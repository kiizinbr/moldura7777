/**
 * Prévia visual: sobe o Chrome, joga uma foto de teste dentro do app e exporta
 * o PNG de cada formato em `docs/_previa/`.
 *
 * É o jeito de olhar o resultado sem abrir o navegador na mão a cada ajuste.
 * Sai com código 1 em qualquer erro de JS ou 404 — trate como o teste do
 * projeto. Requer o Chrome instalado.
 *
 * Uso:
 *   node scripts/serve.mjs           (em outro terminal)
 *   node scripts/previa.mjs [url] [caminho-da-foto]
 */
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';

const URL_ALVO = process.argv[2] || 'http://127.0.0.1:5599/';
const FOTO = process.argv[3] || 'C:/dev/sarah-poncio-federal/assets/img/selfie-apoiadora.webp';
const SAIDA = 'docs/_previa';

await mkdir(SAIDA, { recursive: true });

const navegador = await chromium.launch({ channel: 'chrome' });
const p = await navegador.newPage({ viewport: { width: 1360, height: 1000 } });

const erros = [];
p.on('pageerror', (e) => erros.push('JS: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });

await p.goto(URL_ALVO, { waitUntil: 'networkidle' });
await p.waitForFunction(() => !document.querySelector('#tela').classList.contains('is-carregando'));

/* Tela inicial, ainda sem foto — é o que o apoiador vê ao abrir o link. */
await p.screenshot({ path: `${SAIDA}/00-vazio.png`, fullPage: true });

await p.setInputFiles('#arquivo', FOTO);
await p.waitForFunction(() => !document.querySelector('#baixar').disabled);

for (const formato of ['feed', 'story']) {
  await p.click(`[data-formato="${formato}"]`);
  await p.waitForTimeout(180);
  const b64 = await p.evaluate(() =>
    document.querySelector('#tela').toDataURL('image/png').split(',')[1]);
  await writeFile(`${SAIDA}/${formato}.png`, Buffer.from(b64, 'base64'));
  console.log(`  ${formato} ok`);
}

await p.click('[data-formato="feed"]');
await p.waitForTimeout(200);
await p.screenshot({ path: `${SAIDA}/01-desktop.png`, fullPage: true });

const m = await navegador.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await m.goto(URL_ALVO, { waitUntil: 'networkidle' });
await m.setInputFiles('#arquivo', FOTO);
await m.waitForFunction(() => !document.querySelector('#baixar').disabled);
await m.waitForTimeout(250);
await m.screenshot({ path: `${SAIDA}/02-mobile.png`, fullPage: true });

await navegador.close();

if (erros.length) {
  console.error('\nERROS:\n' + erros.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`\nprévia gerada em ${SAIDA}/`);
