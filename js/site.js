const SITE = {
  ela: "Kamilly",
  apelido: "Cachos",
  filho: "Matteo",
};

const ABAS = [
  ["inicio.html", "Início"],
  ["desculpas.html", "Desculpas"],
  ["amor.html", "Eu te amo"],
  ["motivos.html", "Motivos"],
  ["cartas.html", "Cartas"],
  ["frases.html", "Frases"],
  ["promessas.html", "Promessas"],
  ["nosso-filho.html", "Matteo"],
  ["linguagens.html", "Linguagens"],
  ["jogo.html", "Jogo"],
  ["galeria.html", "Galeria"],
  ["para-sempre.html", "Para sempre"],
];

function paginaAtual() {
  const nome = location.pathname.split("/").pop() || "inicio.html";
  return nome === "" || nome === "index.html" ? "inicio.html" : nome;
}

function montarNav() {
  const topo = document.querySelector("[data-nav]");
  if (!topo) return;
  const atual = paginaAtual();
  const css = document.querySelector('link[href*="estilo.css"]');
  if (css && !css.href.includes("v=14")) css.href = "css/estilo.css?v=14";
  topo.innerHTML = `
    <div class="topo-interno">
      <a class="marca" href="inicio.html">Para ${SITE.ela}</a>
      <button class="menu-btn" type="button">Menu</button>
      <div class="abas">
        ${ABAS.map(
          ([href, label]) =>
            `<a href="${href}" class="${href === atual ? "ativa" : ""}">${label}</a>`
        ).join("")}
      </div>
    </div>`;
  const btn = topo.querySelector(".menu-btn");
  const abas = topo.querySelector(".abas");
  btn.addEventListener("click", () => abas.classList.toggle("aberto"));
}

function lightbox() {
  const caixa = document.querySelector(".lightbox");
  if (!caixa) return;
  document.querySelectorAll("[data-zoom]").forEach((img) => {
    img.addEventListener("click", () => {
      caixa.querySelector("img").src = img.src;
      caixa.classList.add("aberto");
    });
  });
  caixa.addEventListener("click", () => caixa.classList.remove("aberto"));
}

async function api(caminho, opcoes) {
  try {
    const res = await fetch(caminho, opcoes);
    if (!res.ok) throw new Error("falhou");
    return await res.json();
  } catch {
    return null;
  }
}

function coracoesNoClique() {
  document.addEventListener("click", (evento) => {
    if (evento.target.closest("a, button, input, textarea, pre, .jogo")) return;
    const h = document.createElement("span");
    h.className = "coracao-flutua";
    h.textContent = "♥";
    h.style.left = `${evento.clientX}px`;
    h.style.top = `${evento.clientY}px`;
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1200);
  });
}

function musicaSuave() {
  const botao = document.querySelector("[data-musica]");
  if (!botao) return;
  let ctx;
  let master;
  let ligado = false;
  let timer;

  const pulso = (inicio, freq, duracao, volume) => {
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    const filtro = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, inicio);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freq * 0.4, 20), inicio + duracao);
    filtro.type = "lowpass";
    filtro.frequency.value = 220;
    ganho.gain.setValueAtTime(0.0001, inicio);
    ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.018);
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
    osc.connect(filtro);
    filtro.connect(ganho);
    ganho.connect(master);
    osc.start(inicio);
    osc.stop(inicio + duracao + 0.03);
  };

  const ciclo = () => {
    if (!ligado || !ctx) return;
    const agora = ctx.currentTime;
    pulso(agora, 52, 0.11, 0.28);
    pulso(agora + 0.17, 68, 0.09, 0.2);
    timer = setTimeout(ciclo, 455);
  };

  botao.addEventListener("click", async () => {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") await ctx.resume();
    if (ligado) {
      ligado = false;
      clearTimeout(timer);
      botao.classList.remove("batendo");
      botao.textContent = "Tocar nossa nota";
      return;
    }
    ligado = true;
    botao.classList.add("batendo");
    botao.textContent = "Pausar a nota";
    ciclo();
  });
}

function maquinaDeEscrever() {
  const alvo = document.querySelector("[data-type]");
  if (!alvo) return;
  const texto = alvo.getAttribute("data-type");
  alvo.textContent = "";
  let i = 0;
  const timer = setInterval(() => {
    alvo.textContent += texto[i] || "";
    i += 1;
    if (i >= texto.length) clearInterval(timer);
  }, 38);
}

function codigoSecreto() {
  let buffer = "";
  window.addEventListener("keydown", (e) => {
    if (e.key.length !== 1) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-12);
    if (buffer.includes("kamilly") || buffer.includes("cachos") || buffer.includes("matteo")) {
      const aviso = document.createElement("div");
      aviso.className = "segredo";
      aviso.innerHTML = `<p>Você digitou um nome sagrado.</p><p>Kamilly, Cachos, Matteo — os três cabem no mesmo amor.</p>`;
      document.body.appendChild(aviso);
      setTimeout(() => aviso.remove(), 4200);
      buffer = "";
    }
  });
}

async function jsonLocal(caminho) {
  try {
    const res = await fetch(caminho);
    if (!res.ok) throw new Error("sem arquivo");
    return await res.json();
  } catch {
    return null;
  }
}

async function preencherMotivos() {
  const caixa = document.getElementById("motivos");
  if (!caixa) return;
  const dados = await api("/api/motivos");
  const lista = dados?.motivos || (await jsonLocal("dados/motivos.json")) || [];
  if (!lista.length) {
    caixa.innerHTML = "<p class='intro'>Kamilly, Cachos, Matteo: vocês três já seriam motivo suficiente.</p>";
    return;
  }
  caixa.classList.remove("revela");
  caixa.classList.add("visivel");
  caixa.innerHTML = lista
    .map(
      (texto, i) =>
        `<div class="motivo"><span class="numero">${String(i + 1).padStart(2, "0")}</span><p>${texto}</p></div>`
    )
    .join("");
}

async function fraseDoMomento() {
  const alvo = document.querySelector("[data-frase-api]");
  const botao = document.querySelector("[data-nova-frase]");
  if (!alvo) return;
  const atualizar = async () => {
    const dados = await api("/api/frase");
    if (dados?.frase) {
      alvo.textContent = dados.frase;
      return;
    }
    const local = await jsonLocal("dados/frases.json");
    const frases = Array.isArray(local) ? local : [];
    alvo.textContent =
      frases[Math.floor(Math.random() * frases.length)] ||
      "Kamilly, eu te amo. Cachos, eu te escolho. Matteo, vocês são a casa.";
  };
  atualizar();
  botao?.addEventListener("click", atualizar);
}

async function montarLinguagens() {
  const grade = document.getElementById("linguagens");
  if (!grade) return;
  const dados = await api("/api/linguagens");
  const lista = dados?.linguagens || (await jsonLocal("dados/linguagens.json")) || [];
  const filtro = document.querySelector("[data-filtro-lang]");
  const pintar = (tipo) => {
    grade.innerHTML = lista
      .filter((item) => tipo === "todas" || item.tipo === tipo)
      .map(
        (item) => `
        <article class="cartao codigo-cartao">
          <p class="olho">${item.tipo}</p>
          <h3>${item.nome}</h3>
          <pre><code>${item.codigo.replace(/</g, "&lt;")}</code></pre>
        </article>`
      )
      .join("");
  };
  pintar("todas");
  filtro?.addEventListener("change", (e) => pintar(e.target.value));
}

async function executarPython() {
  const botao = document.querySelector("[data-run-py]");
  const saida = document.querySelector("[data-saida-py]");
  if (!botao || !saida) return;
  botao.addEventListener("click", async () => {
    const dados = await api("/api/executar-python");
    saida.textContent = dados
      ? `${dados.codigo}\n— resultado —\n${dados.saida}`
      : "print('Kamilly, eu te amo.')\nprint('Cachos, você é o meu lugar.')\nprint('Matteo, seu pai ama a sua mãe.')\n— resultado —\nKamilly, eu te amo.\nCachos, você é o meu lugar.\nMatteo, seu pai ama a sua mãe.";
  });
}

function envelopes() {
  document.querySelectorAll("[data-envelope]").forEach((el) => {
    el.addEventListener("click", () => el.classList.toggle("aberto"));
  });
  if (paginaAtual() !== "cartas.html") return;
  document.querySelectorAll("main.conteudo > article.carta").forEach((carta) => {
    const titulo = carta.querySelector("h3");
    if (!titulo || carta.classList.contains("para-abrir")) return;
    const nome = titulo.textContent.trim();
    const folha = document.createElement("div");
    folha.className = "carta-folha";
    const miolo = document.createElement("div");
    miolo.className = "carta-folha-miolo";
    while (carta.firstChild) miolo.appendChild(carta.firstChild);
    folha.appendChild(miolo);
    const frente = document.createElement("button");
    frente.type = "button";
    frente.className = "carta-frente";
    frente.setAttribute("aria-expanded", "false");
    frente.innerHTML = `
      <span class="carta-aba" aria-hidden="true"></span>
      <span class="carta-miolo">
        <span class="carta-selo">♥</span>
        <span class="carta-nome">${nome}</span>
        <span class="carta-toque">Toque para abrir</span>
      </span>`;
    carta.classList.add("para-abrir");
    carta.append(frente, folha);
    frente.addEventListener("click", () => {
      const aberta = carta.classList.toggle("aberta");
      frente.setAttribute("aria-expanded", aberta ? "true" : "false");
      frente.querySelector(".carta-toque").textContent = aberta
        ? "Toque para fechar"
        : "Toque para abrir";
    });
  });
}

async function recados() {
  const form = document.querySelector("[data-recado]");
  const lista = document.querySelector("[data-lista-recados]");
  if (!form) return;
  const pintar = (itens) => {
    if (!lista) return;
    lista.innerHTML = (itens || [])
      .slice()
      .reverse()
      .map(
        (r) =>
          `<article class="carta"><p class="olho">${r.autor} · ${r.quando || ""}</p><p>${r.texto}</p></article>`
      )
      .join("") || "<p class='intro'>Ainda não tem recado. O primeiro pode ser seu, Kamilly.</p>";
  };
  const chave = "recados-cachos";
  const locais = () => {
    try {
      return JSON.parse(localStorage.getItem(chave) || "[]");
    } catch {
      return [];
    }
  };
  const atuais = await api("/api/recados");
  pintar(atuais?.recados || locais());
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texto = form.querySelector("[name=texto]").value;
    const autor = form.querySelector("[name=autor]").value || "Kamilly";
    const res = await api("/api/recado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, autor }),
    });
    if (res?.ok) {
      form.querySelector("[name=texto]").value = "";
      pintar(res.recados);
      return;
    }
    const lista = locais();
    lista.push({
      autor,
      texto,
      quando: new Date().toISOString().slice(0, 19),
    });
    localStorage.setItem(chave, JSON.stringify(lista));
    form.querySelector("[name=texto]").value = "";
    pintar(lista);
  });
}

function amorInfinito() {
  const btn = document.querySelector("[data-infinito]");
  const out = document.querySelector("[data-contador]");
  if (!btn || !out) return;
  let n = Number(localStorage.getItem("amor-kamilly") || 0);
  const mostrar = () => {
    out.textContent = `Eu te amo × ${n.toLocaleString("pt-BR")} — e ainda é pouco.`;
  };
  mostrar();
  btn.addEventListener("click", () => {
    n += 1;
    localStorage.setItem("amor-kamilly", String(n));
    mostrar();
  });
}

function barraMusica() {
  if (document.querySelector("[data-musica]")) return;
  const botao = document.createElement("button");
  botao.className = "botao claro barra-musica";
  botao.setAttribute("data-musica", "");
  botao.textContent = "Tocar nossa nota";
  document.body.appendChild(botao);
}

function petalas() {
  const camada = document.createElement("div");
  camada.className = "petalas";
  camada.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 14; i += 1) {
    const p = document.createElement("span");
    p.textContent = "❀";
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${10 + Math.random() * 12}s`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    p.style.fontSize = `${0.7 + Math.random()}rem`;
    p.style.opacity = `${0.25 + Math.random() * 0.35}`;
    camada.appendChild(p);
  }
  document.body.appendChild(camada);
}

function revelar() {
  const alvos = document.querySelectorAll(
    ".conteudo > *:not(#motivos):not([data-lista-recados]), .carta, .cartao, .faixa"
  );
  if (!("IntersectionObserver" in window)) {
    alvos.forEach((el) => el.classList.add("visivel"));
    return;
  }
  const obs = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visivel");
          obs.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  alvos.forEach((el) => {
    el.classList.add("revela");
    obs.observe(el);
  });
}

function portao() {
  const porta = document.getElementById("portao");
  if (!porta) {
    document.body.classList.remove("portao-fechado");
    return;
  }
  const botao = document.getElementById("abrir");
  if (location.hash === "#dentro") {
    porta.remove();
    document.body.classList.remove("portao-fechado");
    return;
  }
  const fecharPortao = () => {
    porta.classList.add("sumindo");
    document.body.classList.remove("portao-fechado");
    setTimeout(() => porta.remove(), 700);
  };
  const abrir = () => {
    if (!botao || botao.classList.contains("aberto")) return;
    botao.classList.add("aberto");
    for (let i = 0; i < 16; i += 1) {
      const h = document.createElement("span");
      h.className = "coracao-abertura";
      h.textContent = i % 2 ? "♥" : "❀";
      h.style.left = `${18 + Math.random() * 64}%`;
      h.style.animationDelay = `${Math.random() * 0.35}s`;
      porta.appendChild(h);
    }
    setTimeout(fecharPortao, 1300);
  };
  if (botao) botao.addEventListener("click", abrir);
}

montarNav();
portao();
barraMusica();
lightbox();
coracoesNoClique();
musicaSuave();
maquinaDeEscrever();
codigoSecreto();
preencherMotivos();
fraseDoMomento();
montarLinguagens();
executarPython();
envelopes();
recados();
amorInfinito();
petalas();
revelar();
