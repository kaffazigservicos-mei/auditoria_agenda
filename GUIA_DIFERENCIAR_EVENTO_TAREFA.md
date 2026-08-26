# Como diferenciar evento e tarefa

## Regra principal

> **Evento** é um compromisso que ocupa um horário específico. **Tarefa** é uma ação que precisa ser realizada até um prazo, mas que pode ser executada em qualquer momento antes dele.

A pergunta mais útil é:

> **Se eu não fizer isso no horário exato, o compromisso deixa de acontecer ou outra pessoa será afetada?**

Se a resposta for sim, registre como **evento**. Se a resposta for não, mas ainda houver uma ação a concluir, registre como **tarefa**.

## Comparação rápida

| Pergunta | Evento | Tarefa |
|---|---|---|
| Ocupa horário fixo? | Sim | Não necessariamente |
| Envolve reunião, compromisso ou outras pessoas? | Geralmente sim | Normalmente não |
| Precisa de início e fim? | Sim | Geralmente apenas prazo |
| Pode ser realizada em qualquer momento antes do prazo? | Não | Sim |
| Tem status `Pendente` ou `Concluída`? | Não é o principal | Sim |
| Fica em uma lista de trabalho? | Não | Sim |

## Exemplos de eventos

Registre como evento uma reunião com cliente, uma consulta, uma apresentação, um treinamento, uma visita técnica, um compromisso com horário marcado ou uma reunião semanal recorrente.

No app, use `Tipo = Evento único` ou `Tipo = Evento recorrente`. Preencha `Título`, `Início` e, quando souber, `Fim`.

## Exemplos de tarefas

Registre como tarefa preparar uma apresentação, enviar uma proposta, revisar um orçamento, ligar para um fornecedor, conferir documentos, atualizar um relatório ou aprovar uma compra.

No app, use `Tipo = Tarefa`. Preencha `Título`, escolha uma `Lista` do Google Tasks e defina `Status = Pendente`. Use `Início` como prazo quando houver uma data-limite.

## Quando usar os dois registros

Algumas atividades precisam de uma tarefa e de um horário reservado. Nesse caso, crie os dois registros:

| Necessidade | Registro |
|---|---|
| Acompanhar o que precisa ser entregue | Tarefa: `Preparar apresentação` |
| Reservar tempo para executar a ação | Evento: `Bloco de trabalho — apresentação`, das 9h às 11h |

A tarefa acompanha a entrega. O evento protege o horário de execução no calendário. Não crie dois eventos para a mesma reunião nem duas tarefas para a mesma ação.

## Como cadastrar diretamente nas fontes Google

No Google Calendar, registre compromissos com data e horário definidos. No Google Tasks, registre ações, prazos, listas e status. A sincronização bidirecional importa essas criações para a `Página1` e para o AppSheet.

## Como cadastrar pelo AppSheet

No formulário aberto pelo botão `+`, escolha o `Tipo` correto. Para evento, informe o horário de início e, se possível, o fim. Para tarefa, informe a lista e o status. Depois de salvar, toque em `Sync` no celular; o Apps Script enviará o novo registro para o Calendar ou para o Tasks na próxima execução.

## Resumo para lembrar

- **Evento:** quando preciso estar disponível?
- **Tarefa:** o que preciso fazer?
- **Prazo:** até quando devo concluir?
- **Bloco de trabalho:** quando vou reservar tempo para executar a tarefa?

Este documento detalha a diferenciação. O resumo também está no [`GUIA_NOVO_USUARIO.md`](GUIA_NOVO_USUARIO.md), que acompanha a apresentação didática.
