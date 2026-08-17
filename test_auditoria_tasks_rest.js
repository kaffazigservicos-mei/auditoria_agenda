const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('/home/ubuntu/auditoria_agenda/auditoria.gs', 'utf8');
const calls = [];

const context = {
  console,
  ScriptApp: {
    getOAuthToken() {
      return 'token-de-teste';
    },
  },
  UrlFetchApp: {
    fetch(url, options) {
      calls.push({ url, options });
      assert.strictEqual(options.method, 'get');
      assert.strictEqual(options.headers.Authorization, 'Bearer token-de-teste');
      assert.strictEqual(options.muteHttpExceptions, true);

      let body;
      if (url.includes('/users/@me/lists')) {
        body = url.includes('pageToken=pagina-listas')
          ? { items: [{ id: 'lista-2', title: 'Trabalho' }] }
          : {
              items: [{ id: 'lista-1', title: 'Pessoal' }],
              nextPageToken: 'pagina-listas',
            };
      } else if (url.includes('/lists/lista-1/tasks')) {
        body = url.includes('pageToken=pagina-tarefas')
          ? {
              items: [
                { id: 'tarefa-3', title: 'Concluída', due: '2026-05-01T00:00:00.000Z', status: 'completed' },
              ],
            }
          : {
              items: [
                { id: 'tarefa-1', title: 'Com prazo', due: '2026-04-20T00:00:00.000Z', status: 'needsAction' },
                { id: 'tarefa-2', title: 'Sem prazo', status: 'needsAction' },
              ],
              nextPageToken: 'pagina-tarefas',
            };
      } else if (url.includes('/lists/lista-2/tasks')) {
        body = {
          items: [
            { id: 'tarefa-4', title: 'Fora do ciclo', due: '2025-12-31T00:00:00.000Z', status: 'needsAction' },
            { id: 'tarefa-5', title: 'Excluída', due: '2026-06-01T00:00:00.000Z', status: 'needsAction', deleted: true },
          ],
        };
      } else {
        throw new Error(`URL inesperada: ${url}`);
      }

      return {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify(body),
      };
    },
  },
  Utilities: {
    formatDate(date, _timezone, format) {
      assert.strictEqual(format, 'dd/MM/yyyy HH:mm');
      return '01/01/2026 00:00';
    },
  },
  Session: { getScriptTimeZone: () => 'America/Sao_Paulo' },
};

vm.createContext(context);
vm.runInContext(source, context);

const registros = context.extrairTarefas_('America/Sao_Paulo');
assert.strictEqual(registros.length, 3, 'deve incluir prazo, sem prazo e concluída');
assert.strictEqual(JSON.stringify(registros.map((r) => r.linha[0])), JSON.stringify(['Com prazo', 'Sem prazo', 'Concluída']));
assert.strictEqual(registros[0].linha[4], 'Google Tasks');
assert.strictEqual(registros[0].linha[3], 'Tarefa');
assert.strictEqual(registros[0].linha[7], 'Pendente');
assert.strictEqual(registros[2].linha[7], 'Concluída');
assert.strictEqual(calls.length, 5, 'deve consultar duas páginas de listas e três de tarefas');

console.log('OK: integração REST, OAuth, paginação, filtros e status validados.');
