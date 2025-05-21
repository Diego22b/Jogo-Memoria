// ====== CONFIGURAÇÕES FIREBASE ======
const firebaseConfig = {
  apiKey: "AIzaSyDeTaMxFcJ6Woi-4dlJglwZLxA8trpncVY",
  authDomain: "jogo-memoria-placar.firebaseapp.com",
  databaseURL: "https://jogo-memoria-placar-default-rtdb.firebaseio.com",
  projectId: "jogo-memoria-placar",
  storageBucket: "jogo-memoria-placar.firebasestorage.app",
  messagingSenderId: "987615668926",
  appId: "1:987615668926:web:ff21417bb1893340caccef"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ====== VARIÁVEIS DO JOGO ======
let imagens = [1, 2, 3, 4, 5, 6];
let cartas = imagens.concat(imagens);
let primeiraCarta = null;
let travar = false;
let tempo = 0;
let intervalo = null; // Garantir inicialização como null
let acertos = 0;

const inputNome = document.getElementById("nomeJogador");
const btnComecar = document.getElementById("btnComecar");
const tabuleiro = document.getElementById("tabuleiro");
const placarDiv = document.getElementById("placar");
const timerDiv = document.getElementById("timer");

let jogoIniciado = false;

// Verifica nome input e habilita botão Começar
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

// Bloqueia/desbloqueia o tabuleiro
function bloquearTabuleiro(bloquear) {
  if (bloquear) {
    tabuleiro.style.pointerEvents = "none";
    tabuleiro.style.opacity = "0.5";
  } else {
    tabuleiro.style.pointerEvents = "auto";
    tabuleiro.style.opacity = "1";
  }
}

// Evento input nome
inputNome.addEventListener("input", () => {
  jogoIniciado = false;
  verificaNomeInput();
  tabuleiro.innerHTML = "";
  clearInterval(intervalo);
  intervalo = null;  // reset timer
  tempo = 0;
  atualizarTimer();
});

// Evento botão Começar
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

// Embaralhar cartas
function embaralhar(array) {
  for (let i = array.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i +1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Iniciar jogo
function iniciarJogo() {
  cartas = imagens.concat(imagens);
  embaralhar(cartas);
  tabuleiro.innerHTML = "";
  acertos = 0;
  tempo = 0;
  clearInterval(intervalo);
  intervalo = null;
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
    verso.textContent = "?";

    carta.appendChild(frente);
    carta.appendChild(verso);
    carta.addEventListener("click", virarCarta);
    tabuleiro.appendChild(carta);
  });
}

// Lógica para virar carta
function virarCarta() {
  if (!jogoIniciado) {
    alert("Por favor, clique em Começar para iniciar o jogo.");
    return;
  }

  if (travar || this.classList.contains("virada")) return;

  this.classList.add("virada");

  if (!primeiraCarta) {
    primeiraCarta = this;
    // só inicia o timer se ele não estiver rodando
    if (tempo === 0 && intervalo === null) iniciarTimer();
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

// Timer
function iniciarTimer() {
  intervalo = setInterval(() => {
    tempo++;
    atualizarTimer();
  }, 1000);
}

function atualizarTimer() {
  let min = Math.floor(tempo / 60).toString().padStart(2, "0");
  let seg = (tempo % 60).toString().padStart(2, "0");
  timerDiv.textContent = `Tempo: ${min}:${seg}`;
}

// Fim do jogo
function fimDeJogo() {
  clearInterval(intervalo);
  intervalo = null;  // limpa a referência para evitar reinício
  alert(`Parabéns ${inputNome.value}! Você terminou em ${formatarTempo(tempo)}`);
  salvarResultado(inputNome.value, tempo).then(() => {
    carregarPlacar();
  });
  bloquearTabuleiro(true);
  jogoIniciado = false;
  btnComecar.disabled = true;
}

// Formatar tempo em mm:ss
function formatarTempo(segundos) {
  const min = Math.floor(segundos / 60).toString().padStart(2, "0");
  const seg = (segundos % 60).toString().padStart(2, "0");
  return `${min}:${seg}`;
}

// ====== FIREBASE - PLACAR ======

// Salvar resultado no Firebase
function salvarResultado(nome, tempo) {
  return new Promise((resolve, reject) => {
    const placarRef = db.ref("placar");

    // Verificar se já existe tempo melhor para o jogador
    placarRef.orderByChild("nome").equalTo(nome).once("value", snapshot => {
      let salvar = true;

      if (snapshot.exists()) {
        snapshot.forEach(childSnap => {
          const dado = childSnap.val();
          if (dado.tempo <= tempo) {
            // Já existe tempo igual ou melhor, não salvar
            salvar = false;
          } else {
            // Tempo pior, remove para atualizar
            db.ref(`placar/${childSnap.key}`).remove();
          }
        });
      }

      if (salvar) {
        const novoRegistro = placarRef.push();
        novoRegistro.set({
          nome: nome,
          tempo: tempo,
          timestamp: Date.now()
        }).then(() => resolve())
          .catch(err => reject(err));
      } else {
        resolve();
      }
    });
  });
}

// Carregar placar do Firebase e mostrar sem nomes repetidos, só o tempo mais rápido
function carregarPlacar() {
  const placarRef = db.ref("placar");
  placarDiv.innerHTML = "<h2>🏆 Placar</h2><p>Carregando...</p>";

  placarRef.once("value", snapshot => {
    const dados = snapshot.val();

    if (!dados) {
      placarDiv.innerHTML = "<h2>🏆 Placar</h2><p>Nenhum resultado ainda.</p>";
      return;
    }

    // Obter apenas o melhor tempo de cada jogador
    const melhoresJogadores = {};

    for (const key in dados) {
      const item = dados[key];
      if (!(item.nome in melhoresJogadores) || item.tempo < melhoresJogadores[item.nome].tempo) {
        melhoresJogadores[item.nome] = { tempo: item.tempo, timestamp: item.timestamp };
      }
    }

    // Converter para array e ordenar pelo tempo crescente (mais rápido no topo)
    const arrayJogadores = Object.entries(melhoresJogadores)
      .map(([nome, data]) => ({ nome, tempo: data.tempo }))
      .sort((a, b) => a.tempo - b.tempo);

    // Mostrar só os 5 primeiros
    let html = "<h2>🏆 Placar</h2>";
    arrayJogadores.slice(0, 5).forEach((jogador, i) => {
      html += `<p>${i + 1}. ${jogador.nome} — ${formatarTempo(jogador.tempo)}</p>`;
    });

    placarDiv.innerHTML = html;
  });
}

// Carrega placar ao iniciar a página
window.onload = () => {
  carregarPlacar();
  verificaNomeInput();
};
