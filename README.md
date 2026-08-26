# Auditoria Agenda

A **Auditoria Agenda** reúne eventos do Google Calendar e tarefas do Google Tasks em uma planilha Google Sheets consumida pelo AppSheet. A solução foi organizada para oferecer uma visão operacional no computador e no celular, com sincronização bidirecional e separação visual entre eventos, tarefas pendentes e tarefas concluídas.

> O projeto contém código e documentação de configuração. Ele não contém os eventos, as tarefas, as senhas ou as credenciais Google de cada instalação.

## O que o sistema faz

| Componente | Função | Fluxo |
|---|---|---|
| Google Calendar | Eventos únicos e recorrentes | Lê e recebe alterações de título, início, fim e novos eventos |
| Google Tasks | Tarefas pendentes e concluídas | Lê e recebe alterações de título, prazo, status e novas tarefas |
| Google Sheets | Aba operacional `Página1` | Intermedia o fluxo e guarda o snapshot da última sincronização |
| AppSheet | Aplicativo para computador e celular | Exibe, filtra e permite editar registros |
| Apps Script | Motor da integração | Compara, grava nas fontes e importa o estado atualizado |

## Fluxo bidirecional

```text
Google Calendar ─┐
                 ├─ Apps Script ─ Google Sheets / Página1 ─ AppSheet
Google Tasks ────┘                       ▲                    │
                                         └── alterações ──────┘
```

O script primeiro compara a `Página1` com o último snapshot salvo em `ScriptProperties`. Se detectar uma alteração feita no Sheets ou no AppSheet, envia a mudança ao Calendar ou ao Tasks. Em seguida, importa novamente o estado das fontes para confirmar o resultado.

A exclusão automática está desativada por segurança. Apagar uma linha da `Página1` não apaga o evento ou a tarefa na fonte Google.

## Estrutura da aba `Página1`

A aba principal deve se chamar exatamente `Página1` e conter estes cabeçalhos na primeira linha:

| Coluna | Conteúdo |
|---|---|
| `Título` | Nome do evento ou da tarefa |
| `Início` | Início do evento ou prazo da tarefa |
| `Fim` | Fim do evento; normalmente vazio para tarefas |
| `Tipo` | `Evento único`, `Evento recorrente` ou `Tarefa` |
| `Origem` | `Google Agenda` ou `Google Tasks` |
| `Lista` | Lista do Google Tasks; vazia para eventos |
| `ID` | Chave externa estável do registro |
| `Status` | `Pendente` ou `Concluída` |

Os IDs são gerados pelo script:

```text
EVENTO|<id do evento>|<início em milissegundos>
TAREFA|<id da lista>|<id da tarefa>
```

Não altere manualmente a coluna `ID`. Ela é o vínculo entre a linha e o objeto externo correto.

## Eventos atuais e futuros

A importação do Apps Script trabalha com o período configurado em `auditoria.gs`:

```javascript
DATA_INICIO: new Date('2026-01-01T00:00:00Z'),
DATA_FIM: new Date('2027-01-01T00:00:00Z')
```

A View do AppSheet chamada **Eventos atuais e futuros** deve usar a Slice técnica `Eventos`, com esta condição:

```appsheet
AND(
  [Tipo] = "Evento único",
  [Início] >= TODAY(),
  [Início] >= DATE("2026-08-01")
)
```

O filtro mostra somente eventos únicos a partir do dia atual e, especificamente no exercício de 2026, a partir de 1º de agosto de 2026. `TODAY()` é recalculado pelo AppSheet conforme a data de uso do app.

### Ressalva da configuração atual e atualização anual

A configuração publicada está preparada para o exercício de **2026**. O Apps Script importa o intervalo de 1º de janeiro a 31 de dezembro de 2026, e a View **Eventos atuais e futuros** exibe eventos únicos a partir de **1º de agosto de 2026**, sempre respeitando também `TODAY()`.

O corte de agosto é uma regra específica de 2026. Ele **não deve ser repetido automaticamente nos exercícios seguintes**.

Para continuar usando o app em um próximo exercício, faça esta atualização no início do ano:

1. Em `auditoria.gs`, altere `DATA_INICIO` para o primeiro dia do novo ano.
2. Altere `DATA_FIM` para o primeiro dia do ano seguinte. A data final não é incluída.
3. Na Slice `Eventos`, remova a condição fixa de agosto e mantenha somente a regra dinâmica de hoje em diante.
4. Salve o Apps Script e o AppSheet.
5. Execute `exportarAgendaAuditoria` manualmente uma vez para reconstruir a `Página1` com o novo período.
6. Toque em `Sync` no celular para baixar a definição e os dados atualizados.
7. Faça um teste com um evento e uma tarefa antes de voltar ao uso normal.

Exemplo para o exercício de 2027:

```javascript
DATA_INICIO: new Date('2027-01-01T00:00:00Z'),
DATA_FIM: new Date('2028-01-01T00:00:00Z')
```

E na Slice `Eventos`:

```appsheet
AND(
  [Tipo] = "Evento único",
  [Início] >= TODAY()
)
```

Se no futuro você quiser estabelecer novamente um mês de corte específico, acrescente uma segunda condição com a data desejada. Isso é opcional e não faz parte da configuração padrão dos próximos exercícios.

## Tarefas e status

Por padrão, o script importa tarefas pendentes, concluídas e sem prazo:

```javascript
INCLUIR_TAREFAS_SEM_PRAZO: true,
INCLUIR_TAREFAS_CONCLUIDAS: true
```

Isso permite manter um histórico de concluídas e exibi-las em uma View própria. A Slice geral `Tarefas` mostra todas as tarefas; a separação visual é feita pelas Slices de status:

```appsheet
// Todas as tarefas
[Tipo] = "Tarefa"
```

```appsheet
// Tarefas pendentes
AND([Tipo] = "Tarefa", [Status] = "Pendente")
```

```appsheet
// Tarefas concluídas
AND([Tipo] = "Tarefa", [Status] = "Concluída")
```

Se a instalação não quiser importar tarefas concluídas para a planilha, altere `INCLUIR_TAREFAS_CONCLUIDAS` para `false`. Nesse caso, elas não aparecerão nem na `Página1` nem na View de concluídas.

## Duas formas de cadastrar eventos e tarefas

A Auditoria Agenda aceita dois caminhos de cadastro. A pessoa pode começar pelo **AppSheet**, usando o botão `+`, ou pode criar diretamente no **Google Calendar** e no **Google Tasks**. Nos dois casos, a sincronização leva o registro para a `Página1` e o torna visível no outro ambiente.

| Onde cadastrar | Para eventos | Para tarefas | Depois do cadastro |
|---|---|---|---|
| AppSheet | Escolha `Evento único` ou `Evento recorrente`, preencha `Título`, `Início` e `Fim` | Escolha `Tarefa`, selecione a `Lista` e defina `Status` | Salve e toque em `Sync` no celular; o Apps Script envia à fonte Google |
| Google Calendar | Crie o evento com data e horário | — | O Apps Script importa o evento para a `Página1` e o AppSheet |
| Google Tasks | — | Crie a tarefa, escolha a lista, o prazo e o status | O Apps Script importa a tarefa para a `Página1` e o AppSheet |

A regra prática é usar o Calendar para compromissos com horário e o Tasks para ações que precisam ser concluídas. A diferenciação detalhada está em [`GUIA_DIFERENCIAR_EVENTO_TAREFA.md`](GUIA_DIFERENCIAR_EVENTO_TAREFA.md).

## Configuração do AppSheet

Em **Data → Tables**, selecione `Página1` e execute **Regenerate structure** ou **Regenerate schema**. Depois, em **Data → Columns**, configure:

| Coluna | Configuração |
|---|---|
| `ID` | Tipo `Text`; `Key` ligado |
| `Título` | Tipo `Text`; `Label` ligado |
| `Início` | Tipo `Date` ou `DateTime` |
| `Fim` | Tipo `Date` ou `DateTime` |
| `Tipo` | Tipo `Enum`, com `Evento único`, `Evento recorrente` e `Tarefa` |
| `Origem` | Tipo `Text` |
| `Lista` | Tipo `Enum`, com os nomes exatos das listas do Google Tasks |
| `Status` | Tipo `Enum`, com `Pendente` e `Concluída`; modo `Dropdown` |

Em **Data → Slices**, inclua `ID` e `_RowNumber` em todas as Slices. `_RowNumber` é técnico e não precisa aparecer na View.

Em **UX → Views** ou **App → Views**, use:

| Nome exibido | For this data | Posição |
|---|---|---|
| `Eventos atuais e futuros` | `Eventos` | `Primary` |
| `Tarefas pendentes` | `Tarefas_Pendentes` | `Primary` ou Menu |
| `Tarefas concluídas` | `Tarefas_Concluidas` | `Primary` ou Menu |
| `Tarefas` | `Tarefas` | Menu |

A View que deve aparecer na barra inferior precisa ter `Position = Primary`.

### Inclusão de eventos e tarefas pelo celular

Para o botão `+` abrir um formulário funcional, abra **Data → Tables → Página1** e clique no ícone de **Table settings** no cabeçalho da tabela. Dentro dele, configure **Are updates allowed?** como `ADDS_AND_UPDATES` ou `ALL_CHANGES`. No novo editor, essa opção não aparece diretamente na lista de tabelas. Não use `UPDATES_ONLY` nem `READ_ONLY`.

As colunas `Título`, `Tipo`, `Início`, `Fim`, `Lista` e `Status` devem estar com **Show?** e **Editable?** ligados. `ID`, `_RowNumber` e `Origem` podem ficar ocultos e não editáveis.

Para que apareçam opções no formulário, configure `Tipo`, `Status` e `Lista` como **Enum**, com **Input mode = Dropdown** e **Allow other values** desativado. No campo `Values`, adicione cada opção separadamente; não cole várias opções juntas em `App formula` ou `Initial value`. Se `Values` não aparecer, use `Valid If` com uma expressão `LIST(...)`. Use os valores:

| Coluna | Opções |
|---|---|
| `Tipo` | `Evento único`, `Evento recorrente`, `Tarefa` |
| `Status` | `Pendente`, `Concluída` |
| `Lista` | `A fazer`, `Concluídas`, `Plano da semana` ou os nomes exatos das listas existentes no Google Tasks |

Em `Status`, use apenas `"Pendente"` no campo `Initial value`. Em `Tipo` e `Lista`, o valor inicial deve ser vazio ou conter apenas uma opção. `App formula` deve ficar vazio nessas três colunas. `Lista` identifica a lista do Google Tasks; não substitui o campo `Status`. Use `Enum`, e não `EnumList`, porque cada tarefa deve ter uma única lista e um único status.

Se precisar usar `Valid If`, informe uma lista com a função `LIST`, por exemplo `LIST("Pendente", "Concluída")` para `Status`.

A ordem recomendada do formulário é:

```text
Título → Tipo → Início → Fim → Lista → Status
```

Para criar um evento, escolha `Tipo = Evento único`, preencha `Título` e `Início` e, se quiser, `Fim`. Para criar uma tarefa, escolha `Tipo = Tarefa`, preencha `Título` e `Lista` e, se quiser, `Início` e `Status`. Depois de salvar no celular, toque em `Sync`.

Se o botão `+` abrir uma tela sem campos ou sem opções, confira se a Slice da View contém todas essas colunas, se o tipo é `Enum`, se há valores em `Values` e se não existe `Editable_If = FALSE` nos campos. O guia detalhado está em [`GUIA_CORRIGIR_FORMULARIO_APPSHEET.md`](GUIA_CORRIGIR_FORMULARIO_APPSHEET.md).

## Atualização no celular

O AppSheet mantém uma cópia local da definição e dos dados. Depois de salvar uma View no editor:

1. Clique em **Save** no AppSheet.
2. Confirme em **Manage → Deploy** que o app está no estado publicado. Não é necessário criar outro deploy se ele já estiver `Deployed`.
3. Abra o mesmo aplicativo no celular.
4. Toque em **Sync** ou no ícone de sincronização.
5. Aguarde o fim da sincronização.
6. Feche e abra o aplicativo novamente.

Se o computador mostrar o nome novo, mas o celular continuar com o nome antigo na barra inferior, confirme que o celular abriu o mesmo app e não um link ou atalho de outra instalação.

## Instalação

1. Crie uma planilha com a aba `Página1`.
2. Copie `auditoria.gs` para um arquivo `.gs` no Apps Script.
3. Copie `appsscript.json` para o manifesto do mesmo projeto.
4. Associe o Apps Script a um projeto Google Cloud controlado pela mesma conta Google.
5. Ative a Google Tasks API no Google Cloud.
6. Autorize o projeto executando `exportarAgendaAuditoria`.
7. Confirme que eventos e tarefas chegaram à `Página1`.
8. Execute `configurarSincronizacaoAutomatica` uma vez.
9. Confira em **Gatilhos** se existe uma única execução de `exportarAgendaAuditoria` aproximadamente a cada cinco minutos.
10. Crie o app AppSheet a partir da planilha e configure as Slices e Views.

O manifesto atual usa chamadas REST autenticadas para o Tasks. Não é necessário encontrar `Tasks API` na lista de Serviços avançados do Apps Script.

Os escopos principais são:

```text
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/tasks
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/script.external_request
https://www.googleapis.com/auth/script.scriptapp
```

A conta que executa o Apps Script e cria o gatilho precisa ter acesso de edição à planilha, ao Calendar e ao Tasks.

## Guia para novos usuários

Para uma instalação passo a passo, inclusive para quem tem pouca familiaridade com credenciais Google, consulte:

- [`GUIA_NOVO_USUARIO.md`](GUIA_NOVO_USUARIO.md) — roteiro didático desde a criação da planilha até o teste no celular.
- [`GUIA_INICIO.md`](GUIA_INICIO.md) — guia operacional da instalação bidirecional.
- [`APPSHEET_CONFIG_BIDIRECTIONAL.md`](APPSHEET_CONFIG_BIDIRECTIONAL.md) — configuração detalhada de Slices e Views.
- [`GUIA_CORRIGIR_FORMULARIO_APPSHEET.md`](GUIA_CORRIGIR_FORMULARIO_APPSHEET.md) — correção do botão `+` e dos campos do formulário móvel.
- [`GUIA_DIFERENCIAR_EVENTO_TAREFA.md`](GUIA_DIFERENCIAR_EVENTO_TAREFA.md) — como decidir entre evento e tarefa e quando usar Calendar, Tasks ou os dois.
- [`APRESENTACAO_LINKEDIN_DIDATICA.md`](APRESENTACAO_LINKEDIN_DIDATICA.md) — roteiro textual atualizado, com cadastro pelo AppSheet ou diretamente pelas ferramentas Google.
- [`apresentacao_linkedin_didatica/`](apresentacao_linkedin_didatica/) — apresentação didática com cadastro pelos dois caminhos e sincronização bidirecional.
- [`apresentacao_linkedin/`](apresentacao_linkedin/) — versão premium anterior, mantida como referência visual.

## Teste recomendado

Use primeiro um evento e uma tarefa com título iniciado por `TESTE BIDIRECIONAL`.

| Teste | Ação | Resultado esperado |
|---|---|---|
| Calendar → Sheets | Alterar título no Calendar e executar o script | Novo título retorna à `Página1` |
| Sheets/AppSheet → Calendar | Alterar título ou horário na `Página1` e executar o script | Evento muda no Calendar |
| Tasks → Sheets | Alterar título ou status no Tasks e executar o script | Alteração retorna à `Página1` |
| Sheets/AppSheet → Tasks | Alterar título ou status na `Página1` e executar o script | Tarefa muda no Tasks |
| Celular | Tocar em `Sync` depois de salvar o app | Nome das Views e dados são atualizados |
| Gatilho | Alterar um registro e aguardar aproximadamente 5 a 10 minutos | A alteração é enviada sem execução manual |

Não apague linhas durante o teste. A exclusão automática está desativada.

## Marca e identidade visual

O manual [`MANUAL_DE_MARCA_KAFFA_ZIG.md`](MANUAL_DE_MARCA_KAFFA_ZIG.md) reúne as regras de uso da marca Kaffa Zig Gestão, cujo foco principal é **gestão, incluindo gestão de projetos**. As soluções digitais e o uso de IA são atividades e recursos complementares. O logo institucional novo é minimalista e usa apenas azul-marinho e coral; o azul-claro/ciano não é destaque da marca institucional. Os logos oficiais estão disponíveis na raiz do repositório:

- [`logo_kaffa_zig_gestao_principal.svg`](logo_kaffa_zig_gestao_principal.svg) — versão horizontal vetorial;
- [`logo_kaffa_zig_gestao_simbolo.svg`](logo_kaffa_zig_gestao_simbolo.svg) — símbolo vetorial para ícones;
- [`logo_kaffa_zig_gestao_simbolo_branco.svg`](logo_kaffa_zig_gestao_simbolo_branco.svg) — símbolo branco vetorial para fundos escuros;
- [`logo_kaffa_zig_gestao_principal_clean.png`](logo_kaffa_zig_gestao_principal_clean.png) — versão horizontal PNG transparente;
- [`logo_kaffa_zig_gestao_simbolo_clean.png`](logo_kaffa_zig_gestao_simbolo_clean.png) — símbolo PNG transparente;
- [`logo_kaffa_zig_gestao_branco_clean.png`](logo_kaffa_zig_gestao_branco_clean.png) — símbolo branco PNG transparente.

## Segurança

### Limitação de segurança do plano gratuito

Na versão gratuita do AppSheet utilizada neste projeto, **não é possível exigir login obrigatório dos usuários do aplicativo**. Portanto, esta instalação não garante autenticação individual dentro do AppSheet.

Para reduzir o risco:

- mantenha a planilha Google Sheets com acesso **Restrito**;
- compartilhe o link do app somente com pessoas de confiança;
- use o app para uso pessoal ou para dados que não sejam sensíveis;
- não coloque senhas, tokens, documentos pessoais, dados financeiros ou informações confidenciais no app;
- nunca publique eventos, tarefas, chaves ou arquivos de credenciais no GitHub.

Um repositório público contém o código, mas não concede automaticamente acesso à sua planilha, ao Calendar ou ao Tasks. O acesso depende das autorizações concedidas em cada instalação. Para dados sensíveis, será necessária uma solução com autenticação individual compatível com a política de segurança desejada.

## Arquivos principais

| Arquivo | Finalidade |
|---|---|
| `auditoria.gs` | Sincronização bidirecional e criação do gatilho |
| `appsscript.json` | Escopos OAuth de leitura e escrita |
| `GUIA_NOVO_USUARIO.md` | Instalação didática para novos usuários, segurança e atualização anual |
| `GUIA_INICIO.md` | Guia operacional completo |
| `APPSHEET_CONFIG_BIDIRECTIONAL.md` | Slices, Views e campos editáveis |
| `GUIA_CORRIGIR_FORMULARIO_APPSHEET.md` | Permissões de inclusão e formulário do celular |
| `GUIA_DIFERENCIAR_EVENTO_TAREFA.md` | Critérios para diferenciar eventos e tarefas e escolher o caminho de cadastro |
| `test_auditoria_bidirectional.js` | Testes da integração bidirecional |
| `test_auditoria_write_mocks.js` | Testes simulados de escrita no Calendar e Tasks |
| `README.md` | Referência rápida |
| `apresentacao_linkedin_didatica/` | Apresentação didática para o LinkedIn, com cadastro pelo app e pelas fontes Google |
| `APRESENTACAO_LINKEDIN_DIDATICA.md` | Roteiro textual da apresentação didática |
| `apresentacao_linkedin/` | Apresentação premium anterior e referência visual |
| `MANUAL_DE_MARCA_KAFFA_ZIG.md` | Regras de marca, cores, tipografia, logo e aplicações |
| `logo_kaffa_zig_gestao_principal.svg` | Logo institucional horizontal vetorial |
| `logo_kaffa_zig_gestao_simbolo.svg` | Símbolo minimalista para ícones |
| `logo_kaffa_zig_gestao_simbolo_branco.svg` | Símbolo branco para fundos escuros |
| `logo_kaffa_zig_gestao_principal_clean.png` | Logo institucional horizontal PNG |
| `logo_kaffa_zig_gestao_simbolo_clean.png` | Símbolo PNG transparente |
| `logo_kaffa_zig_gestao_branco_clean.png` | Símbolo branco PNG transparente |

## Dificuldades comuns

| Problema | Causa provável | Solução |
|---|---|---|
| Tarefas concluídas aparecem na View geral | A Slice `Tarefas` mostra todas as tarefas | Use `Tarefas pendentes` ou `Tarefas concluídas` |
| Concluídas aparecem em pendentes | Fórmula ou valor de status incorreto | Use exatamente `AND([Tipo] = "Tarefa", [Status] = "Pendente")` |
| View nova aparece no computador, não no celular | Cópia local desatualizada | Salve, publique se necessário e toque em `Sync` no celular |
| AppSheet não envia alterações | Snapshot inexistente, código antigo ou gatilho ausente | Execute a primeira sincronização e depois configure o gatilho |
| Erro 403 no Calendar ou Tasks | Escopos não autorizados ou API desativada | Reautorize o Apps Script e ative a Google Tasks API |
| Tarefas não chegam à `Página1` | Conta, lista ou API incorreta | Confira a conta autorizada e a mensagem em **Execuções** |
| Evento não atualiza | `ID` alterado, calendário diferente ou data inválida | Preserve o `ID` e confira `Início`/`Fim` |
| Dados aparecem em `Sobre` | Código antigo usava a aba ativa | Use a versão que fixa o destino em `Página1` |
| Vários gatilhos iguais | Função configurada mais de uma vez por caminhos diferentes | Execute `configurarSincronizacaoAutomatica` novamente |

## Referências oficiais

[1]: https://support.google.com/appsheet/answer/10108301?hl=pt-BR — AppSheet: sincronização entre app e backend.

[2]: https://support.google.com/appsheet/answer/10104495?hl=pt-BR — AppSheet: implantação do aplicativo.

[3]: https://developers.google.com/apps-script/guides/triggers/installable — Google Apps Script: gatilhos instaláveis.

[4]: https://developers.google.com/workspace/tasks/reference/rest — Google Tasks API: referência REST.

[5]: https://developers.google.com/apps-script/reference/calendar/calendar-event — Google Apps Script: CalendarEvent.
