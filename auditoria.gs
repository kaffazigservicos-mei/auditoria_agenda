/**
 * SISTEMA DE AUDITORIA DE AGENDA E TAREFAS
 *
 * Consolida eventos do Google Calendar e itens do Google Tasks em uma única
 * tabela do Google Sheets para consumo pelo AppSheet.
 *
 * A integração com o Google Tasks usa a API REST diretamente, porque o serviço
 * avançado Tasks não está disponível em todos os projetos Apps Script.
 */

var CONFIG = {
  CALENDAR_ID: 'primary',
  DATA_INICIO: new Date('2026-01-01T00:00:00Z'),
  DATA_FIM: new Date('2027-01-01T00:00:00Z'),
  INCLUIR_TAREFAS_SEM_PRAZO: true,
  INCLUIR_TAREFAS_CONCLUIDAS: true,
  TASKS_MAX_RESULTS: 100,
  SHEET_NAME: 'Página1'
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
 * Importa os eventos do calendário e as tarefas do Google Tasks.
 */
function exportarAgendaAuditoria() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!planilha) {
    throw new Error('A aba de dados "' + CONFIG.SHEET_NAME + '" não foi encontrada. Verifique o nome da aba principal.');
  }
  var fusoHorario = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  var itens = [];
  var quantidadeEventos = 0;
  var quantidadeTarefas = 0;
  var avisoTarefas = '';

  removerFiltro_(planilha);
  garantirColunas_(planilha, CABECALHOS.length);

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
    if (a.ordem === null && b.ordem === null) {
      return 0;
    }
    if (a.ordem === null) {
      return 1;
    }
    if (b.ordem === null) {
      return -1;
    }
    return a.ordem - b.ordem;
  });

  var dados = itens.map(function(item) {
    return item.linha;
  });

  planilha.getRange(1, 1, 1, CABECALHOS.length).setValues([CABECALHOS]);
  if (planilha.getLastRow() > 1) {
    planilha.getRange(2, 1, planilha.getLastRow() - 1, CABECALHOS.length).clearContent();
  }

  if (dados.length > 0) {
    planilha.getRange(2, 1, dados.length, CABECALHOS.length).setValues(dados);
  }

  planilha.setFrozenRows(1);

  var mensagem = 'Sincronização concluída: ' + quantidadeEventos +
    ' eventos e ' + quantidadeTarefas + ' tarefas importados.';
  if (dados.length === 0) {
    mensagem = 'Nenhum evento ou tarefa encontrado no período configurado.';
  }
  mensagem += avisoTarefas;

  try {
    planilha.toast(mensagem, 'Auditoria Agenda', 10);
  } catch (erroUi) {
    console.log(mensagem);
  }
  return mensagem;
}

/**
 * Extrai tarefas de todas as listas do usuário, respeitando a janela de datas.
 * Tarefas sem prazo são incluídas por padrão para não desaparecerem do app.
 */
function extrairTarefas_(fusoHorario) {
  var registros = [];
  var listas = listarTodasAsListas_();

  for (var i = 0; i < listas.length; i++) {
    var lista = listas[i];
    var tarefas = listarTodasAsTarefasDaLista_(lista.id);

    for (var j = 0; j < tarefas.length; j++) {
      var tarefa = tarefas[j];
      if (tarefa.deleted) {
        continue;
      }

      var concluida = tarefa.status === 'completed';
      if (concluida && !CONFIG.INCLUIR_TAREFAS_CONCLUIDAS) {
        continue;
      }

      var prazo = tarefa.due ? new Date(tarefa.due) : null;
      var prazoValido = prazo && !isNaN(prazo.getTime());
      if (prazoValido) {
        if (prazo < CONFIG.DATA_INICIO || prazo >= CONFIG.DATA_FIM) {
          continue;
        }
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

/**
 * Faz uma requisição GET autenticada à Google Tasks API REST.
 * O token pertence ao usuário que executa o Apps Script.
 */
function consultarTasksApi_(caminho, parametros) {
  var url = TASKS_API_BASE_URL + caminho + montarQueryString_(parametros);
  var resposta = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  });
  var codigo = resposta.getResponseCode();
  var texto = resposta.getContentText();
  var corpo = texto ? JSON.parse(texto) : {};

  if (codigo < 200 || codigo >= 300) {
    var detalhe = corpo.error && corpo.error.message ? corpo.error.message : texto;
    throw new Error('Google Tasks API (' + codigo + '): ' + detalhe);
  }

  return corpo;
}

/** Lista todas as listas de tarefas, tratando paginação da API REST. */
function listarTodasAsListas_() {
  var listas = [];
  var pageToken;

  do {
    var resposta = consultarTasksApi_('/users/@me/lists', {
      maxResults: CONFIG.TASKS_MAX_RESULTS,
      pageToken: pageToken
    });
    if (resposta && resposta.items) {
      listas = listas.concat(resposta.items);
    }
    pageToken = resposta && resposta.nextPageToken;
  } while (pageToken);

  return listas;
}

/** Lista todos os itens de uma lista, tratando paginação da API REST. */
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
    if (resposta && resposta.items) {
      tarefas = tarefas.concat(resposta.items);
    }
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

function formatarData_(data, fusoHorario) {
  return "'" + Utilities.formatDate(data, fusoHorario, 'dd/MM/yyyy HH:mm');
}

/**
 * Formata o vencimento da tarefa sem deslocar o dia por causa do fuso horário.
 */
function formatarPrazoDeTarefa_(valorRFC3339, fusoHorario) {
  var dataISO = String(valorRFC3339).substring(0, 10);
  var partes = dataISO.split('-');
  if (partes.length === 3) {
    return "'" + partes[2] + '/' + partes[1] + '/' + partes[0];
  }
  return formatarData_(new Date(valorRFC3339), fusoHorario);
}

function removerFiltro_(planilha) {
  if (planilha.getFilter()) {
    planilha.getFilter().remove();
  }
}

function garantirColunas_(planilha, quantidade) {
  var colunasDisponiveis = planilha.getMaxColumns();
  if (colunasDisponiveis < quantidade) {
    planilha.insertColumnsAfter(colunasDisponiveis, quantidade - colunasDisponiveis);
  }
}

function obterMensagemErro_(erro) {
  if (erro && erro.message) {
    return erro.message;
  }
  return String(erro);
}

/** Cria o menu personalizado na planilha. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Sincronizar')
    .addItem('Atualizar agenda e tarefas', 'exportarAgendaAuditoria')
    .addToUi();
}
