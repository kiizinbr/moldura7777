# -*- coding: utf-8 -*-
"""
Prepara a arte oficial da moldura para os dois formatos do gerador.

A arte que o designer entrega e quadrada. O feed usa ela direto, reduzida para
1080. O story NAO pode ser a mesma arte esticada -- isso deformaria o rosto da
candidata e o lockup. Em vez disso, a arte quadrada e colada rente ao PE de um
canvas 1080x1920 e o resto fica transparente: a composicao de baixo continua
identica e o que sobra vira area de foto, que e o que o formato pede.

O script tambem MEDE onde a faixa opaca comeca e imprime o valor -- e esse
numero que o molduras.js usa para saber ate onde a foto do apoiador aparece.
Se a arte mudar, rode de novo e confira se o numero bateu.

Uso:
  py scripts/prepara-moldura.py [arte.png]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ENTRADA = Path(sys.argv[1] if len(sys.argv) > 1
               else 'assets/molduras/_fonte/oficial-quadrada.png')
DESTINO = Path('assets/molduras')
LARGURA = 1080
ALTURA_STORY = 1920

arte = Image.open(ENTRADA).convert('RGBA')
if arte.width != arte.height:
    raise SystemExit(f'a arte precisa ser quadrada; veio {arte.width}x{arte.height}')

feed = arte.resize((LARGURA, LARGURA), Image.LANCZOS)

# A faixa navy da arte oficial NAO e chapada: ela tem degrade de alfa, e a
# foto do apoiador atravessa a parte de cima dela. Entao o limite util nao e
# "onde fica opaco", e "onde a moldura passa a cobrir mais da metade" -- dali
# para baixo nao adianta mais tentar encaixar rosto.
cobertura = (np.asarray(feed)[..., 3].astype(float) / 255).mean(axis=1)
util = np.where(cobertura > 0.5)[0]
if len(util) == 0:
    raise SystemExit('a arte nunca cobre metade da largura -- e moldura mesmo?')
faixa = LARGURA - int(util[0])

story = Image.new('RGBA', (LARGURA, ALTURA_STORY), (0, 0, 0, 0))
story.alpha_composite(feed, (0, ALTURA_STORY - LARGURA))

# WebP e nao PNG: mesma arte, um quinto do peso, alfa igual. Quem abre isso
# esta no 4G do celular no meio da rua.
DESTINO.mkdir(parents=True, exist_ok=True)
feed.save(DESTINO / 'oficial-feed.webp', quality=92, method=6)
story.save(DESTINO / 'oficial-story.webp', quality=92, method=6)

print('oficial-feed.webp  1080x1080')
print(f'oficial-story.webp 1080x{ALTURA_STORY}')
print(f'"faixa": {faixa}   <- confira este numero em assets/molduras/manifesto.json')
