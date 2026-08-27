/**
 * Configuração do aplicativo de triagem.
 * A planilha e a aba abaixo foram identificadas no workflow n8n já existente.
 * A lista abaixo contém os únicos e-mails autorizados a consultar as avaliações.
 */
const CONFIG = Object.freeze({
  APP_TITLE: "Triagem IA",
  SPREADSHEET_ID: "1pMr73CaWDxx72FMlEbb_FAfyZ1VjgWQbnTyuiqTj1VA",
  SHEET_NAME: "Respostas do Formulário 1",
  ALLOWED_EMAILS: [
    "kaffa.zig.servicos@gmail.com",
    "dilmafb@gmail.com",
    "dilma.balbi@gmail.com",
  ],
});
