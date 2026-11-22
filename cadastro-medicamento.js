// Tela: Cadastro de medicamento (CREATE - POST em /estoque)
// Usa as funções do common.js: api, mostrarAviso, escapar, formatarVencimento e ligarMenusDoGrupo
const campos = ["medicamento", "validade", "quantidade", "unidade", "estoqueMinimo"];

function limparErros() {
  campos.forEach((c) => (document.getElementById("erro-" + c).textContent = ""));
}

function erroNoCampo(campo, texto) {
  document.getElementById("erro-" + campo).textContent = texto;
}

// READ: mostra os medicamentos que já estão no estoque (mais novos primeiro)
async function carregarLista() {
  const caixa = document.getElementById("lista-cadastrados");
  try {
    const lista = await api("/estoque?_sort=id&_order=desc");
    if (lista.length === 0) {
      caixa.innerHTML = '<p class="vazio">Nenhum medicamento cadastrado ainda.</p>';
      return;
    }
    caixa.innerHTML = `<table>
      <thead><tr><th>Medicamento</th><th>Quantidade</th><th>Validade</th><th>Estoque mínimo</th></tr></thead>
      <tbody>${lista
        .map(
          (m) => `<tr>
            <td>${escapar(m.medicamento)}</td>
            <td>${m.quantidade} ${escapar(m.unidade)}</td>
            <td>${formatarVencimento(m.validade)}</td>
            <td>${m.estoqueMinimo} ${escapar(m.unidade)}</td>
          </tr>`
        )
        .join("")}</tbody></table>`;
  } catch (erro) {
    console.error(erro);
    caixa.innerHTML = '<p class="vazio">Não foi possível carregar o estoque.</p>';
    mostrarAviso("Não foi possível carregar o estoque. O JSON Server está rodando?");
  }
}

// EVENTO 1: onload - carrega a lista ao abrir a tela
window.addEventListener("load", carregarLista);

// Valida os campos e devolve o objeto pronto para salvar (ou null se tiver erro)
function lerFormulario() {
  limparErros();
  let ok = true;

  const medicamento = document.getElementById("medicamento").value.trim();
  const validade = document.getElementById("validade").value; // "AAAA-MM"
  const textoQtd = document.getElementById("quantidade").value.trim();
  const unidade = document.getElementById("unidade").value;
  const textoMin = document.getElementById("estoqueMinimo").value.trim();
  const quantidade = Number(textoQtd);
  const estoqueMinimo = Number(textoMin);

  if (medicamento.length < 3) { erroNoCampo("medicamento", "Informe o nome do medicamento (mínimo 3 letras)."); ok = false; }

  if (!validade) {
    erroNoCampo("validade", "Informe a data de validade."); ok = false;
  } else {
    const hoje = new Date();
    const mesAtual = hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0");
    if (validade < mesAtual) { erroNoCampo("validade", "A validade não pode estar no passado."); ok = false; }
  }

  if (textoQtd === "" || !Number.isInteger(quantidade) || quantidade < 0) {
    erroNoCampo("quantidade", "Informe um número inteiro maior ou igual a zero."); ok = false;
  }
  if (!unidade) { erroNoCampo("unidade", "Escolha a unidade."); ok = false; }
  if (textoMin === "" || !Number.isInteger(estoqueMinimo) || estoqueMinimo < 0) {
    erroNoCampo("estoqueMinimo", "Informe um número inteiro maior ou igual a zero."); ok = false;
  }

  return ok ? { medicamento, validade, quantidade, unidade, estoqueMinimo } : null;
}

// EVENTO 2: onsubmit - valida e cadastra o medicamento (CREATE)
document.getElementById("form-cadastro").addEventListener("submit", async (e) => {
  e.preventDefault();
  const novo = lerFormulario();
  if (!novo) return;

  const botao = document.getElementById("btn-salvar");
  botao.disabled = true;
  try {
    // não deixa cadastrar duas vezes o mesmo medicamento com a mesma validade
    const existentes = await api("/estoque");
    const repetido = existentes.some(
      (m) => m.medicamento.toLowerCase() === novo.medicamento.toLowerCase() && m.validade === novo.validade
    );
    if (repetido) {
      erroNoCampo("medicamento", "Este medicamento já está cadastrado com essa validade.");
      return;
    }
    await api("/estoque", { method: "POST", body: JSON.stringify(novo) });
    mostrarAviso("Medicamento cadastrado!");
    document.getElementById("form-cadastro").reset();
    await carregarLista();
  } catch (erro) {
    console.error(erro);
    mostrarAviso("Não foi possível cadastrar. O JSON Server está rodando?");
  } finally {
    botao.disabled = false;
  }
});

// EVENTO 3: onclick - Cancelar limpa o formulário
document.getElementById("btn-cancelar").addEventListener("click", () => {
  document.getElementById("form-cadastro").reset();
  limparErros();
  mostrarAviso("Preenchimento cancelado.");
});

// EVENTO 4: oninput/onchange - tira a mensagem de erro quando a pessoa volta a digitar
campos.forEach((c) => {
  const el = document.getElementById(c);
  el.addEventListener("input", () => erroNoCampo(c, ""));
  el.addEventListener("change", () => erroNoCampo(c, ""));
});

// Links de telas que pertencem a outros integrantes do grupo
ligarMenusDoGrupo();
