window.onload = function() {

  console.log("JS carregado 🔥");

  const form = document.getElementById("form");
  const lista = document.getElementById("lista");

  // 🔹 Salvar no localStorage
  function salvarDados(dados) {
    localStorage.setItem("dados", JSON.stringify(dados));
  }

  // 🔹 Pegar dados
  function pegarDados() {
    return JSON.parse(localStorage.getItem("dados")) || [];
  }

  // 🔹 Mostrar dados na tela
  function mostrarDados() {
    const dados = pegarDados();

    lista.innerHTML = "";

    dados.forEach((item, index) => {
      const li = document.createElement("li");

      li.textContent = item.nome + " - " + item.email + " ";

      // 🔴 Botão excluir
      const botao = document.createElement("button");
      botao.textContent = "Excluir";
      botao.style.marginLeft = "10px";

      botao.onclick = function() {
        excluirDado(index);
      };

      li.appendChild(botao);
      lista.appendChild(li);
    });
  }

  // 🔹 Excluir dado
  function excluirDado(index) {
    let dados = pegarDados();

    dados.splice(index, 1);

    salvarDados(dados);
    mostrarDados();

    console.log("Item removido!");
  }

  // 🔹 Evento do formulário
  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();

    let dados = pegarDados();

    // 🔍 Verifica email duplicado
    const emailExiste = dados.some(item => item.email === email);

    if (emailExiste) {
      alert("❌ Este email já foi cadastrado!");
      return;
    }

    const novoUsuario = {
      nome: nome,
      email: email
    };

    dados.push(novoUsuario);

    salvarDados(dados);
    mostrarDados();

    console.log("Salvou:", dados);

    form.reset();
  });

  // 🔹 Carrega ao abrir
  mostrarDados();
};