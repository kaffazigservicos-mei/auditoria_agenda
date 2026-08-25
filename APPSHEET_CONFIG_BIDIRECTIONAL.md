# Configuração AppSheet — eventos e tarefas

A integração de dados é feita pelo Apps Script, mas as listas visuais de tarefas são configuradas no AppSheet.

## Tabela Página1

Em **Data → Tables → Página1**, execute **Regenerate structure**. Em **Data → Columns**, configure:

| Coluna | Tipo | Configuração |
|---|---|---|
| `ID` | Text | Key ligado; não substituir o valor importado |
| `Título` | Text | Label ligado |
| `Início` | Date ou DateTime | Editável para tarefas/eventos |
| `Fim` | Date ou DateTime | Editável para eventos |
| `Tipo` | Enum | `Evento único`, `Evento recorrente`, `Tarefa`; Input mode `Dropdown` |
| `Origem` | Text | Não editar manualmente |
| `Lista` | Enum | Nome da lista para novas tarefas; Input mode `Dropdown` |
| `Status` | Enum | `Pendente`, `Concluída`; Input mode `Dropdown` |

Para novas linhas, use `UNIQUEID()` apenas como valor inicial temporário de `ID`. O script substitui esse identificador após criar o objeto externo.

## Slices

Crie cada Slice em **Data → Slices** e inclua a coluna `ID` na lista de colunas.

### Eventos

```appsheet
OR([Tipo] = "Evento único", [Tipo] = "Evento recorrente")
```

### Tarefas

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

## Views

Em **App → Views** ou **UX → Views**, crie uma View para cada Slice:

| View | For this data | Tipo |
|---|---|---|
| Eventos | `Eventos` | Deck ou Table |
| Tarefas | `Tarefas` | Deck ou Table |
| Tarefas pendentes | `Tarefas_Pendentes` | Deck ou Table |
| Tarefas concluídas | `Tarefas_Concluidas` | Deck ou Table |

Na View de tarefas, mostre `Título`, `Início`, `Lista` e `Status`. Não use `ID` como cabeçalho visível; ele deve permanecer como chave técnica.

## Inclusão de registros pelo celular

Para o botão `+` funcionar, abra **Data → Tables → Página1** e clique no ícone de **Table settings** no cabeçalho da tabela. Dentro dele, configure **Are updates allowed?** como `ADDS_AND_UPDATES` ou `ALL_CHANGES`. No novo editor, essa opção não aparece diretamente na lista de tabelas. Não use `UPDATES_ONLY` nem `READ_ONLY`.

Nas Slices usadas pelas Views de inclusão, mantenha estas colunas:

```text
ID, _RowNumber, Título, Início, Fim, Tipo, Origem, Lista, Status
```

Nas configurações de colunas de `Página1`, use:

| Coluna | Show? | Editable? | Observação |
|---|---:|---:|---|
| `ID` | Não | Não | Key; valor inicial `UNIQUEID()` para linhas novas |
| `Título` | Sim | Sim | Campo principal |
| `Início` | Sim | Sim | Obrigatório para eventos; opcional para tarefas |
| `Fim` | Sim | Sim | Opcional; evento usa uma hora se ficar vazio |
| `Tipo` | Sim | Sim | Evento único, Evento recorrente ou Tarefa |
| `Origem` | Não | Não | Preenchido pela sincronização |
| `Lista` | Sim | Sim | Necessário para novas tarefas |
| `Status` | Sim | Sim | Pendente ou Concluída; padrão Pendente |

No formulário, deixe a ordem `Título`, `Tipo`, `Início`, `Fim`, `Lista`, `Status`. O formulário pode ser criado automaticamente pelo AppSheet quando o usuário toca em `+`.

Configure as opções de seleção em **Data → Columns → Página1**, editando cada coluna:

| Coluna | Type | Valores em `Values` |
|---|---|---|
| `Tipo` | Enum | `Evento único`, `Evento recorrente`, `Tarefa` |
| `Status` | Enum | `Pendente`, `Concluída` |
| `Lista` | Enum | `A fazer`, `Concluídas`, `Plano da semana` ou os nomes exatos das listas do Google Tasks |

Use **Input mode = Dropdown** e deixe **Allow other values** desativado. Use `Enum`, e não `EnumList`, porque cada registro deve receber apenas uma opção. Em `Status`, use valor inicial `Pendente`. Os nomes de `Lista` precisam coincidir exatamente com os nomes existentes no Google Tasks.

Para nova tarefa, use `Tipo = Tarefa`, `Título`, `Lista` e, opcionalmente, `Início` e `Status`. Para novo evento, use `Tipo = Evento único`, `Título`, `Início` e, opcionalmente, `Fim`.

## Edição bidirecional

No celular, altere somente `Título`, `Início`, `Fim` e `Status` de registros existentes. A próxima execução do gatilho enviará as alterações para Calendar/Tasks.

Para criar uma nova tarefa pelo formulário do celular, use `Tipo = Tarefa`, um `Título`, uma `Lista` válida e, opcionalmente, `Início` e `Status`. Para criar um evento, use `Tipo = Evento único`, `Título`, `Início` e, opcionalmente, `Fim`. Depois de salvar, toque em `Sync`; o Apps Script enviará a nova linha para o Google Tasks ou Google Calendar na próxima execução.

Não apague linhas para excluir objetos Google: a exclusão automática está desativada por segurança.

## Gatilho

No Apps Script, execute uma vez:

```text
configurarSincronizacaoAutomatica
```

O gatilho executa a sincronização aproximadamente a cada cinco minutos. Também é possível executar manualmente `sincronizarBidirecional`.
