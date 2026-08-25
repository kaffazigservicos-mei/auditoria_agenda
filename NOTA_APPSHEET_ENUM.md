# Confirmação sobre opções de seleção no AppSheet

A documentação oficial do AppSheet informa que uma coluna do tipo `Enum` permite selecionar um único valor entre os valores permitidos. A configuração é feita em **Data → Columns**, editando a coluna, escolhendo `Enum`, adicionando os valores no campo `Values` e selecionando `Dropdown` como modo de entrada.

`EnumList` é usado para selecionar vários valores e não é necessário para `Status`, `Tipo` ou `Lista` nesta aplicação.

Para este projeto:

- `Tipo`: `Evento único`, `Evento recorrente`, `Tarefa`;
- `Status`: `Pendente`, `Concluída`;
- `Lista`: nomes exatos das listas existentes no Google Tasks, por exemplo `A fazer`, `Concluídas` e `Plano da semana`.

A opção `Allow other values` deve ficar desativada para impedir variações de escrita que prejudiquem os filtros e a localização da lista de tarefas.

Referência: https://support.google.com/appsheet/answer/10107878?hl=pt-BR
