// Tela: Meu hospital (lista o estoque e permite alterar a quantidade - PATCH em /estoque)
let estoque = [];
let editandoId = null; // id do medicamento que está com a quantidade em edição

// EVENTO 1: onload - carrega o hospital e o estoque (READ)
window.addEventListener("load", carregar);

async function carregar() {
  try {
    const [hospital, lista] = await Promise.all([api("/hospital"), api("/estoque?_sort=medicamento&_order=asc")]);
    estoque = lista;
    document.getElementById("nome-hospital").textContent = hospital.nome.replace("Hosp. ", "");
    desenhar();
  } catch (erro) {
    console.error(erro);
    document.getElementById("lista-estoque").innerHTML = '<p class="vazio">Não foi possível carregar o estoque.</p>';
    mostrarAviso("Não foi possível carregar o estoque. O JSON Server está rodando?");
  }
}

function abaixoDoMinimo(m) {
  return m.quantidade <= m.estoqueMinimo;
}

function desenhar() {
  const termo = document.getElementById("busca-estoque").value.trim().toLowerCase();
  const soBaixo = document.getElementById("so-baixo").checked;
  const lista = estoque.filter((m) => m.medicamento.toLowerCase().includes(termo) && (!soBaixo || abaixoDoMinimo(m)));

  const abaixo = estoque.filter(abaixoDoMinimo).length;
  document.getElementById("resumo-estoque").textContent =
    estoque.length + " medicamentos cadastrados · " + abaixo + " abaixo do mínimo";

  const caixa = document.getElementById("lista-estoque");
  if (lista.length === 0) {
    caixa.innerHTML = '<p class="vazio">Nenhum medicamento encontrado.</p>';
    return;
  }
  caixa.innerHTML = lista
    .map((m) => {
      const etiqueta = m.quantidade === 0
        ? '<span class="tag alta">Fora de estoque</span>'
        : abaixoDoMinimo(m) ? '<span class="tag media">Estoque baixo</span>' : "";
      const detalhe = m.quantidade + " " + escapar(m.unidade) + " · val. " + formatarVencimento(m.validade) +
        " · mín. " + m.estoqueMinimo + " " + escapar(m.unidade);
      const acao = editandoId === m.id
        ? `<form class="form-qtd" data-id="${m.id}" novalidate>
             <input type="number" min="0" id="nova-quantidade" value="${m.quantidade}" aria-label="Nova quantidade">
             <button type="submit" class="btn pequeno">Salvar</button>
             <button type="button" class="btn claro pequeno" data-acao="cancelar">Cancelar</button>
             <div class="erro" id="erro-quantidade"></div>
           </form>`
        : `<button type="button" class="btn" data-acao="alterar" data-id="${m.id}">Alterar quantidade</button>`;
      return `<div class="card item-estoque">
        <div class="nome">${escapar(m.medicamento)} ${etiqueta}<small>${detalhe}</small></div>
        ${acao}
      </div>`;
    })
    .join("");
  if (editandoId !== null) {
    const campo = document.getElementById("nova-quantidade");
    if (campo) campo.focus();
  }
}

// EVENTO 2: oninput - pesquisa enquanto digita
document.getElementById("busca-estoque").addEventListener("input", desenhar);

// EVENTO 3: onchange - filtro "só abaixo do mínimo"
document.getElementById("so-baixo").addEventListener("change", desenhar);

// EVENTO 4: onclick - Alterar quantidade / Cancelar
document.getElementById("lista-estoque").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-acao]");
  if (!btn) return;
  editandoId = btn.dataset.acao === "alterar" ? Number(btn.dataset.id) : null;
  desenhar();
});

// EVENTO 5: onsubmit - salva a nova quantidade (UPDATE)
document.getElementById("lista-estoque").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = Number(e.target.dataset.id);
  const texto = document.getElementById("nova-quantidade").value.trim();
  const quantidade = Number(texto);
  if (texto === "" || !Number.isInteger(quantidade) || quantidade < 0) {
    document.getElementById("erro-quantidade").textContent = "Informe um número inteiro maior ou igual a zero.";
    return;
  }
  try {
    await api("/estoque/" + id, { method: "PATCH", body: JSON.stringify({ quantidade }) });
    editandoId = null;
    await carregar();
    mostrarAviso("Quantidade atualizada!");
  } catch (erro) {
    mostrarAviso("Erro ao atualizar a quantidade.");
  }
});

// Links de menu que pertencem a outros integrantes do grupo
ligarMenusDoGrupo();
