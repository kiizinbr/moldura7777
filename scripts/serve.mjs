/**
 * Servidor estático de desenvolvimento. Sem dependência externa.
 * Uso: npm run dev  →  http://localhost:5173
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = Number(process.env.PORT || 5599);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.pdf':  'application/pdf',
};

http.createServer((req, res) => {
  let rota = decodeURIComponent(req.url.split('?')[0]);
  if (rota.endsWith('/')) rota += 'index.html';

  const arquivo = path.join(RAIZ, rota);
  // impede sair da raiz do projeto
  if (!arquivo.startsWith(RAIZ)) {
    res.writeHead(403).end('403');
    return;
  }

  fs.readFile(arquivo, (erro, dados) => {
    if (erro) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1><p>Não achei <code>' + rota + '</code>.</p>');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(arquivo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(dados);
  });
}).listen(PORTA, () => {
  console.log('Site no ar em http://localhost:' + PORTA);
});
