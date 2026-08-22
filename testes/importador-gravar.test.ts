import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
  O importador não pode remover nada.

  Esta verificação é grosseira de propósito: ela lê o código-fonte e falha se
  a palavra aparecer. É a regra que protege 500 cadastros de um erro de
  implementação, e ela vale mais sendo boba e infalível do que sendo elegante
  e furável.

  A lista de arquivos vem de varrer as duas pastas, não de mantê-la à mão: uma
  lista escrita à mão cresce tarefa a tarefa, e um arquivo novo em `scripts/`
  nasce fora da guarda em silêncio no dia em que alguém esquecer de acrescentar
  a linha.
*/
const PASTAS = ["../scripts", "../lib/importador"];

const FONTES = PASTAS.flatMap((pasta) => {
  const dir = fileURLToPath(new URL(pasta, import.meta.url));
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => `${pasta}/${f}`);
});

describe("nenhuma remoção no importador", () => {
  it("a varredura acha os arquivos das duas pastas", () => {
    /* Falha alto se a varredura vier vazia ou curta demais — um erro de
       caminho não pode virar aprovação silenciosa da lista de guarda. */
    expect(FONTES.length).toBeGreaterThanOrEqual(15);
  });

  for (const relativo of FONTES) {
    it(`${relativo} não contém delete nem truncate`, () => {
      const caminho = fileURLToPath(new URL(relativo, import.meta.url));
      const fonte = readFileSync(caminho, "utf8").toLowerCase();

      expect(fonte).not.toMatch(/\.delete\s*\(/);
      expect(fonte).not.toMatch(/\btruncate\b/);
      expect(fonte).not.toMatch(/\bdrop\s+table\b/);
    });
  }
});
