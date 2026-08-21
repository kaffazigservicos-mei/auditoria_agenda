# Auditoria Agenda

Sistema de consolidação e sincronização bidirecional de **eventos do Google Calendar** e **tarefas do Google Tasks** em uma estrutura do Google Sheets consumida pelo AppSheet.

## Visão geral

A Auditoria Agenda importa Calendar/Tasks para a aba `Página1`, permite editar registros no AppSheet e envia alterações de volta às fontes Google. A aba `Sobre` é institucional e não participa da sincronização.

| Fonte | Tipo | Escrita bidirecional |
|---|---|---|
| Google Calendar | Eventos únicos e recorrentes | Título, início, fim e criação de novos eventos |
| Google Tasks | Tarefas pendentes e concluídas | Título, prazo, status e criação de novas tarefas |
| Google Sheets | `Página1` | Fonte intermediária e snapshot da sincronização |
| AppSheet | Views e edição no celular | Interface operacional |

## Estrutura da Página1

| Coluna | Conteúdo |
|---|---|
| `Título` | Nome do evento ou tarefa |
| `Início` | Início do evento ou prazo da tarefa |
| `Fim` | Fim do evento; vazio para tarefas |
| `Tipo` | `Evento único`, `Evento recorrente` ou `Tarefa` |
| `Origem` | `Google Agenda` ou `Google Tasks` |
| `Lista` | Lista do Google Tasks; vazio para eventos |
| `ID` | Chave externa estável |
| `Status` | `Pendente` ou `Concluída` |

A sincronização grava exclusivamente na aba `Página1`, mesmo que outra aba esteja aberta. A aba `Sobre` deve conter somente `ID`, `Título`, `Descrição` e `Crédito`, preenchido pelo criador de cada instalação.

## Instalação

1. Copie `auditoria.gs` para um arquivo `.gs` no Apps Script.
2. Copie `appsscript.json` para o manifesto do projeto.
3. Associe o Apps Script ao projeto Google Cloud da mesma conta que possui Calendar, Tasks e Sheets.
4. Ative a Google Tasks API.
5. Configure o OAuth como aplicativo externo e adicione a própria conta como usuário de teste.
6. Autorize estes escopos:

```text
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/tasks
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/script.external_request
https://www.googleapis.com/auth/script.scriptapp
```

7. Execute `exportarAgendaAuditoria` uma vez para importar os dados e criar o snapshot inicial.
8. Execute `configurarSincronizacaoAutomatica` uma vez para criar o gatilho periódico de aproximadamente cinco minutos.

O código não depende de `Tasks API` aparecer na lista de Serviços avançados: a leitura e a escrita do Tasks são feitas pela API REST com `UrlFetchApp` e `ScriptApp.getOAuthToken()`.

## Sincronização bidirecional

O script compara cada linha da `Página1` com o último snapshot salvo em `ScriptProperties`. Quando detecta uma alteração feita no AppSheet, envia:

| Registro | Campos enviados |
|---|---|
| Tarefa existente | `Título`, `Início`/prazo e `Status` |
| Evento existente | `Título`, `Início` e `Fim` |
| Nova tarefa | `Título`, `Lista`, prazo e `Status` |
| Novo evento | `Título`, `Início`, `Fim` e `Tipo` |

A exclusão automática está desativada. Apagar uma linha da `Página1` não apaga o objeto no Calendar ou Tasks. Isso evita que uma exclusão acidental no celular destrua dados externos.

A conta que cria o gatilho é a conta que executa a sincronização e precisa ter acesso de escrita às três fontes. Alterações simultâneas devem ser evitadas: a linha alterada no AppSheet será enviada na próxima execução, e depois a fonte será importada novamente.

## AppSheet

Em **Data → Tables**, regenere a estrutura da tabela `Página1`. Configure `ID` como `Key`, `Título` como `Label` e `Status` como `Text` ou `Enum` com os valores `Pendente` e `Concluída`.

Crie as Slices:

**Eventos**

```appsheet
OR([Tipo] = "Evento único", [Tipo] = "Evento recorrente")
```

**Tarefas**

```appsheet
[Tipo] = "Tarefa"
```

**Tarefas pendentes**

```appsheet
AND([Tipo] = "Tarefa", [Status] = "Pendente")
```

**Tarefas concluídas**

```appsheet
AND([Tipo] = "Tarefa", [Status] = "Concluída")
```

Inclua `ID` em todas as Slices e crie Views do tipo Deck ou Table. Para tarefas, mostre `Título`, `Início`, `Lista` e `Status`.

## Assets visuais

| Arquivo | Uso |
|---|---|
| `capa_auditoria_agenda_16x9.png` | Capa horizontal com área segura |
| `capa_auditoria_agenda_safe.png` | Capa quadrada com margens amplas |
| `icone_auditoria_agenda_final.png` | Ícone do aplicativo |

## Testes

O teste isolado está em `test_auditoria_bidirectional.js`. Ele verifica a sintaxe, normalização de status, comparação de linhas, payloads de Tasks, escopos, mutação de eventos e existência do gatilho periódico.

## Dificuldades comuns

| Problema | Solução |
|---|---|
| AppSheet não envia alterações | Substitua o script pelo `auditoria.gs` bidirecional e execute `configurarSincronizacaoAutomatica` |
| Erro 403 ao escrever | Reautorize os escopos `calendar` e `tasks` e confirme a ativação da Google Tasks API |
| Tarefas sem listas de status | Crie as Slices e Views com as expressões acima |
| Status volta ao valor anterior | Aguarde o próximo ciclo e evite editar o mesmo registro simultaneamente no Google e no AppSheet |
| Nova tarefa não é criada | Informe `Tipo = Tarefa`, `Título` e uma `Lista` válida |
| Dados aparecem na aba `Sobre` | Use a versão que fixa o destino em `Página1` |
| Texto da capa é cortado | Use a capa 16:9 ou a versão quadrada segura |

## Arquivos principais

| Arquivo | Finalidade |
|---|---|
| `auditoria.gs` | Sincronização bidirecional e gatilho |
| `appsscript.json` | Escopos OAuth de leitura e escrita |
| `GUIA_INICIO.md` | Guia operacional completo |
| `test_auditoria_bidirectional.js` | Testes da integração bidirecional |
| `APPSHEET_CONFIG_BIDIRECTIONAL.md` | Slices, Views e campos editáveis no AppSheet |
| `README.md` | Referência rápida |

## Referências oficiais

[1]: https://developers.google.com/workspace/calendar/api/v3/reference/events/patch "Google Calendar Events patch"
[2]: https://developers.google.com/workspace/tasks/reference/rest "Google Tasks API REST reference"
[3]: https://developers.google.com/apps-script/guides/triggers/installable "Installable triggers | Apps Script"
[4]: https://developers.google.com/apps-script/guides/services/external "External APIs | Apps Script"
