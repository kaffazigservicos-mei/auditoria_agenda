# Triagem IA no Google Apps Script

Este pacote substitui a integração do endpoint publicado. Ele lê diretamente a planilha que o n8n já atualiza e abre os currículos pelos links existentes do Google Drive. O workflow com Qwen não deve ser alterado.

## Configuração inicial

Abra `Config.gs` e mantenha o identificador da planilha e o nome da aba já preenchidos. Em `ALLOWED_EMAILS`, inclua os e-mails que poderão consultar os currículos. Por exemplo:

```javascript
ALLOWED_EMAILS: [
  "seu-email@empresa.com",
  "rh@empresa.com",
],
```

## Publicação no Google

1. Acesse [script.google.com](https://script.google.com) com a conta proprietária da planilha.
2. Clique em **Novo projeto** e dê o nome `Triagem IA`.
3. Crie os arquivos `Config.gs`, `Code.gs`, `Index.html` e `appsscript.json`; copie o conteúdo equivalente deste pacote para cada um.
4. Salve o projeto. O Google pedirá autorização para leitura da planilha e dos links do Drive; conceda apenas para a conta administradora.
5. Para a primeira publicação, clique em **Implantar → Nova implantação → Aplicativo da Web**.
6. Em **Executar como**, selecione **Usuário que acessa o app**. Em **Quem pode acessar**, escolha somente os usuários Google da sua equipe.
7. Clique em **Implantar** e copie o link gerado. Abra-o no computador ou celular.

Para alterações posteriores, não crie outra implantação. Use **Implantar → Gerenciar implantações → Editar → Nova versão → Implantar**. Isso mantém o mesmo endereço do aplicativo e evita abrir acidentalmente uma versão antiga.

> Como o app executa com a conta de cada usuário, cada pessoa autorizada também deve ter permissão de leitura na planilha e nos currículos correspondentes no Google Drive.

## Regra de pontuação e classificação

O n8n continua gravando os resultados na planilha. O aplicativo lê as quatro notas de critério: **Formação**, **Experiência**, **Habilidades** e **Idiomas e certificações**.

Quando as quatro notas são numéricas, o aplicativo calcula a pontuação total pela soma delas, mesmo que a coluna de total da planilha esteja vazia ou contenha um valor divergente. Por exemplo, o candidato Juliana juju, com notas `5 + 10 + 5 + 0`, deve aparecer com **20 pontos** tanto no dashboard quanto no detalhe.

Currículos que não seguem a estrutura recomendada, não permitem leitura adequada ou não geram nenhuma nota válida podem aparecer sem pontuação individual. Nesses casos, o aplicativo define automaticamente a pontuação total como **0** e classifica o candidato como **Não recomendado**. Esses candidatos são somados à categoria **Não recomendados** no dashboard; eles não devem aparecer como “Em análise”.

Essa regra não significa que o currículo foi rejeitado por uma decisão humana. Ela indica que o fluxo não encontrou notas válidas para comparar o documento com os critérios parametrizados. A avaliação humana pode revisar o currículo quando necessário.

## Estrutura recomendada do currículo

Para aumentar a chance de leitura correta pelo fluxo, o currículo deve ser enviado em PDF legível, preferencialmente com texto selecionável, e conter títulos claros para **Identificação**, **Objetivo**, **Resumo profissional**, **Formação**, **Experiência profissional**, **Habilidades**, **Idiomas**, **Certificações** e **Projetos ou portfólio**.

As experiências devem informar empresa, cargo, período, responsabilidades, ferramentas utilizadas e resultados. As datas devem seguir um padrão consistente, como `03/2022 a 08/2025` ou `março de 2022 a agosto de 2025`. Evite imagens do currículo, PDF protegido por senha, fotografias ilegíveis, excesso de tabelas e textos importantes dentro de imagens.

## Dados lidos

O app utiliza as colunas existentes no workflow: `Nome`, `E-mail`, `Número de telefone`, `Seu currículo em pdf`, `Pontuação IA` ou `Pontução IA`, pontuações e justificativas de formação, experiência, habilidades e idiomas, `Recomendação IA`, `Analise Detalhada IA` e `Justificativa Competências IA`.

## Segurança

Mantenha o link do app apenas com a equipe responsável pelo recrutamento, deixe o login Google obrigatório e não adicione e-mails não confiáveis em `ALLOWED_EMAILS`. O aplicativo não guarda cópias dos currículos: consulta somente a planilha e o Google Drive já existentes.
