import { describe, expect, it } from "vitest";
import { TITULOS, lerCabecalho } from "@/lib/importador/colunas";
import { NOMES_DE_COLUNA } from "@/lib/importador/tipos";

describe("TITULOS", () => {
  it("tem título para cada uma das 13 colunas", () => {
    expect(NOMES_DE_COLUNA).toHaveLength(13);
    for (const c of NOMES_DE_COLUNA) {
      expect(TITULOS[c]).toBeTruthy();
    }
  });
});

describe("lerCabecalho", () => {
  it("reconhece o cabeçalho do modelo, na ordem do modelo", () => {
    const cab = lerCabecalho([...NOMES_DE_COLUNA]);
    expect(cab.indices.nome).toBe(0);
    expect(cab.indices.crm).toBe(1);
    expect(cab.indices.whatsapp).toBe(12);
    expect(cab.ignoradas).toEqual([]);
  });

  it("reconhece em qualquer ordem", () => {
    const cab = lerCabecalho(["crm", "nome"]);
    expect(cab.indices.crm).toBe(0);
    expect(cab.indices.nome).toBe(1);
  });

  it("aceita acento, caixa e espaço no lugar do sublinhado", () => {
    const cab = lerCabecalho(["Nome", "CRM", "UF do CRM", "Especialidade"]);
    expect(cab.indices.nome).toBe(0);
    expect(cab.indices.crm).toBe(1);
    expect(cab.indices.uf_do_crm).toBe(2);
    expect(cab.indices.especialidade).toBe(3);
  });

  it("lista o que não reconheceu, com o título como estava no arquivo", () => {
    const cab = lerCabecalho(["nome", "crm", "E-mail", "bio"]);
    expect(cab.ignoradas).toEqual(["E-mail", "bio"]);
  });

  it("ignora célula vazia do cabeçalho sem chamar de coluna desconhecida", () => {
    const cab = lerCabecalho(["nome", "crm", null, "  "]);
    expect(cab.ignoradas).toEqual([]);
  });

  it("a primeira ocorrência vence quando um título se repete", () => {
    const cab = lerCabecalho(["nome", "crm", "nome"]);
    expect(cab.indices.nome).toBe(0);
  });

  it("cabeçalho sem nome nem crm devolve os índices ausentes", () => {
    const cab = lerCabecalho(["telefone"]);
    expect(cab.indices.nome).toBeUndefined();
    expect(cab.indices.crm).toBeUndefined();
  });
});
