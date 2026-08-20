import { describe, expect, it } from "vitest";
import {
  LIMITE_DESCRICAO,
  LIMITE_TITULO,
  descricaoEspecialidade,
  descricaoMedico,
  tituloEspecialidade,
  tituloFaceta,
  tituloMedico,
} from "@/lib/seo/metadados";

describe("tituloEspecialidade", () => {
  it("traz a especialidade, a cidade e a contagem real", () => {
    expect(tituloEspecialidade("Cardiologia", 7)).toBe(
      "Cardiologia em Imperatriz - MA | 7 médicos | AMI",
    );
  });

  it("concorda o singular", () => {
    expect(tituloEspecialidade("Cardiologia", 1)).toContain("1 médico |");
  });

  it("abre mão do sufixo da marca antes de estourar o limite", () => {
    const t = tituloEspecialidade("Otorrinolaringologia pediátrica", 12);
    expect(t.length).toBeLessThanOrEqual(LIMITE_TITULO);
    expect(t).toContain("Otorrinolaringologia pediátrica");
  });
});

describe("tituloFaceta", () => {
  it("nomeia o bairro", () => {
    expect(tituloFaceta("Cardiologia", "Centro", 4)).toBe(
      "Cardiologia no Centro, Imperatriz - MA | 4 médicos | AMI",
    );
  });

  it("respeita o limite", () => {
    const t = tituloFaceta("Ginecologia e Obstetrícia", "Parque do Buriti", 3);
    expect(t.length).toBeLessThanOrEqual(LIMITE_TITULO);
  });
});

describe("tituloMedico", () => {
  it("junta nome e especialidade", () => {
    expect(tituloMedico("Mayara Viana", "Cardiologia")).toBe(
      "Mayara Viana - Cardiologia em Imperatriz - MA | AMI",
    );
  });

  it("sem especialidade registrada, omite o papel em vez de chutar o gênero", () => {
    const t = tituloMedico("Mayara Viana", null);
    expect(t).toBe("Mayara Viana em Imperatriz - MA | AMI");
    expect(t).not.toContain("Médica");
    expect(t).not.toContain("Médico");
  });

  it("encurta nome longo sem amputar palavra", () => {
    const t = tituloMedico(
      "Maria Aparecida de Vasconcelos Nascimento",
      "Ginecologia e Obstetrícia",
    );
    expect(t.length).toBeLessThanOrEqual(LIMITE_TITULO);
    expect(t).not.toMatch(/[\s,;:–-]$/);
    /* Toda palavra do resultado tem de ser palavra inteira da entrada. */
    const fonte =
      "Maria Aparecida de Vasconcelos Nascimento - Ginecologia e Obstetrícia em Imperatriz - MA | AMI";
    for (const palavra of t.split(/[\s|]+/).filter(Boolean)) {
      expect(fonte.split(/[\s|]+/)).toContain(palavra);
    }
  });
});

describe("truncamento", () => {
  /* Os piores casos reais do catálogo: as especialidades e os bairros mais
     longos de Imperatriz. É onde o molde estoura. */
  const casos: [string, string][] = [
    ["Ginecologia e Obstetrícia", "Parque do Buriti"],
    ["Ortopedia e Traumatologia", "Nova Imperatriz"],
    ["Otorrinolaringologia", "Maranhão Novo"],
  ];

  it("nunca termina em palavra cortada, hífen solto ou pontuação", () => {
    for (const [esp, bairro] of casos) {
      for (const t of [
        tituloFaceta(esp, bairro, 3),
        tituloEspecialidade(esp, 12),
      ]) {
        expect(t.length).toBeLessThanOrEqual(LIMITE_TITULO);
        expect(t).not.toMatch(/[\s,;:–-]$/);
        /* "Imperatriz - M" seria pior que um título curto. */
        expect(t).not.toMatch(/\bM$/);
      }
    }
  });

  it("prefere encurtar a cabeça a amputar a palavra", () => {
    const t = tituloFaceta("Ginecologia e Obstetrícia", "Parque do Buriti", 3);
    expect(t).toContain("Ginecologia e Obstetrícia");
    expect(t).toContain("Parque do Buriti");
  });
});

describe("descricaoEspecialidade", () => {
  it("cita a contagem e os bairros", () => {
    const d = descricaoEspecialidade("Cardiologia", 7, ["Centro", "Bacuri"]);
    expect(d).toContain("7 cardiologistas");
    expect(d).toContain("Centro");
    expect(d.length).toBeLessThanOrEqual(LIMITE_DESCRICAO);
  });

  it("não repete a mesma descrição para dados diferentes", () => {
    const a = descricaoEspecialidade("Cardiologia", 7, ["Centro"]);
    const b = descricaoEspecialidade("Pediatria", 3, ["Bacuri"]);
    expect(a).not.toBe(b);
  });
});

describe("descricaoMedico", () => {
  it("cabe no limite mesmo com nome e bairros longos", () => {
    const d = descricaoMedico(
      "Maria Aparecida de Vasconcelos Nascimento",
      "Ginecologia e Obstetrícia",
      ["Parque do Buriti", "Nova Imperatriz"],
    );
    expect(d.length).toBeLessThanOrEqual(LIMITE_DESCRICAO);
  });
});
