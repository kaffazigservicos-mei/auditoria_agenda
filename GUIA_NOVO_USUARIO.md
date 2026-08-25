# Como criar sua própria Auditoria Agenda

Este guia explica como montar uma instalação pessoal da **Auditoria Agenda** usando Google Sheets, Google Calendar, Google Tasks, Google Apps Script e AppSheet.

> O objetivo é colocar eventos e tarefas em um só aplicativo. O código não contém seus eventos, suas tarefas, sua senha ou suas credenciais. Cada usuário deve instalar o projeto na própria conta Google.

## Antes de começar

Você precisa ter:

| Item | Para que serve |
|---|---|
| Uma conta Google | É a conta que autorizará todos os acessos |
| Google Calendar | Fonte dos eventos |
| Google Tasks | Fonte das tarefas |
| Google Sheets | Tabela intermediária chamada `Página1` |
| Google Apps Script | Programa que faz a sincronização |
| AppSheet | Aplicativo para usar no celular |
| Aproximadamente 30 a 60 minutos | Tempo para a primeira configuração |

Use a **mesma conta Google** para a planilha, o Calendar, o Tasks e o Apps Script. A conta do GitHub serve somente para copiar o código; ela não precisa ser a mesma conta Google.

### Importante sobre segurança e plano gratuito

Na versão gratuita do AppSheet usada neste projeto, **não é possível exigir login obrigatório dos usuários do aplicativo**. Isso significa que não há autenticação individual garantida dentro do app.

Para reduzir o risco, mantenha a planilha com acesso **Restrito**, compartilhe o link do AppSheet somente com pessoas de confiança e use o app apenas para dados pessoais de baixo risco ou dados que não sejam confidenciais. Não coloque senhas, tokens, documentos pessoais, dados financeiros ou informações sensíveis no app.

O repositório público do GitHub contém código e documentação, mas não contém automaticamente os dados da sua conta Google. A conta que instala e autoriza o projeto é a responsável pelos acessos.

## Passo 1 — Copiar o projeto

Abra o repositório:

[github.com/kaffazigservicos-mei/auditoria_agenda](https://github.com/kaffazigservicos-mei/auditoria_agenda)

Baixe ou abra estes dois arquivos:

```text
auditoria.gs
appsscript.json
```

Não compartilhe arquivos que contenham tokens, senhas ou dados pessoais. O repositório contém apenas o código e materiais de configuração; seus eventos e tarefas permanecem na sua conta Google.

## Passo 2 — Criar a planilha

1. Abra [Google Sheets](https://sheets.google.com).
2. Crie uma planilha em branco.
3. Dê um nome, por exemplo, `Minha Auditoria Agenda`.
4. Renomeie a primeira aba para exatamente:

```text
Página1
```

5. Na linha 1, coloque estes cabeçalhos, um em cada coluna:

| Coluna | Cabeçalho |
|---|---|
| A | `Título` |
| B | `Início` |
| C | `Fim` |
| D | `Tipo` |
| E | `Origem` |
| F | `Lista` |
| G | `ID` |
| H | `Status` |

Não troque os nomes, não acrescente acentos diferentes e não coloque espaços extras.

Você pode criar uma aba chamada `Sobre`, mas ela é apenas institucional. O script de sincronização grava os dados operacionais somente em `Página1`.

## Passo 3 — Abrir o Apps Script

1. Na planilha, clique em **Extensões → Apps Script**.
2. O Google abrirá um projeto ligado à planilha.
3. No arquivo de código que termina em `.gs`, apague o código antigo, se houver.
4. Copie todo o conteúdo de `auditoria.gs` do repositório e cole no arquivo `.gs`.
5. Clique em **Salvar**.

O nome visual do arquivo pode ser `Código.gs` ou outro nome. O importante é que o conteúdo seja o arquivo `auditoria.gs` completo.

## Passo 4 — Copiar o manifesto

O manifesto é o arquivo que informa ao Google quais permissões o projeto precisa.

1. No Apps Script, abra **Project Settings/Configurações do projeto**.
2. Ative a opção **Show appsscript.json manifest file in editor**, se ela estiver desligada.
3. Abra o arquivo `appsscript.json`.
4. Substitua o conteúdo pelo arquivo `appsscript.json` do repositório.
5. Clique em **Salvar**.

Não cole o manifesto dentro do arquivo `.gs`. São dois arquivos diferentes:

| Arquivo | Onde colocar |
|---|---|
| `auditoria.gs` | Arquivo de código `.gs` |
| `appsscript.json` | Arquivo de manifesto `appsscript.json` |

## Passo 5 — Ativar a Google Tasks API

A integração com o Google Tasks usa uma chamada REST autenticada. Por isso, talvez seja necessário ativar a API no projeto Google Cloud. Não é necessário procurar `Tasks API` em **Serviços avançados** do Apps Script.

1. No Apps Script, abra **Project Settings/Configurações do projeto**.
2. Localize o projeto Google Cloud associado ao Apps Script.
3. Abra o projeto nessa conta Google.
4. No Google Cloud, abra **APIs e serviços → Biblioteca**.
5. Procure por **Google Tasks API**.
6. Clique em **Ativar**.

Se o Google pedir um projeto, escolha o projeto associado a este Apps Script. Não escolha o repositório do GitHub e não use o projeto de outra pessoa.

## Passo 6 — Autorizar o projeto

A primeira execução solicitará acesso a Calendar, Tasks e Sheets.

1. Volte ao Apps Script.
2. No seletor de funções, escolha `exportarAgendaAuditoria`.
3. Clique em **Executar**.
4. Escolha a sua conta Google.
5. Leia as permissões e clique em **Permitir**.

Se aparecer uma tela dizendo que o aplicativo não foi verificado, isso pode acontecer porque o projeto é uma instalação pessoal. Confirme que o endereço e o projeto são seus. Só prossiga se reconhecer o projeto que acabou de criar; nunca autorize um projeto desconhecido.

A conta que autoriza deve ter acesso de edição à própria planilha, ao próprio Calendar e ao próprio Tasks.

## Passo 7 — Conferir a primeira sincronização

Depois da execução, volte à planilha e abra a aba `Página1`.

Os dados devem aparecer com estes valores:

| Tipo de registro | `Tipo` | `Origem` | `ID` |
|---|---|---|---|
| Evento | `Evento único` ou `Evento recorrente` | `Google Agenda` | Começa com `EVENTO|` |
| Tarefa | `Tarefa` | `Google Tasks` | Começa com `TAREFA|` |

Se não houver eventos ou tarefas, confira primeiro se eles existem na mesma conta Google que autorizou o Apps Script.

A mensagem final deve informar quantos eventos e tarefas foram importados. Se aparecer `As tarefas não foram importadas`, copie a mensagem completa antes de alterar qualquer coisa.

## Passo 8 — Configurar o AppSheet

1. Abra [AppSheet](https://www.appsheet.com).
2. Crie um app a partir da planilha criada no Passo 2.
3. Escolha a aba `Página1` como tabela.
4. Em **Data → Tables**, selecione `Página1` e use **Regenerate structure** ou **Regenerate schema**.
5. Em **Data → Columns**, configure:

| Coluna | Configuração |
|---|---|
| `ID` | Tipo `Text`; `Key` ligado |
| `Título` | Tipo `Text`; `Label` ligado |
| `Início` | `Date` ou `DateTime` |
| `Fim` | `Date` ou `DateTime` |
| `Tipo` | `Text` ou `Enum` |
| `Origem` | `Text` |
| `Lista` | `Text` |
| `Status` | `Text` ou `Enum` com `Pendente` e `Concluída` |

Não crie uma fórmula que substitua o valor importado de `ID`.

## Passo 9 — Criar as Slices

Em **Data → Slices**, crie estas Slices. Em todas elas, inclua `ID` e `_RowNumber` nas colunas da Slice.

### Eventos atuais e futuros

Use o nome técnico `Eventos` e a condição:

```appsheet
AND(
  [Tipo] = "Evento único",
  [Início] >= TODAY(),
  [Início] >= DATE("2026-08-01")
)
```

Essa Slice mostra somente eventos únicos com início a partir de hoje e a partir de 1º de agosto de 2026. A data `TODAY()` muda automaticamente conforme o dia em que o app é usado.

### Configuração atual e atualização para os próximos exercícios

A versão publicada está preparada para o exercício de **2026**. O Apps Script importa o período de 1º de janeiro a 31 de dezembro de 2026, e a Slice acima limita a View aos eventos únicos de 1º de agosto de 2026 em diante, desde que também ocorram a partir de hoje.

Para continuar usando o app no próximo exercício, por exemplo 2027:

1. Abra `auditoria.gs`.
2. Troque `DATA_INICIO` para `2027-01-01T00:00:00Z`.
3. Troque `DATA_FIM` para `2028-01-01T00:00:00Z`.
4. Na Slice `Eventos`, troque `DATE("2026-08-01")` por `DATE("2027-08-01")`.
5. Salve o Apps Script e o AppSheet.
6. Execute `exportarAgendaAuditoria` manualmente uma vez.
7. No celular, toque em `Sync`.
8. Faça um teste com um evento e uma tarefa.

Exemplo para 2027 no Apps Script:

```javascript
DATA_INICIO: new Date('2027-01-01T00:00:00Z'),
DATA_FIM: new Date('2028-01-01T00:00:00Z')
```

Exemplo para 2027 na Slice:

```appsheet
AND(
  [Tipo] = "Evento único",
  [Início] >= TODAY(),
  [Início] >= DATE("2027-08-01")
)
```

A data final do Apps Script é exclusiva. Portanto, para cada exercício, use o primeiro dia do ano seguinte como `DATA_FIM`.

Se a coluna `Início` for `DateTime`, a comparação continua funcionando. Se ela for `Text`, altere o tipo da coluna para `Date` ou `DateTime` antes de testar.

### Todos os eventos

Se quiser manter uma lista separada com eventos únicos e recorrentes, crie outra Slice, por exemplo `Todos_Eventos`, com:

```appsheet
OR([Tipo] = "Evento único", [Tipo] = "Evento recorrente")
```

### Todas as tarefas

```appsheet
[Tipo] = "Tarefa"
```

### Tarefas pendentes

```appsheet
AND([Tipo] = "Tarefa", [Status] = "Pendente")
```

### Tarefas concluídas

```appsheet
AND([Tipo] = "Tarefa", [Status] = "Concluída")
```

O `=` que aparece no início do campo de fórmula é apenas o marcador visual do AppSheet. Não é necessário removê-lo.

## Passo 10 — Criar as Views

Em **UX → Views** ou **App → Views**, crie estas Views:

| Nome exibido | For this data | Posição sugerida |
|---|---|---|
| `Eventos atuais e futuros` | `Eventos` | `Primary` |
| `Tarefas pendentes` | `Tarefas_Pendentes` | `Primary` ou Menu |
| `Tarefas concluídas` | `Tarefas_Concluidas` | `Primary` ou Menu |
| `Tarefas` | `Tarefas` | Menu |

Use o tipo de View `Deck` ou `Table`. Mostre `Título`, `Início`, `Lista` e `Status`. Não use `ID` como título visível; ele é uma chave técnica.

## Passo 11 — Salvar e atualizar o celular

1. No editor do AppSheet, clique em **Save**.
2. Se o app pedir uma verificação de implantação, abra **Manage → Deploy** e conclua a verificação.
3. No celular, abra o mesmo aplicativo criado no Passo 8.
4. Toque em **Sync** ou no ícone de sincronização.
5. Aguarde o fim da sincronização.
6. Feche e abra o app novamente.

O celular mantém uma cópia local da definição e dos dados. Por isso, salvar no computador não basta: é necessário executar o Sync no celular.

Se o nome antigo continuar na barra inferior, verifique se a View está com `Position = Primary`, se o nome foi salvo e se o celular abriu o mesmo app, e não um link antigo ou uma cópia.

## Passo 12 — Ativar a sincronização automática

Depois de a primeira sincronização funcionar:

1. Abra o Apps Script.
2. No seletor de funções, escolha `configurarSincronizacaoAutomatica`.
3. Clique em **Executar** uma vez.
4. Autorize a criação do gatilho, se solicitado.
5. No menu lateral do Apps Script, abra **Gatilhos**.
6. Confirme uma única linha para `exportarAgendaAuditoria`, com origem **Baseado em tempo** e intervalo **A cada 5 minutos**.

O intervalo é aproximado. O gatilho executa na conta que o criou, por isso essa conta precisa ter acesso de edição à planilha, ao Calendar e ao Tasks.

## Passo 13 — Fazer um teste seguro

Não comece pelos seus registros mais importantes. Use um evento e uma tarefa de teste.

### Teste de evento

1. Na `Página1`, escolha um evento existente com `ID` iniciado por `EVENTO|`.
2. Altere o título para `TESTE BIDIRECIONAL CALENDAR`.
3. Execute `exportarAgendaAuditoria` manualmente.
4. Confira o título no Google Calendar.
5. Altere o título diretamente no Calendar para `TESTE RETORNO CALENDAR`.
6. Execute novamente o script.
7. Confira o retorno do novo título para a `Página1` e para o AppSheet.

### Teste de tarefa

1. Escolha uma tarefa com `ID` iniciado por `TAREFA|`.
2. Altere o `Status` para `Concluída` na `Página1` ou no AppSheet.
3. Execute `exportarAgendaAuditoria`.
4. Confirme a tarefa como concluída no Google Tasks.
5. Marque-a novamente como pendente no Google Tasks.
6. Execute a sincronização e confirme o retorno para `Página1`.

Não apague linhas durante o teste. A versão atual não apaga automaticamente objetos do Calendar ou do Tasks.

## Problemas comuns

| Problema | O que verificar |
|---|---|
| Tarefas não aparecem em `Página1` | Google Tasks API ativada, mesma conta Google, autorização e mensagem de execução |
| Tarefas concluídas aparecem na View geral | Isso é esperado na Slice `Tarefas`; use `Tarefas pendentes` para ocultá-las |
| Tarefas concluídas aparecem em `Tarefas pendentes` | Condição deve ser `AND([Tipo] = "Tarefa", [Status] = "Pendente")` |
| Eventos aparecem no computador, mas não no celular | Toque em `Sync`, feche/reabra o app e confirme que é o mesmo app |
| Nome antigo na barra inferior | Salve a View, mantenha `Position = Primary` e execute `Sync` no celular |
| Apps Script mostra erro 403 | Reautorize Calendar/Tasks e confirme a ativação da Google Tasks API |
| Evento não atualiza | Não altere o `ID`; confirme `Início`, `Fim` e o calendário correto |
| Dados aparecem em `Sobre` | O script correto grava somente em `Página1`; substitua o código antigo |
| Execução automática não aparece | Execute `configurarSincronizacaoAutomatica` uma vez e confira **Gatilhos** |

## Segurança e limitações do plano gratuito

Na versão gratuita do AppSheet utilizada neste projeto, **não é possível exigir login obrigatório dos usuários do aplicativo**. Portanto, não considere que o app oferece autenticação individual ou controle de acesso por usuário.

Use estas medidas de redução de risco:

- mantenha a planilha Google Sheets com acesso **Restrito**;
- compartilhe o link do AppSheet somente com pessoas de confiança;
- use o app para uso pessoal ou para dados que não sejam sensíveis;
- não coloque senhas, tokens, documentos pessoais, dados financeiros ou informações confidenciais no app;
- nunca publique eventos, tarefas, chaves ou arquivos de credenciais no GitHub.

Um repositório público contém o código, mas não concede automaticamente acesso à sua planilha, ao Calendar ou ao Tasks. O acesso depende das autorizações concedidas pela conta que instala o Apps Script. Para dados sensíveis ou uso com pessoas não confiáveis, será necessária uma solução com autenticação individual compatível com a política de segurança desejada.

Se precisar interromper a automação, abra **Apps Script → Gatilhos** e exclua o gatilho de `exportarAgendaAuditoria`.

## Referências oficiais

[1]: https://support.google.com/appsheet/answer/10108301?hl=pt-BR — AppSheet: sincronização entre app e backend.

[2]: https://support.google.com/appsheet/answer/10104495?hl=pt-BR — AppSheet: implantação do aplicativo.

[3]: https://developers.google.com/apps-script/guides/triggers/installable — Google Apps Script: gatilhos instaláveis.

[4]: https://developers.google.com/workspace/tasks/reference/rest — Google Tasks API: referência REST.

[5]: https://developers.google.com/apps-script/reference/calendar/calendar-event — Google Apps Script: CalendarEvent.
