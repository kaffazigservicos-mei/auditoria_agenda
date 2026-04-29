# Auditoria de Agenda - Google Sheets & AppSheet

Sistema de extração e monitoramento de eventos da Google Agenda para auditoria técnica, com interface de visualização em modo Deck via AppSheet.

## 🚀 Funcionamento
* **Dados:** O Apps Script extrai os eventos e alimenta o Google Sheets.
* **Interface:** O AppSheet filtra e exibe eventos únicos a partir de **Abril/2026**.
* **Visualização:** Utiliza o modo **Deck** para facilitar a conferência rápida.

---

## 🚨 ATENÇÃO: MANUTENÇÃO DE CICLO (OBRIGATÓRIO)

Este script utiliza um **filtro de data fixo** no código para garantir a performance da extração e a relevância dos dados no AppSheet.

> ### 📅 ATUALIZAÇÃO PARA NOVOS CICLOS (2027, 2028...)
> Para que o sistema continue operacional em anos subsequentes, é fundamental atualizar a data de corte manualmente:
>
> 1.  Abra o editor do **Apps Script** na sua planilha.
> 2.  No arquivo `auditoria.gs`, localize a definição da data de início (ex: `2026-04-01`).
> 3.  **Atualize o ano e mês** para o início do novo ciclo de auditoria.
>
> **Nota:** Se a data não for atualizada, o sistema continuará processando todos os eventos desde 2026, o que resultará em lentidão no processamento e poluição visual no AppSheet.

---

## 📋 Instalação e Configuração

1.  **Google Sheets:** Prepare a planilha que servirá de banco de dados.
2.  **Apps Script:** Copie os arquivos `auditoria.gs` e `appsscript.json` deste repositório para o seu editor de script.
3.  **AppSheet:** Gere o app a partir da planilha e configure a View principal como `Deck`.
4.  **Autorização:** Execute o script pela primeira vez para conceder as permissões de acesso à sua Google Agenda.

## 📂 Arquivos
* `auditoria.gs`: Lógica principal de extração de dados.
* `appsscript.json`: Configurações de permissões e fuso horário.

---
**Status:** Ativo e Funcional (Ciclo Atual: 2026)
