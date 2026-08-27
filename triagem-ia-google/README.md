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
5. Clique em **Implantar → Nova implantação → Aplicativo da Web**.
6. Em **Executar como**, selecione **Usuário que acessa o app**. Em **Quem pode acessar**, escolha somente os usuários Google da sua equipe.
7. Clique em **Implantar** e copie o link gerado. Abra-o no computador ou celular.

> Como o app executa com a conta de cada usuário, cada pessoa autorizada também deve ter permissão de leitura na planilha e nos currículos correspondentes no Google Drive.

## Dados lidos

O app utiliza as colunas existentes no workflow: `Nome`, `E-mail`, `Número de telefone`, `Seu currículo em pdf`, `Pontução IA`, pontuações e justificativas de formação, experiência, habilidades e idiomas, `Recomendação IA`, `Analise Detalhada IA` e `Justificativa Competências IA`.

## Segurança

Mantenha o link do app apenas com a equipe responsável pelo recrutamento, deixe o login Google obrigatório e não adicione e-mails não confiáveis em `ALLOWED_EMAILS`. O aplicativo não guarda cópias dos currículos: consulta somente a planilha e o Google Drive já existentes.
