// Tela: Início (apresentação de informações vindas do JSON Server)
// Coleções usadas: hospital, estoque, excedentes e notificacoes
let estoque = [];
let excedentes = [];
let notificacoes = [];

const INTERVALO_ATUALIZACAO = 30000; // 30 segundos

// EVENTO 1: onload - carrega os dados da API e liga o atualizador automático
window.addEventListener("load", async () => {
  await carregarTudo();
  // EVENTO 2: timer - atualiza os dados sozinho, sem recarregar a página
  setInterval(carregarTudo, INTERVALO_ATUALIZACAO);
});

// READ: busca tudo de uma vez e redesenha a tela
async function carregarTudo() {
  try {
    const [hospital, est, exc, notif] = await Promise.all([
      api("/hospital"),
      api("/estoque"),
      api("/excedentes"),
      api("/notificacoes"),
    ]);
    estoque = est;
    excedentes = exc;
    notificacoes = notif;
    desenharHospital(hospital);
    desenharEstoqueBaixo();
    desenharExcedentes();
    desenharNotificacoes();
    const agora = new Date().toLocaleTimeString("pt-BR");
    document.getElementById("ultima-atualizacao").textContent = "Atualizado às " + agora;
  } catch (erro) {
    console.error(erro);
    document.getElementById("ultima-atualizacao").textContent = "Sem conexão com a API";
    mostrarAviso("Não foi possível carregar os dados. O JSON Server está rodando?");
  }
}

// ---------- Meu hospital ----------
function desenharHospital(hospital) {
  const abaixo = estoque.filter((m) => m.quantidade <= m.estoqueMinimo).length;
  document.getElementById("nome-hospital").textContent = hospital.nome;
  document.getElementById("resumo-hospital").textContent =
    estoque.length + " medicamentos no estoque · " + abaixo + " abaixo do mínimo";
}

// ---------- Estoque baixo / faltantes ----------
function desenharEstoqueBaixo() {
  const baixos = estoque
    .filter((m) => m.quantidade <= m.estoqueMinimo)
    .sort((a, b) => a.quantidade - b.quantidade);
  const caixa = document.getElementById("lista-estoque-baixo");
  if (baixos.length === 0) {
    caixa.innerHTML = '<p class="vazio">Nenhum medicamento abaixo do estoque mínimo.</p>';
    return;
  }
  caixa.innerHTML = baixos
    .map((m) => {
      const situacao = m.quantidade === 0
        ? "Fora de estoque"
        : m.quantidade + " " + m.unidade + " no estoque · mínimo " + m.estoqueMinimo;
      const percentual = Math.min(100, Math.round((m.quantidade / m.estoqueMinimo) * 100));
      return `<div class="item">
        <div class="nome">${escapar(m.medicamento)}
          <small>${escapar(situacao)}</small>
          <div class="barra" title="${percentual}% do estoque mínimo"><span style="width:${percentual}%"></span></div>
        </div>
        <a class="btn pequeno" href="#" data-grupo>Buscar</a>
      </div>`;
    })
    .join("");
}

// ---------- Excedentes da rede ----------
// Quantos meses faltam para o vencimento (formato "AAAA-MM")
function mesesParaVencer(vencimento) {
  const [ano, mes] = vencimento.split("-").map(Number);
  const hoje = new Date();
  return (ano - hoje.getFullYear()) * 12 + (mes - (hoje.getMonth() + 1));
}

function descreverVencimento(meses) {
  if (meses < 0) return { texto: "vencido", classe: "alta" };
  if (meses === 0) return { texto: "vence este mês", classe: "alta" };
  if (meses === 1) return { texto: "vence em 1 mês", classe: "alta" };
  return { texto: "vence em " + meses + " meses", classe: meses <= 3 ? "media" : "baixa" };
}

// Link que leva para a tela Nova solicitação já com o medicamento escolhido
function linkSolicitar(e) {
  const p = new URLSearchParams({ medicamento: e.medicamento, hospital: e.hospital, unidade: e.unidade });
  return "solicitacao.html?" + p.toString();
}

function desenharExcedentes() {
  const termo = document.getElementById("busca-excedente").value.trim().toLowerCase();
  const ordem = document.getElementById("ordem-excedente").value;

  const lista = excedentes
    .filter((e) => (e.medicamento + " " + e.hospital).toLowerCase().includes(termo))
    .sort((a, b) => {
      if (ordem === "quantidade") return b.quantidade - a.quantidade;
      if (ordem === "nome") return a.medicamento.localeCompare(b.medicamento, "pt-BR");
      return a.vencimento.localeCompare(b.vencimento);
    });

  const caixa = document.getElementById("lista-excedentes");
  if (lista.length === 0) {
    caixa.innerHTML = '<p class="vazio">Nenhum excedente encontrado.</p>';
    return;
  }
  caixa.innerHTML = lista
    .map((e) => {
      const v = descreverVencimento(mesesParaVencer(e.vencimento));
      return `<div class="item">
        <div class="nome">${escapar(e.medicamento)}
          <small>${escapar(e.hospital)} · vencimento ${formatarVencimento(e.vencimento)} · ${e.quantidade} ${escapar(e.unidade)}</small>
          <span class="tag ${v.classe}">${v.texto}</span>
        </div>
        <a class="btn pequeno" href="${linkSolicitar(e)}">Solicitar</a>
      </div>`;
    })
    .join("");
}

// EVENTO 3: oninput - pesquisa enquanto digita
document.getElementById("busca-excedente").addEventListener("input", desenharExcedentes);

// EVENTO 4: onchange - muda a ordenação da lista
document.getElementById("ordem-excedente").addEventListener("change", desenharExcedentes);

// ---------- Notificações ----------
function desenharNotificacoes() {
  const novas = notificacoes.filter((n) => !n.lida);
  const texto = document.getElementById("texto-notificacoes");
  const botao = document.getElementById("btn-ver-notificacoes");
  if (novas.length === 0) {
    texto.textContent = "Nenhuma notificação nova";
    botao.disabled = true;
  } else {
    texto.textContent = "Mudança de status em " + novas.length + (novas.length === 1 ? " pedido" : " pedidos");
    botao.disabled = false;
  }
  document.getElementById("lista-notificacoes").innerHTML = novas
    .map((n) => {
      const classe = n.status === "Aceito" ? "aceito" : n.status === "Recusado" ? "recusado" : "analise";
      return `<li><span>${escapar(n.medicamento)}<small>${escapar(n.hospital)}</small></span>
        <span class="selo ${classe}">${escapar(n.status)}</span></li>`;
    })
    .join("");
}

// EVENTO 5: onclick - mostra/esconde o detalhe das notificações
document.getElementById("btn-ver-notificacoes").addEventListener("click", () => {
  const lista = document.getElementById("lista-notificacoes");
  lista.hidden = !lista.hidden;
  document.getElementById("btn-ver-notificacoes").textContent = lista.hidden ? "Ver" : "Ocultar";
});

// EVENTO 6: onclick - atualização manual
document.getElementById("btn-atualizar").addEventListener("click", async () => {
  await carregarTudo();
  mostrarAviso("Dados atualizados.");
});

// Links de menu que pertencem a outros integrantes do grupo
ligarMenusDoGrupo();
