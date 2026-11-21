// ShareMeds - Meus pedidos (Apresentação de Informações)
const API_URL = "http://localhost:3000/pedidos";
const CLASSES = { "Em análise": "st-analise", "Aceito": "st-aceito", "Recusada": "st-recusada" };

const elLista = document.getElementById("lista");
const elMensagem = document.getElementById("mensagem");

// Busca os pedidos no JSONServer (API REST) e monta os cartões via DOM
async function carregarPedidos() {
  try {
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);
    const pedidos = await resposta.json();
    elMensagem.textContent = "";
    renderizar(pedidos);
  } catch (erro) {
    elLista.innerHTML = "";
    elMensagem.textContent = "Não foi possível carregar os pedidos. Verifique se o JSONServer está rodando (json-server --watch meus-pedidos-db.json).";
    console.error(erro);
  }
}

function renderizar(pedidos) {
  elLista.innerHTML = "";
  if (pedidos.length === 0) {
    elMensagem.style.color = "#555";
    elMensagem.textContent = "Nenhum pedido encontrado.";
    return;
  }
  pedidos.forEach(function (p) {
    const card = document.createElement("article");
    card.className = "card";
    const info = document.createElement("div");
    const titulo = document.createElement("h2");
    titulo.textContent = p.medicamento;
    const sub = document.createElement("p");
    sub.textContent = p.hospital;
    info.append(titulo, sub);
    const status = document.createElement("span");
    status.className = "status " + (CLASSES[p.status] || "");
    status.textContent = p.status;
    card.append(info, status);
    elLista.appendChild(card);
  });
}

// ---- Eventos ----
document.addEventListener("DOMContentLoaded", carregarPedidos);   // 1) carga da página
// O botão "← Início" ainda não tem função: será ligado à tela inicial (cadastro) na Sprint 3.
setInterval(carregarPedidos, 30000);                              // 2) timer: atualiza a cada 30 s
