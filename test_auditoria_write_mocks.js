const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync(__dirname + '/auditoria.gs', 'utf8');
const calls = [];
let taskGets = 0;
let calendarTitle = null;
let calendarStart = null;
let calendarEnd = null;

const taskResource = {
  id: 'task-1',
  etag: 'etag-1',
  title: 'Título antigo',
  notes: 'Notas',
  status: 'needsAction',
  due: '2026-08-21T12:00:00.000Z'
};

const context = {
  console,
  PropertiesService: { getScriptProperties: () => ({}) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ScriptApp: { getOAuthToken: () => 'test-token', getProjectTriggers: () => [] },
  UrlFetchApp: {
    fetch: (url, options) => {
      calls.push({ url, options });
      if (options.method === 'get') {
        taskGets += 1;
        return { getResponseCode: () => 200, getContentText: () => JSON.stringify(taskResource) };
      }
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ ok: true }) };
    }
  },
  CalendarApp: {
    getCalendarById: () => ({
      getEventById: () => ({
        setTitle: (value) => { calendarTitle = value; },
        setTime: (start, end) => { calendarStart = start; calendarEnd = end; }
      })
    })
  },
  Utilities: { formatDate: (date) => date.toISOString() },
  SpreadsheetApp: {},
  Session: {}
};
vm.createContext(context);
vm.runInContext(source, context);

context.atualizarTarefaDaLinha_({
  id: 'TAREFA|list-1|task-1',
  titulo: 'Título novo',
  inicio: '21/08/2026 13:00',
  fim: '',
  status: 'Concluída'
}, {
  id: 'TAREFA|list-1|task-1',
  titulo: 'Título antigo',
  inicio: '21/08/2026 12:00',
  fim: '',
  status: 'Pendente'
});

assert.strictEqual(taskGets, 1);
assert.strictEqual(calls.length, 2);
assert.strictEqual(calls[1].options.method, 'put');
const taskPayload = JSON.parse(calls[1].options.payload);
assert.strictEqual(taskPayload.title, 'Título novo');
assert.strictEqual(taskPayload.status, 'completed');
assert.ok(taskPayload.due);

context.atualizarEventoDaLinha_({
  id: 'EVENTO|event-1|1000',
  titulo: 'Reunião nova',
  inicio: '21/08/2026 14:00',
  fim: '21/08/2026 15:00',
  status: 'Pendente'
}, {
  id: 'EVENTO|event-1|1000',
  titulo: 'Reunião antiga',
  inicio: '21/08/2026 13:00',
  fim: '21/08/2026 14:00',
  status: 'Pendente'
});

assert.strictEqual(calendarTitle, 'Reunião nova');
assert.strictEqual(typeof calendarStart.getTime, 'function');
assert.strictEqual(typeof calendarEnd.getTime, 'function');
assert.ok(calendarEnd.getTime() > calendarStart.getTime());

console.log('Write-back mock tests passed.');
