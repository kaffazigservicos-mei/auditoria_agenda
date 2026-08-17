# Auditoria Agenda

Sistema de consolidação e auditoria de **eventos do Google Calendar** e **tarefas do Google Tasks** em uma única estrutura do Google Sheets, com visualização e filtros no AppSheet.

## Visão geral

A Auditoria Agenda reúne eventos e tarefas em uma carga padronizada. Cada registro recebe título, data, tipo, origem, lista, identificador e status. O AppSheet pode então separar eventos, tarefas pendentes e tarefas concluídas sem misturar as fontes.

A integração com o Google Tasks usa chamadas REST autenticadas por `UrlFetchApp` e `ScriptApp.getOAuthToken()`. Assim, o projeto não depende de o serviço avançado `Tasks API` aparecer na lista de Serviços do Apps Script.

| Fonte | Tipo | Data usada | Status |
|---|---|---|---|
| Google Calendar | Evento único ou Evento recorrente | Início do evento | Pendente |
| Google Tasks | Tarefa | Prazo, quando existir | Pendente ou Concluída |

## Estrutura do Google Sheets

A sincronização grava **exclusivamente na aba `Página1`**, mesmo que outra aba esteja aberta durante a execução. A aba `Sobre` é reservada para informações institucionais e nunca deve ser usada como destino da sincronização.

A primeira linha da `Página1` contém:

| Coluna | Cabeçalho | Conteúdo |
|---|---|---|
| A | `Título` | Nome do evento ou tarefa |
| B | `Início` | Início do evento ou prazo da tarefa |
| C | `Fim` | Fim do evento; vazio para tarefas |
| D | `Tipo` | Evento único, Evento recorrente ou Tarefa |
| E | `Origem` | Google Agenda ou Google Tasks |
| F | `Lista` | Lista do Google Tasks; vazio para eventos |
| G | `ID` | Chave única do registro |
| H | `Status` | Pendente ou Concluída |

A aba institucional `Sobre` pode conter:

| ID | Título | Descrição | Crédito |
|---:|---|---|---|
| 1 | Auditoria Agenda | Eventos e tarefas em um só lugar | Preencher com o nome de quem criou o app |

## Instalação no Apps Script

Abra o Apps Script pela planilha e copie:

| Arquivo do repositório | Destino |
|---|---|
| `auditoria.gs` | Arquivo de código terminado em `.gs`, como `Código.gs` |
| `appsscript.json` | Arquivo de manifesto do projeto |

A versão final do `auditoria.gs` usa `SHEET_NAME: 'Página1'`, cria chaves únicas para eventos recorrentes e evita `SpreadsheetApp.getUi().alert()`. A mensagem de execução é exibida por `toast` quando possível e fica registrada no log quando o script é executado sem interface.

O manifesto não contém `enabledAdvancedServices`. Não é necessário adicionar `Tasks API` em **Serviços**.

## Configuração do ciclo

No início de `auditoria.gs`, ajuste o período conforme a necessidade:

```javascript
var CONFIG = {
  CALENDAR_ID: 'primary',
  DATA_INICIO: new Date('2026-01-01T00:00:00Z'),
  DATA_FIM: new Date('2027-01-01T00:00:00Z'),
  INCLUIR_TAREFAS_SEM_PRAZO: true,
  INCLUIR_TAREFAS_CONCLUIDAS: true,
  TASKS_MAX_RESULTS: 100,
  SHEET_NAME: 'Página1'
};
```

A data final é exclusiva. Para auditar todo o ano de 2027, use `2027-01-01` como início e `2028-01-01` como fim.

## Google Cloud e OAuth

Use a mesma conta Google que possui a planilha, o calendário e as tarefas. A conta do GitHub serve apenas para hospedar o código e não participa da autorização do Google.

Para uma conta pessoal, associe o Apps Script a um projeto Cloud próprio. Configure o Google Auth Platform como aplicativo **Externo**, adicione a própria conta como usuário de teste e inclua os escopos mínimos:

```text
https://www.googleapis.com/auth/tasks.readonly
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/spreadsheets
```

Ative a **Google Tasks API** no mesmo projeto Cloud. O escopo `script.external_request` é usado pelo Apps Script para chamadas externas e já consta no manifesto.

## Primeira execução

Selecione `exportarAgendaAuditoria` no editor do Apps Script e clique em **Executar**. Autorize as permissões solicitadas na primeira execução.

A função percorre as listas e páginas da Google Tasks API, importa os itens válidos e escreve o resultado na `Página1`. A execução pode ocorrer com qualquer aba aberta. Depois, confirme que a aba `Sobre` permaneceu intacta.

Se uma versão antiga tiver inserido dados na aba `Sobre`, apague as linhas extras e restaure a linha institucional indicada neste README antes de continuar.

## Configuração do AppSheet

Em **Data → Tables**, selecione a tabela ligada à `Página1` e clique em **Regenerate structure** ou **Regenerate schema**.

Em **Data → Columns**, configure:

| Coluna | Configuração |
|---|---|
| `ID` | Text e `Key` ligado |
| `Título` | Text e `Label` ligado |
| `Início` | Date ou DateTime |
| `Fim` | Date ou DateTime |
| `Tipo` | Text |
| `Origem` | Text |
| `Lista` | Text |
| `Status` | Text |

### Slices recomendadas

Eventos:

```appsheet
OR([Tipo] = "Evento único", [Tipo] = "Evento recorrente")
```

Todas as tarefas:

```appsheet
[Tipo] = "Tarefa"
```

Tarefas pendentes:

```appsheet
AND([Tipo] = "Tarefa", [Status] = "Pendente")
```

Tarefas concluídas:

```appsheet
AND([Tipo] = "Tarefa", [Status] = "Concluída")
```

Inclua a coluna `ID` em todas as Slices, pois ela é a chave da tabela principal. Crie Views do tipo Deck ou Table para Eventos, Tarefas, Tarefas pendentes e Tarefas concluídas.

### Tela Sobre o app

Adicione a aba `Sobre` como uma tabela no AppSheet e crie uma View do tipo `Detail` chamada `Sobre o app`. Mostre somente `Título`, `Descrição` e `Crédito`. O campo `Crédito` deve ser preenchido pelo próprio criador do aplicativo, por exemplo `Criado por [nome do criador]`. Não use uma atribuição fixa à Kaffa Zig.

A conta Google exibida no menu nativo do AppSheet é parte da sessão autenticada da plataforma e não pode ser substituída pelo branding. O crédito personalizado deve aparecer na View `Sobre o app` ou em uma tela institucional própria.

## Identidade visual

Os assets finais estão no repositório:

| Arquivo | Uso |
|---|---|
| `capa_auditoria_agenda_16x9.png` | Capa horizontal com área segura contra recortes |
| `capa_auditoria_agenda_safe.png` | Capa quadrada com margens internas amplas |
| `icone_auditoria_agenda_final.png` | Logo ou ícone quadrado do aplicativo |

Use a capa no campo de imagem de abertura/marca e o ícone no campo de logo. A tela de abertura nativa do AppSheet aparece rapidamente; para manter uma apresentação institucional depois da abertura, use a View `Sobre o app` como primeira opção de navegação quando essa organização estiver disponível no editor.

## Dificuldades comuns

| Problema | Causa | Solução |
|---|---|---|
| `Tasks API` não aparece em Serviços | Serviço avançado indisponível no projeto | Não adicione o serviço; use a integração REST desta versão |
| Erro 403 da Google Tasks API | API desativada no projeto Cloud | Ative a Google Tasks API no projeto associado |
| Nova autorização OAuth | Escopos ou projeto Cloud foram alterados | Autorize usando a conta dona da planilha |
| Dados aparecem na aba `Sobre` | Código antigo usava a aba ativa | Substitua pelo `auditoria.gs` final, que fixa `Página1` |
| `Cannot call SpreadsheetApp.getUi()` | Execução sem interface | Use o `auditoria.gs` final, que usa `toast` e log |
| AppSheet não carrega | Fórmulas antigas referenciam nomes removidos | Use `[Título]`, `[Início]` e `[ID]` |
| Slice não salva | Filtro usa `Data de início` ou `Evento` | Use os nomes atuais e inclua `ID` na Slice |
| IDs duplicados | Eventos recorrentes compartilhavam o mesmo ID | Execute o código final, que inclui o horário de início na chave |
| Texto da capa é cortado | Proporção ou margem inadequada | Use `capa_auditoria_agenda_16x9.png` ou `capa_auditoria_agenda_safe.png` |

## Arquivos do projeto

| Arquivo | Finalidade |
|---|---|
| `auditoria.gs` | Extração, consolidação, ordenação e gravação segura |
| `appsscript.json` | Escopos OAuth e configuração do Apps Script |
| `README.md` | Visão geral e referência rápida |
| `GUIA_INICIO.md` | Passo a passo de instalação e uso |
| `APRESENTACAO_LINKEDIN.md` | Texto pronto para publicação no LinkedIn |
| `apresentacao_filminho.md` | Roteiro textual da apresentação em slides |
| `apresentacao_filminho/` | Projeto visual da apresentação em formato filminho |
| `test_auditoria_tasks_rest.js` | Teste isolado da integração REST |
| `capa_auditoria_agenda_16x9.png` | Capa visual horizontal |
| `capa_auditoria_agenda_safe.png` | Capa visual quadrada segura |
| `icone_auditoria_agenda_final.png` | Ícone visual do aplicativo |

## Referências oficiais

[1]: https://developers.google.com/workspace/tasks/auth "Choose Google Tasks API scopes"
[2]: https://developers.google.com/workspace/tasks/reference/rest/v1/tasklists/list "Method: tasklists.list"
[3]: https://developers.google.com/apps-script/guides/services/external "External APIs | Apps Script"
[4]: https://developers.google.com/apps-script/reference/script/script-app#getoauthtoken "ScriptApp.getOAuthToken()"
