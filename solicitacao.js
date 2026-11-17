// Tela: Nova solicitação (CRUD completo sobre /solicitacoes)
const form = document.getElementById("form-solicitacao");
const campos = ["medicamento", "quantidade", "unidade", "modalidade", "urgencia", "justificativa"];
let editandoId = null;   // null = criando; número = editando
let solicitacoes = [];
const nomes = { emprestimo: "Empréstimo", doacao: "Doação", alta: "Alta", media: "Média", baixa: "Baixa" };

// O medicamento (e o hospital) são escolhidos na tela Buscar e chegam pela URL.
// Nesta tela o medicamento não pode ser trocado.
const parametros = new URLSearchParams(location.search);
const medicamentoDaUrl = parametros.get("medicamento");
const hospitalDaUrl = parametros.get("hospital");
const unidadeDaUrl = parametros.get("unidade");

// EVENTO 1: onload - mostra o medicamento escolhido e carrega a lista (READ)
window.addEventListener("load", async () => {
  mostrarMedicamentoDaUrl();
  ajustarFormulario();
  await carregarSolicitacoes();
});

function mostrarMedicamentoDaUrl() {
  if (medicamentoDaUrl) {
    document.getElementById("medicamento").value = medicamentoDaUrl;
    document.getElementById("nome-medicamento").textContent = medicamentoDaUrl;
    if (unidadeDaUrl) document.getElementById("unidade").value = unidadeDaUrl;
  } else {
    document.getElementById("nome-medicamento").textContent = "nenhum selecionado";
  }
}

// Sem medicamento escolhido (e sem estar editando), o formulário fica desativado
function ajustarFormulario() {
  const semMedicamento = editandoId === null && !medicamentoDaUrl;
  form.querySelectorAll("input, select, textarea, button[type=submit]").forEach((el) => {
    if (el.type !== "hidden") el.disabled = semMedicamento;
  });
  document.getElementById("aviso-medicamento").hidden = !semMedicamento;
}

// READ
async function carregarSolicitacoes() {
  try {
    solicitacoes = await api("/solicitacoes?_sort=id&_order=desc");
    desenharTabela();
  } catch (erro) {
    console.error(erro);
    mostrarAviso("Não foi possível carregar as solicitações. O JSON Server está rodando?");
  }
}

function desenharTabela() {
  const corpo = document.getElementById("corpo-solicitacoes");
  if (solicitacoes.length === 0) {
    corpo.innerHTML = '<tr><td colspan="7" class="vazio">Nenhuma solicitação cadastrada.</td></tr>';
    return;
  }
  corpo.innerHTML = solicitacoes
    .map(
      (s) => `<tr>
        <td>${formatarData(s.data)}</td>
        <td>${escapar(s.medicamento)}${s.hospital ? `<small class="hosp">${escapar(s.hospital)}</small>` : ""}</td>
        <td>${s.quantidade} ${escapar(s.unidade)}</td>
        <td>${nomes[s.modalidade] || s.modalidade}</td>
        <td><span class="tag ${s.urgencia}">${nomes[s.urgencia] || s.urgencia}</span></td>
        <td><span class="status">${escapar(s.status)}</span></td>
        <td>
          <button class="btn pequeno" data-acao="editar" data-id="${s.id}">Editar</button>
          <button class="btn pequeno perigo" data-acao="excluir" data-id="${s.id}">Excluir</button>
        </td>
      </tr>`
    )
    .join("");
}

// EVENTO 2: onclick - Editar / Excluir na tabela
document.getElementById("corpo-solicitacoes").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-acao]");
  if (!btn) return;
  const sol = solicitacoes.find((s) => String(s.id) === btn.dataset.id);
  if (btn.dataset.acao === "editar") iniciarEdicao(sol);
  if (btn.dataset.acao === "excluir") await excluir(sol);
});

function iniciarEdicao(s) {
  editandoId = s.id;
  campos.forEach((c) => (document.getElementById(c).value = s[c]));
  document.getElementById("nome-medicamento").textContent = s.medicamento;
  document.getElementById("titulo-pagina").textContent = "Editar solicitação";
  document.getElementById("btn-enviar").textContent = "Salvar alterações";
  ajustarFormulario();
  limparErros();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// DELETE
async function excluir(s) {
  if (!confirm('Excluir a solicitação de "' + s.medicamento + '"?')) return;
  try {
    await api("/solicitacoes/" + s.id, { method: "DELETE" });
    if (editandoId === s.id) reiniciarFormulario();
    await carregarSolicitacoes();
    mostrarAviso("Solicitação excluída.");
  } catch (erro) {
    mostrarAviso("Erro ao excluir a solicitação.");
  }
}

function limparErros() {
  campos.forEach((c) => (document.getElementById("erro-" + c).textContent = ""));
}

function validar() {
  limparErros();
  let ok = true;
  const v = (c) => document.getElementById(c).value.trim();
  const erro = (c, msg) => { document.getElementById("erro-" + c).textContent = msg; ok = false; };
  if (!v("medicamento")) { ok = false; mostrarAviso("Escolha o medicamento na tela Buscar."); }
  if (!v("quantidade") || Number(v("quantidade")) < 1) erro("quantidade", "Informe uma quantidade maior que zero.");
  if (!v("unidade")) erro("unidade", "Escolha a unidade.");
  if (!v("modalidade")) erro("modalidade", "Escolha a modalidade.");
  if (!v("urgencia")) erro("urgencia", "Escolha a urgência.");
  if (v("justificativa").length < 10) erro("justificativa", "Descreva a justificativa (mínimo 10 caracteres).");
  return ok;
}

// EVENTO 3: onsubmit - CREATE (POST) ou UPDATE (PUT)
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) return;
  const dados = {};
  campos.forEach((c) => (dados[c] = document.getElementById(c).value.trim()));
  dados.quantidade = Number(dados.quantidade);
  try {
    if (editandoId === null) {
      dados.status = "Em análise";
      dados.data = new Date().toISOString().slice(0, 10);
      if (hospitalDaUrl) dados.hospital = hospitalDaUrl;
      await api("/solicitacoes", { method: "POST", body: JSON.stringify(dados) });
      mostrarAviso("Solicitação enviada com sucesso!");
    } else {
      const original = solicitacoes.find((s) => s.id === editandoId);
      await api("/solicitacoes/" + editandoId, {
        method: "PUT",
        body: JSON.stringify({ ...original, ...dados }),
      });
      mostrarAviso("Solicitação atualizada!");
    }
    reiniciarFormulario();
    await carregarSolicitacoes();
  } catch (erro) {
    mostrarAviso("Erro ao salvar a solicitação.");
  }
});

function reiniciarFormulario() {
  editandoId = null;
  form.reset();
  limparErros();
  document.getElementById("titulo-pagina").textContent = "Nova solicitação";
  document.getElementById("btn-enviar").textContent = "Enviar";
  mostrarMedicamentoDaUrl();
  ajustarFormulario();
}

// Cancelar: limpa o formulário (e sai do modo de edição, se for o caso)
document.getElementById("btn-cancelar").addEventListener("click", () => {
  const estavaEditando = editandoId !== null;
  reiniciarFormulario();
  mostrarAviso(estavaEditando ? "Edição cancelada." : "Preenchimento cancelado.");
});

// Links de menu que pertencem a outros integrantes do grupo
ligarMenusDoGrupo();
