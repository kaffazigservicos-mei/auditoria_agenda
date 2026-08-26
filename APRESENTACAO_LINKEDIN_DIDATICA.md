# Apresentação LinkedIn — Auditoria Agenda

## Cover
**Crie sua própria Auditoria Agenda**

Eventos e tarefas em um só lugar, no seu celular

Criado por Kaffa Zig Gestão com IAs

## Slide 1
**A rotina fica espalhada**

- Reuniões e compromissos ficam no Google Calendar.
- Tarefas ficam no Google Tasks.
- A equipe perde tempo procurando a próxima ação.

**Ideia central:** quando a informação está em lugares diferentes, acompanhar o trabalho fica mais difícil.

## Slide 2
**Uma visão única facilita a próxima ação**

- O projeto reúne eventos e tarefas em uma mesma rotina.
- O Google Sheets funciona como a base organizada.
- O aplicativo ajuda a consultar e atualizar o trabalho no celular.

**Ideia central:** menos procura, mais clareza para decidir o que fazer agora.

## Slide 3
**Você começa com o que já usa**

- Uma conta Google.
- Google Calendar para compromissos.
- Google Tasks para tarefas.
- Google Sheets para organizar os dados.
- AppSheet para acessar tudo no celular.

**Ideia central:** não é preciso comprar um sistema novo nem saber programar.

## Slide 4
**Primeiro, crie a base do projeto**

1. Crie uma planilha Google.
2. Renomeie a aba principal para `Página1`.
3. Abra o Apps Script pela planilha.
4. Copie os arquivos do projeto disponíveis no GitHub.

**Ideia central:** a planilha é o ponto de partida da organização.

## Slide 5
**Depois, autorize a sua própria conta**

- Execute a primeira sincronização.
- Leia as permissões solicitadas pelo Google.
- Autorize somente o projeto que você mesmo criou.
- Seus dados permanecem na sua conta Google.

**Aviso simples:** no plano gratuito do AppSheet usado neste projeto, não é possível exigir login obrigatório dentro do aplicativo. Por isso, o link deve ser compartilhado apenas com pessoas de confiança e o app não deve conter dados sensíveis.

## Slide 6
**Escolha o registro certo para cada compromisso**

- **Evento:** tem horário marcado, reunião, compromisso ou outras pessoas envolvidas.
- **Tarefa:** é uma ação que pode ser feita até um prazo, sem horário fixo.
- **Regra rápida:** evento responde “quando preciso estar disponível?”; tarefa responde “o que preciso fazer?”.
- Se a tarefa precisar de tempo reservado, crie a tarefa e também um evento de bloco de trabalho.

A diferenciação completa, com exemplos, está em [`GUIA_DIFERENCIAR_EVENTO_TAREFA.md`](GUIA_DIFERENCIAR_EVENTO_TAREFA.md).

## Slide 7
**Cadastre pelo app ou pela ferramenta que já usa**

- Pelo AppSheet: toque em `+`, escolha Evento ou Tarefa, preencha, salve e toque em `Sync`.
- Pelo Google Calendar: crie o evento com data e horário.
- Pelo Google Tasks: crie a tarefa, escolha a lista e defina o prazo/status.
- O registro pode começar em qualquer um dos dois caminhos e depois aparecer na planilha e no app.

**Ideia central:** cada pessoa pode registrar o trabalho no lugar mais conveniente.

## Slide 8
**Acompanhe sem copiar informações manualmente**

- A alteração chega à planilha e é confirmada pelo Apps Script.
- O app mostra a versão atualizada depois do `Sync`.
- O gatilho automático verifica alterações aproximadamente a cada cinco minutos.
- A configuração atual cobre 2026; nos próximos exercícios, atualize o período no início do ano.

**Ideia central:** a rotina permanece organizada nos dois sentidos.

## Slide 9
**Auditoria Agenda: clareza para agir**

Teste com um evento e uma tarefa.

Conheça o projeto:
https://github.com/kaffazigservicos-mei/auditoria_agenda

Criado por Kaffa Zig Gestão com IAs
