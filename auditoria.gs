/**
 * SISTEMA DE AUDITORIA 2026 - VERSÃO TEXTO FORÇADO
 * O uso do apóstrofo (') garante que o formato DD/MM/YYYY seja respeitado.
 */

function exportarAgendaAuditoria() {
  var idAgenda = 'primary'; 
  
  // Intervalo de Auditoria: Ano de 2026
  var dataInicioBusca = new Date('2026-01-01T00:00:00Z');
  var dataFimBusca = new Date('2026-12-31T23:59:59Z');

  var agenda = CalendarApp.getCalendarById(idAgenda);
  var eventos = agenda.getEvents(dataInicioBusca, dataFimBusca);
  var planilha = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 1. Remove filtros ativos que travam a planilha
  if (planilha.getFilter()) {
    planilha.getFilter().remove();
  }
  
  // 2. Limpa os dados antigos (Colunas A até D)
  if (planilha.getLastRow() > 1) {
    planilha.getRange(2, 1, planilha.getLastRow() - 1, 4).clearContent();
  }
  
  var dados = [];
  var fusoHorario = Session.getScriptTimeZone();

  // 3. Processamento com trava de formato de texto
  for (var i = 0; i < eventos.length; i++) {
    var titulo = eventos[i].getTitle();
    
    // O prefixo "'" força o Sheets a ler como texto literal e não inverter datas
    var inicioFormatado = "'" + Utilities.formatDate(eventos[i].getStartTime(), fusoHorario, "dd/MM/yyyy HH:mm");
    var fimFormatado = "'" + Utilities.formatDate(eventos[i].getEndTime(), fusoHorario, "dd/MM/yyyy HH:mm");
    
    var tipo = eventos[i].isRecurringEvent() ? "Recorrente" : "Único";
    
    dados.push([titulo, inicioFormatado, fimFormatado, tipo]);
  }
  
  // 4. Gravação na Planilha
  if (dados.length > 0) {
    planilha.getRange(2, 1, dados.length, 4).setValues(dados);
    SpreadsheetApp.getUi().alert('Sincronização concluída: ' + dados.length + ' eventos formatados com sucesso.');
  } else {
    SpreadsheetApp.getUi().alert('Nenhum evento encontrado em 2026.');
  }
}

/**
 * Cria o menu personalizado na planilha.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ Sincronizar')
    .addItem('Atualizar Agora', 'exportarAgendaAuditoria')
    .addToUi();
}
