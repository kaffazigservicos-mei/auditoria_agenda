/**
 * AUDITORIA AGENDA — sincronização bidirecional
 *
 * Consolida eventos do Google Calendar e tarefas do Google Tasks na Página1.
 * Também envia para as fontes Google alterações feitas na Página1 pelo AppSheet.
 *
 * Política de conflito: se a linha da Página1 foi alterada desde a última
 * sincronização, a alteração feita no AppSheet vence e é enviada à fonte.
 * Alterações externas são importadas na sincronização seguinte.
 *
 * Exclusão automática está desativada por segurança. Remover uma linha da
 * Página1 não apaga automaticamente o evento ou a tarefa na fonte.
 */

var CONFIG = {
  CALENDAR_ID: 'primary',
  DATA_INICIO: new Date('2026-01-01T00:00:00Z'),
  DATA_FIM: new Date('2027-01-01T00:00:00Z'),
  INCLUIR_TAREFAS_SEM_PRAZO: true,
  INCLUIR_TAREFAS_CONCLUIDAS: true,
  TASKS_MAX_RESULTS: 100,
  DEFAULT_TASK_LIST_ID: '',
  SHEET_NAME: 'Página1',
  SYNC_SNAPSHOT_KEY: 'AUDITORIA_AGENDA_SYNC_SNAPSHOT'
};

var TASKS_API_BASE_URL = 'https://tasks.googleapis.com/tasks/v1';

var CABECALHOS = [
  'Título',
  'Início',
  'Fim',
  'Tipo',
  'Origem',
  'Lista',
  'ID',
  'Status'
];

/**
 * Sincroniza nos dois sentidos:
 * 1) envia alterações feitas na Página1 para Calendar/Tasks;
 * 2) importa o estado atual das fontes para a Página1.
 *
 * Execute esta função manualmente ou configure um gatilho de tempo com
 * configurarSincronizacaoAutomatica().
 */
function exportarAgendaAuditoria() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var planilha = obterPlanilha_();
    var resultadoEscrita = aplicarAlteracoesDaPagina_(planilha);
    var resultadoImportacao = importarFontesParaPagina_(planilha);
    var mensagem = montarMensagemSincronizacao_(resultadoEscrita, resultadoImportacao);

    try {
      planilha.toast(mensagem, 'Auditoria Agenda', 10);
    } catch (erroUi) {
      console.log(mensagem);
    }

    return mensagem;
  } finally {
    lock.releaseLock();
  }
}

/** Nome explícito para seleção no editor do Apps Script. */
function sincronizarBidirecional() {
  return exportarAgendaAuditoria();
}

/**
 * Cria um gatilho de tempo a cada cinco minutos.
 * O gatilho deve ser criado pela conta dona do Calendar, Tasks e Sheets.
 */
function configurarSincronizacaoAutomatica() {
  // Execute esta função manualmente no editor para solicitar a autorização dos gatilhos.
  ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, [
    'https://www.googleapis.com/auth/script.scriptapp'
  ]);

  var gatilhos = ScriptApp.getProjectTriggers();
  for (var i = 0; i < gatilhos.length; i++) {
    var funcao = gatilhos[i].getHandlerFunction();
    if (funcao === 'exportarAgendaAuditoria' || funcao === 'sincronizarBidirecional') {
      ScriptApp.deleteTrigger(gatilhos[i]);
    }
  }

  ScriptApp.newTrigger('exportarAgendaAuditoria')
    .timeBased()
    .everyMinutes(5)
    .create();

  return 'Sincronização automática configurada para aproximadamente a cada 5 minutos.';
}

/** Retorna a planilha vinculada ao Apps Script e guarda o ID para o gatilho. */
function obterPlanilha_() {
  var propriedades = PropertiesService.getScriptProperties();
  var idSalvo = propriedades.getProperty('AUDITORIA_AGENDA_SPREADSHEET_ID');
  if (idSalvo) {
    return SpreadsheetApp.openById(idSalvo);
  }

  var ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (!ativa) {
    throw new Error('Não foi possível localizar a planilha vinculada ao Apps Script.');
  }
  propriedades.setProperty('AUDITORIA_AGENDA_SPREADSHEET_ID', ativa.getId());
  return ativa;
}

/**
 * Envia para as fontes as linhas que foram alteradas no AppSheet desde o
 * último snapshot. Se uma linha foi alterada simultaneamente fora do app,
 * a versão da Página1 vence nesta execução e fica registrada no próximo
 * snapshot após a importação.
 */
function aplicarAlteracoesDaPagina_(planilha) {
  var snapshot = carregarSnapshot_();
  var aba = obterAbaPrincipal_(planilha);
  var linhas = lerLinhasDaPagina_(aba);
  var resultado = {
    atualizados: 0,
    ignorados: 0,
    erros: []
  };

  if (Object.keys(snapshot).length === 0) {
    return resultado;
  }

  for (var i = 0; i < linhas.length; i++) {
    var linha = linhas[i];
    if (!linha.id) {
      try {
        if (linha.tipo === 'Tarefa') {
          criarTarefaDaLinha_(linha);
          resultado.atualizados++;
        } else if (linha.tipo === 'Evento único' || linha.tipo === 'Evento recorrente') {
          criarEventoDaLinha_(linha);
          resultado.atualizados++;
        } else {
          resultado.ignorados++;
        }
      } catch (erroNovo) {
        resultado.erros.push('linha ' + linha.rowNumber + ': ' + obterMensagemErro_(erroNovo));
        console.error(erroNovo);
      }
      continue;
    }

    if (!snapshot[linha.id]) {
      if (linha.tipo === 'Tarefa') {
        try {
          criarTarefaDaLinha_(linha);
          resultado.atualizados++;
        } catch (erroTarefaNova) {
          resultado.erros.push('linha ' + linha.rowNumber + ': ' + obterMensagemErro_(erroTarefaNova));
          console.error(erroTarefaNova);
        }
      } else if (linha.tipo === 'Evento único' || linha.tipo === 'Evento recorrente') {
        try {
          criarEventoDaLinha_(linha);
          resultado.atualizados++;
        } catch (erroEventoNovo) {
          resultado.erros.push('linha ' + linha.rowNumber + ': ' + obterMensagemErro_(erroEventoNovo));
          console.error(erroEventoNovo);
        }
      } else {
        resultado.ignorados++;
      }
      continue;
    }

    var anterior = snapshot[linha.id];
    if (JSON.stringify(registroEditavel_(linha)) === JSON.stringify(registroEditavel_(anterior))) {
      continue;
    }

    try {
      if (linha.id.indexOf('TAREFA|') === 0) {
        atualizarTarefaDaLinha_(linha, anterior);
        resultado.atualizados++;
      } else if (linha.id.indexOf('EVENTO|') === 0) {
        atualizarEventoDaLinha_(linha, anterior);
        resultado.atualizados++;
      }
    } catch (erro) {
      resultado.erros.push(linha.id + ': ' + obterMensagemErro_(erro));
      console.error(erro);
    }
  }

  return resultado;
}

function atualizarTarefaDaLinha_(linha, anterior) {
  var partes = linha.id.split('|');
  if (partes.length < 3) {
    throw new Error('ID de tarefa inválido: ' + linha.id);
  }

  var listaId = partes[1];
  var tarefaId = partes.slice(2).join('|');
  var caminho = '/lists/' + encodeURIComponent(listaId) + '/tasks/' + encodeURIComponent(tarefaId);
  var tarefaAtual = chamarTasksApi_(caminho, {}, 'get');
  var corpo = copiarCamposEditaveisDaTarefa_(tarefaAtual);
  var atual = registroEditavel_(linha);
  var antigo = registroEditavel_(anterior);

  if (atual.titulo !== antigo.titulo) {
    corpo.title = linha.titulo || '(sem título)';
  }
  if (atual.inicio !== antigo.inicio) {
    corpo.due = converterParaData_(linha.inicio) ? converterParaData_(linha.inicio).toISOString() : null;
  }
  if (atual.status !== antigo.status) {
    corpo.status = normalizarStatus_(linha.status) === 'Concluída' ? 'completed' : 'needsAction';
  }

  chamarTasksApi_(caminho, {}, 'put', corpo);
}

function copiarCamposEditaveisDaTarefa_(tarefa) {
  return {
    id: tarefa.id || undefined,
    etag: tarefa.etag || undefined,
    title: tarefa.title || '',
    notes: tarefa.notes || '',
    status: tarefa.status || 'needsAction',
    due: tarefa.due || null,
    parent: tarefa.parent || undefined,
    position: tarefa.position || undefined
  };
}

function criarTarefaDaLinha_(linha) {
  var listaId = obterIdDaLista_(linha.lista);
  var corpo = {
    title: linha.titulo || '(sem título)',
    status: normalizarStatus_(linha.status) === 'Concluída' ? 'completed' : 'needsAction'
  };
  var prazo = converterParaData_(linha.inicio);
  if (prazo) corpo.due = prazo.toISOString();

  var criada = chamarTasksApi_('/lists/' + encodeURIComponent(listaId) + '/tasks', {}, 'post', corpo);
  if (!criada || !criada.id) {
    throw new Error('A Google Tasks API não devolveu o ID da nova tarefa.');
  }
}

function obterIdDaLista_(nomeOuId) {
  if (CONFIG.DEFAULT_TASK_LIST_ID) return CONFIG.DEFAULT_TASK_LIST_ID;
  var texto = limparTexto_(nomeOuId);
  var listas = listarTodasAsListas_();
  if (texto) {
    for (var i = 0; i < listas.length; i++) {
      if (listas[i].id === texto || listas[i].title === texto) return listas[i].id;
    }
  }
  if (listas.length > 0) return listas[0].id;
  throw new Error('Nenhuma lista do Google Tasks foi encontrada.');
}

function criarEventoDaLinha_(linha) {
  var inicio = converterParaData_(linha.inicio);
  var fim = converterParaData_(linha.fim);
  if (!inicio) throw new Error('O novo evento precisa de um início válido.');
  if (!fim || fim <= inicio) fim = new Date(inicio.getTime() + 60 * 60 * 1000);

  var calendario = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  var criado = calendario.createEvent(linha.titulo || '(sem título)', inicio, fim);
  if (!criado) throw new Error('O Google Calendar não devolveu o evento criado.');
}

function atualizarEventoDaLinha_(linha, anterior) {
  var partes = linha.id.split('|');
  if (partes.length < 3) {
    throw new Error('ID de evento inválido: ' + linha.id);
  }

  var eventId = partes[1];
  var calendario = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  var evento = calendario.getEventById(eventId);
  if (!evento) {
    throw new Error('Evento não encontrado no Google Calendar: ' + eventId);
  }

  var atual = registroEditavel_(linha);
  var antigo = registroEditavel_(anterior);

  if (atual.titulo !== antigo.titulo && linha.titulo) {
    evento.setTitle(linha.titulo);
  }

  if (atual.inicio !== antigo.inicio || atual.fim !== antigo.fim) {
    var inicio = converterParaData_(linha.inicio);
    var fim = converterParaData_(linha.fim);
    if (!inicio || !fim || fim <= inicio) {
      throw new Error('Início e fim do evento precisam ser datas válidas, com fim posterior ao início.');
    }
    evento.setTime(inicio, fim);
  }
}

/** Importa Calendar e Tasks e substitui somente as linhas de dados da Página1. */
function importarFontesParaPagina_(planilha) {
  if (!planilha) {
    throw new Error('A planilha não foi encontrada.');
  }
  var aba = obterAbaPrincipal_(planilha);

  var fusoHorario = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  var itens = [];
  var quantidadeEventos = 0;
  var quantidadeTarefas = 0;
  var avisoTarefas = '';

  removerFiltro_(aba);
  garantirColunas_(aba, CABECALHOS.length);

  var agenda = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  if (!agenda) {
    throw new Error('Não foi possível localizar o calendário configurado: ' + CONFIG.CALENDAR_ID);
  }

  var eventos = agenda.getEvents(CONFIG.DATA_INICIO, CONFIG.DATA_FIM);
  for (var i = 0; i < eventos.length; i++) {
    var evento = eventos[i];
    var inicio = evento.getStartTime();
    var fim = evento.getEndTime();

    itens.push({
      ordem: inicio.getTime(),
      linha: [
        evento.getTitle(),
        formatarData_(inicio, fusoHorario),
        formatarData_(fim, fusoHorario),
        evento.isRecurringEvent() ? 'Evento recorrente' : 'Evento único',
        'Google Agenda',
        '',
        'EVENTO|' + evento.getId() + '|' + inicio.getTime(),
        'Pendente'
      ]
    });
    quantidadeEventos++;
  }

  try {
    var registrosDeTarefas = extrairTarefas_(fusoHorario);
    itens = itens.concat(registrosDeTarefas);
    quantidadeTarefas = registrosDeTarefas.length;
  } catch (erro) {
    avisoTarefas = ' As tarefas não foram importadas: ' + obterMensagemErro_(erro);
    console.error(erro);
  }

  itens.sort(function(a, b) {
    if (a.ordem === null && b.ordem === null) return 0;
    if (a.ordem === null) return 1;
    if (b.ordem === null) return -1;
    return a.ordem - b.ordem;
  });

  var dados = itens.map(function(item) { return item.linha; });
  aba.getRange(1, 1, 1, CABECALHOS.length).setValues([CABECALHOS]);
  if (aba.getLastRow() > 1) {
    aba.getRange(2, 1, aba.getLastRow() - 1, CABECALHOS.length).clearContent();
  }
  if (dados.length > 0) {
    aba.getRange(2, 1, dados.length, CABECALHOS.length).setValues(dados);
  }
  aba.setFrozenRows(1);

  salvarSnapshot_(dados);
  return {
    eventos: quantidadeEventos,
    tarefas: quantidadeTarefas,
    avisoTarefas: avisoTarefas,
    total: dados.length
  };
}

function montarMensagemSincronizacao_(escrita, importacao) {
  var mensagem = 'Sincronização concluída: ' + importacao.eventos +
    ' eventos e ' + importacao.tarefas + ' tarefas importados.';
  if (escrita.atualizados > 0) {
    mensagem += ' ' + escrita.atualizados + ' alterações enviadas às fontes Google.';
  }
  if (escrita.erros.length > 0) {
    mensagem += ' Falhas de escrita: ' + escrita.erros.length + '.';
  }
  if (importacao.total === 0) {
    mensagem = 'Nenhum evento ou tarefa encontrado no período configurado.';
  }
  return mensagem + (importacao.avisoTarefas || '');
}

/** Extrai tarefas de todas as listas, incluindo concluídas e sem prazo conforme CONFIG. */
function extrairTarefas_(fusoHorario) {
  var registros = [];
  var listas = listarTodasAsListas_();

  for (var i = 0; i < listas.length; i++) {
    var lista = listas[i];
    var tarefas = listarTodasAsTarefasDaLista_(lista.id);

    for (var j = 0; j < tarefas.length; j++) {
      var tarefa = tarefas[j];
      if (tarefa.deleted) continue;

      var concluida = tarefa.status === 'completed';
      if (concluida && !CONFIG.INCLUIR_TAREFAS_CONCLUIDAS) continue;

      var prazo = tarefa.due ? new Date(tarefa.due) : null;
      var prazoValido = prazo && !isNaN(prazo.getTime());
      if (prazoValido) {
        if (prazo < CONFIG.DATA_INICIO || prazo >= CONFIG.DATA_FIM) continue;
      } else if (!CONFIG.INCLUIR_TAREFAS_SEM_PRAZO) {
        continue;
      }

      registros.push({
        ordem: prazoValido ? prazo.getTime() : null,
        linha: [
          tarefa.title || '(sem título)',
          prazoValido ? formatarPrazoDeTarefa_(tarefa.due, fusoHorario) : '',
          '',
          'Tarefa',
          'Google Tasks',
          lista.title || '(sem lista)',
          'TAREFA|' + lista.id + '|' + tarefa.id,
          concluida ? 'Concluída' : 'Pendente'
        ]
      });
    }
  }

  return registros;
}

function chamarTasksApi_(caminho, parametros, metodo, corpo) {
  var url = TASKS_API_BASE_URL + caminho + montarQueryString_(parametros);
  var opcoes = {
    method: (metodo || 'get').toLowerCase(),
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };
  if (corpo !== undefined) {
    opcoes.contentType = 'application/json';
    opcoes.payload = JSON.stringify(corpo);
  }

  var resposta = UrlFetchApp.fetch(url, opcoes);
  var codigo = resposta.getResponseCode();
  var texto = resposta.getContentText();
  var dados = texto ? JSON.parse(texto) : {};
  if (codigo < 200 || codigo >= 300) {
    var detalhe = dados.error && dados.error.message ? dados.error.message : texto;
    throw new Error('Google Tasks API (' + codigo + '): ' + detalhe);
  }
  return dados;
}

function consultarTasksApi_(caminho, parametros) {
  return chamarTasksApi_(caminho, parametros, 'get');
}

function listarTodasAsListas_() {
  var listas = [];
  var pageToken;
  do {
    var resposta = consultarTasksApi_('/users/@me/lists', {
      maxResults: CONFIG.TASKS_MAX_RESULTS,
      pageToken: pageToken
    });
    if (resposta && resposta.items) listas = listas.concat(resposta.items);
    pageToken = resposta && resposta.nextPageToken;
  } while (pageToken);
  return listas;
}

function listarTodasAsTarefasDaLista_(taskListId) {
  var tarefas = [];
  var pageToken;
  do {
    var resposta = consultarTasksApi_('/lists/' + encodeURIComponent(taskListId) + '/tasks', {
      maxResults: CONFIG.TASKS_MAX_RESULTS,
      showCompleted: CONFIG.INCLUIR_TAREFAS_CONCLUIDAS,
      showDeleted: true,
      showHidden: true,
      pageToken: pageToken
    });
    if (resposta && resposta.items) tarefas = tarefas.concat(resposta.items);
    pageToken = resposta && resposta.nextPageToken;
  } while (pageToken);
  return tarefas;
}

function montarQueryString_(parametros) {
  var partes = [];
  var chaves = Object.keys(parametros || {});
  for (var i = 0; i < chaves.length; i++) {
    var chave = chaves[i];
    var valor = parametros[chave];
    if (valor !== undefined && valor !== null && valor !== '') {
      partes.push(encodeURIComponent(chave) + '=' + encodeURIComponent(String(valor)));
    }
  }
  return partes.length > 0 ? '?' + partes.join('&') : '';
}

function obterAbaPrincipal_(planilha) {
  var aba = planilha.getSheetByName(CONFIG.SHEET_NAME);
  if (!aba) {
    throw new Error('A aba "' + CONFIG.SHEET_NAME + '" não foi encontrada na planilha.');
  }
  return aba;
}

function lerLinhasDaPagina_(aba) {
  var ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return [];
  var valores = aba.getRange(2, 1, ultimaLinha - 1, CABECALHOS.length).getValues();
  return valores.map(function(valor, indice) {
    return {
      rowNumber: indice + 2,
      titulo: limparTexto_(valor[0]),
      inicio: valor[1],
      fim: valor[2],
      tipo: limparTexto_(valor[3]),
      origem: limparTexto_(valor[4]),
      lista: limparTexto_(valor[5]),
      id: limparTexto_(valor[6]),
      status: normalizarStatus_(valor[7])
    };
  });
}

function registroEditavel_(registro) {
  return {
    titulo: limparTexto_(registro.titulo),
    inicio: normalizarDataParaComparacao_(registro.inicio),
    fim: normalizarDataParaComparacao_(registro.fim),
    status: normalizarStatus_(registro.status)
  };
}

function salvarSnapshot_(dados) {
  var snapshot = {};
  for (var i = 0; i < dados.length; i++) {
    var linha = {
      titulo: dados[i][0],
      inicio: dados[i][1],
      fim: dados[i][2],
      tipo: dados[i][3],
      origem: dados[i][4],
      lista: dados[i][5],
      id: dados[i][6],
      status: dados[i][7]
    };
    snapshot[linha.id] = registroEditavel_(linha);
  }
  PropertiesService.getScriptProperties().setProperty(CONFIG.SYNC_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

function carregarSnapshot_() {
  var valor = PropertiesService.getScriptProperties().getProperty(CONFIG.SYNC_SNAPSHOT_KEY);
  if (!valor) return {};
  try {
    return JSON.parse(valor);
  } catch (erro) {
    console.error(erro);
    return {};
  }
}

function limparTexto_(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/^'/, '').trim();
}

function normalizarStatus_(valor) {
  var texto = limparTexto_(valor).toLowerCase();
  if (texto === 'concluída' || texto === 'concluida' || texto === 'completed' || texto === 'concluído') {
    return 'Concluída';
  }
  return 'Pendente';
}

function normalizarDataParaComparacao_(valor) {
  var data = converterParaData_(valor);
  if (!data) return limparTexto_(valor);
  return Utilities.formatDate(data, 'UTC', "yyyy-MM-dd'T'HH:mm:ss");
}

function converterParaData_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return valor;
  var texto = limparTexto_(valor);
  if (!texto) return null;

  var brasil = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (brasil) {
    return new Date(
      Number(brasil[3]),
      Number(brasil[2]) - 1,
      Number(brasil[1]),
      Number(brasil[4] || 0),
      Number(brasil[5] || 0),
      0
    );
  }

  var data = new Date(texto);
  return isNaN(data.getTime()) ? null : data;
}

function formatarData_(data, fusoHorario) {
  return "'" + Utilities.formatDate(data, fusoHorario, 'dd/MM/yyyy HH:mm');
}

function formatarPrazoDeTarefa_(valorRFC3339, fusoHorario) {
  var dataISO = String(valorRFC3339).substring(0, 10);
  var partes = dataISO.split('-');
  if (partes.length === 3) {
    return "'" + partes[2] + '/' + partes[1] + '/' + partes[0];
  }
  return formatarData_(new Date(valorRFC3339), fusoHorario);
}

function removerFiltro_(planilha) {
  if (planilha.getFilter()) planilha.getFilter().remove();
}

function garantirColunas_(planilha, quantidade) {
  var colunasDisponiveis = planilha.getMaxColumns();
  if (colunasDisponiveis < quantidade) {
    planilha.insertColumnsAfter(colunasDisponiveis, quantidade - colunasDisponiveis);
  }
}

function obterMensagemErro_(erro) {
  return erro && erro.message ? erro.message : String(erro);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Sincronizar')
    .addItem('Sincronizar agora', 'exportarAgendaAuditoria')
    .addItem('Configurar sincronização automática', 'configurarSincronizacaoAutomatica')
    .addToUi();
}
