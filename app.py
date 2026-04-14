from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

USERS_FILE = DATA_DIR / "usuarios.json"
FORMS_FILE = DATA_DIR / "formularios.json"
RESPONSES_FILE = DATA_DIR / "respostas.json"


app = Flask(__name__, static_folder=".", static_url_path="")


def load_items(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_items(path: Path, items: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(items, file, ensure_ascii=False, indent=2)


def sort_by_updated_at(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(items, key=lambda item: item.get("updatedAt", ""))


def merge_records(local_items: list[dict[str, Any]], incoming_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {item["id"]: item for item in local_items if "id" in item}

    for incoming in incoming_items:
        incoming_id = incoming.get("id")

        if not incoming_id:
            continue

        current = merged.get(incoming_id)

        if current is None or current.get("updatedAt", "") <= incoming.get("updatedAt", ""):
            merged[incoming_id] = incoming

    return sort_by_updated_at(list(merged.values()))


def load_store() -> dict[str, list[dict[str, Any]]]:
    return {
        "usuarios": load_items(USERS_FILE),
        "formularios": load_items(FORMS_FILE),
        "respostas": load_items(RESPONSES_FILE),
    }


def save_store(store: dict[str, list[dict[str, Any]]]) -> None:
    save_items(USERS_FILE, store["usuarios"])
    save_items(FORMS_FILE, store["formularios"])
    save_items(RESPONSES_FILE, store["respostas"])


def apply_operation(store: dict[str, list[dict[str, Any]]], operation: dict[str, Any]) -> None:
    kind = operation.get("tipo")
    record = operation.get("registro") or {}

    key_map = {
        "usuario": "usuarios",
        "formulario": "formularios",
        "resposta": "respostas",
    }

    store_key = key_map.get(kind)

    if not store_key or not record.get("id"):
        return

    store[store_key] = merge_records(store[store_key], [record])


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/api/sync", methods=["POST", "OPTIONS"])
def sync_data():
    if request.method == "OPTIONS":
        return ("", 204)

    payload = request.get_json(silent=True) or {}
    operations = payload.get("operations") or []
    store = load_store()

    for operation in operations:
        apply_operation(store, operation)

    save_store(store)

    return jsonify(
        {
            "usuarios": sort_by_updated_at(store["usuarios"]),
            "formularios": sort_by_updated_at(store["formularios"]),
            "respostas": sort_by_updated_at(store["respostas"]),
            "serverTime": datetime.now(timezone.utc).isoformat(),
        }
    )


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:path>")
def static_proxy(path: str):
    return send_from_directory(BASE_DIR, path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Servidor local do Modelage Offline")
    parser.add_argument("--host", default="0.0.0.0", help="Host para expor o servidor")
    parser.add_argument("--port", type=int, default=5000, help="Porta do servidor")
    parser.add_argument(
        "--https",
        action="store_true",
        help="Ativa HTTPS com certificado automático adhoc para testes locais",
    )
    parser.add_argument("--cert", help="Caminho para certificado SSL")
    parser.add_argument("--key", help="Caminho para chave SSL")
    parser.add_argument("--debug", action="store_true", help="Ativa modo debug")
    return parser.parse_args()


def build_ssl_context(args: argparse.Namespace):
    if args.cert and args.key:
        return args.cert, args.key

    if args.https:
        return "adhoc"

    return None


if __name__ == "__main__":
    args = parse_args()
    ssl_context = build_ssl_context(args)

    app.run(
        host=args.host,
        port=args.port,
        debug=args.debug,
        ssl_context=ssl_context,
    )
