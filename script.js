window.onload = function() {
  const telaAuth = document.getElementById("telaAuth");
  const telaHome = document.getElementById("telaHome");
  const telaFormulario = document.getElementById("telaFormulario");
  const formCadastro = document.getElementById("formCadastro");
  const formLogin = document.getElementById("formLogin");
  const boasVindas = document.getElementById("boasVindas");
  const formDinamico = document.getElementById("formDinamico");
  const statusSync = document.getElementById("statusSync");
  const statusBadge = document.getElementById("statusBadge");
  const apiInfo = document.getElementById("apiInfo");
  const statusBadgeFormulario = document.getElementById("statusBadgeFormulario");
  const statusSalvamento = document.getElementById("statusSalvamento");
  const tituloFormulario = document.getElementById("tituloFormulario");
  const nomeFormularioInput = document.getElementById("nomeFormulario");
  const listaFormularios = document.getElementById("listaFormularios");
  const botaoSalvarFormulario = document.getElementById("botaoSalvarFormulario");
  const botaoSalvarConteudo = document.getElementById("botaoSalvarConteudo");
  const botaoVoltarHome = document.getElementById("botaoVoltarHome");
  const botaoSyncManual = document.getElementById("botaoSyncManual");
  const botaoSair = document.getElementById("botaoSair");
  const botoesInstalar = Array.from(document.querySelectorAll(".js-install-app"));

  let eventoInstalacao = null;
  let sincronizacaoEmAndamento = null;
  let formularioAbertoId = null;

  const STORAGE_KEYS = {
    usuarios: "usuarios",
    usuarioLogado: "usuarioLogado",
    formularios: "formularios",
    respostas: "respostas",
    operacoes: "operacoesPendentes",
    ultimaSincronizacao: "ultimaSincronizacao",
    deviceId: "deviceId",
    ultimaTela: "ultimaTela"
  };

  const rawApiBaseUrl = (window.MODELAGE_CONFIG && window.MODELAGE_CONFIG.apiBaseUrl) || "";
  const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

  function buildApiUrl(path) {
    const rota = path.startsWith("/") ? path : "/" + path;
    return API_BASE_URL ? API_BASE_URL + rota : rota;
  }

  function showTela(nome) {
    telaAuth.classList.add("oculto");
    telaHome.classList.add("oculto");
    telaFormulario.classList.add("oculto");

    if (nome === "home") {
      telaHome.classList.remove("oculto");
      localStorage.setItem(STORAGE_KEYS.ultimaTela, "home");
    } else if (nome === "formulario") {
      telaFormulario.classList.remove("oculto");
      localStorage.setItem(STORAGE_KEYS.ultimaTela, "formulario");
    } else {
      telaAuth.classList.remove("oculto");
      localStorage.setItem(STORAGE_KEYS.ultimaTela, "auth");
    }
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function() {
      navigator.serviceWorker.register("sw.js").catch(function(error) {
        console.error("Erro ao registrar o service worker:", error);
      });
    });
  }

  if (apiInfo) {
    apiInfo.textContent = API_BASE_URL
      ? "Servidor configurado para sincronização: " + API_BASE_URL
      : "Servidor configurado para sincronização no mesmo endereço deste app.";
  }

  window.addEventListener("beforeinstallprompt", function(event) {
    event.preventDefault();
    eventoInstalacao = event;
    botoesInstalar.forEach(function(botao) {
      botao.classList.remove("oculto");
    });
  });

  window.addEventListener("appinstalled", function() {
    eventoInstalacao = null;
    botoesInstalar.forEach(function(botao) {
      botao.classList.add("oculto");
    });
  });

  botoesInstalar.forEach(function(botao) {
    botao.addEventListener("click", async function() {
      if (!eventoInstalacao) {
        alert("Use a opção 'Adicionar à tela inicial' do navegador para instalar este app.");
        return;
      }

      eventoInstalacao.prompt();
      await eventoInstalacao.userChoice;
      eventoInstalacao = null;
      botoesInstalar.forEach(function(item) {
        item.classList.add("oculto");
      });
    });
  });

  function criarId(prefixo) {
    return prefixo + "_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function agoraIso() {
    return new Date().toISOString();
  }

  function formatarData(dataIso) {
    const data = new Date(dataIso);

    if (Number.isNaN(data.getTime())) {
      return "";
    }

    return data.toLocaleString("pt-BR");
  }

  function lerLista(chave) {
    return JSON.parse(localStorage.getItem(chave)) || [];
  }

  function salvarLista(chave, lista) {
    localStorage.setItem(chave, JSON.stringify(lista));
  }

  function atualizarBadge(elemento, texto, variante) {
    if (!elemento) {
      return;
    }

    elemento.textContent = texto;
    elemento.setAttribute("data-variant", variante || "neutral");
  }

  function pegarDeviceId() {
    let deviceId = localStorage.getItem(STORAGE_KEYS.deviceId);

    if (!deviceId) {
      deviceId = criarId("device");
      localStorage.setItem(STORAGE_KEYS.deviceId, deviceId);
    }

    return deviceId;
  }

  function normalizarUsuarios() {
    const usuarios = lerLista(STORAGE_KEYS.usuarios);
    let alterou = false;

    usuarios.forEach(function(usuario) {
      if (!usuario.id) {
        usuario.id = criarId("user");
        alterou = true;
      }

      if (!usuario.updatedAt) {
        usuario.updatedAt = agoraIso();
        alterou = true;
      }
    });

    if (alterou) {
      salvarLista(STORAGE_KEYS.usuarios, usuarios);
    }

    return usuarios;
  }

  function normalizarFormularios() {
    const formularios = lerLista(STORAGE_KEYS.formularios);
    let alterou = false;

    formularios.forEach(function(formulario) {
      if (!formulario.id) {
        formulario.id = criarId("form");
        alterou = true;
      }

      if (typeof formulario.deleted !== "boolean") {
        formulario.deleted = false;
        alterou = true;
      }

      if (!formulario.updatedAt) {
        formulario.updatedAt = agoraIso();
        alterou = true;
      }
    });

    if (alterou) {
      salvarLista(STORAGE_KEYS.formularios, formularios);
    }

    return formularios;
  }

  function normalizarRespostas() {
    const respostas = lerLista(STORAGE_KEYS.respostas);
    let alterou = false;

    respostas.forEach(function(resposta) {
      if (!resposta.id) {
        resposta.id = criarId("resp");
        alterou = true;
      }

      if (typeof resposta.deleted !== "boolean") {
        resposta.deleted = false;
        alterou = true;
      }

      if (!resposta.updatedAt) {
        resposta.updatedAt = agoraIso();
        alterou = true;
      }
    });

    if (alterou) {
      salvarLista(STORAGE_KEYS.respostas, respostas);
    }

    return respostas;
  }

  function pegarUsuarios() {
    return normalizarUsuarios();
  }

  function salvarUsuarios(usuarios) {
    salvarLista(STORAGE_KEYS.usuarios, usuarios);
  }

  function pegarFormularios() {
    return normalizarFormularios();
  }

  function salvarFormularios(formularios) {
    salvarLista(STORAGE_KEYS.formularios, formularios);
  }

  function pegarRespostas() {
    return normalizarRespostas();
  }

  function salvarRespostas(respostas) {
    salvarLista(STORAGE_KEYS.respostas, respostas);
  }

  function pegarOperacoesPendentes() {
    return lerLista(STORAGE_KEYS.operacoes);
  }

  function salvarOperacoesPendentes(operacoes) {
    salvarLista(STORAGE_KEYS.operacoes, operacoes);
  }

  function registrarOperacao(tipo, acao, registro) {
    const operacoes = pegarOperacoesPendentes();

    operacoes.push({
      id: criarId("op"),
      tipo: tipo,
      acao: acao,
      registro: registro,
      createdAt: agoraIso(),
      deviceId: pegarDeviceId()
    });

    salvarOperacoesPendentes(operacoes);
    atualizarStatusSync();
  }

  function pegarUsuarioLogado() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.usuarioLogado));
  }

  function salvarUsuarioLogado(usuario) {
    localStorage.setItem(STORAGE_KEYS.usuarioLogado, JSON.stringify(usuario));
  }

  function limparSessao() {
    localStorage.removeItem(STORAGE_KEYS.usuarioLogado);
    localStorage.removeItem(STORAGE_KEYS.ultimaTela);
    localStorage.removeItem("formSelecionado");
    formularioAbertoId = null;
  }

  function buscarRespostaDoFormulario(formularioId, email) {
    const respostas = pegarRespostas().filter(function(resposta) {
      return resposta.formularioId === formularioId && resposta.email === email && !resposta.deleted;
    });

    return respostas[respostas.length - 1] || null;
  }

  function compararData(itemA, itemB) {
    const dataA = new Date(itemA.updatedAt || 0).getTime();
    const dataB = new Date(itemB.updatedAt || 0).getTime();

    return dataA - dataB;
  }

  function aplicarListaMesclada(chave, itensServidor) {
    const locais = lerLista(chave);
    const mapa = {};

    locais.forEach(function(item) {
      mapa[item.id] = item;
    });

    itensServidor.forEach(function(itemServidor) {
      const itemLocal = mapa[itemServidor.id];

      if (!itemLocal || compararData(itemLocal, itemServidor) <= 0) {
        mapa[itemServidor.id] = itemServidor;
      }
    });

    const itensMesclados = Object.values(mapa).sort(function(a, b) {
      return compararData(a, b);
    });

    salvarLista(chave, itensMesclados);
  }

  function atualizarStatusSync(mensagemExtra, variante) {
    if (!statusSync) {
      return;
    }

    const pendencias = pegarOperacoesPendentes().length;
    const ultimaSincronizacao = localStorage.getItem(STORAGE_KEYS.ultimaSincronizacao);

    let mensagem = pendencias > 0
      ? "Há " + pendencias + " alteração(ões) pendente(s) para sincronizar."
      : "Nenhuma pendência local no momento.";

    if (ultimaSincronizacao) {
      mensagem += " Última sincronização: " + formatarData(ultimaSincronizacao) + ".";
    }

    if (mensagemExtra) {
      mensagem += " " + mensagemExtra;
    }

    statusSync.textContent = mensagem;

    if (pendencias > 0) {
      atualizarBadge(statusBadge, "Pendências", variante || "warning");
    } else {
      atualizarBadge(statusBadge, "Em dia", variante || "success");
    }
  }

  async function sincronizarComServidor() {
    if (sincronizacaoEmAndamento) {
      return sincronizacaoEmAndamento;
    }

    sincronizacaoEmAndamento = (async function() {
      if (!navigator.onLine) {
        atualizarStatusSync("Sem conexão com a internet ou rede local.", "warning");
        return false;
      }

      const operacoes = pegarOperacoesPendentes();

      if (operacoes.length === 0) {
        atualizarStatusSync("Sem novas alterações para enviar.", "success");
      } else {
        atualizarStatusSync("Enviando alterações para o servidor...", "warning");
      }

      try {
        const resposta = await fetch(buildApiUrl("/api/sync"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            deviceId: pegarDeviceId(),
            operations: operacoes
          })
        });

        if (!resposta.ok) {
          throw new Error("Falha na sincronização com o servidor.");
        }

        const dados = await resposta.json();

        aplicarListaMesclada(STORAGE_KEYS.usuarios, dados.usuarios || []);
        aplicarListaMesclada(STORAGE_KEYS.formularios, dados.formularios || []);
        aplicarListaMesclada(STORAGE_KEYS.respostas, dados.respostas || []);

        salvarOperacoesPendentes([]);
        localStorage.setItem(STORAGE_KEYS.ultimaSincronizacao, dados.serverTime || agoraIso());

        const usuarioLogado = pegarUsuarioLogado();

        if (usuarioLogado) {
          const usuarioAtualizado = pegarUsuarios().find(function(usuario) {
            return usuario.id === usuarioLogado.id || usuario.email === usuarioLogado.email;
          });

          if (usuarioAtualizado) {
            salvarUsuarioLogado(usuarioAtualizado);
          }
        }

        atualizarStatusSync("Sincronização concluída com sucesso.", "success");
        atualizarTelaAtual();
        return true;
      } catch (error) {
        atualizarStatusSync("Servidor indisponível no momento.", "danger");
        console.error(error);
        return false;
      }
    })();

    try {
      return await sincronizacaoEmAndamento;
    } finally {
      sincronizacaoEmAndamento = null;
    }
  }

  async function sincronizarSePossivel() {
    if (!navigator.onLine) {
      return false;
    }

    return sincronizarComServidor();
  }

  function renderFormularioAtual() {
    const usuario = pegarUsuarioLogado();
    const formularios = pegarFormularios().filter(function(formulario) {
      return usuario && formulario.email === usuario.email && !formulario.deleted;
    });
    const formulario = formularios.find(function(item) {
      return item.id === formularioAbertoId;
    });

    if (!usuario || !formulario) {
      formularioAbertoId = null;
      showTela("home");
      return;
    }

    tituloFormulario.textContent = formulario.nome;
    formDinamico.innerHTML = "";

    const campoTexto = document.createElement("textarea");
    campoTexto.id = "conteudoFormulario";
    campoTexto.placeholder = "Digite o conteúdo do formulário aqui...";
    campoTexto.required = true;

    const respostaExistente = buscarRespostaDoFormulario(formulario.id, usuario.email);

    if (respostaExistente) {
      campoTexto.value = respostaExistente.conteudo || "";
      statusSalvamento.textContent =
        "Último conteúdo salvo em " + formatarData(respostaExistente.updatedAt) + ".";
      atualizarBadge(statusBadgeFormulario, "Sincronizado", "success");
    } else {
      statusSalvamento.textContent = "Sem conteúdo salvo ainda.";
      atualizarBadge(statusBadgeFormulario, "Rascunho", "warning");
    }

    formDinamico.appendChild(campoTexto);
    showTela("formulario");
  }

  function renderHome() {
    const usuario = pegarUsuarioLogado();

    if (!usuario) {
      showTela("auth");
      return;
    }

    boasVindas.textContent = "Olá, " + usuario.nome;
    listaFormularios.innerHTML = "";

    const formularios = pegarFormularios().filter(function(formulario) {
      return formulario.email === usuario.email && !formulario.deleted;
    });

    if (formularios.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Nenhum formulário criado ainda.";
      listaFormularios.appendChild(li);
    } else {
      formularios.forEach(function(formulario) {
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
          formularioAbertoId = formulario.id;
          localStorage.setItem("formSelecionado", formulario.id);
          renderFormularioAtual();
        };

        botaoExcluir.textContent = "Excluir";
        botaoExcluir.className = "botao-excluir";
        botaoExcluir.onclick = async function() {
          const confirmar = window.confirm("Deseja excluir este formulário?");

          if (!confirmar) {
            return;
          }

          const momento = agoraIso();
          const formulariosAtualizados = pegarFormularios().map(function(item) {
            if (item.id === formulario.id && item.email === usuario.email) {
              return Object.assign({}, item, {
                deleted: true,
                updatedAt: momento
              });
            }

            return item;
          });

          const respostasAtualizadas = pegarRespostas().map(function(resposta) {
            if (resposta.formularioId === formulario.id && resposta.email === usuario.email) {
              return Object.assign({}, resposta, {
                deleted: true,
                updatedAt: momento
              });
            }

            return resposta;
          });

          salvarFormularios(formulariosAtualizados);
          salvarRespostas(respostasAtualizadas);

          const formularioExcluido = formulariosAtualizados.find(function(item) {
            return item.id === formulario.id;
          });

          if (formularioExcluido) {
            registrarOperacao("formulario", "delete", formularioExcluido);
          }

          respostasAtualizadas.forEach(function(resposta) {
            if (resposta.formularioId === formulario.id && resposta.email === usuario.email) {
              registrarOperacao("resposta", "delete", resposta);
            }
          });

          if (formularioAbertoId === formulario.id) {
            formularioAbertoId = null;
          }

          alert("Formulário marcado para exclusão e sincronização.");
          renderHome();
          await sincronizarSePossivel();
        };

        acoes.appendChild(botaoAbrir);
        acoes.appendChild(botaoExcluir);
        li.appendChild(texto);
        li.appendChild(acoes);
        listaFormularios.appendChild(li);
      });
    }

    showTela("home");
  }

  atualizarTelaAtual = function() {
    const ultimaTela = localStorage.getItem(STORAGE_KEYS.ultimaTela);

    if (!pegarUsuarioLogado()) {
      showTela("auth");
      return;
    }

    if (ultimaTela === "formulario" && (formularioAbertoId || localStorage.getItem("formSelecionado"))) {
      formularioAbertoId = formularioAbertoId || localStorage.getItem("formSelecionado");
      renderFormularioAtual();
    } else {
      renderHome();
    }
  };

  if (formCadastro) {
    formCadastro.addEventListener("submit", async function(e) {
      e.preventDefault();

    const nome = document.getElementById("nomeCadastro").value.trim();
    const email = document.getElementById("emailCadastro").value.trim().toLowerCase();
    const usuarios = pegarUsuarios();

    if (usuarios.some(function(usuario) { return usuario.email === email; })) {
      alert("Email já cadastrado!");
      return;
    }

    const usuario = {
      id: criarId("user"),
      nome: nome,
      email: email,
      updatedAt: agoraIso()
    };

    usuarios.push(usuario);
    salvarUsuarios(usuarios);
    registrarOperacao("usuario", "upsert", usuario);

    alert("Cadastro realizado!");
    formCadastro.reset();
      await sincronizarSePossivel();
    });
  }

  if (formLogin) {
    formLogin.addEventListener("submit", async function(e) {
      e.preventDefault();

    const nome = document.getElementById("nomeLogin").value.trim();
    const email = document.getElementById("emailLogin").value.trim().toLowerCase();
    let usuarios = pegarUsuarios();
    let usuario = usuarios.find(function(item) {
      return item.email === email && item.nome === nome;
    });

    if (!usuario) {
      const sincronizou = await sincronizarSePossivel();

      if (sincronizou) {
        usuarios = pegarUsuarios();
        usuario = usuarios.find(function(item) {
          return item.email === email && item.nome === nome;
        });
      }
    }

    if (!usuario) {
      alert("Usuário não encontrado neste dispositivo nem no servidor.");
      return;
    }

      salvarUsuarioLogado(usuario);
      formularioAbertoId = localStorage.getItem("formSelecionado");
      renderHome();
    });
  }

  if (botaoSalvarFormulario) {
    botaoSalvarFormulario.addEventListener("click", async function() {
      const usuario = pegarUsuarioLogado();
    const nome = nomeFormularioInput.value.trim();

    if (!usuario) {
      showTela("auth");
      return;
    }

    if (!nome) {
      alert("Digite um título para o formulário.");
      return;
    }

    const formulario = {
      id: criarId("form"),
      nome: nome,
      tipo: "texto",
      email: usuario.email,
      autorId: usuario.id,
      deleted: false,
      createdAt: agoraIso(),
      updatedAt: agoraIso()
    };

    const formularios = pegarFormularios();
    formularios.push(formulario);
    salvarFormularios(formularios);
    registrarOperacao("formulario", "upsert", formulario);

    nomeFormularioInput.value = "";
    alert("Formulário salvo localmente.");
      renderHome();
      await sincronizarSePossivel();
    });
  }

  if (botaoSalvarConteudo) {
    botaoSalvarConteudo.addEventListener("click", async function() {
      const usuario = pegarUsuarioLogado();
    const campoTexto = document.getElementById("conteudoFormulario");
    const conteudo = campoTexto ? campoTexto.value.trim() : "";
    const formularios = pegarFormularios().filter(function(formulario) {
      return usuario && formulario.email === usuario.email && !formulario.deleted;
    });
    const formulario = formularios.find(function(item) {
      return item.id === formularioAbertoId;
    });

    if (!usuario || !formulario) {
      renderHome();
      return;
    }

    if (!conteudo) {
      alert("Preencha o conteúdo antes de salvar.");
      return;
    }

    const momento = agoraIso();
    const respostas = pegarRespostas();
    let resposta = buscarRespostaDoFormulario(formulario.id, usuario.email);

    if (resposta) {
      resposta = Object.assign({}, resposta, {
        conteudo: conteudo,
        deleted: false,
        updatedAt: momento
      });

      const respostasAtualizadas = respostas.map(function(item) {
        return item.id === resposta.id ? resposta : item;
      });

      salvarRespostas(respostasAtualizadas);
    } else {
      resposta = {
        id: criarId("resp"),
        formularioId: formulario.id,
        formulario: formulario.nome,
        conteudo: conteudo,
        autor: usuario.nome,
        autorId: usuario.id,
        email: usuario.email,
        deleted: false,
        createdAt: momento,
        updatedAt: momento
      };

      respostas.push(resposta);
      salvarRespostas(respostas);
    }

    registrarOperacao("resposta", "upsert", resposta);
    statusSalvamento.textContent = "Conteúdo salvo offline em " + formatarData(momento) + ".";
    atualizarBadge(statusBadgeFormulario, "Salvo local", "warning");

    alert("Conteúdo salvo offline com sucesso.");
      await sincronizarSePossivel();
      renderFormularioAtual();
    });
  }

  if (botaoVoltarHome) {
    botaoVoltarHome.addEventListener("click", function() {
      renderHome();
    });
  }

  if (botaoSyncManual) {
    botaoSyncManual.addEventListener("click", async function() {
      await sincronizarComServidor();
    });
  }

  if (botaoSair) {
    botaoSair.addEventListener("click", function() {
      limparSessao();
      showTela("auth");
    });
  }

  if (navigator.onLine) {
    sincronizarComServidor();
  } else {
    atualizarStatusSync("Modo offline ativo.", "warning");
  }

  atualizarTelaAtual();
};
