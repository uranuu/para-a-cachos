(() => {
  const arena = document.querySelector("[data-jogo]");
  if (!arena) return;

  const TEMPO = 45;
  const VIDAS = 3;
  const CHAVE = "recorde-chuva-cachos";
  const sussurros = ["eu te amo", "me perdoa", "Cachos", "Kamilly", "pra sempre", "você", "nosso", "eu fico"];

  const cesta = arena.querySelector("[data-cesta]");
  const ceu = arena.querySelector("[data-jogo-ceu]");
  const inicio = arena.querySelector("[data-jogo-inicio]");
  const fim = arena.querySelector("[data-jogo-fim]");
  const els = {
    pontos: document.querySelector("[data-jogo-pontos]"),
    combo: document.querySelector("[data-jogo-combo]"),
    pegos: document.querySelector("[data-jogo-pegos]"),
    tempo: document.querySelector("[data-jogo-tempo]"),
    vidas: document.querySelector("[data-jogo-vidas]"),
    recorde: document.querySelector("[data-jogo-recorde]"),
    fimPontos: document.querySelector("[data-fim-pontos]"),
    fimPegos: document.querySelector("[data-fim-pegos]"),
    fimCombo: document.querySelector("[data-fim-combo]"),
    fimRecorde: document.querySelector("[data-fim-recorde]"),
    tituloFim: document.querySelector("[data-jogo-titulo-fim]"),
    msgFim: document.querySelector("[data-jogo-msg-fim]"),
  };

  let pontos = 0;
  let combo = 0;
  let melhorCombo = 0;
  let pegos = 0;
  let vidas = VIDAS;
  let resto = TEMPO;
  let rodando = false;
  let itens = [];
  let cestaX = 0.5;
  let ultimo = 0;
  let nasceuEm = 0;
  let quadro;
  const teclas = { ArrowLeft: false, ArrowRight: false };

  const recordeAtual = () => Number(localStorage.getItem(CHAVE) || 0);
  if (els.recorde) els.recorde.textContent = recordeAtual();

  for (let i = 0; i < 18; i += 1) {
    const s = document.createElement("span");
    s.className = "jogo-estrela";
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 48}%`;
    s.style.opacity = `${0.25 + Math.random() * 0.5}`;
    ceu.appendChild(s);
  }

  const formatarTempo = (s) => {
    const n = Math.max(0, Math.ceil(s));
    return `0:${String(n).padStart(2, "0")}`;
  };

  const multiplicador = () => 1 + Math.floor(combo / 3);

  const atualizarHud = () => {
    els.pontos.textContent = pontos.toLocaleString("pt-BR");
    els.combo.textContent = `x${multiplicador()}`;
    els.pegos.textContent = String(pegos);
    els.tempo.textContent = formatarTempo(resto);
    els.vidas.textContent = "♥".repeat(vidas) + "♡".repeat(Math.max(0, VIDAS - vidas));
  };

  const sussurrar = (x, y, texto, classe) => {
    const el = document.createElement("span");
    el.className = `jogo-sussurro ${classe || ""}`;
    el.textContent = texto;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    arena.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  };

  const posicaoItem = (item) => {
    const a = arena.getBoundingClientRect();
    return { x: (item.x / 100) * a.width, y: (item.y / 100) * a.height };
  };

  const perderVida = () => {
    vidas -= 1;
    combo = 0;
    arena.classList.remove("ferido");
    void arena.offsetWidth;
    arena.classList.add("ferido");
    atualizarHud();
    if (vidas <= 0) encerrar("vidas");
  };

  const pegar = (item, motivo) => {
    if (!item.vivo || !rodando) return;
    item.vivo = false;
    item.el.remove();
    const { x, y } = motivo?.clientX
      ? (() => {
          const a = arena.getBoundingClientRect();
          return { x: motivo.clientX - a.left, y: motivo.clientY - a.top };
        })()
      : posicaoItem(item);

    if (item.tipo === "ruim") {
      sussurrar(x, y, "orgulho", "ruim");
      perderVida();
      return;
    }

    combo += 1;
    melhorCombo = Math.max(melhorCombo, combo);
    const ganho = item.valor * multiplicador();
    pontos += ganho;
    pegos += 1;
    atualizarHud();
    sussurrar(x, y, `+${ganho}`);
    if (combo > 1 && combo % 3 === 0) {
      sussurrar(x, y - 22, `combo x${multiplicador()}`);
    } else {
      sussurrar(x, Math.max(18, y - 36), sussurros[Math.floor(Math.random() * sussurros.length)]);
    }
  };

  const tipoAleatorio = () => {
    const n = Math.random();
    if (n < 0.12) return { tipo: "ruim", classe: "ruim", texto: "☁", valor: 0 };
    if (n < 0.24) return { tipo: "ouro", classe: "ouro", texto: "♥", valor: 30 };
    if (n < 0.42) return { tipo: "flor", classe: "flor", texto: "❀", valor: 15 };
    return { tipo: "coracao", classe: "", texto: "♥", valor: 10 };
  };

  const nascer = (agora) => {
    if (!rodando || itens.length > 9) return;
    const intervalo = Math.max(380, 980 - (TEMPO - resto) * 14);
    if (agora - nasceuEm < intervalo) return;
    nasceuEm = agora;
    const tipo = tipoAleatorio();
    const el = document.createElement("button");
    el.type = "button";
    el.className = `jogo-item ${tipo.classe}`.trim();
    el.textContent = tipo.texto;
    const item = {
      el,
      x: 8 + Math.random() * 84,
      y: -8,
      vy: 0.016 + Math.random() * 0.014 + (TEMPO - resto) * 0.00035,
      vivo: true,
      ...tipo,
    };
    el.style.left = `${item.x}%`;
    el.style.top = `${item.y}%`;
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      pegar(item, e);
    });
    arena.appendChild(el);
    itens.push(item);
  };

  const colideCesta = (item) => {
    const a = arena.getBoundingClientRect();
    const b = cesta.getBoundingClientRect();
    const ix = a.left + (item.x / 100) * a.width;
    const iy = a.top + (item.y / 100) * a.height + 16;
    return ix > b.left - 8 && ix < b.right + 8 && iy > b.top && iy < b.bottom + 12;
  };

  const moverCesta = (clienteX) => {
    const caixa = arena.getBoundingClientRect();
    const x = (clienteX - caixa.left) / caixa.width;
    cestaX = Math.min(0.9, Math.max(0.1, x));
    cesta.style.left = `${cestaX * 100}%`;
  };

  const passo = (agora) => {
    if (!rodando) return;
    const dt = Math.min(32, agora - ultimo || 16);
    ultimo = agora;
    resto -= dt / 1000;
    if (resto <= 0) {
      resto = 0;
      atualizarHud();
      encerrar("tempo");
      return;
    }
    if (teclas.ArrowLeft) cestaX = Math.max(0.1, cestaX - 0.012);
    if (teclas.ArrowRight) cestaX = Math.min(0.9, cestaX + 0.012);
    cesta.style.left = `${cestaX * 100}%`;
    nascer(agora);
    itens.forEach((item) => {
      item.y += item.vy * dt;
      item.el.style.top = `${item.y}%`;
      if (colideCesta(item)) pegar(item);
      else if (item.y > 108) {
        item.vivo = false;
        item.el.remove();
        if (item.tipo === "coracao" || item.tipo === "ouro") {
          combo = 0;
        }
      }
    });
    itens = itens.filter((i) => i.vivo);
    atualizarHud();
    quadro = requestAnimationFrame(passo);
  };

  const limpar = () => {
    itens.forEach((i) => i.el.remove());
    itens = [];
    arena.querySelectorAll(".jogo-sussurro").forEach((n) => n.remove());
    arena.classList.remove("ferido");
  };

  const iniciar = () => {
    cancelAnimationFrame(quadro);
    limpar();
    pontos = 0;
    combo = 0;
    melhorCombo = 0;
    pegos = 0;
    vidas = VIDAS;
    resto = TEMPO;
    rodando = true;
    nasceuEm = 0;
    ultimo = performance.now();
    atualizarHud();
    inicio.classList.add("oculto");
    fim.classList.add("oculto");
    quadro = requestAnimationFrame(passo);
  };

  const encerrar = (motivo) => {
    if (!rodando) return;
    rodando = false;
    cancelAnimationFrame(quadro);
    limpar();
    const recorde = recordeAtual();
    const novo = pontos > recorde;
    if (novo) localStorage.setItem(CHAVE, String(pontos));
    const recordeFinal = Math.max(pontos, recorde);
    els.fimPontos.textContent = pontos.toLocaleString("pt-BR");
    els.fimPegos.textContent = String(pegos);
    els.fimCombo.textContent = `x${1 + Math.floor(melhorCombo / 3)} (${melhorCombo})`;
    els.fimRecorde.textContent = recordeFinal.toLocaleString("pt-BR");
    els.tituloFim.textContent = motivo === "vidas" ? "As vidas acabaram" : "O tempo acabou";
    els.msgFim.textContent = novo
      ? "Novo recorde, Cachos. Você pegou mais amor do que da última vez."
      : "É assim que eu te amo, Kamilly: em chuva, em números, e ainda assim incompleto.";
    if (els.recorde) els.recorde.textContent = recordeFinal;
    fim.classList.remove("oculto");
  };

  arena.addEventListener("pointermove", (e) => moverCesta(e.clientX));
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      teclas[e.key] = true;
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") teclas[e.key] = false;
  });
  arena.querySelector("[data-jogo-comecar]").addEventListener("click", iniciar);
  arena.querySelector("[data-jogo-de-novo]").addEventListener("click", iniciar);
  atualizarHud();
})();
