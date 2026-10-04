import { describe, expect, it } from "vitest";
import {
  LINHA_DE_LEITURA,
  MINIMO_DO_INDICE,
  ancoraDoTitulo,
  ancorasUnicas,
  indiceNestaPagina,
  secaoAtual,
} from "@/lib/nestaPagina";

/*
  O índice "Nesta página" das páginas de texto, em funções puras: a âncora
  de cada título de seção, quando o índice aparece e qual seção está sendo
  lida. A ligação com a rolagem do navegador é conferida pela auditoria
  visual (scripts/auditoria-visual.js, conferência 16).
*/

describe("a âncora de cada título", () => {
  it("sem acento, em minúsculas, com hífen no lugar do resto e o prefixo secao-", () => {
    expect(ancoraDoTitulo("O que é a AMI")).toBe("secao-o-que-e-a-ami");
    expect(ancoraDoTitulo("Quem pode se associar")).toBe("secao-quem-pode-se-associar");
    expect(ancoraDoTitulo("Como exercer esses direitos, e como falar sobre dados")).toBe(
      "secao-como-exercer-esses-direitos-e-como-falar-sobre-dados",
    );
    expect(ancoraDoTitulo("  Lei 13.709/2018 — artigo 41  ")).toBe("secao-lei-13-709-2018-artigo-41");
  });

  it("título sem letra nem número fica só com o prefixo", () => {
    expect(ancoraDoTitulo("¿?")).toBe("secao");
    expect(ancoraDoTitulo("")).toBe("secao");
  });

  it("título repetido ganha -2, -3, e uma âncora nunca se repete", () => {
    expect(ancorasUnicas(["Alterações", "Alterações", "Alterações 2", "Alterações"])).toEqual([
      { id: "secao-alteracoes", titulo: "Alterações" },
      { id: "secao-alteracoes-2", titulo: "Alterações" },
      { id: "secao-alteracoes-2-2", titulo: "Alterações 2" },
      { id: "secao-alteracoes-3", titulo: "Alterações" },
    ]);
  });
});

describe("quando o índice aparece", () => {
  const itens = ancorasUnicas(["Um", "Dois", "Três"]);

  it("com dois títulos ou mais: todos, na ordem", () => {
    expect(MINIMO_DO_INDICE).toBe(2);
    expect(indiceNestaPagina(itens)).toEqual(itens);
    expect(indiceNestaPagina(itens.slice(0, 2))).toEqual(itens.slice(0, 2));
  });

  it("com menos de dois: nenhum", () => {
    expect(indiceNestaPagina(itens.slice(0, 1))).toEqual([]);
    expect(indiceNestaPagina([])).toEqual([]);
  });
});

describe("a seção que está sendo lida", () => {
  it("a linha de leitura é a do desenho: 140px do topo da janela", () => {
    expect(LINHA_DE_LEITURA).toBe(140);
  });

  it("no alto da página, nenhum título passou da linha: a primeira", () => {
    expect(secaoAtual([300, 900, 1500], 140, false)).toBe(0);
  });

  it("a última cujo título já passou da linha, inclusive o que está em cima dela", () => {
    expect(secaoAtual([-500, 120, 1500], 140, false)).toBe(1);
    expect(secaoAtual([-900, -400, 140], 140, false)).toBe(2);
    expect(secaoAtual([-900, 141, 900], 140, false)).toBe(0);
  });

  it("no fim da página, a última, mesmo que o título dela não chegue à linha", () => {
    expect(secaoAtual([-900, 300, 700], 140, true)).toBe(2);
  });

  it("título que não está na página (topo infinito) não conta", () => {
    expect(secaoAtual([-900, Infinity, 700], 140, false)).toBe(0);
  });

  it("sem títulos, nenhuma", () => {
    expect(secaoAtual([], 140, false)).toBe(-1);
    expect(secaoAtual([], 140, true)).toBe(-1);
  });
});
