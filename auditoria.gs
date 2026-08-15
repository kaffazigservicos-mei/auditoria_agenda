/**
 * SISTEMA DE AUDITORIA DE AGENDA E TAREFAS
 *
 * Consolida eventos do Google Calendar e itens do Google Tasks em uma única
 * tabela do Google Sheets para consumo pelo AppSheet.
 */

var CONFIG = {
  CALENDAR_ID: 'primary',
  DATA_INICIO: new Date('2026-01-01T00:00:00Z'),
  DATA_FIM: new Date('2027-01-01T00:00:00Z'),
  INCLUIR_TAREFAS_SEM_PRAZO: true,
  INCLUIR_TAREFAS_CONCLUIDAS: true,
  TASKS_MAX_RESULTS: 100
};

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
 *
 * O serviço avançado Tasks precisa estar habilitado no projeto do Apps Script
 * e a Google Tasks API precisa estar ativada no projeto do Google Cloud.
 */
function exportarAgendaAuditoria() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
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
        'EVENTO|' + evento.getId(),
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

  // Mantém o esquema esperado pelo AppSheet e remove a carga anterior.
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

  SpreadsheetApp.getUi().alert(mensagem);
}

/**
 * Extrai tarefas de todas as listas do usuário, respeitando a janela de datas.
 * Tarefas sem prazo são incluídas por padrão para não desaparecerem do app.
 */
function extrairTarefas_(fusoHorario) {
  if (typeof Tasks === 'undefined') {
    throw new Error('O serviço avançado Tasks ainda não foi habilitado no Apps Script.');
  }

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

/** Lista todas as listas de tarefas, tratando paginação da API. */
function listarTodasAsListas_() {
  var listas = [];
  var pageToken;

  do {
    var resposta = Tasks.Tasklists.list({
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

/** Lista todos os itens de uma lista de tarefas, tratando paginação da API. */
function listarTodasAsTarefasDaLista_(taskListId) {
  var tarefas = [];
  var pageToken;

  do {
    var resposta = Tasks.Tasks.list(taskListId, {
      maxResults: CONFIG.TASKS_MAX_RESULTS,
      showCompleted: CONFIG.INCLUIR_TAREFAS_CONCLUIDAS,
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

/**
 * Formata eventos como texto para preservar o padrão usado pela planilha.
 */
function formatarData_(data, fusoHorario) {
  return "'" + Utilities.formatDate(data, fusoHorario, 'dd/MM/yyyy HH:mm');
}

/**
 * Formata o vencimento da tarefa sem deslocar o dia por causa do fuso horário.
 * A API do Tasks costuma retornar prazos como datas em UTC sem horário útil.
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
    .createMenu('⚙️ Sincronizar')
    .addItem('Atualizar agenda e tarefas', 'exportarAgendaAuditoria')
    .addToUi();
}
