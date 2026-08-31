import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

function loadToCandidate() {
  const source = readFileSync(new URL("../google-apps-script/Code.gs", import.meta.url), "utf8");
  const context: Record<string, unknown> = {};
  vm.runInNewContext(source, context);
  return context.toCandidate_ as (
    headers: string[],
    row: string[],
    sourceRow: number,
    richTextRow: null,
  ) => { totalScore: number | null; recommendation: string; scores: Record<string, number | null> };
}

const baseHeaders = [
  "Nome",
  "Pontuação IA",
  "Recomendação IA",
  "Formação Pontos IA",
  "Experiência Pontos IA",
  "Habilidades Pontos IA",
  "Idioma Pontos IA",
];

describe("Google Apps Script candidate scoring", () => {
  it("recalcula o total da Juliana pela soma dos quatro critérios", () => {
    const toCandidate = loadToCandidate();
    const candidate = toCandidate(baseHeaders, ["Juliana juju", "0", "NÃO RECOMENDADO", "5", "10", "5", "0"], 2, null);

    expect(candidate.totalScore).toBe(20);
    expect(candidate.scores).toEqual({ education: 5, experience: 10, skills: 5, languages: 0 });
  });

  it("classifica candidato sem notas como não recomendado e zera a pontuação", () => {
    const toCandidate = loadToCandidate();
    const candidate = toCandidate(baseHeaders, ["Candidato sem notas", "35", "", "", "", "", ""], 3, null);

    expect(candidate.totalScore).toBe(0);
    expect(candidate.recommendation).toBe("NAO_RECOMENDADO");
  });
});
