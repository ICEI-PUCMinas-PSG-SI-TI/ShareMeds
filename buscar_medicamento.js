const medicamentos = [
    {
        nome: "Dipirona injetável",
        dosagem: "1 g",
        hospital: "Hospital Terraço",
        validade: "04/2027"
    },
    {
        nome: "Dipirona Monoidratada Solução oral",
        dosagem: "500mg",
        hospital: "Hospital Seguro",
        validade: "11/2027"
    }
];

const formulario = document.getElementById("formBusca");
const campoNome = document.getElementById("nombre");
const campoValidade = document.getElementById("validade");
const resultado = document.getElementById("resultado");

function renderizarMedicamentos() {
    const nomeBusca = campoNome.value.trim().toLowerCase();
    const validadeBusca = campoValidade.value.trim().toLowerCase();

    const encontrados = medicamentos.filter((medicamento) => {
        const nomeConfere = medicamento.nome.toLowerCase().includes(nomeBusca);
        const validadeConfere =
            !validadeBusca ||
            medicamento.validade.toLowerCase().includes(validadeBusca) ||
            medicamento.dosagem.toLowerCase().includes(validadeBusca);

        return nomeConfere && validadeConfere;
    });

    resultado.replaceChildren();

    if (encontrados.length === 0) {
        const mensagem = document.createElement("p");
        mensagem.className = "sem-resultados";
        mensagem.textContent = "Nenhum medicamento encontrado.";
        resultado.appendChild(mensagem);
        return;
    }

    encontrados.forEach((medicamento) => {
        const item = document.createElement("article");
        item.className = "resultado-item";

        const informacoes = document.createElement("div");

        const titulo = document.createElement("h2");
        titulo.textContent =
            `${medicamento.nome} (${medicamento.dosagem})`;

        const detalhes = document.createElement("p");
        detalhes.textContent =
            `${medicamento.hospital}  -  val. ${medicamento.validade}`;

        informacoes.append(titulo, detalhes);

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "btn-solicitar";
        botao.textContent = "Solicitar";
        botao.addEventListener("click", () => {
            alert(`Solicitação do medicamento: ${medicamento.nome}`);
        });

        item.append(informacoes, botao);
        resultado.appendChild(item);
    });
}

formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    renderizarMedicamentos();
});

campoNome.addEventListener("input", renderizarMedicamentos);
campoValidade.addEventListener("input", renderizarMedicamentos);

renderizarMedicamentos();
