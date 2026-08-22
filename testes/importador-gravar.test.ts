import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
  O importador não pode remover nada.

  Esta verificação é grosseira de propósito: ela lê o código-fonte e falha se
  a palavra aparecer. É a regra que protege 500 cadastros de um erro de
  implementação, e ela vale mais sendo boba e infalível do que sendo elegante
  e furável.

  Nota: esta lista cresceu tarefa a tarefa, conforme cada arquivo nascia.
*/
const FONTES = [
  "../scripts/gravar.ts",
  "../scripts/retrato.ts",
  "../scripts/credencial.ts",
  "../scripts/importar.ts",
  "../scripts/modelo.ts",
  "../scripts/publicar.ts",
  "../lib/importador/plano.ts",
  "../lib/importador/publicacao.ts",
];

describe("nenhuma remoção no importador", () => {
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
