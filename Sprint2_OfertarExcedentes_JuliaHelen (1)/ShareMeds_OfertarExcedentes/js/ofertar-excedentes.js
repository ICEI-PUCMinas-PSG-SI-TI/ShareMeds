// ShareMeds - Ofertar excedente (Cadastro de Informações - CRUD)
// Os dados ficam no JSONServer (API REST), na coleção "ofertarExcedente".
//   CREATE -> POST   | READ -> GET   | UPDATE -> PUT   | DELETE -> DELETE
const API_URL = "http://localhost:3000/ofertarExcedente";
const CAMPO_QTD = "quantidadeDisponível"; // nome da chave no JSON (conforme o planejamento)

let ofertas = [];          // cópia local dos registros do servidor
let editandoId = null;     // id da oferta em edição (null = modo cadastro)
let ordemAtual = "id";     // critério de ordenação da tabela

const form = document.getElementById("formOfertarExcedentes");
const elBtnEnviar = document.getElementById("btnEnviar");
const elMensagem = document.getElementById("mensagem");
const elCorpo = document.getElementById("corpoTabela");
const elVazio = document.getElementById("msgVazio");
const campos = {
  medicamento: document.getElementById("medicamento"),
  dataDeValidade: document.getElementById("dataDeValidade"),
  quantidadeDisponivel: document.getElementById("quantidadeDisponivel")
};

// ---------- Validação ----------
const regras = {
  medicamento: function (v) {
    if (v === "") return "Informe o nome e a dosagem do medicamento.";
    if (v.length < 3) return "O nome do medicamento deve ter pelo menos 3 caracteres.";
    return "";
  },
  dataDeValidade: function (v) {
    if (v === "") return "Informe a validade do medicamento.";
    if (!/\d/.test(v)) return "Informe a validade com números (ex: 15 dias ou 30/12/2026).";
    return "";
  },
  quantidadeDisponivel: function (v) {
    if (v === "") return "Informe a quantidade disponível.";
    if (!/\d/.test(v)) return "Informe a quantidade com números (ex: 15 caixas).";
    if (parseInt(v.replace(/\D/g, ""), 10) <= 0) return "A quantidade deve ser maior que zero.";
    return "";
  }
};

function mostrarErro(nome, texto) {
  campos[nome].classList.toggle("invalido", texto !== "");
  document.querySelector('[data-erro-para="' + nome + '"]').textContent = texto;
}
function validarCampo(nome) {
  const texto = regras[nome](campos[nome].value.trim());
  mostrarErro(nome, texto);
  return texto === "";
}
function validarFormulario() {
  let valido = true;
  Object.keys(campos).forEach(function (nome) { if (!validarCampo(nome)) valido = false; });
  return valido;
}
function limparErros() {
  Object.keys(campos).forEach(function (nome) { mostrarErro(nome, ""); });
}
function mostrarMensagem(texto, tipo) {
  elMensagem.textContent = texto;
  elMensagem.className = "mensagem " + (tipo || "");
}
const MSG_API = "Não foi possível comunicar com o servidor. Verifique se o JSONServer está rodando (json-server --watch db.json).";

// ---------- READ: busca e exibe as ofertas ----------
async function carregarOfertas() {
  try {
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);
    ofertas = await resposta.json();
    renderizarTabela();
  } catch (erro) {
    console.error(erro);
    ofertas = [];
    elCorpo.innerHTML = "";
    elVazio.textContent = "";
    mostrarMensagem(MSG_API, "falha");
  }
}

function ordenar(lista) {
  const copia = lista.slice();
  copia.sort(function (a, b) {
    if (ordemAtual === "id") return Number(b.id) - Number(a.id); // mais recentes primeiro
    return String(a[ordemAtual]).localeCompare(String(b[ordemAtual]), "pt-BR", { numeric: true });
  });
  return copia;
}

function criarBotao(texto, acao, id, perigo) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn-tabela" + (perigo ? " perigo" : "");
  b.dataset.acao = acao;
  b.dataset.id = id;
  b.textContent = texto;
  return b;
}

// Monta a tabela dinamicamente via DOM
function renderizarTabela() {
  elCorpo.innerHTML = "";
  if (ofertas.length === 0) {
    elVazio.textContent = "Nenhuma oferta cadastrada.";
    return;
  }
  elVazio.textContent = "";
  ordenar(ofertas).forEach(function (o) {
    const tr = document.createElement("tr");
    if (String(o.id) === String(editandoId)) tr.className = "em-edicao";
    tr.insertCell().textContent = o.medicamento;
    tr.insertCell().textContent = o.dataDeValidade;
    tr.insertCell().textContent = o[CAMPO_QTD];
    const tdAcoes = tr.insertCell();
    tdAcoes.className = "col-acoes";
    tdAcoes.append(criarBotao("Editar", "editar", o.id, false), criarBotao("Excluir", "excluir", o.id, true));
    elCorpo.appendChild(tr);
  });
}

// ---------- CREATE / UPDATE ----------
async function enviarOferta(evento) {
  evento.preventDefault();
  mostrarMensagem("");

  if (!validarFormulario()) {
    mostrarMensagem("Corrija os campos destacados antes de enviar.", "falha");
    return;
  }

  const oferta = {
    medicamento: campos.medicamento.value.trim(),
    dataDeValidade: campos.dataDeValidade.value.trim()
  };
  oferta[CAMPO_QTD] = campos.quantidadeDisponivel.value.trim();

  const editando = editandoId !== null;
  const url = editando ? API_URL + "/" + encodeURIComponent(editandoId) : API_URL;
  if (editando) oferta.id = editandoId;

  elBtnEnviar.disabled = true;
  try {
    const resposta = await fetch(url, {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(oferta)
    });
    if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);
    sairDoModoEdicao();
    form.reset();
    limparErros();
    await carregarOfertas();
    mostrarMensagem(editando ? "Oferta atualizada com sucesso!" : "Oferta enviada! Ela já está disponível para os outros hospitais.", "sucesso");
  } catch (erro) {
    console.error(erro);
    mostrarMensagem(MSG_API, "falha");
  } finally {
    elBtnEnviar.disabled = false;
  }
}

// ---------- Modo edição ----------
function entrarNoModoEdicao(id) {
  const o = ofertas.find(function (x) { return String(x.id) === String(id); });
  if (!o) return;
  editandoId = o.id;
  campos.medicamento.value = o.medicamento;
  campos.dataDeValidade.value = o.dataDeValidade;
  campos.quantidadeDisponivel.value = o[CAMPO_QTD];
  limparErros();
  elBtnEnviar.textContent = "Salvar alterações";
  mostrarMensagem("Editando a oferta de " + o.medicamento + ". Altere os campos e clique em \"Salvar alterações\".", "");
  renderizarTabela();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  campos.medicamento.focus();
}

function sairDoModoEdicao() {
  editandoId = null;
  elBtnEnviar.textContent = "Enviar";
}

// ---------- DELETE ----------
async function excluirOferta(id) {
  const o = ofertas.find(function (x) { return String(x.id) === String(id); });
  if (!o || !confirm("Excluir a oferta de \"" + o.medicamento + "\"?")) return;
  try {
    const resposta = await fetch(API_URL + "/" + encodeURIComponent(id), { method: "DELETE" });
    if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);
    if (String(editandoId) === String(id)) { sairDoModoEdicao(); form.reset(); limparErros(); }
    await carregarOfertas();
    mostrarMensagem("Oferta excluída.", "sucesso");
  } catch (erro) {
    console.error(erro);
    mostrarMensagem(MSG_API, "falha");
  }
}

// ---------- Eventos ----------
document.addEventListener("DOMContentLoaded", function () {     // 1) carga da página (onload)
  carregarOfertas();
  campos.medicamento.focus();
});
form.addEventListener("submit", enviarOferta);                  // 2) envio do formulário (onsubmit)
elCorpo.addEventListener("click", function (e) {                // 3) cliques em Editar / Excluir (onclick, delegação)
  const btn = e.target.closest("button[data-acao]");
  if (!btn) return;
  if (btn.dataset.acao === "editar") entrarNoModoEdicao(btn.dataset.id);
  else excluirOferta(btn.dataset.id);
});
document.querySelectorAll("th[data-ordem]").forEach(function (th) {
  th.addEventListener("click", function () {                    // 4) clique no cabeçalho: ordena a tabela
    ordemAtual = th.dataset.ordem;
    renderizarTabela();
  });
});
Object.keys(campos).forEach(function (nome) {
  campos[nome].addEventListener("blur", function () { validarCampo(nome); });    // 5) saída do campo (onblur)
  campos[nome].addEventListener("input", function () {                           // 6) digitação (oninput)
    if (campos[nome].classList.contains("invalido")) validarCampo(nome);
  });
});
