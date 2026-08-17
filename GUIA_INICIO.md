# Guia inicial da Auditoria Agenda

Este guia descreve o caminho mínimo para instalar, autorizar e usar a Auditoria Agenda com Google Sheets, Google Apps Script, Google Calendar, Google Tasks e AppSheet.

## Visão geral

A solução importa eventos do Google Calendar e tarefas do Google Tasks para a aba `Página1` de uma planilha. A aba `Sobre` é independente e deve conter somente as informações institucionais do aplicativo. O AppSheet lê essas abas e apresenta os dados em telas separadas.

| Componente | Função |
|---|---|
| Google Calendar | Fonte de eventos únicos e recorrentes |
| Google Tasks | Fonte de tarefas pendentes e concluídas |
| Apps Script | Consulta as fontes e consolida os registros |
| Google Sheets | Armazena os dados na aba `Página1` |
| AppSheet | Exibe, filtra e separa eventos e tarefas |
| Google Cloud | Controla a API Tasks e as permissões OAuth |

## 1. Preparar a planilha

Crie ou utilize uma planilha vinculada à mesma conta Google que possui o calendário e as tarefas. Mantenha uma aba principal chamada exatamente `Página1`. Essa é a aba que o script atualiza automaticamente.

Crie também, se desejar, uma aba chamada `Sobre` com a seguinte estrutura:

| ID | Título | Descrição | Crédito |
|---:|---|---|---|
| 1 | Auditoria Agenda | Eventos e tarefas em um só lugar | Preencher com o nome de quem criou o app |

A aba `Sobre` não deve ser usada como destino da sincronização. O código atual procura a aba `Página1` pelo nome, independentemente da aba que estiver aberta no momento da execução. O campo `Crédito` é preenchido pelo criador do aplicativo e deve usar o nome real de quem desenvolveu ou configurou aquela instalação.

## 2. Copiar os arquivos para o Apps Script

No Apps Script aberto pela planilha, copie `auditoria.gs` para um arquivo terminado em `.gs`, como `Código.gs`, e copie `appsscript.json` para o arquivo de manifesto do projeto.

O arquivo `auditoria.gs` é o código principal. O manifesto deve ser mantido como JSON válido e não deve conter `enabledAdvancedServices` nem depender da presença de `Tasks API` na lista de serviços avançados.

A versão final do código possui estas características importantes:

- grava exclusivamente na aba `Página1`;
- usa a Google Tasks API por chamadas REST autenticadas;
- importa tarefas com e sem prazo, conforme a configuração;
- importa tarefas concluídas quando `INCLUIR_TAREFAS_CONCLUIDAS` está como `true`;
- cria chaves únicas para eventos recorrentes;
- usa `toast` e log em vez de `SpreadsheetApp.getUi().alert`, evitando erro quando o script é executado sem interface aberta.

## 3. Configurar o Google Cloud e o OAuth

Use a mesma conta Google que possui a planilha e as tarefas. A conta do GitHub não participa da autorização.

Para uma conta pessoal, crie um projeto Cloud próprio e associe-o ao Apps Script. No projeto Cloud, configure o Google Auth Platform como aplicativo **Externo**, adicione a própria conta como usuário de teste e inclua os escopos necessários em **Data access**:

```text
https://www.googleapis.com/auth/tasks.readonly
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/spreadsheets
```

Ative a **Google Tasks API** no mesmo projeto Cloud. O `script.external_request` é uma permissão do Apps Script declarada no manifesto e não precisa ser procurada como um serviço separado.

## 4. Executar a primeira sincronização

No Apps Script, selecione `exportarAgendaAuditoria` e clique em **Executar**. Na primeira execução, autorize as permissões solicitadas.

A sincronização deve preencher a linha de cabeçalho da `Página1` com:

```text
Título | Início | Fim | Tipo | Origem | Lista | ID | Status
```

Os registros de eventos terão `Origem = Google Agenda`. Os registros de tarefas terão `Origem = Google Tasks`. A execução pode ser feita com qualquer aba aberta, pois o destino é fixado no código como `Página1`.

Depois da execução, confirme se a aba `Sobre` permaneceu sem registros de eventos ou tarefas. Se ela tiver sido contaminada por uma versão antiga do código, apague as linhas extras e restaure a linha institucional descrita na seção 1.

## 5. Configurar a tabela no AppSheet

No editor do AppSheet, acesse **Data → Tables**, selecione a tabela da `Página1` e clique em **Regenerate structure** ou **Regenerate schema**.

Em **Data → Columns**, confirme:

| Coluna | Configuração |
|---|---|
| `ID` | Tipo Text e coluna-chave (`Key`) |
| `Título` | Tipo Text e coluna de rótulo (`Label`) |
| `Início` | Date ou DateTime |
| `Fim` | Date ou DateTime |
| `Tipo` | Text |
| `Origem` | Text |
| `Lista` | Text |
| `Status` | Text |

Se a tabela `Sobre` foi adicionada ao AppSheet, configure `ID` como chave e crie uma View do tipo `Detail` chamada `Sobre o app`. Mostre nessa tela apenas `Título`, `Descrição` e `Crédito`.

## 6. Separar eventos e tarefas

Crie uma Slice chamada `Eventos` com esta condição:

```appsheet
OR([Tipo] = "Evento único", [Tipo] = "Evento recorrente")
```

Inclua a coluna `ID` na lista de colunas da Slice.

Crie uma Slice chamada `Tarefas` com:

```appsheet
[Tipo] = "Tarefa"
```

Para separar os status, crie também:

```appsheet
AND([Tipo] = "Tarefa", [Status] = "Pendente")
```

```appsheet
AND([Tipo] = "Tarefa", [Status] = "Concluída")
```

Depois acesse **UX → Views** e crie Views do tipo Deck ou Table para `Eventos`, `Tarefas`, `Tarefas pendentes` e `Tarefas concluídas`. Use `Título` como campo principal, `Início` como campo secundário e `Status` ou `Origem` como informação de resumo.

## 7. Personalizar a aparência

Em **UX → Brand** ou **UX → Options**, carregue os assets finais do projeto:

| Asset | Uso |
|---|---|
| `capa_auditoria_agenda_16x9.png` | Capa horizontal com área segura para recorte |
| `capa_auditoria_agenda_safe.png` | Alternativa quadrada com margem interna ampla |
| `icone_auditoria_agenda_final.png` | Logo ou ícone quadrado do aplicativo |

A tela de abertura nativa do AppSheet pode aparecer rapidamente e o seu tempo não é controlado pela imagem. Para manter uma apresentação institucional, use a View `Sobre o app` como primeira opção de navegação, quando essa organização estiver disponível no editor.

## Dificuldades comuns e solução

| Dificuldade | Causa provável | Solução |
|---|---|---|
| `Tasks API` não aparece em Serviços | O serviço avançado não está disponível no projeto | Não adicione o serviço; use o código REST desta versão |
| API Tasks retorna 403 | A Google Tasks API está desativada no projeto Cloud | Ative a API no projeto associado e aguarde a propagação |
| Solicitação de autorização OAuth | O script usa novos escopos ou mudou de projeto Cloud | Revise as permissões com a mesma conta dona da planilha |
| Dados aparecem na aba `Sobre` | Código antigo usava a aba ativa como destino | Substitua pelo `auditoria.gs` final, que fixa `Página1` |
| `Cannot call SpreadsheetApp.getUi()` | Execução sem interface gráfica | Use o arquivo final, que usa `toast` e log |
| AppSheet não carrega | Fórmulas antigas referenciam colunas removidas | Atualize fórmulas para `[Título]`, `[Início]` e `[ID]` |
| Slice não salva | A condição usa `Data de início` ou `Evento` | Use os nomes atuais e inclua `ID` na Slice |
| Chaves duplicadas | Eventos recorrentes compartilhavam o mesmo ID | Execute o código final, que inclui o horário de início na chave |
| Texto da capa é cortado | Imagem fora da área segura ou proporção inadequada | Use a versão 16:9 ou a versão quadrada com margem interna |
| Conta Google aparece no menu | É o menu nativo da sessão do AppSheet | Não pode ser substituído pelo branding; use a View `Sobre o app` para o crédito |

## 8. Manutenção

Para iniciar um novo ciclo de auditoria, altere `DATA_INICIO` e `DATA_FIM` no objeto `CONFIG` do `auditoria.gs`. A data final é exclusiva. Depois salve o código e execute novamente `exportarAgendaAuditoria`.

Não edite manualmente os dados das colunas A:H da `Página1`, pois a sincronização limpa e reescreve essa carga. Mantenha informações institucionais somente na aba `Sobre`.

## Referências oficiais

[1]: https://developers.google.com/workspace/tasks/auth "Choose Google Tasks API scopes"
[2]: https://developers.google.com/workspace/tasks/reference/rest/v1/tasklists/list "Method: tasklists.list"
[3]: https://developers.google.com/apps-script/guides/services/external "External APIs | Apps Script"
[4]: https://developers.google.com/apps-script/reference/script/script-app#getoauthtoken "ScriptApp.getOAuthToken()"
