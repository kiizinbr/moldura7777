# Gerador de moldura — Sarah Poncio 7777

**No ar: https://kiizinbr.github.io/moldura7777/**

Página onde o apoiador coloca a foto dele dentro da moldura oficial da campanha
e salva pronta para o perfil. É o que a internet chama de *twibbon*.

HTML estático puro: sem framework, sem bundler, sem etapa de build. O que roda
em `npm run dev` é exatamente o que vai para o ar.

```
npm run dev       # http://localhost:5599
npm run previa    # abre o Chrome, monta uma foto e exporta um PNG de cada formato
```

## A decisão que define o projeto: nada sai do aparelho

A montagem inteira acontece no navegador do apoiador, num `<canvas>`. Não existe
upload, servidor de imagem nem banco de dados. Isso não é economia de código, são
três coisas de uma vez:

1. **Confiança.** "Monte a sua foto" convence numa campanha; "me manda sua foto"
   não. A frase está na tela porque é verdade, não porque é marketing.
2. **LGPD.** Foto de rosto é dado pessoal. O que nunca é coletado não precisa de
   base legal, de retenção nem de plano de incidente.
3. **Custo e escala.** Arquivo estático aguenta um pico de compartilhamento sem
   fila, sem servidor de imagem e sem conta no fim do mês.

## A moldura é um arquivo, não código

A arte oficial vive em `assets/molduras/` e é declarada em `manifesto.json`.
Trocar a arte é trocar um arquivo — o código não muda. As regras do arquivo
estão no `LEIA-ME.txt` daquela pasta.

Para preparar uma arte nova, entregue quadrada pelo designer:

```
py scripts/prepara-moldura.py "C:\caminho\ARTE.png"
```

O script reduz para 1080×1080, monta a versão de story colando a arte rente ao
pé de um quadro 1080×1920 (esticar deformaria o rosto e o lockup) e **mede**
até onde ainda dá para encaixar rosto. Esse número vai para o campo `faixa` do
manifesto — é o que faz o app enquadrar a selfie na janela certa em vez de
jogar o rosto atrás da faixa.

## Detalhe da arte atual

A faixa navy da moldura oficial **não é chapada**: ela tem degradê de alfa e a
foto do apoiador atravessa a parte de cima dela. Foi assim que a arte foi
exportada. Duas consequências práticas:

- a foto precisa cobrir o **quadro inteiro**, não só o topo — senão apareceria
  buraco atrás do degradê;
- sobre foto muito clara, o lockup perde contraste. Se isso incomodar, é
  correção na arte (faixa opaca), não no código.

## Regras de design herdadas do site

Vêm do `sarah-poncio-federal` e não são preferência:

1. **Paleta bicolor travada** — navy `#172053`, laranja `#FE6F29`, branco.
2. **O laranja da marca reprova como texto** (2.79:1 sobre branco). Ele é
   grafismo e fundo. Texto laranja sobre claro usa `--laranja-700` (5.43:1).
   Navy sobre laranja (5.50:1) é o par usado nos botões.
3. **Sem sombra difusa.** Hierarquia por massa de cor e corte diagonal.
4. **Anton em caixa alta não desce de ~1.05 de entrelinha** — acento colide.

## O que já funciona

- moldura oficial em feed 1080×1080 e story 1080×1920
- foto por botão, arrastar-e-soltar ou <kbd>Ctrl</kbd>+<kbd>V</kbd>
- enquadramento automático na janela útil ao escolher a foto e ao trocar de
  formato; reposicionar arrastando; zoom por roda, pinça e cursor; travas que
  impedem buraco na borda
- EXIF respeitado (`createImageBitmap` com `imageOrientation`), senão foto de
  celular entra deitada
- download PNG, imagem pronta na tela para salvar com toque longo, e no celular
  **Compartilhar** direto para Instagram/WhatsApp (`navigator.share` com
  arquivo — o botão só aparece onde funciona)

## Publicação

GitHub Pages, branch `main`, raiz — `git push` publica em cerca de um minuto.
O `.nojekyll` existe porque `assets/molduras/_fonte/` começa com underscore e o
Jekyll ignoraria a pasta.

Para trocar o endereço por `moldura.sarahponcio.com.br` depois: CNAME para
`kiizinbr.github.io`, o domínio em Settings → Pages e "Enforce HTTPS" ligado.
Só o `og:url` e o `og:image` do `index.html` precisam acompanhar.

O cartão de link (o que aparece quando alguém cola a URL no WhatsApp) é gerado
por `node scripts/monta-cartao.mjs`. Rode de novo se a arte ou a chamada mudar.

## O que ainda está aberto

As pendências deste projeto moram no repositório **privado** da campanha, em
`sarah-poncio-federal/docs/PENDENCIAS-moldura7777.md`. Elas ficavam aqui, em
`docs/PENDENCIAS.md`, até 31/08/2026 — e como o GitHub Pages serve todo arquivo
versionado, estavam sendo publicadas no mesmo endereço que a campanha divulga.

A trava que era a nº 1, o **CNPJ do contratante**, está resolvida: o rodapé agora traz a
identificação completa. Continua aberta a pergunta ao jurídico sobre se o CNPJ precisa
aparecer **dentro da imagem exportada** ou basta no rodapé da página.

⚠️ **Antes de divulgar o link:** o endereço eletrônico usado na campanha precisa constar
do RRC/DRAP, ou só pode ser usado 48 horas depois de comunicado à Justiça Eleitoral
(Lei 9.504/1997, art. 28, § 1º-B). Esta página está no ar desde 21/08/2026 e essa
verificação nunca foi registrada.
