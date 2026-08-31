/* =============================================================================
   GERADOR DE MOLDURA · SARAH PONCIO 7777

   Tudo roda no navegador do apoiador. Nao existe upload, nao existe servidor,
   nao existe banco. Numa campanha isso nao e detalhe tecnico: e a diferenca
   entre "me da sua foto" e "monte a sua foto". Tambem derruba o custo de
   hospedagem para zero (arquivo estatico) e o risco de LGPD junto.

   A moldura em si nao vive aqui: ela e a arte oficial em PNG/WebP declarada em
   assets/molduras/manifesto.json. Trocar a arte e trocar um arquivo -- este
   codigo nao muda.
   ========================================================================== */

/* Caminho do manifesto. A versao de arquivo unico troca esta linha pelo
   proprio objeto ja resolvido, com as artes em data URI -- por isso
   carregaMolduras() aceita texto ou objeto. */
const MANIFESTO = 'assets/molduras/manifesto.json';

(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);

  const tela   = $('#tela');
  const ctx    = tela.getContext('2d');
  const palco  = $('#palco');
  const vazio  = $('#vazio');
  const dica   = $('#dica');

  const FORMATOS = {
    feed:  { w: 1080, h: 1080, rotulo: '1080x1080' },
    story: { w: 1080, h: 1920, rotulo: '1080x1920' },
  };

  const MOLDURAS = [];   // vem do manifesto

  const estado = {
    foto: null,        // { fonte, w, h }
    escala: 1,
    dx: 0, dy: 0,      // deslocamento em pixels do canvas de saida
    moldura: null,
    formato: 'feed',
    nome: '',
  };

  /* ==========================================================================
     CARGA DE RECURSOS
     Arte e fonte precisam estar prontas ANTES do primeiro desenho: canvas nao
     se redesenha sozinho quando o arquivo termina de baixar.
     ====================================================================== */

  function carregaImagem(src) {
    return new Promise((ok, erro) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = () => erro(new Error(`nao consegui carregar ${src}`));
      img.src = src;
    });
  }

  /**
   * Le o manifesto e monta o catalogo. E por aqui que a arte do designer entra
   * sem tocar em codigo: solta o arquivo na pasta, escreve uma linha no JSON.
   *
   * `faixa` e a altura, em unidades de 1080, que a moldura cobre no pe. Serve
   * para o app saber onde ainda da para encaixar rosto. Sai medida pelo
   * scripts/prepara-moldura.py -- nao e numero chutado.
   */
  async function carregaMolduras() {
    let dados = MANIFESTO;
    if (typeof dados === 'string') {
      const r = await fetch(dados, { cache: 'no-cache' });
      if (!r.ok) throw new Error(`manifesto respondeu ${r.status}`);
      dados = await r.json();
    }
    const lista = dados.molduras || [];

    for (const m of lista) {
      const arte = {};
      for (const formato of ['feed', 'story']) {
        if (!m[formato]) continue;
        const src = m[formato].startsWith('data:') ? m[formato] : `assets/molduras/${m[formato]}`;
        arte[formato] = await carregaImagem(src);
      }
      if (!arte.feed && !arte.story) throw new Error(`moldura "${m.id}" nao declara arquivo`);

      MOLDURAS.push({
        id: m.id,
        nome: m.nome || m.id,
        faixa: Number(m.faixa) || 0,
        aceitaNome: Boolean(m.aceitaNome),
        arte: (formato) => arte[formato] || arte.feed || arte.story,
      });
    }

    if (!MOLDURAS.length) throw new Error('o manifesto nao tem nenhuma moldura');
    estado.moldura = MOLDURAS[0];
  }

  function carregaFontes() {
    if (!document.fonts) return Promise.resolve();
    return Promise.all([
      document.fonts.load('400 100px Anton'),
      document.fonts.load('700 40px "Barlow Condensed"'),
    ]).catch(() => {});
  }

  /* ==========================================================================
     DESENHO
     ====================================================================== */

  /**
   * Onde ainda da para ver rosto. A faixa da arte oficial nao e chapada -- ela
   * tem degrade, e a foto atravessa a parte de cima dela. Por isso a foto
   * cobre o quadro INTEIRO (senao apareceria buraco atras do degrade) e so o
   * ENQUADRAMENTO usa esta janela.
   */
  function janela(W, H) {
    const alt = H - estado.moldura.faixa * (W / 1080);
    return Math.max(alt, H * 0.3);
  }

  /** Escala minima que faz a foto cobrir o quadro inteiro. */
  function escalaBase(W, H) {
    return Math.max(W / estado.foto.w, H / estado.foto.h);
  }

  /** Impede que o arrasto deixe aparecer buraco na borda. */
  function limitaDeslocamento(W, H) {
    const s = escalaBase(W, H) * estado.escala;
    const lx = Math.max(0, (estado.foto.w * s - W) / 2);
    const ly = Math.max(0, (estado.foto.h * s - H) / 2);
    estado.dx = Math.min(lx, Math.max(-lx, estado.dx));
    estado.dy = Math.min(ly, Math.max(-ly, estado.dy));
  }

  /** Sobe a foto ate o rosto cair na janela util, sem abrir buraco. */
  function enquadraNaJanela(W, H) {
    estado.dx = 0;
    estado.dy = janela(W, H) / 2 - H / 2;
    limitaDeslocamento(W, H);
  }

  function desenhaFoto(ctx2, W, H, foto, escala, dx, dy) {
    const base = Math.max(W / foto.w, H / foto.h) * escala;
    const w = foto.w * base;
    const h = foto.h * base;
    ctx2.drawImage(foto.fonte, W / 2 - w / 2 + dx, H / 2 - h / 2 + dy, w, h);
  }

  /**
   * Pinta uma composicao completa. Usada pelo palco, pela miniatura e pela
   * exportacao -- uma funcao so, entao o que o apoiador ve e o que ele salva.
   */
  function compoe(ctx2, W, H, m, o) {
    ctx2.clearRect(0, 0, W, H);
    if (o.pintaFoto) o.pintaFoto(ctx2, W, H);
    ctx2.drawImage(m.arte(o.formato), 0, 0, W, H);
  }

  function render() {
    const f = FORMATOS[estado.formato];
    if (tela.width !== f.w || tela.height !== f.h) {
      tela.width = f.w;
      tela.height = f.h;
    }
    if (estado.foto) limitaDeslocamento(f.w, f.h);

    compoe(ctx, f.w, f.h, estado.moldura, {
      formato: estado.formato,
      pintaFoto: estado.foto
        ? (c, W, H) => desenhaFoto(c, W, H, estado.foto, estado.escala, estado.dx, estado.dy)
        : null,
    });

    vazio.hidden = !!estado.foto;
    tela.classList.toggle('is-vazio', !estado.foto);
  }

  /* ==========================================================================
     SELETOR DE MODELOS
     Some enquanto houver uma moldura so. Escolher entre uma opcao nao e
     escolha, e um passo a mais entre o apoiador e a foto dele pronta.
     ====================================================================== */

  /** Foto de mentira para a miniatura mostrar como a moldura se comporta. */
  function fotoFalsa(ctx2, W, H) {
    const g = ctx2.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#8e94ab');
    g.addColorStop(0.5, '#5d6480');
    g.addColorStop(1, '#3a4059');
    ctx2.fillStyle = g;
    ctx2.fillRect(0, 0, W, H);
  }

  /* Os passos sao numerados no HTML, mas o bloco de modelos pode nao existir.
     Numero de passo que pula do 1 para o 3 parece pagina quebrada. */
  function renumeraPassos() {
    document.querySelectorAll('.bloco:not([hidden]) .passo')
      .forEach((el, i) => { el.textContent = String(i + 1); });
  }

  function montaModelos() {
    $('#blocoModelos').hidden = MOLDURAS.length < 2;
    renumeraPassos();
    if (MOLDURAS.length < 2) return;

    const caixa = $('#modelos');
    caixa.innerHTML = '';

    MOLDURAS.forEach((m) => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'modelo' + (m.id === estado.moldura.id ? ' is-on' : '');
      botao.setAttribute('role', 'radio');
      botao.setAttribute('aria-checked', String(m.id === estado.moldura.id));
      botao.dataset.id = m.id;

      const mini = document.createElement('canvas');
      mini.width = 300;
      mini.height = estado.formato === 'story' ? Math.round(300 * 16 / 9) : 300;
      compoe(mini.getContext('2d'), mini.width, mini.height, m, {
        formato: estado.formato, pintaFoto: fotoFalsa,
      });

      const rot = document.createElement('span');
      rot.className = 'modelo__nome';
      rot.textContent = m.nome;

      botao.append(mini, rot);
      botao.addEventListener('click', () => {
        estado.moldura = m;
        montaModelos();
        atualizaCampoNome();
        render();
      });
      caixa.appendChild(botao);
    });
  }

  function atualizaCampoNome() {
    $('#campoNome').hidden = !estado.moldura.aceitaNome;
  }

  /* ==========================================================================
     ENTRADA DA FOTO
     ====================================================================== */

  async function usaArquivo(arquivo) {
    if (!arquivo || !arquivo.type.startsWith('image/')) return;

    let fonte;
    try {
      /* createImageBitmap respeita o EXIF: sem isso, foto de celular entra
         deitada. O fallback cobre navegador antigo. */
      fonte = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
    } catch {
      fonte = await carregaImagem(URL.createObjectURL(arquivo));
    }

    const f = FORMATOS[estado.formato];
    estado.foto = {
      fonte,
      w: fonte.width || fonte.naturalWidth,
      h: fonte.height || fonte.naturalHeight,
    };
    estado.escala = 1;
    $('#zoom').value = 100;
    enquadraNaJanela(f.w, f.h);
    $('#baixar').disabled = false;
    mostraDica();
    render();
  }

  function mostraDica() {
    dica.hidden = false;
    dica.classList.remove('is-fade');
    clearTimeout(mostraDica._t);
    mostraDica._t = setTimeout(() => dica.classList.add('is-fade'), 3200);
  }

  /* ==========================================================================
     ARRASTAR E DAR ZOOM
     ====================================================================== */

  const ponteiros = new Map();
  let pinca = null;

  function paraCanvas(e) {
    const r = tela.getBoundingClientRect();
    return { x: e.clientX * (tela.width / r.width), y: e.clientY * (tela.height / r.height) };
  }

  tela.addEventListener('pointerdown', (e) => {
    if (!estado.foto) return;
    tela.setPointerCapture(e.pointerId);
    ponteiros.set(e.pointerId, paraCanvas(e));
    tela.classList.add('is-grabbing');
    if (ponteiros.size === 2) pinca = distancia();
  });

  tela.addEventListener('pointermove', (e) => {
    if (!ponteiros.has(e.pointerId)) return;
    const antes = ponteiros.get(e.pointerId);
    const agora = paraCanvas(e);
    ponteiros.set(e.pointerId, agora);

    if (ponteiros.size === 1) {
      estado.dx += agora.x - antes.x;
      estado.dy += agora.y - antes.y;
      render();
    } else if (ponteiros.size === 2 && pinca) {
      const d = distancia();
      aplicaZoom(estado.escala * (d / pinca));
      pinca = d;
    }
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
    tela.addEventListener(ev, (e) => {
      ponteiros.delete(e.pointerId);
      if (ponteiros.size < 2) pinca = null;
      if (ponteiros.size === 0) tela.classList.remove('is-grabbing');
    })
  );

  function distancia() {
    const [a, b] = [...ponteiros.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function aplicaZoom(valor) {
    estado.escala = Math.min(3.2, Math.max(1, valor));
    $('#zoom').value = Math.round(estado.escala * 100);
    render();
  }

  tela.addEventListener('wheel', (e) => {
    if (!estado.foto) return;
    e.preventDefault();
    aplicaZoom(estado.escala * (e.deltaY < 0 ? 1.06 : 1 / 1.06));
  }, { passive: false });

  /* ==========================================================================
     SAIDA
     ====================================================================== */

  const nomeArquivo = () => `sarah-poncio-7777-${estado.formato}.png`;
  const paraBlob = () => new Promise((ok) => tela.toBlob(ok, 'image/png'));

  let urlResultado = null;

  /**
   * Mostra a imagem pronta na propria pagina. Nao e enfeite: e a unica via de
   * salvar que funciona em todo lugar -- o download programado falha no Safari
   * do iPhone e e bloqueado dentro de visualizador embutido.
   */
  function mostraResultado(blob) {
    if (urlResultado) URL.revokeObjectURL(urlResultado);
    urlResultado = URL.createObjectURL(blob);
    $('#resultadoImg').src = urlResultado;
    $('#resultado').hidden = false;
  }

  async function salva(blob) {
    const ponte = window.claude?.use
      ? await window.claude.use('downloads').catch(() => null)
      : null;

    if (ponte) {
      try {
        await ponte.save({ filename: nomeArquivo(), data: blob });
      } catch (e) {
        /* 'declined' e o usuario dizendo nao -- nao e falha. */
        if (e?.code !== 'declined') console.warn('nao consegui salvar:', e?.code || e);
      }
      return;
    }

    const a = document.createElement('a');
    a.href = urlResultado;
    a.download = nomeArquivo();
    a.click();
  }

  $('#baixar').addEventListener('click', async () => {
    const blob = await paraBlob();
    mostraResultado(blob);
    await salva(blob);
  });

  $('#compartilhar').addEventListener('click', async () => {
    const blob = await paraBlob();
    const arquivo = new File([blob], nomeArquivo(), { type: 'image/png' });
    try {
      await navigator.share({ files: [arquivo], text: 'Agora é Federal! Sarah Poncio 7777' });
    } catch { /* cancelou: nao e erro */ }
  });

  /* ==========================================================================
     LIGACOES DE INTERFACE
     ====================================================================== */

  $('#arquivo').addEventListener('change', (e) => usaArquivo(e.target.files[0]));
  $('#zoom').addEventListener('input', (e) => aplicaZoom(Number(e.target.value) / 100));

  $('#nome').addEventListener('input', (e) => {
    estado.nome = e.target.value;
    render();
  });

  $('#centralizar').addEventListener('click', () => {
    const f = FORMATOS[estado.formato];
    estado.escala = 1;
    $('#zoom').value = 100;
    enquadraNaJanela(f.w, f.h);
    render();
  });

  document.querySelectorAll('.formato__op').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('.formato__op').forEach((op) => {
        op.classList.toggle('is-on', op === b);
        op.setAttribute('aria-checked', String(op === b));
      });
      estado.formato = b.dataset.formato;
      const f = FORMATOS[estado.formato];
      if (estado.foto) enquadraNaJanela(f.w, f.h);
      $('#ajudaSaida').textContent =
        `Sai em PNG ${f.rotulo}, ` +
        (estado.formato === 'feed' ? 'pronto para foto de perfil.' : 'pronto para o story.');
      montaModelos();
      render();
    })
  );

  /* Arrastar arquivo para cima do palco */
  ['dragenter', 'dragover'].forEach((ev) =>
    palco.addEventListener(ev, (e) => { e.preventDefault(); palco.classList.add('is-dragover'); })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    palco.addEventListener(ev, (e) => { e.preventDefault(); palco.classList.remove('is-dragover'); })
  );
  palco.addEventListener('drop', (e) => usaArquivo(e.dataTransfer.files[0]));

  /* Colar com Ctrl+V */
  document.addEventListener('paste', (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    if (item) usaArquivo(item.getAsFile());
  });

  /* ==========================================================================
     PARTIDA
     ====================================================================== */

  Promise.all([carregaFontes(), carregaMolduras()])
    .then(() => {
      montaModelos();
      atualizaCampoNome();
      render();
      /* O botao de compartilhar so aparece onde ele realmente funciona
         (Android/iOS). No desktop ele abriria um dialogo inutil. */
      if (navigator.canShare?.({ files: [new File([''], 'x.png', { type: 'image/png' })] })) {
        $('#compartilhar').hidden = false;
      }
    })
    .catch((erro) => {
      console.error(erro);
      vazio.innerHTML =
        '<p><b>Não consegui carregar a moldura da campanha.</b><br>Recarregue a página.</p>';
    });
})();
