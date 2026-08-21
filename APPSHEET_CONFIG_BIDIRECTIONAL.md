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
| `Tipo` | Enum/Text | `Evento único`, `Evento recorrente`, `Tarefa` |
| `Origem` | Text | Não editar manualmente |
| `Lista` | Text | Nome da lista para novas tarefas |
| `Status` | Enum | `Pendente`, `Concluída` |

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

## Edição bidirecional

No celular, altere somente `Título`, `Início`, `Fim` e `Status` de registros existentes. A próxima execução do gatilho enviará as alterações para Calendar/Tasks.

Para criar uma nova tarefa, adicione uma linha com `Tipo = Tarefa`, um `Título`, uma `Lista` e, opcionalmente, `Início` e `Status`. Para criar um evento, use `Tipo = Evento único`, `Título`, `Início` e `Fim`.

Não apague linhas para excluir objetos Google: a exclusão automática está desativada por segurança.

## Gatilho

No Apps Script, execute uma vez:

```text
configurarSincronizacaoAutomatica
```

O gatilho executa a sincronização aproximadamente a cada cinco minutos. Também é possível executar manualmente `sincronizarBidirecional`.
