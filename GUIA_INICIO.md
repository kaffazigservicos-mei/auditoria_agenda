# Guia inicial — Auditoria Agenda

Este guia descreve a instalação, a autorização e o uso da Auditoria Agenda com Google Sheets, Google Apps Script, Google Calendar, Google Tasks e AppSheet. A versão atual possui **sincronização bidirecional**: importa alterações feitas nas fontes Google e envia de volta alterações feitas pelo AppSheet na aba `Página1`.

## 1. Como o fluxo funciona

| Componente | Função |
|---|---|
| Google Calendar | Fonte e destino de eventos únicos e recorrentes |
| Google Tasks | Fonte e destino de tarefas pendentes e concluídas |
| Apps Script | Compara a Página1 com o último snapshot, grava alterações nas fontes e importa o estado atualizado |
| Google Sheets | Mantém a tabela operacional na aba `Página1` |
| AppSheet | Permite consultar e editar eventos e tarefas no celular |
| Google Cloud | Controla as APIs e as permissões OAuth |

A sincronização usa `ID` como chave externa. Eventos usam o formato `EVENTO|id|início`; tarefas usam `TAREFA|lista|id`. A aba `Sobre` é independente e nunca é usada como destino dos dados operacionais.

## 2. Preparar a planilha

Use uma planilha vinculada à mesma conta Google que possui o calendário e as tarefas. Mantenha uma aba principal chamada exatamente `Página1`.

Crie, se desejar, uma aba `Sobre` com esta estrutura:

| ID | Título | Descrição | Crédito |
|---:|---|---|---|
| 1 | Auditoria Agenda | Eventos e tarefas em um só lugar | Preencher com o nome de quem criou o app |

A aba `Sobre` deve conter somente informações institucionais. Se uma versão antiga do script inseriu dados nessa aba, apague as linhas extras e restaure a estrutura acima.

## 3. Copiar os arquivos para o Apps Script

Abra o Apps Script pela planilha e copie:

| Arquivo | Destino |
|---|---|
| `auditoria.gs` | Arquivo de código terminado em `.gs`, como `Código.gs` |
| `appsscript.json` | Arquivo de manifesto do projeto |

O manifesto atual não depende da presença de `Tasks API` na lista de serviços avançados. Ele usa chamadas REST autenticadas.

## 4. Configurar o Google Cloud e o OAuth

Use a mesma conta Google que possui a planilha, o calendário e as tarefas. A conta do GitHub serve apenas para hospedar o código.

Na versão gratuita do AppSheet utilizada neste projeto, **não é possível exigir login obrigatório dos usuários do aplicativo**. Portanto, não há autenticação individual garantida dentro do app. Mantenha a planilha com acesso **Restrito**, compartilhe o link somente com pessoas de confiança e não coloque no app senhas, tokens, documentos pessoais, dados financeiros ou outras informações confidenciais.

Para uma conta pessoal, associe o Apps Script ao projeto Cloud que você controla, configure o aplicativo OAuth como **Externo**, adicione sua própria conta como usuário de teste e ative a Google Tasks API.

Os escopos de escrita necessários são:

```text
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/tasks
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/script.external_request
https://www.googleapis.com/auth/script.scriptapp
```

Na primeira execução, autorize novamente, pois a versão bidirecional substitui os escopos `readonly` por escopos de escrita.

## 5. Fazer a primeira sincronização

No Apps Script, selecione `exportarAgendaAuditoria` e clique em **Executar**. A primeira execução deve ser feita manualmente para autorizar a conta e criar o snapshot inicial.

A `Página1` deverá conter:

```text
Título | Início | Fim | Tipo | Origem | Lista | ID | Status
```

Os registros de eventos terão `Origem = Google Agenda`. Os registros de tarefas terão `Origem = Google Tasks`. A execução pode ocorrer com qualquer aba aberta, pois o destino é fixado como `Página1`.

É importante executar uma segunda vez somente depois de confirmar que os dados foram importados. O primeiro snapshot serve como base de comparação; alterações feitas depois disso serão enviadas às fontes.

## 6. Ativar a sincronização automática

Depois da primeira sincronização, execute uma vez a função:

```text
configurarSincronizacaoAutomatica
```

Essa função cria um gatilho de tempo de aproximadamente cinco minutos para executar `exportarAgendaAuditoria`. O gatilho é criado sob a conta que o configura; essa conta precisa ter acesso de escrita ao Calendar, Tasks e Sheets.

O Apps Script também oferece gatilhos de edição, mas chamadas feitas por scripts ou APIs não disparam automaticamente um gatilho de edição. Por isso, nesta versão, o gatilho periódico é a opção mais previsível para detectar alterações do AppSheet.

## 7. O que pode ser editado no AppSheet

As alterações abaixo são enviadas de volta na próxima execução:

| Tipo | Campos sincronizados |
|---|---|
| Tarefa existente | `Título`, `Início`/prazo e `Status` |
| Evento existente | `Título`, `Início` e `Fim` |
| Nova tarefa | `Título`, `Lista`, `Início`/prazo e `Status` |
| Novo evento | `Título`, `Início`, `Fim` e `Tipo` |

Para criar uma tarefa, o registro novo precisa ter `Tipo = Tarefa`, `Título` e uma `Lista` válida. Se a lista estiver vazia, o script usa a primeira lista do Google Tasks. Para escolher uma lista fixa, preencha `DEFAULT_TASK_LIST_ID` no objeto `CONFIG`.

Para criar um evento, use `Tipo = Evento único`, preencha `Título` e `Início`; se `Fim` ficar vazio, será usado um intervalo padrão de uma hora.

A exclusão de linhas não apaga automaticamente os objetos no Google. Essa proteção evita que uma exclusão acidental no celular destrua eventos ou tarefas. Para excluir na fonte, use o Calendar ou o Tasks diretamente.

## 8. Configurar o AppSheet

No editor do AppSheet, acesse **Data → Tables**, selecione a tabela ligada à `Página1` e clique em **Regenerate structure** ou **Regenerate schema**.

Em **Data → Columns**, confirme:

| Coluna | Configuração |
|---|---|
| `ID` | Tipo `Text` e `Key` ligado |
| `Título` | Tipo `Text` e `Label` ligado |
| `Início` | `Date` ou `DateTime` |
| `Fim` | `Date` ou `DateTime` |
| `Tipo` | `Text` ou `Enum` |
| `Origem` | `Text` |
| `Lista` | `Text` |
| `Status` | `Text` ou `Enum` com `Pendente` e `Concluída` |

Não configure uma fórmula que substitua o `ID` importado. Para linhas novas, o AppSheet pode usar `UNIQUEID()` como valor inicial; depois da sincronização o script importará o ID externo definitivo.

## 9. Criar as Slices e Views de status

Crie uma Slice `Eventos` para a View **Eventos atuais e futuros** com:

```appsheet
AND(
  [Tipo] = "Evento único",
  [Início] >= TODAY(),
  [Início] >= DATE("2026-08-01")
)
```

Essa é a configuração publicada para o exercício de **2026**: mostra eventos únicos a partir de hoje e a partir de 1º de agosto de 2026. Se quiser uma lista adicional com todos os eventos únicos e recorrentes, crie outra Slice, por exemplo `Todos_Eventos`, usando:

```appsheet
OR([Tipo] = "Evento único", [Tipo] = "Evento recorrente")
```

Crie uma Slice `Tarefas` com:

```appsheet
[Tipo] = "Tarefa"
```

Crie as duas Slices de status:

```appsheet
AND([Tipo] = "Tarefa", [Status] = "Pendente")
```

```appsheet
AND([Tipo] = "Tarefa", [Status] = "Concluída")
```

Em todas as Slices inclua obrigatoriamente a coluna `ID`, pois ela é a chave da tabela principal. Em **UX → Views** ou **App → Views**, crie Views do tipo Deck ou Table para `Eventos`, `Tarefas`, `Tarefas pendentes` e `Tarefas concluídas`. Use `Título` como cabeçalho, `Início` como informação secundária e `Status` ou `Origem` como resumo.

## 10. Permitir a criação de eventos e tarefas pelo celular

Para o botão `+` abrir um formulário com campos preenchíveis, abra **Data → Tables → Página1** e clique no ícone de **Table settings** no cabeçalho da tabela. Dentro dele, configure **Are updates allowed?** como `ADDS_AND_UPDATES` ou `ALL_CHANGES`. No novo editor, essa opção não aparece diretamente na lista de tabelas. Não use `UPDATES_ONLY` nem `READ_ONLY`.

Em **Data → Columns → Página1**, deixe **Show?** e **Editable?** ligados para `Título`, `Tipo`, `Início`, `Fim`, `Lista` e `Status`. Mantenha `ID`, `_RowNumber` e `Origem` ocultos e não editáveis.

O formulário deve apresentar, preferencialmente, estes campos nesta ordem:

```text
Título
Tipo
Início
Fim
Lista
Status
```

Para criar um evento, escolha `Tipo = Evento único`, preencha `Título` e `Início` e, se quiser, `Fim`. Para criar uma tarefa, escolha `Tipo = Tarefa`, preencha `Título` e `Lista` e, se quiser, `Início` e `Status`. A Slice usada pela View também precisa conter esses campos.

Se o botão `+` abrir uma tela vazia, verifique se a tabela ou a Slice está em modo somente leitura, se existe `Editable_If = FALSE` ou se os campos foram retirados da Slice. Depois de salvar o editor, toque em `Sync` no celular. Veja o procedimento completo em [`GUIA_CORRIGIR_FORMULARIO_APPSHEET.md`](GUIA_CORRIGIR_FORMULARIO_APPSHEET.md).

## 11. Configurar a página Sobre

Adicione a aba `Sobre` como tabela no AppSheet e crie uma View do tipo `Detail` chamada `Sobre o app`. Mostre apenas `Título`, `Descrição` e `Crédito`. O campo `Crédito` deve ser preenchido pelo criador da instalação, por exemplo `Criado por [nome do criador]`.

A conta Google exibida no menu nativo do AppSheet pertence à sessão autenticada e não pode ser substituída pelo branding.

## 12. Política de conflito

A sincronização trabalha com o último snapshot salvo pelo script. Se uma linha for alterada no AppSheet, essa versão será enviada à fonte na execução seguinte. Depois, a fonte será lida novamente e a `Página1` será reconstruída com o estado confirmado.

Se alguém alterar diretamente Calendar ou Tasks antes da próxima execução, a alteração externa será importada. Se o AppSheet e a fonte forem alterados entre duas execuções, a alteração detectada na `Página1` será enviada nesta execução; por isso, evite editar simultaneamente o mesmo registro nos dois lugares.

## 13. Dificuldades comuns

| Problema | Causa provável | Solução |
|---|---|---|
| AppSheet edita, mas Calendar/Tasks não mudam | Código antigo era somente leitura ou o gatilho não foi criado | Copie o `auditoria.gs` bidirecional e execute `configurarSincronizacaoAutomatica` |
| Erro 403 ao atualizar | Escopo `calendar`/`tasks` ou API não autorizados | Reautorize o Apps Script e ative a Google Tasks API |
| Tarefas não aparecem | Slice ou View não foi criada, ou `Status` tem valor diferente | Regenere a estrutura e use exatamente `Pendente`/`Concluída` |
| Status muda no AppSheet, mas volta | O ciclo ainda não executou ou há edição simultânea | Aguarde a próxima execução e evite alterar o mesmo item em dois lugares |
| Nova tarefa não é criada | `Tipo` ou `Lista` inválidos | Use `Tipo = Tarefa`, título e uma lista válida |
| Nova tarefa aparece duplicada | O script foi executado duas vezes antes de importar o novo ID | Aguarde uma sincronização completa antes de repetir |
| Evento não é atualizado | ID antigo, calendário diferente ou data inválida | Confirme `CALENDAR_ID`, `Início` e `Fim` |
| Dados aparecem na aba `Sobre` | Código antigo usava a aba ativa | Use a versão que fixa `Página1` |
| AppSheet não carrega | Fórmulas antigas referenciam nomes removidos | Use `[Título]`, `[Início]` e `[ID]` |
| Login obrigatório não aparece | O plano gratuito não oferece essa exigência | Mantenha a planilha restrita, limite o compartilhamento e não use dados sensíveis |
| Eventos do próximo exercício não aparecem | O período do Apps Script ou a Slice ainda está configurado para 2026 | Atualize `DATA_INICIO` e `DATA_FIM`; nos próximos exercícios, use somente `[Início] >= TODAY()` na Slice |
| Texto da capa é cortado | Imagem fora da área segura | Use `capa_auditoria_agenda_16x9.png` ou `capa_auditoria_agenda_safe.png` |

## 14. Manutenção e atualização para os próximos exercícios

A versão atual está configurada para o exercício de **2026** e para eventos únicos a partir de **1º de agosto de 2026**. Esse corte de agosto é exclusivo de 2026. Para continuar usando o app em um próximo exercício, a importação deve começar em janeiro e a View deve mostrar eventos únicos a partir de hoje; atualize os dois lugares abaixo.

No `auditoria.gs`, altere o período. Para 2027, por exemplo:

```javascript
DATA_INICIO: new Date('2027-01-01T00:00:00Z'),
DATA_FIM: new Date('2028-01-01T00:00:00Z')
```

Na Slice `Eventos`, remova a condição fixa `DATE("2026-08-01")` e mantenha somente a regra `[Início] >= TODAY()`. Depois salve o Apps Script e o AppSheet, execute `exportarAgendaAuditoria` manualmente uma vez e toque em `Sync` no celular. A data final é exclusiva; sempre use o primeiro dia do ano seguinte.

Evite editar diretamente muitas linhas na `Página1`. Prefira o AppSheet para alterações individuais. Não apague linhas para excluir objetos Google, porque a exclusão automática está desativada por segurança.

Se precisar interromper a automação, abra **Apps Script → Triggers** e exclua o gatilho de `exportarAgendaAuditoria`.

## Referências oficiais

[1]: https://developers.google.com/workspace/calendar/api/v3/reference/events/patch "Google Calendar Events patch"
[2]: https://developers.google.com/workspace/tasks/reference/rest "Google Tasks API REST reference"
[3]: https://developers.google.com/apps-script/guides/triggers/installable "Installable triggers | Apps Script"
[4]: https://developers.google.com/apps-script/guides/services/external "External APIs | Apps Script"
