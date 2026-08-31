# Contexto para agentes — gerador de moldura 7777

> ⚠️ **Este repositório é PÚBLICO e tudo nele é servido pelo GitHub Pages** — o
> `index.html`, sim, mas também todo `.md`, todo script e todo arquivo em `docs/`. Não
> guarde aqui nada que você não publicaria: pendência interna, nota jurídica, decisão de
> negócio, endereço, telefone, credencial. O material interno deste projeto mora no
> repositório **privado** `sarah-poncio-federal`, em `docs/PENDENCIAS-moldura7777.md`.
> Isso não é hipótese: o `docs/PENDENCIAS.md` daqui ficou dez dias respondendo HTTP 200,
> e nele estava escrito que a peça estava no ar sem o CNPJ exigido por lei.

> **Pasta local `C:\dev\sarah-poncio-twibbon`, repo `kiizinbr/moldura7777`.**
> Os nomes divergem porque a pasta estava travada pelo VS Code na hora de
> renomear. No ar em https://kiizinbr.github.io/moldura7777/

## O que é
Twibbon da campanha da **deputada federal Sarah Poncio (RJ, nº 7777)**: o
apoiador põe a própria foto na moldura oficial e salva pronta. HTML estático,
sem build.

**Não é** o `sarah-poncio-federal` (site de campanha, `C:\dev\sarah-poncio-federal`),
o `artes7777` (hub de artes digitais, que lista este projeto) nem o
`sarah-poncio-revista` (micro-site dos QR da revista estadual). Este projeto **herda**
a direção visual e os tokens do primeiro — cor nova aqui é erro.

## Três regras que não são preferência

1. **Nada da foto do apoiador pode sair do aparelho.** Sem upload, sem servidor
   de imagem, sem analytics que carregue a imagem. Se uma feature exigir
   servidor (contador de uso, galeria), ela muda a promessa que está escrita na
   tela e precisa de decisão do Erick — não de um commit.
2. **A moldura é a arte oficial da campanha, não um layout nosso.** Já houve uma
   rodada com cinco modelos desenhados em código; foram removidos a pedido do
   Erick. Não reintroduzir layout inventado sem ele pedir.
3. **Fontes moram em `assets/fonts`, não no Google.** Até 31/08/2026 este arquivo
   trazia três `<link>` para `fonts.googleapis.com`, e foi medido no ar: **toda visita
   entregava IP e User-Agent ao Google antes de qualquer consentimento**. Num endereço
   de campanha o simples acesso já revela opinião política — dado sensível (LGPD,
   art. 5º, II), para o qual o art. 11 não oferece legítimo interesse. É a regra nº 7
   do `CLAUDE.md` do site, que este repo descumpria desde que nasceu. **Não
   reintroduzir**, nem "só para testar": o canvas depende de `document.fonts.load`
   para Anton 400 e Barlow Condensed 700, e os dois estão em `assets/fonts/`.

## Onde mexer
- `assets/molduras/` — a arte. `manifesto.json` declara qual arquivo é qual
  formato e o campo `faixa`.
- `scripts/prepara-moldura.py` — converte a arte quadrada do designer nos dois
  formatos e **mede** o `faixa`. Rodar sempre que a arte mudar.
- `assets/js/app.js` — o motor (foto, zoom, arrasto, exportação).
- `assets/fonts/` — os 12 `.woff2` que o app usa. Precisou de um peso novo? Copie de
  `sarah-poncio-federal/assets/fonts/` e acrescente o `@font-face` no topo do `app.css`.
- O app suporta várias molduras: se o manifesto tiver duas ou mais, o seletor
  de modelos aparece sozinho e os passos se renumeram.

## Verificação
```
npm run dev       # em outro terminal
npm run previa    # exporta docs/_previa/*.png e falha se houver erro de console
```
`npm run previa` sai com código 1 em qualquer erro de JS ou 404 — trate isso
como o teste do projeto. Ele monta feed e story de verdade, então também prova que as
fontes chegaram antes do canvas desenhar.

## Publicação
GitHub Pages, branch `main`, raiz. **`git push` já publica — leva ~1 min, sem revisão e
sem ninguém no meio.** Trate cada commit como uma publicação. O `.nojekyll` existe
porque `assets/molduras/_fonte/` começa com underscore e o Jekyll ignoraria a pasta.

Antes de mexer no que vai ao ar, leia `sarah-poncio-federal/docs/PENDENCIAS-moldura7777.md`
(repositório privado).
