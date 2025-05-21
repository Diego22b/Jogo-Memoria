const URL_API = "https://script.google.com/macros/s/AKfycbzfojNV_V1Ij28QeRWfvqMA70ueRyS0Taz_Q90A3KuSIc5CMXwQvvZB76we15VyxBFB/exec";

let imagens = [1, 2, 3, 4, 5, 6];
let cartas = imagens.concat(imagens);
let primeiraCarta = null;
let travar = false;
let tempo = 0;
let intervalo;
let acertos = 0;

const inputNome = document.getElementById("nomeJogador");
const btnComecar = document.getElementById("btnComecar");
const tabuleiro = document.getElementById("tabuleiro");

const modal = document.getElementById("modalFimJogo");
const mensagemModal = document.getElementById("mensagemFimJogo");
const btnFecharModal = document.getElementById("btnFecharModal");

let jogoIniciado = false; // flag para saber se o jogo começou

function verificaNomeInput() {
  const nomeVal = inputNome.value.trim();
  if (nomeVal === "") {
    btnComecar.disabled = true;
    bloquearTabuleiro(true);
  } else {
    btnComecar.disabled = false;
    bloquearTabuleiro(!jogoIniciado);
  }
}

function bloquearTabuleiro(bloquear) {
  if (bloquear) {
    tabuleiro.style.pointerEvents = "none";
    tabuleiro.style.opacity = "0.5";
  } else {
    tabuleiro.style.pointerEvents = "auto";
    tabuleiro.style.opacity = "1";
  }
}

inputNome.addEventListener("input", () => {
  jogoIniciado = false; // Se o usuário mudar o nome, precisa clicar em Começar de novo
  verificaNomeInput();
  tabuleiro.innerHTML = ""; // Limpa o tabuleiro se mudar o nome
  clearInterval(intervalo);
  atualizarTimer();
});

btnComecar.addEventListener("click", () => {
  if (inputNome.value.trim() === "") {
    alert("Por favor, digite seu nome antes de jogar!");
    inputNome.focus();
    return;
  }
  jogoIniciado = true;
  bloquearTabuleiro(false);
  iniciarJogo();
});

btnFecharModal.addEventListener("click", () => {
  modal.style.display = "none";
  carregarPlacar(); // Atualiza o placar quando fecha a modal
});

function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function iniciarJogo() {
  cartas = imagens.concat(imagens);
  embaralhar(cartas);
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
    frente.style.backgroundImage = `url('IMG/${img}.png')`;

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
  if (!jogoIniciado) {
    alert("Por favor, clique em Começar para iniciar o jogo.");
    return;
  }

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
  const min = Math.floor(tempo / 60).toString().padStart(2, "0");
  const seg = (tempo % 60).toString().padStart(2, "0");
  document.getElementById("timer").innerText = `Tempo: ${min}:${seg}`;
}

function fimDeJogo() {
  clearInterval(intervalo);
  const nome = inputNome.value || "Anônimo";
  mostrarModalMensagem(`Parabéns, ${nome}! Você terminou o jogo em ${formatarTempo(tempo)}.`);
  enviarResultado(nome, tempo);
}

function mostrarModalMensagem(mensagem) {
  mensagemModal.textContent = mensagem;
  modal.style.display = "flex";
}

function enviarResultado(nome, tempo) {
  fetch(URL_API, {
    method: "POST",
    body: JSON.stringify({ nome, tempo }),
    headers: { "Content-Type": "application/json" },
  })
    .then(() => carregarPlacar())
    .catch((err) => console.error("Erro ao enviar resultado:", err));
}

function carregarPlacar() {
  fetch(URL_API)
    .then((res) => res.json())
    .then((dados) => {
      const placarDiv = document.getElementById("placar");
      placarDiv.innerHTML = "<h2>🏆 Placar</h2>";
      const top5 = dados.sort((a, b) => a.tempo - b.tempo).slice(0, 5);
      top5.forEach((item, index) => {
        const tempoFormatado = formatarTempo(item.tempo);
        placarDiv.innerHTML += `<p>${index + 1}. ${item.nome} — ${tempoFormatado}</p>`;
      });
    })
    .catch((err) => console.error("Erro ao carregar placar:", err));
}

function formatarTempo(seg) {
  const min = Math.floor(seg / 60).toString().padStart(2, "0");
  const s = (seg % 60).toString().padStart(2, "0");
  return `${min}:${s}`;
}

window.onload = () => {
  jogoIniciado = false;
  bloquearTabuleiro(true);
  verificaNomeInput();
  carregarPlacar();
};
