# Auditoria de Agenda e Tarefas

Sistema de extração e monitoramento de **eventos do Google Calendar** e **tarefas do Google Tasks** para auditoria técnica, com uma tabela única no Google Sheets e visualização em modo Deck pelo AppSheet.

## Funcionamento

O Apps Script consolida os itens das duas fontes em uma única planilha. Cada registro recebe uma origem explícita, um tipo, um identificador estável e um status, permitindo que o AppSheet trate eventos e tarefas no mesmo fluxo de conferência.

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

## Configuração

### 1. Google Sheets e Apps Script

Prepare a planilha que será usada pelo AppSheet. No editor do Apps Script, copie os arquivos `auditoria.gs` e `appsscript.json` deste repositório. O manifesto já declara o serviço avançado `Tasks` e os escopos necessários.

### 2. Ativar o Google Tasks API

No projeto do Google Cloud associado ao Apps Script, ative a **Google Tasks API**. No editor do Apps Script, confirme também que o serviço avançado **Tasks API** aparece em **Serviços**. A documentação oficial descreve essa configuração em [Tasks Service | Apps Script](https://developers.google.com/apps-script/advanced/tasks) e no [quickstart do Google Tasks para Apps Script](https://developers.google.com/workspace/tasks/quickstart/apps-script).

### 3. Ajustar o ciclo de auditoria

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

### 4. Executar a sincronização

Salve o projeto, execute `exportarAgendaAuditoria` pela primeira vez e conceda as permissões solicitadas. Depois, recarregue a planilha para visualizar o menu **⚙️ Sincronizar → Atualizar agenda e tarefas**.

Se a integração com o Google Tasks ainda não estiver habilitada, o script continua importando os eventos do Calendar e exibe um aviso indicando a configuração pendente.

### 5. Atualizar o AppSheet

No AppSheet, atualize a estrutura da fonte de dados para reconhecer as colunas novas. Configure a visualização Deck usando `Título` como campo principal e, se desejado, mostre `Tipo`, `Origem`, `Lista`, `Início` e `Status` como informações secundárias. As visualizações existentes podem continuar filtrando por status e agora também poderão filtrar por `Origem` ou `Tipo`.

## Regras de tarefas

O script percorre todas as listas do usuário e trata a paginação da API. Tarefas excluídas não são importadas. Tarefas com prazo fora do ciclo são ignoradas. Tarefas sem prazo são incluídas quando `INCLUIR_TAREFAS_SEM_PRAZO` está como `true`, ficando ao final da ordenação. Tarefas concluídas são incluídas quando `INCLUIR_TAREFAS_CONCLUIDAS` está como `true`.

## Arquivos

| Arquivo | Finalidade |
|---|---|
| `auditoria.gs` | Extração, consolidação, ordenação e gravação de eventos e tarefas |
| `appsscript.json` | Fuso horário, serviço avançado Tasks e escopos OAuth |
| `README.md` | Instalação, configuração e regras de uso |

## Manutenção do ciclo

A janela de datas é deliberadamente explícita para controlar desempenho e manter o AppSheet concentrado no ciclo atual. Ao iniciar um novo ano, atualize `DATA_INICIO` e `DATA_FIM`, salve o script e execute novamente a sincronização.

## Referências

[1]: https://developers.google.com/apps-script/advanced/tasks "Tasks Service | Apps Script"
[2]: https://developers.google.com/workspace/tasks/quickstart/apps-script "Google Apps Script quickstart | Google Tasks"
