# Modelage Offline

Aplicação `offline-first` para criação e preenchimento de formulários em texto, com sincronização posterior para um backend Flask.

## Como rodar localmente

Na pasta do projeto:

```powershell
python -m pip install -r requirements.txt
python app.py --debug
```

Servidor local padrão:

- `http://127.0.0.1:5000`
- `http://SEU-IP-LOCAL:5000`

## Como rodar com HTTPS

Para o PWA funcionar melhor no celular, o mais recomendado é usar HTTPS:

```powershell
python app.py --https --debug
```

## Arquitetura recomendada para produção

O caminho mais profissional é separar:

- frontend PWA hospedado online
- backend Flask hospedado online

Assim:

- o app instala de verdade no celular
- o offline funciona melhor
- o sincronismo pode acontecer de qualquer rede

## Configurar URL do backend

O frontend agora suporta uma URL de sincronização separada.

Arquivo padrão:

- [config.js](C:\Users\luisg\OneDrive\Documentos\GitHub\Modelage_teste\config.js)

Exemplo:

```js
window.MODELAGE_CONFIG = {
  apiBaseUrl: "https://seu-backend-online.onrender.com"
};
```

Modelo pronto:

- [config.example.js](C:\Users\luisg\OneDrive\Documentos\GitHub\Modelage_teste\config.example.js)

Se `apiBaseUrl` ficar vazio, o app usa o mesmo domínio onde estiver hospedado.

## Publicar o frontend

Você pode publicar estes arquivos estáticos em serviços como:

- Vercel
- Netlify
- GitHub Pages

Arquivo de apoio para Vercel:

- [vercel.json](C:\Users\luisg\OneDrive\Documentos\GitHub\Modelage_teste\vercel.json)

Arquivos principais do frontend:

- `index.html`
- `home.html`
- `formulario.html`
- `offline.html`
- `style.css`
- `script.js`
- `config.js`
- `manifest.json`
- `sw.js`
- `icons/`

## Publicar o backend

O backend Flask está em:

- [app.py](C:\Users\luisg\OneDrive\Documentos\GitHub\Modelage_teste\app.py)

Ele pode ser publicado depois em serviços como:

- Render
- Railway
- Fly.io

Arquivo de apoio para Render:

- [render.yaml](C:\Users\luisg\OneDrive\Documentos\GitHub\Modelage_teste\render.yaml)

## Fluxo final esperado

1. O usuário instala o app PWA no celular.
2. O app funciona offline e salva tudo localmente.
3. Quando a internet voltar, o app sincroniza com o backend configurado.
4. Pessoas em redes diferentes continuam conseguindo usar e sincronizar.
