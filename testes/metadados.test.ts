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

  it("funciona sem especialidade registrada", () => {
    expect(tituloMedico("Mayara Viana", null)).toBe(
      "Mayara Viana - Médica em Imperatriz - MA | AMI",
    );
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
