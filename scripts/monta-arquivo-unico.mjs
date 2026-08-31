/**
 * Junta o app inteiro num único arquivo HTML — CSS, JS e a arte da moldura
 * embutidos como data URI.
 *
 * Serve para dois usos: mandar o gerador por link antes de existir domínio,
 * e hospedar em qualquer lugar que só aceite um arquivo. A fonte continua
 * sendo o projeto: este script LÊ os arquivos reais, então a versão única
 * nunca sai do ar diferente da versão servida.
 *
 * Uso:  node scripts/monta-arquivo-unico.mjs [saida.html]
 */
import { readFile, writeFile } from 'node:fs/promises';

const SAIDA = process.argv[2] || 'docs/_previa/arquivo-unico.html';

const MIME = { webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml', woff2: 'font/woff2' };
const dataUri = async (caminho) => {
  const ext = caminho.split('.').pop().toLowerCase();
  if (!MIME[ext]) throw new Error(`nao sei embutir ".${ext}" (${caminho})`);
  return `data:${MIME[ext]};base64,${(await readFile(caminho)).toString('base64')}`;
};

const [html, css, app, manifestoBruto] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('assets/css/app.css', 'utf8'),
  readFile('assets/js/app.js', 'utf8'),
  readFile('assets/molduras/manifesto.json', 'utf8'),
]);

/* O manifesto vira um objeto com as artes já em data URI e entra no lugar do
   caminho. Objeto, e não JSON em data URI: aninhar base64 dentro de base64
   engordaria a arte em mais um terço à toa. */
const manifesto = JSON.parse(manifestoBruto);
if (!manifesto.molduras?.length) throw new Error('o manifesto não tem nenhuma moldura');

for (const m of manifesto.molduras) {
  for (const formato of ['feed', 'story']) {
    if (m[formato]) m[formato] = await dataUri(`assets/molduras/${m[formato]}`);
  }
}

const appEmbutido = app.replace(
  /const MANIFESTO = '[^']*';/,
  `const MANIFESTO = ${JSON.stringify(manifesto)};`
);
if (appEmbutido === app) throw new Error('não achei a linha do MANIFESTO no app.js');

/* Até o ícone entra embutido: a versão de arquivo único não pode depender de
   nenhum arquivo ao lado, senão ela não é de arquivo único. */
const favicon = await dataUri('assets/brand/favicon.svg');

/* As fontes também entram embutidas. Elas são LOCAIS desde 31/08/2026 — antes
   vinham do fonts.googleapis.com, e o arquivo único herdava a chamada ao Google
   junto. Agora cada `url("../fonts/X.woff2")` do @font-face vira data URI, e os
   dois <link rel="preload"> saem: num arquivo só não há o que pré-carregar.
   Sem isto o arquivo abriria com a fonte de sistema, e o canvas — que espera
   Anton e Barlow Condensed — desenharia o lockup errado. */
const arquivosDeFonte = [...new Set([...css.matchAll(/url\("\.\.\/fonts\/([^"]+)"\)/g)].map((m) => m[1]))];
let cssEmbutido = css;
for (const arq of arquivosDeFonte) {
  cssEmbutido = cssEmbutido.split(`url("../fonts/${arq}")`).join(`url("${await dataUri(`assets/fonts/${arq}`)}")`);
}
if (/\.\.\/fonts\//.test(cssEmbutido)) throw new Error('sobrou caminho de fonte no CSS embutido');

const corpo = html
  .replace(/\s*<link rel="preload" href="assets\/fonts\/[^"]+"[^>]*>/g, '')
  .replace('<link rel="stylesheet" href="assets/css/app.css">', `<style>\n${cssEmbutido}\n</style>`)
  .replace('href="assets/brand/favicon.svg"', `href="${favicon}"`)
  .replace('<script src="assets/js/app.js"></script>', `<script>\n${appEmbutido}\n</script>`);

/* Se um dos encaixes não aconteceu, o arquivo sai mudo — melhor parar. */
for (const marca of ['<style>', '<script>', 'MANIFESTO']) {
  if (!corpo.includes(marca)) throw new Error(`montagem falhou: falta ${marca}`);
}
const sobrou = corpo.match(/"assets\/[^"]*"/g);
if (sobrou) throw new Error(`sobrou caminho de arquivo não embutido: ${sobrou.join(', ')}`);

await writeFile(SAIDA, corpo, 'utf8');
const kb = (t) => Math.round(Buffer.byteLength(t) / 1024);
console.log(`${SAIDA} — ${kb(corpo)} KB`);

/* Segunda saída: só o miolo, para publicar como artifact (o visualizador
   monta o <html>/<head>/<body> por fora; mandar os nossos gera aninhamento). */
const miolo = corpo
  .replace(/^[\s\S]*?<meta charset="utf-8">\s*/, '')
  .replace(/<\/head>\s*<body>/, '')
  .replace(/<\/body>\s*<\/html>\s*$/, '');

const SAIDA_ARTIFACT = SAIDA.replace(/\.html$/, '-artifact.html');
await writeFile(SAIDA_ARTIFACT, miolo, 'utf8');
console.log(`${SAIDA_ARTIFACT} — ${kb(miolo)} KB`);
