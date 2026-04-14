window.onload = function() {
  const formCadastro = document.getElementById("formCadastro");
  const formLogin = document.getElementById("formLogin");
  const boasVindas = document.getElementById("boasVindas");
  const formDinamico = document.getElementById("formDinamico");

  function criarId() {
    return "form_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function pegarUsuarios() {
    return JSON.parse(localStorage.getItem("usuarios")) || [];
  }

  function salvarUsuarios(usuarios) {
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
  }

  function pegarUsuarioLogado() {
    return JSON.parse(localStorage.getItem("usuarioLogado"));
  }

  function exigirUsuarioLogado() {
    const usuario = pegarUsuarioLogado();

    if (!usuario) {
      window.location.href = "index.html";
      return null;
    }

    return usuario;
  }

  function pegarFormularios() {
    const formularios = JSON.parse(localStorage.getItem("formularios")) || [];
    let alterou = false;

    formularios.forEach(formulario => {
      if (!formulario.id) {
        formulario.id = criarId();
        alterou = true;
      }
    });

    if (alterou) {
      salvarFormularios(formularios);
    }

    return formularios;
  }

  function salvarFormularios(formularios) {
    localStorage.setItem("formularios", JSON.stringify(formularios));
  }

  function pegarRespostas() {
    return JSON.parse(localStorage.getItem("respostas")) || [];
  }

  function salvarRespostas(respostas) {
    localStorage.setItem("respostas", JSON.stringify(respostas));
  }

  function buscarUltimaRespostaDoFormulario(formularioId, email) {
    const respostas = pegarRespostas().filter(resposta => {
      return resposta.formularioId === formularioId && resposta.email === email;
    });

    return respostas[respostas.length - 1] || null;
  }

  if (formCadastro) {
    formCadastro.addEventListener("submit", function(e) {
      e.preventDefault();

      const nome = document.getElementById("nomeCadastro").value.trim();
      const email = document.getElementById("emailCadastro").value.trim().toLowerCase();
      const usuarios = pegarUsuarios();

      if (usuarios.some(u => u.email === email)) {
        alert("Email já cadastrado!");
        return;
      }

      usuarios.push({ nome, email });
      salvarUsuarios(usuarios);

      alert("Cadastro realizado!");
      formCadastro.reset();
    });
  }

  if (formLogin) {
    formLogin.addEventListener("submit", function(e) {
      e.preventDefault();

      const nome = document.getElementById("nomeLogin").value.trim();
      const email = document.getElementById("emailLogin").value.trim().toLowerCase();
      const usuarios = pegarUsuarios();
      const usuario = usuarios.find(u => u.email === email && u.nome === nome);

      if (!usuario) {
        alert("Usuário não encontrado!");
        return;
      }

      localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
      window.location.href = "home.html";
    });
  }

  window.logout = function() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "index.html";
  };

  window.voltar = function() {
    window.location.href = "home.html";
  };

  if (boasVindas) {
    const usuario = exigirUsuarioLogado();

    if (!usuario) {
      return;
    }

    boasVindas.textContent = "Olá, " + usuario.nome;

    window.salvarFormulario = function() {
      const nome = document.getElementById("nomeFormulario").value.trim();

      if (!nome) {
        alert("Digite um título para o formulário.");
        return;
      }

      const formularios = pegarFormularios();

      formularios.push({
        id: criarId(),
        nome: nome,
        tipo: "texto",
        email: usuario.email,
        criadoEm: new Date().toLocaleString("pt-BR")
      });

      salvarFormularios(formularios);
      document.getElementById("nomeFormulario").value = "";
      mostrarFormularios();

      alert("Formulário salvo!");
    };

    function excluirFormulario(formularioId) {
      const confirmar = window.confirm("Deseja excluir este formulário?");

      if (!confirmar) {
        return;
      }

      const formularios = pegarFormularios().filter(formulario => {
        return !(formulario.id === formularioId && formulario.email === usuario.email);
      });

      const respostas = pegarRespostas().filter(resposta => {
        return !(resposta.formularioId === formularioId && resposta.email === usuario.email);
      });

      salvarFormularios(formularios);
      salvarRespostas(respostas);

      if (localStorage.getItem("formSelecionado") === formularioId) {
        localStorage.removeItem("formSelecionado");
      }

      mostrarFormularios();
      alert("Formulário excluído com sucesso.");
    }

    function mostrarFormularios() {
      const lista = document.getElementById("listaFormularios");
      const formularios = pegarFormularios().filter(f => f.email === usuario.email);

      lista.innerHTML = "";

      if (formularios.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Nenhum formulário criado ainda.";
        lista.appendChild(li);
        return;
      }

      formularios.forEach(formulario => {
        const li = document.createElement("li");
        const texto = document.createElement("span");
        const acoes = document.createElement("div");
        const botaoAbrir = document.createElement("button");
        const botaoExcluir = document.createElement("button");

        texto.textContent = formulario.nome;
        acoes.className = "acoes-formulario";

        botaoAbrir.textContent = "Abrir";
        botaoAbrir.className = "botao-abrir";
        botaoAbrir.onclick = function() {
          localStorage.setItem("formSelecionado", formulario.id);
          window.location.href = "formulario.html";
        };

        botaoExcluir.textContent = "Excluir";
        botaoExcluir.className = "botao-excluir";
        botaoExcluir.onclick = function() {
          excluirFormulario(formulario.id);
        };

        acoes.appendChild(botaoAbrir);
        acoes.appendChild(botaoExcluir);
        li.appendChild(texto);
        li.appendChild(acoes);
        lista.appendChild(li);
      });
    }

    mostrarFormularios();
  }

  if (formDinamico) {
    const usuario = exigirUsuarioLogado();
    const statusSalvamento = document.getElementById("statusSalvamento");

    if (!usuario) {
      return;
    }

    const formularios = pegarFormularios().filter(f => f.email === usuario.email);
    const formularioIdSelecionado = localStorage.getItem("formSelecionado");
    const formulario = formularios.find(f => f.id === formularioIdSelecionado);

    if (!formulario) {
      alert("Formulário não encontrado.");
      window.location.href = "home.html";
      return;
    }

    document.getElementById("tituloFormulario").textContent = formulario.nome;

    const campoTexto = document.createElement("textarea");
    campoTexto.id = "conteudoFormulario";
    campoTexto.placeholder = "Digite o conteúdo do formulário aqui...";
    campoTexto.required = true;

    formDinamico.appendChild(campoTexto);

    const ultimaResposta = buscarUltimaRespostaDoFormulario(formulario.id, usuario.email);

    if (ultimaResposta) {
      campoTexto.value = ultimaResposta.conteudo || "";

      if (statusSalvamento) {
        statusSalvamento.textContent = "Último conteúdo salvo em " + ultimaResposta.data + ".";
      }
    }

    window.enviarFormulario = function() {
      const conteudo = campoTexto.value.trim();

      if (!conteudo) {
        alert("Preencha o conteúdo antes de enviar.");
        return;
      }

      const respostas = pegarRespostas();
      const dataAtual = new Date().toLocaleString("pt-BR");

      respostas.push({
        formularioId: formulario.id,
        formulario: formulario.nome,
        conteudo: conteudo,
        autor: usuario.nome,
        email: usuario.email,
        data: dataAtual
      });

      salvarRespostas(respostas);

      if (statusSalvamento) {
        statusSalvamento.textContent = "Conteúdo salvo com sucesso em " + dataAtual + ".";
      }

      alert("Conteúdo salvo com sucesso.");
    };
  }
};
