// Funções compartilhadas entre as telas
const API = "http://localhost:3000";

async function api(caminho, opcoes = {}) {
  const resp = await fetch(API + caminho, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });
  if (!resp.ok) throw new Error("Erro na API: " + resp.status);
  return resp.status === 204 ? null : resp.json();
}

function mostrarAviso(texto) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = texto;
  t.classList.add("ativo");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("ativo"), 2600);
}

function formatarVencimento(iso) {
  const [ano, mes] = iso.split("-");
  return mes + "/" + ano.slice(2);
}

function formatarData(iso) {
  const [a, m, d] = iso.split("-");
  return d + "/" + m + "/" + a;
}

function escapar(texto) {
  const d = document.createElement("div");
  d.textContent = texto;
  return d.innerHTML;
}

// Links de menu que pertencem a outros integrantes do grupo
function ligarMenusDoGrupo() {
  document.querySelectorAll("[data-grupo]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      mostrarAviso("Funcionalidade desenvolvida por outro integrante do grupo.");
    });
  });
}
