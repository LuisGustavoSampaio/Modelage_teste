# Modelage Offline

PWA de formulários textuais com funcionamento `offline-first` e sincronização posterior com backend Flask.

## O que faz

- cadastra usuários
- cria formulários em formato de texto
- salva respostas localmente no navegador
- funciona offline
- sincroniza dados entre dispositivos quando a internet volta

## Como funciona

O sistema tem 2 partes:

- `frontend PWA`
  roda no navegador/celular, funciona offline e salva dados locais

- `backend Flask`
  recebe sincronizações e centraliza usuários, formulários e respostas

Fluxo:

1. o usuário usa o app normalmente, mesmo sem internet
2. os dados ficam salvos no dispositivo
3. quando a conexão volta, o app sincroniza com o servidor
4. outro dispositivo pode baixar essas alterações

## Rodar localmente

Na pasta do projeto:

```powershell
python -m pip install -r requirements.txt
python app.py --debug
```

Abrir em:

- `http://127.0.0.1:5000`

## Rodar com HTTPS local

Para testar melhor o PWA no celular:

```powershell
python app.py --https --debug
```

## Produção

Frontend publicado em:

- `Vercel`

Backend publicado em:

- `Render`

A URL do backend fica em:

- [config.js](C:\Users\luisg\OneDrive\Documentos\GitHub\Modelage_teste\config.js)

Exemplo:

```js
window.MODELAGE_CONFIG = {
  apiBaseUrl: "https://modelage-teste.onrender.com"
};
```

## Arquivos principais

- [index.html](C:\Users\luisg\OneDrive\Documentos\GitHub\Modelage_teste\index.html): entrada do app
- [home.html](C:\Users\luisg\OneDrive\Documentos\GitHub\Modelage_teste\home.html): painel principal
- [formulario.html](C:\Users\luisg\OneDrive\Documentos\GitHub\Modelage_teste\formulario.html): editor do formulário
- [script.js](C:\Users\luisg\OneDrive\Documentos\GitHub\Modelage_teste\script.js): lógica local e sincronização
- [sw.js](C:\Users\luisg\OneDrive\Documentos\GitHub\Modelage_teste\sw.js): cache offline do PWA
- [app.py](C:\Users\luisg\OneDrive\Documentos\GitHub\Modelage_teste\app.py): backend Flask

## Resumo

O app foi feito para continuar funcionando offline, salvar tudo no dispositivo e sincronizar depois com o servidor, permitindo uso em celular e computador com a mesma base de dados.
