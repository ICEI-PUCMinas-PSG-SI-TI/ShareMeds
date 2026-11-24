
// SHAREMEDS - SISTEMA DE CADASTRO E SENHAS

const CHAVE_USUARIOS = "sharemeds_usuarios";

// Busca os usuários salvos no navegador
function buscarUsuarios() {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIOS)) || [];
}

// Salva os usuários no navegador
function salvarUsuarios(usuarios) {
    localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios));
}

// CADASTRO DE MÉDICOS
const formularioCadastro = document.getElementById("cadastroForm");

if (formularioCadastro) {
    formularioCadastro.addEventListener("submit", function(event) {
        event.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const crm = document.getElementById("crm").value.trim();
        const hospital = document.getElementById("hospital").value;
        const email = document.getElementById("email").value.trim().toLowerCase();
        const senha = document.getElementById("senha").value;

        let usuarios = buscarUsuarios();

        // Verifica se o e-mail já está cadastrado
        const usuarioExistente = usuarios.find(
            usuario => usuario.email === email
        );

        if (usuarioExistente) {
            alert("Este e-mail já está cadastrado!");
            return;
        }

        if (senha.length < 6) {
            alert("A senha precisa ter pelo menos 6 caracteres.");
            return;
        }

        // Cria o novo usuário
        const novoUsuario = {
            nome: nome,
            crm: crm,
            hospital: hospital,
            email: email,
            senha: senha
        };

        usuarios.push(novoUsuario);

        salvarUsuarios(usuarios);

        alert("Cadastro realizado com sucesso!");

        window.location.href = "loguin.html";
    });
}


// LOGIN DE MÉDICOS
const formularioLogin = document.getElementById("loginForm");

if (formularioLogin) {
    formularioLogin.addEventListener("submit", function(event) {
        event.preventDefault();

        const email = document.getElementById("email")
            .value.trim().toLowerCase();

        const senha = document.getElementById("senha").value;

        const usuarios = buscarUsuarios();

        const usuario = usuarios.find(
            pessoa => pessoa.email === email && pessoa.senha === senha
        );

        if (usuario) {
            alert("Login realizado com sucesso! Bem-vindo(a), " + usuario.nome + ".");
        } else {
            alert("E-mail ou senha incorretos!");
        }
    });
}


// RECUPERAÇÃO / TROCA DE SENHA
const formularioRecuperacao = document.getElementById("recuperacaoForm");

if (formularioRecuperacao) {
    formularioRecuperacao.addEventListener("submit", function(event) {
        event.preventDefault();

        const email = document.getElementById("email")
            .value.trim().toLowerCase();

        const novaSenha = document.getElementById("novaSenha").value;

        const confirmarSenha = document.getElementById("confirmarSenha").value;

        let usuarios = buscarUsuarios();

        // Procura o usuário pelo e-mail
        const indiceUsuario = usuarios.findIndex(
            pessoa => pessoa.email === email
        );

        if (indiceUsuario === -1) {
            alert("E-mail não encontrado. Verifique se você já possui cadastro.");
            return;
        }

        if (novaSenha.length < 6) {
            alert("A nova senha precisa ter pelo menos 6 caracteres.");
            return;
        }

        if (novaSenha !== confirmarSenha) {
            alert("As senhas não são iguais!");
            return;
        }

        // Atualiza a senha do usuário
        usuarios[indiceUsuario].senha = novaSenha;

        salvarUsuarios(usuarios);

        alert("Senha atualizada com sucesso!");

        window.location.href = "loguin.html";
    });
}
// Pedidos Recebidos 

function responderPedido(botao, resposta) {

    const pedido = botao.closest(".pedido");

    const informacoes = pedido.querySelector(".informacoes");

    const acoes = pedido.querySelector(".acoes");

    const mensagem = document.createElement("p");

    mensagem.className = "mensagem";

    if (resposta === "aceito") {

        mensagem.textContent = "Pedido aceito com sucesso!";

        mensagem.classList.add("sucesso");

    } else {

        mensagem.textContent = "Pedido recusado.";

        mensagem.classList.add("erro");

    }

    informacoes.appendChild(mensagem);

    acoes.remove();
}
