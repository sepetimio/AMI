import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { gerarModelo, lerPlanilha } from "@/scripts/modelo";
import { lerCabecalho } from "@/lib/importador/colunas";
import { ehErro, ehLinhaVazia, lerLinha } from "@/lib/importador/linha";
import { NOMES_DE_COLUNA } from "@/lib/importador/tipos";

const pasta = mkdtempSync(join(tmpdir(), "ami-modelo-"));
afterAll(() => rmSync(pasta, { recursive: true, force: true }));

describe("gerarModelo", () => {
  it("escreve um arquivo que dá para ler de volta", async () => {
    const caminho = join(pasta, "modelo.xlsx");
    await gerarModelo(caminho);

    const linhas = await lerPlanilha(caminho);
    expect(linhas.length).toBeGreaterThan(0);
  });

  it("o cabeçalho do modelo é reconhecido pelo próprio importador", async () => {
    const caminho = join(pasta, "ida-e-volta.xlsx");
    await gerarModelo(caminho);

    const linhas = await lerPlanilha(caminho);
    const cab = lerCabecalho(linhas[0]);

    expect(cab.ignoradas).toEqual([]);
    for (const c of NOMES_DE_COLUNA) {
      expect(cab.indices[c], `coluna ${c}`).toBeDefined();
    }
  });

  it("a linha de exemplo do modelo passa pela validação", async () => {
    const caminho = join(pasta, "exemplo.xlsx");
    await gerarModelo(caminho);

    const linhas = await lerPlanilha(caminho);
    const cab = lerCabecalho(linhas[0]);
    const dados = linhas.slice(1).filter((l) => !ehLinhaVazia(l));

    expect(dados.length).toBeGreaterThan(0);

    const r = lerLinha(dados[0], cab, 2);
    expect(ehErro(r)).toBe(false);
  });
});
