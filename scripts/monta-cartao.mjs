/**
 * Gera o cartão de link (Open Graph) em `assets/brand/cartao.png`, 1200×630.
 *
 * Por que existe: o link vai circular em grupo de WhatsApp. Link sem cartão
 * vira uma linha azul que ninguém clica — o cartão é metade da difusão.
 *
 * Renderiza no Chrome em vez de montar a imagem em código: assim usa as mesmas
 * fontes e as mesmas cores do site, e não abre uma segunda fonte da verdade
 * para a identidade visual.
 *
 * Uso:  node scripts/monta-cartao.mjs
 */
import { chromium } from 'playwright-core';
import { readFile } from 'node:fs/promises';

// As fontes entram como data URI a partir de assets/fonts. Nao e firula de
// offline: puxa-las do fonts.googleapis.com aqui reintroduziria pela porta dos
// fundos exatamente o que o app proibe na porta da frente, e o cartao ficaria
// refem de a maquina de quem gera ter internet.
const fonte = async (arquivo) =>
  `data:font/woff2;base64,${(await readFile('assets/fonts/' + arquivo)).toString('base64')}`;
const anton = await fonte('anton-400-latin.woff2');
const cond600 = await fonte('barlow-condensed-600-latin.woff2');
const cond700 = await fonte('barlow-condensed-700-latin.woff2');

const moldura = `data:image/webp;base64,${(await readFile('assets/molduras/oficial-feed.webp')).toString('base64')}`;

const PAGINA = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<style>
  @font-face { font-family: "Anton"; src: url("${anton}") format("woff2"); }
  @font-face { font-family: "Barlow Condensed"; font-weight: 600; src: url("${cond600}") format("woff2"); }
  @font-face { font-family: "Barlow Condensed"; font-weight: 700; src: url("${cond700}") format("woff2"); }
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;overflow:hidden;background:#172053;
       display:flex;align-items:center;gap:56px;padding:0 64px;
       font-family:"Barlow Condensed",sans-serif;color:#fff}
  .texto{flex:1}
  .chapeu{font-size:26px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
          color:#fe6f29;margin-bottom:18px}
  h1{font-family:Anton,sans-serif;font-weight:400;font-size:82px;line-height:1.04;
     text-transform:uppercase;letter-spacing:.005em}
  h1 em{font-style:normal;color:#fe6f29}
  p{font-size:31px;font-weight:600;color:rgba(255,255,255,.82);margin-top:22px;line-height:1.25}
  /* O quadro mostra a moldura por cima de um lugar VAZIO de foto: quem vê o
     cartao entende em um segundo que a foto que falta ali e a dele. */
  .quadro{position:relative;width:430px;height:430px;flex:none;
          border-radius:76px 0 76px 0;overflow:hidden;
          background:linear-gradient(135deg,#8e94ab,#5d6480 55%,#3a4059)}
  .quadro img{position:absolute;inset:0;width:100%;height:100%}
  .vaga{position:absolute;top:82px;left:0;right:0;text-align:center;
        font-size:27px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;
        color:rgba(255,255,255,.9)}
  .pe{position:absolute;left:0;right:0;bottom:0;height:16px;background:#fe6f29}
</style></head>
<body>
  <div class="texto">
    <div class="chapeu">Sarah Poncio · Deputada Federal</div>
    <h1>Coloque a <em>moldura 7777</em> na sua foto</h1>
    <p>Sua foto não sai do seu celular.</p>
  </div>
  <div class="quadro">
    <div class="vaga">sua foto aqui</div>
    <img src="${moldura}" alt="">
  </div>
  <div class="pe"></div>
</body></html>`;

const navegador = await chromium.launch({ channel: 'chrome' });
const p = await navegador.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.setContent(PAGINA, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: 'assets/brand/cartao.png' });
await navegador.close();

console.log('assets/brand/cartao.png — 1200x630');
