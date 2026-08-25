# Corrigir o botão `+` e o formulário do AppSheet

## O problema

Quando o botão `+` aparece no celular, mas a tela seguinte não mostra campos para preencher, a inclusão de linhas está habilitada apenas parcialmente. O AppSheet precisa permitir **Adds** na tabela e na Slice, e os campos usados no formulário precisam estar visíveis e editáveis.

A correção é feita no editor do AppSheet. O código do Apps Script já sabe criar um novo evento ou uma nova tarefa quando recebe uma nova linha com os campos necessários.

## 1. Permitir a inclusão de novas linhas

No editor do AppSheet:

1. Abra **Data → Tables**.
2. Selecione a tabela `Página1`.
3. No cabeçalho da tabela, clique no ícone de **Table settings** — normalmente aparece como uma engrenagem, controles ou três pontos ao lado do nome da tabela.
4. Dentro de **Table settings**, localize **Are updates allowed?**.
5. Selecione `ALL_CHANGES`.
6. Salve.

Se o app não deve permitir exclusões, use `ADDS_AND_UPDATES` em vez de `ALL_CHANGES`. O importante é não usar `UPDATES_ONLY` nem `READ_ONLY`, pois essas opções impedem a criação pelo botão `+`.

Se o ícone de **Table settings** não aparecer, expanda o painel da tabela ou abra o menu de três pontos no cabeçalho. Você pode estar no novo editor; nesse editor, a permissão não fica visível diretamente na lista de tabelas.

Depois confira cada Slice usada nas Views:

1. Abra **Data → Slices**.
2. Selecione `Eventos`, `Tarefas`, `Tarefas_Pendentes` e `Tarefas_Concluidas`.
3. Se aparecer a configuração de permissões da Slice, permita `ADDS_AND_UPDATES`.
4. Salve cada Slice.

A permissão da Slice não pode ser mais ampla que a permissão da tabela principal.

## 2. Manter os campos necessários nas Slices

Nas Slices que abrem o formulário, mantenha estas colunas:

```text
ID
_RowNumber
Título
Início
Fim
Tipo
Origem
Lista
Status
```

`ID` e `_RowNumber` podem ficar ocultos no aplicativo. Eles devem permanecer na Slice para manter a chave e a ordenação.

Se `Tipo`, `Lista`, `Status`, `Início` ou `Fim` não estiverem na Slice, eles não aparecerão no formulário aberto pelo `+`.

## 3. Configurar as colunas da tabela `Página1`

Abra **Data → Columns → Página1** e configure:

| Coluna | Tipo | Show? | Editable? | Configuração adicional |
|---|---|---:|---:|---|
| `ID` | Text | Não | Não | Key ligado; Initial value: `UNIQUEID()` |
| `Título` | Text | Sim | Sim | Obrigatório para novos registros |
| `Início` | DateTime | Sim | Sim | Obrigatório para eventos; opcional para tarefas |
| `Fim` | DateTime | Sim | Sim | Opcional; se vazio, o script usa uma hora de duração |
| `Tipo` | Enum | Sim | Sim | `Evento único`, `Evento recorrente`, `Tarefa` |
| `Origem` | Text | Não | Não | Pode ficar vazio em novos registros |
| `Lista` | Text | Sim | Sim | Necessário para tarefas; pode ficar vazio para eventos |
| `Status` | Enum | Sim | Sim | Valores: `Pendente`, `Concluída`; Initial value: `Pendente`; Input mode: `Dropdown`; Allow other values: desativado |
| `_RowNumber` | Number | Não | Não | Coluna técnica |

## 3.1 Configurar as opções de seleção

Abra **Data → Columns → Página1** e clique no ícone de edição da coluna. Para cada coluna abaixo, selecione **Type = Enum**, mantenha **Base type = Text**, escolha **Input mode = Dropdown** e use **Allow other values** desativado.

| Coluna | Opções que devem ser adicionadas em `Values` |
|---|---|
| `Tipo` | `Evento único`, `Evento recorrente`, `Tarefa` |
| `Status` | `Pendente`, `Concluída` |
| `Lista` | `A fazer`, `Concluídas`, `Plano da semana` |

Em `Status`, defina **Initial value** como:

```appsheet
"Pendente"
```

As opções de `Lista` precisam ser iguais, letra por letra, aos nomes das listas existentes no Google Tasks. Se a sua conta usa outros nomes, coloque exatamente os nomes que aparecem no Google Tasks. O Apps Script procura a lista pelo nome e, se não encontrar correspondência, pode usar a primeira lista disponível.

A coluna `Lista` representa uma lista do Google Tasks, não o status da tarefa. Portanto, `Concluídas` pode ser uma lista de tarefas, mas o estado concluído deve ser escolhido separadamente em `Status = Concluída`.

Para o formulário, mantenha `Show?` e `Editable?` ligados nessas três colunas. Depois clique em **Done** ou **Save**.

Para evitar que o AppSheet exija prazo de tarefas sem prazo, use estas expressões opcionais:

**Início — Required_If**

```appsheet
[Tipo] <> "Tarefa"
```

**Lista — Required_If**

```appsheet
[Tipo] = "Tarefa"
```

**Fim — Required_If**

```appsheet
[Tipo] = "Evento único"
```

Se a instalação preferir permitir evento com duração padrão, deixe `Fim` sem obrigação. O Apps Script usa uma hora a partir de `Início` quando `Fim` fica vazio.

## 4. Conferir o formulário criado automaticamente

Depois de salvar as colunas:

1. Abra **UX → Views** ou **App → Views**.
2. Localize a View de formulário criada pelo AppSheet para `Eventos` ou `Tarefas`.
3. Se houver a opção **Column order**, deixe nesta ordem:

```text
Título
Tipo
Início
Fim
Lista
Status
```

Não inclua `ID`, `_RowNumber` ou `Origem` como campos de preenchimento.

Se o formulário não aparecer na lista, abra uma View de eventos ou tarefas no preview e toque no botão `+` novamente. O AppSheet normalmente cria a View de formulário automaticamente.

## 5. Como criar um evento pelo celular

1. Abra **Eventos atuais e futuros**.
2. Toque no botão `+`.
3. Preencha `Título`.
4. Escolha `Tipo = Evento único`.
5. Preencha `Início`.
6. Preencha `Fim`, se quiser indicar a duração.
7. Deixe `Status = Pendente`.
8. Salve e toque em `Sync`.

Depois da próxima execução do Apps Script, o evento deverá aparecer no Google Calendar. A sincronização automática ocorre aproximadamente a cada cinco minutos.

## 6. Como criar uma tarefa pelo celular

1. Abra **Tarefas pendentes** ou **Tarefas**.
2. Toque no botão `+`.
3. Preencha `Título`.
4. Escolha `Tipo = Tarefa`.
5. Preencha `Lista` com o nome de uma lista existente no Google Tasks.
6. Preencha `Início` se a tarefa tiver prazo.
7. Deixe `Status = Pendente`.
8. Salve e toque em `Sync`.

Depois da próxima execução do Apps Script, a tarefa deverá aparecer na lista escolhida do Google Tasks.

## 7. Se o formulário continuar vazio

Confira, nesta ordem:

1. A tabela `Página1` não está em `UPDATES_ONLY` ou `READ_ONLY`.
2. A Slice usada pela View contém `Título`, `Tipo`, `Início`, `Fim`, `Lista` e `Status`.
3. As colunas estão com **Show?** e **Editable?** ligados.
4. Nenhuma coluna tem `Editable_If = FALSE`.
5. O formulário não está usando uma Slice antiga.
6. O app foi salvo no editor.
7. O celular executou `Sync` depois do salvamento.

Não altere o `ID` externo de registros já sincronizados. Para novas linhas, `UNIQUEID()` é apenas um identificador temporário; o Apps Script cria o registro no Google e depois a próxima importação grava o ID externo definitivo.

## Referência oficial

A documentação do AppSheet informa que as configurações da tabela controlam se os usuários podem adicionar, editar ou excluir linhas. As opções de permissão da Slice também precisam respeitar a permissão da tabela principal [1].

[1]: https://support.google.com/appsheet/answer/10106345?hl=pt-BR — AppSheet Help: controlar operações de inclusão, atualização e exclusão.
