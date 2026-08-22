const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync(__dirname + '/auditoria.gs', 'utf8');
const manifest = fs.readFileSync(__dirname + '/appsscript.json', 'utf8');
const context = {
  console,
  CONFIG: undefined,
  TASKS_API_BASE_URL: undefined,
  CABECALHOS: undefined,
  PropertiesService: {},
  LockService: {},
  ScriptApp: {},
  SpreadsheetApp: {},
  CalendarApp: {},
  UrlFetchApp: {},
  Session: {},
  Utilities: {
    formatDate: (date) => date.toISOString()
  }
};
vm.createContext(context);
vm.runInContext(source, context);

assert.strictEqual(context.normalizarStatus_('completed'), 'Concluída');
assert.strictEqual(context.normalizarStatus_('Concluída'), 'Concluída');
assert.strictEqual(context.normalizarStatus_('needsAction'), 'Pendente');
assert.strictEqual(context.normalizarStatus_('Pendente'), 'Pendente');

assert.strictEqual(
  context.montarQueryString_({ maxResults: 100, showCompleted: true, pageToken: '' }),
  '?maxResults=100&showCompleted=true'
);

const tarefa = context.copiarCamposEditaveisDaTarefa_({
  title: 'Tarefa existente',
  notes: 'Observação',
  status: 'needsAction',
  due: '2026-08-21T00:00:00.000Z',
  parent: 'parent-id'
});
assert.strictEqual(JSON.stringify(tarefa), JSON.stringify({
  title: 'Tarefa existente',
  notes: 'Observação',
  status: 'needsAction',
  due: '2026-08-21T00:00:00.000Z',
  parent: 'parent-id'
}));

const antiga = { titulo: 'Antes', inicio: '21/08/2026 09:00', fim: '', status: 'Pendente' };
const nova = { titulo: 'Depois', inicio: '21/08/2026 10:00', fim: '', status: 'Concluída' };
assert.notStrictEqual(
  JSON.stringify(context.registroEditavel_(antiga)),
  JSON.stringify(context.registroEditavel_(nova))
);

const sourceAssertions = [
  ['calendar write scope', manifest.includes('https://www.googleapis.com/auth/calendar')],
  ['tasks write scope', manifest.includes('https://www.googleapis.com/auth/tasks')],
  ['tasks PUT request', source.includes("chamarTasksApi_(caminho, {}, 'put', corpo)")],
  ['tasks POST request', source.includes("chamarTasksApi_('/lists/' + encodeURIComponent(listaId) + '/tasks', {}, 'post', corpo)")],
  ['calendar event mutation', source.includes('evento.setTitle') && source.includes('evento.setTime')],
  ['calendar event creation', source.includes('calendario.createEvent')],
  ['time trigger', source.includes('.everyMinutes(5)')],
  ['fixed Página1 destination', source.includes("SHEET_NAME: 'Página1'") && source.includes('getSheetByName(CONFIG.SHEET_NAME)')],
  ['default task list option', source.includes('DEFAULT_TASK_LIST_ID')]
];
for (const [name, ok] of sourceAssertions) {
  assert.ok(ok, `missing ${name}`);
}

console.log('Bidirectional synchronization tests passed.');
