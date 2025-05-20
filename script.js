const URL_API = "https://script.google.com/macros/s/AKfycbxJhTnl1k9LAfPSXDPrOEntm2EnYvxCeu9LZg4nhb7CQ4miaRgb3mtiEfyW6--p8GDrlw/exec"; // Substitua pela sua URL

let imagens = [1, 2, 3, 4, 5, 6];
let cartas = imagens.concat(imagens);
let primeiraCarta = null;
let travar = false;
let tempo = 0;
let intervalo;
let acertos = 0;

function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function iniciarJogo() {
  cartas = imagens.concat(imagens);
  embaralhar(cartas);
  const tabuleiro = document.getElementById("tabuleiro");
  tabuleiro.innerHTML = "";
  acertos = 0;
  tempo = 0;
  clearInterval(intervalo);
  atualizarTimer();

  cartas.forEach((img) => {
    const carta = document.createElement("div");
    carta.classList.add("carta");
    carta.dataset.valor = img;

    const frente = document.createElement("div");
    frente.classList.add("frente");
    frente.style.backgroundImage = `url('img/${img}.png')`;

    const verso = document.createElement("div");
    verso.classList.add("verso");
    verso.innerHTML = "?";

    carta.appendChild(frente);
    carta.appendChild(verso);
    carta.addEventListener("click", virarCarta);
    tabuleiro.appendChild(carta);
  });
}

function virarCarta() {
  if (travar || this.classList.contains("virada")) return;

  this.classList.add("virada");
  if (!primeiraCarta) {
    primeiraCarta = this;
    if (tempo === 0) iniciarTimer();
  } else {
    if (this.dataset.valor === primeiraCarta.dataset.valor) {
      acertos++;
      primeiraCarta = null;
      if (acertos === imagens.length) fimDeJogo();
    } else {
      travar = true;
      setTimeout(() => {
        this.classList.remove("virada");
        primeiraCarta.classList.remove("virada");
        primeiraCarta = null;
        travar = false;
      }, 1000);
    }
  }
}

function iniciarTimer() {
  intervalo = setInterval(() => {
    tempo++;
    atualizarTimer();
  }, 1000);
}

function atualizarTimer() {
  const min = Math.floor(tempo / 60).toString().padStart(2, '0');
  const seg = (tempo % 60).toString().padStart(2, '0');
  document.getElementById("timer").innerText = `Tempo: ${min}:${seg}`;
}

function fimDeJogo() {
  clearInterval(intervalo);
  const nome = document.getElementById("nomeJogador").value || "Anônimo";
  enviarResultado(nome, tempo);
}

function enviarResultado(nome, tempo) {
  fetch(URL_API, {
    method: "POST",
    body: JSON.stringify({ nome, tempo }),
    headers: { "Content-Type": "application/json" }
  })
  .then(() => carregarPlacar())
  .catch(err => console.error("Erro ao enviar resultado:", err));
}

function carregarPlacar() {
  fetch(URL_API)
    .then(res => res.json())
    .then(dados => {
      const placarDiv = document.getElementById("placar");
      placarDiv.innerHTML = "<h2>🏆 Placar</h2>";
      const top5 = dados.sort((a, b) => a.tempo - b.tempo).slice(0, 5);
      top5.forEach((item, index) => {
        const tempoFormatado = formatarTempo(item.tempo);
        placarDiv.innerHTML += `<p>${index + 1}. ${item.nome} — ${tempoFormatado}</p>`;
      });
    })
    .catch(err => console.error("Erro ao carregar placar:", err));
}

function formatarTempo(seg) {
  const min = Math.floor(seg / 60).toString().padStart(2, '0');
  const s = (seg % 60).toString().padStart(2, '0');
  return `${min}:${s}`;
}

window.onload = () => {
  iniciarJogo();
  carregarPlacar();
};
