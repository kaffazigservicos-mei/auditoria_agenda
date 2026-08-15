# Auditoria de Agenda e Tarefas

Sistema de extração e monitoramento de **eventos do Google Calendar** e **tarefas do Google Tasks** para auditoria técnica, com uma tabela única no Google Sheets e visualização em modo Deck pelo AppSheet.

## Funcionamento

O Apps Script consolida os itens das duas fontes em uma única planilha. Cada registro recebe uma origem explícita, um tipo, um identificador estável e um status, permitindo que o AppSheet trate eventos e tarefas no mesmo fluxo de conferência.

A integração com o Google Tasks é feita por chamadas REST autenticadas com `UrlFetchApp` e `ScriptApp.getOAuthToken()`. Dessa forma, o projeto não depende de o item **Tasks API** aparecer na lista de serviços avançados do Apps Script.

| Fonte | Tipo exibido | Data usada na ordenação | Regra padrão |
|---|---|---|---|
| Google Calendar | Evento único ou Evento recorrente | Início do evento | Eventos dentro do ciclo configurado |
| Google Tasks | Tarefa | Prazo da tarefa | Tarefas com prazo no ciclo e tarefas sem prazo |

Por padrão, as tarefas concluídas também são importadas, com status `Concluída`. Essa regra pode ser alterada na configuração do script.

## Estrutura da planilha

A primeira linha é mantida pelo script com os cabeçalhos abaixo:

| Coluna | Cabeçalho | Descrição |
|---|---|---|
| A | Título | Nome do evento ou da tarefa |
| B | Início | Início do evento ou prazo da tarefa |
| C | Fim | Fim do evento; fica vazio para tarefas |
| D | Tipo | Evento único, Evento recorrente ou Tarefa |
| E | Origem | Google Agenda ou Google Tasks |
| F | Lista | Lista do Google Tasks; fica vazio para eventos |
| G | ID | Identificador estável do registro |
| H | Status | Pendente ou Concluída |

O campo `ID` usa os prefixos `EVENTO|` e `TAREFA|` para evitar colisões entre as fontes.

## Configuração no Apps Script

### 1. Copiar os dois arquivos

Abra o [repositório do projeto](https://github.com/kaffazigservicos-mei/auditoria_agenda) e copie o conteúdo completo de:

- `auditoria.gs` para o arquivo `.gs` do Apps Script;
- `appsscript.json` para o arquivo de manifesto do projeto.

No editor do Apps Script, a opção **Mostrar arquivo de manifesto `appsscript.json` no editor** deve estar marcada em **Configurações do projeto**. O manifesto não deve conter `enabledAdvancedServices` nem exigir que `Tasks API` seja adicionado em **Serviços**.

O manifesto atual declara os seguintes escopos:

```json
"https://www.googleapis.com/auth/calendar.readonly",
"https://www.googleapis.com/auth/tasks.readonly",
"https://www.googleapis.com/auth/spreadsheets",
"https://www.googleapis.com/auth/script.external_request"
```

### 2. Ajustar o ciclo de auditoria

No início de `auditoria.gs`, altere as datas conforme o ciclo desejado:

```javascript
var CONFIG = {
  CALENDAR_ID: 'primary',
  DATA_INICIO: new Date('2026-01-01T00:00:00Z'),
  DATA_FIM: new Date('2027-01-01T00:00:00Z'),
  INCLUIR_TAREFAS_SEM_PRAZO: true,
  INCLUIR_TAREFAS_CONCLUIDAS: true,
  TASKS_MAX_RESULTS: 100
};
```

A data final é exclusiva. Para auditar todo o ano de 2027, por exemplo, use `2027-01-01` como início e `2028-01-01` como fim.

### 3. Executar a sincronização

Depois de colar e salvar os dois arquivos, selecione a função `exportarAgendaAuditoria` no alto do editor e clique em **Executar**. Na primeira execução, conceda as permissões solicitadas, incluindo a leitura das tarefas e o acesso a solicitações externas.

Não é necessário adicionar **Tasks API** em **Serviços**. O código usa diretamente os endpoints oficiais:

- `GET https://tasks.googleapis.com/tasks/v1/users/@me/lists`;
- `GET https://tasks.googleapis.com/tasks/v1/lists/{tasklist}/tasks`.

Se ocorrer uma mensagem de API desativada ou acesso negado, copie a mensagem completa do registro de execução. Ela indicará se a conta ou o administrador do Google Workspace bloqueia a Google Tasks API.

## Regras de tarefas

O script percorre todas as listas do usuário e trata a paginação da API. Tarefas excluídas não são importadas. Tarefas com prazo fora do ciclo são ignoradas. Tarefas sem prazo são incluídas quando `INCLUIR_TAREFAS_SEM_PRAZO` está como `true`, ficando ao final da ordenação. Tarefas concluídas são incluídas quando `INCLUIR_TAREFAS_CONCLUIDAS` está como `true`.

## Atualizar o AppSheet

Depois que as colunas aparecerem no Google Sheets, abra **Data → Tables**, selecione a tabela e clique em **Regenerate structure** ou **Regenerate schema**. Em seguida, crie Slices usando:

```appsheet
AND([Tipo] = "Tarefa", [Status] = "Pendente")
```

para tarefas pendentes, e:

```appsheet
AND([Tipo] = "Tarefa", [Status] = "Concluída")
```

para tarefas concluídas.

## Arquivos

| Arquivo | Finalidade |
|---|---|
| `auditoria.gs` | Extração, consolidação, ordenação e gravação de eventos e tarefas |
| `appsscript.json` | Escopos OAuth, fuso horário e acesso a requisições externas |
| `README.md` | Instalação, configuração e regras de uso |

## Manutenção do ciclo

A janela de datas é deliberadamente explícita para controlar desempenho e manter o AppSheet concentrado no ciclo atual. Ao iniciar um novo ano, atualize `DATA_INICIO` e `DATA_FIM`, salve o script e execute novamente a sincronização.

## Referências oficiais

[1]: https://developers.google.com/workspace/tasks/auth "Choose Google Tasks API scopes"
[2]: https://developers.google.com/workspace/tasks/reference/rest/v1/tasklists/list "Method: tasklists.list"
[3]: https://developers.google.com/apps-script/guides/services/external "External APIs | Apps Script"
[4]: https://developers.google.com/apps-script/reference/script/script-app#getoauthtoken "ScriptApp.getOAuthToken()"
