function doGet() {
  return HtmlService.createTemplateFromFile("Index")
    .evaluate()
    .setTitle(CONFIG.APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getInitialData() {
  const email = getSignedInEmail_();
  assertAuthorized_(email);
  const candidates = readCandidates_();
  return {
    user: { email: email },
    dashboard: buildDashboard_(candidates),
    candidates: candidates,
  };
}

function getCandidate(candidateId) {
  const email = getSignedInEmail_();
  assertAuthorized_(email);
  const candidate = readCandidates_().find(item => String(item.id) === String(candidateId));
  if (!candidate) throw new Error("Candidato não encontrado.");
  return candidate;
}

function getSignedInEmail_() {
  const email = Session.getActiveUser().getEmail();
  if (!email) {
    throw new Error("Não foi possível identificar seu e-mail Google. Publique o aplicativo para usuários que tenham login Google e acesso à planilha.");
  }
  return email.trim().toLowerCase();
}

function assertAuthorized_(email) {
  const allowed = CONFIG.ALLOWED_EMAILS.map(item => item.trim().toLowerCase()).filter(Boolean);
  if (!allowed.length) {
    throw new Error("Defina pelo menos um e-mail autorizado em Config.gs antes de publicar o aplicativo.");
  }
  if (allowed.indexOf(email) === -1) {
    throw new Error("Seu e-mail não está autorizado a acessar dados de candidatos.");
  }
}

function readCandidates_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error(`Aba não encontrada: ${CONFIG.SHEET_NAME}`);

  const range = sheet.getDataRange();
  const values = range.getDisplayValues();
  const richTextValues = range.getRichTextValues();
  if (values.length < 2) return [];

  const headers = values[0].map(header => header.trim());
  return values.slice(1)
    .map((row, index) => toCandidate_(headers, row, index + 2, richTextValues[index + 1]))
    .filter(candidate => candidate.name || candidate.resumeUrl || candidate.totalScore !== null)
    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
}

function toCandidate_(headers, row, sourceRow, richTextRow) {
  const get = (...names) => {
    for (let i = 0; i < names.length; i += 1) {
      const index = headers.indexOf(names[i]);
      if (index !== -1 && row[index]) return row[index].trim();
    }
    return "";
  };

  const score = value => {
    const text = String(value ?? "").trim();
    if (!text) return null;
    const parsed = Number(text.replace(",", ".").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const keywordText = get("Justificativa Competências IA");
  const resumeColumn = headers.indexOf("Seu currículo em pdf");
  const resumeUrl = resumeColumn === -1
    ? ""
    : normalizeDriveUrl_(row[resumeColumn], richTextRow && richTextRow[resumeColumn]);

  const scores = {
    education: score(get("Formação Pontos IA")),
    experience: score(get("Experiência Pontos IA")),
    skills: score(get("Habilidades Pontos IA")),
    languages: score(get("Idioma Pontos IA")),
  };
  const scoreValues = Object.values(scores);
  const hasAnyScore = scoreValues.some(value => value !== null);
  const criteriaTotal = scoreValues.every(value => value !== null)
    ? scoreValues.reduce((sum, value) => sum + value, 0)
    : null;
  const storedTotal = score(get("Pontuação IA", "Pontução IA"));
  const totalScore = !hasAnyScore
    ? 0
    : criteriaTotal !== null
      ? criteriaTotal
      : storedTotal;
  const recommendation = hasAnyScore
    ? normalizeRecommendation_(get("Recomendação IA"))
    : "NAO_RECOMENDADO";

  return {
    id: get("row_number") || sourceRow,
    submittedAt: get("Data da Submissão", "Carimbo de data/hora"),
    name: get("Nome") || "Candidato sem nome",
    email: get("E-mail", "Endereço de email"),
    phone: get("Número de telefone"),
    resumeUrl: resumeUrl,
    totalScore: totalScore,
    recommendation: recommendation,
    scores: scores,
    justifications: {
      education: get("Justificava Formação IA"),
      experience: get("Experiência Justificativa IA"),
      skills: get("Justificativa Habilidade IA"),
      languages: get("Idioma Justificartiva IA"),
    },
    foundKeywords: extractKeywords_(keywordText, "Encontradas:"),
    missingKeywords: extractKeywords_(keywordText, "Faltantes:"),
    analysisDetail: get("Analise Detalhada IA"),
  };
}

function normalizeDriveUrl_(displayValue, richTextValue) {
  let link = "";
  if (richTextValue) {
    link = richTextValue.getLinkUrl() || "";
    if (!link) {
      const linkedRun = richTextValue.getRuns().find(run => run.getLinkUrl());
      link = linkedRun ? linkedRun.getLinkUrl() : "";
    }
  }

  const rawValue = String(link || displayValue || "").trim();
  if (!rawValue) return "";

  const idMatch = rawValue.match(/[-\w]{20,}/);
  if (idMatch) return `https://drive.google.com/open?id=${idMatch[0]}`;
  return /^https?:\/\//i.test(rawValue) ? rawValue : "";
}

function normalizeRecommendation_(value) {
  const normalized = String(value || "").trim().toUpperCase().replace(/Ç/g, "C").replace(/Ã/g, "A");
  if (normalized.indexOf("PARCIAL") !== -1) return "PARCIALMENTE_RECOMENDADO";
  if (normalized.indexOf("NAO") !== -1 || normalized.indexOf("NÃO") !== -1) return "NAO_RECOMENDADO";
  if (normalized.indexOf("RECOMEND") !== -1) return "RECOMENDADO";
  return "NAO_RECOMENDADO";
}

function extractKeywords_(value, label) {
  const text = String(value || "");
  const start = text.indexOf(label);
  if (start === -1) return [];
  const after = text.slice(start + label.length);
  const section = after.split("|")[0].trim();
  if (!section || section.toLowerCase() === "nenhuma") return [];
  return section.split(",").map(item => item.trim()).filter(Boolean);
}

function buildDashboard_(candidates) {
  const scored = candidates.filter(item => item.totalScore !== null);
  const total = candidates.length;
  const average = scored.length ? Math.round(scored.reduce((sum, item) => sum + item.totalScore, 0) / scored.length) : null;
  const counts = candidates.reduce((result, item) => {
    result[item.recommendation] = (result[item.recommendation] || 0) + 1;
    return result;
  }, {});

  return {
    total: total,
    average: average,
    recommended: counts.RECOMENDADO || 0,
    notRecommended: counts.NAO_RECOMENDADO || 0,
    distribution: [
      { key: "RECOMENDADO", label: "Recomendados", description: "Aderência alta à vaga", count: counts.RECOMENDADO || 0 },
      { key: "PARCIALMENTE_RECOMENDADO", label: "Parcialmente recomendados", description: "Pontos a validar", count: counts.PARCIALMENTE_RECOMENDADO || 0 },
      { key: "NAO_RECOMENDADO", label: "Não recomendados", description: "Aderência insuficiente", count: counts.NAO_RECOMENDADO || 0 },
    ],
  };
}
