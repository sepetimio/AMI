import { describe, expect, it } from "vitest";
import {
  LIMITE_DESCRICAO,
  LIMITE_TITULO,
  descricaoEspecialidade,
  descricaoMedico,
  tituloDePagina,
  tituloEspecialidade,
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
  /* Os piores casos reais do catálogo: as especialidades mais longas de
     Imperatriz. É onde o molde estoura. */
  const casos = ["Ginecologia e Obstetrícia", "Ortopedia e Traumatologia", "Otorrinolaringologia"];

  it("nunca termina em palavra cortada, hífen solto ou pontuação", () => {
    for (const esp of casos) {
      const t = tituloEspecialidade(esp, 12);
      expect(t.length).toBeLessThanOrEqual(LIMITE_TITULO);
      expect(t).not.toMatch(/[\s,;:–-]$/);
      /* "Imperatriz - M" seria pior que um título curto. */
      expect(t).not.toMatch(/\bM$/);
    }
  });

  it("prefere encurtar a cabeça a amputar a palavra", () => {
    const t = tituloEspecialidade("Ginecologia e Obstetrícia", 12);
    expect(t).toContain("Ginecologia e Obstetrícia");
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

  it("usa 'no bairro X'/'nos bairros X e Y', não um 'em' bruto antes do nome", () => {
    const um = descricaoEspecialidade("Cardiologia", 4, ["Nova Imperatriz"]);
    expect(um).toContain("no bairro Nova Imperatriz");
    expect(um).not.toMatch(/\bem Nova Imperatriz\b/);

    const dois = descricaoEspecialidade("Cardiologia", 5, ["Centro", "Bacuri"]);
    expect(dois).toContain("nos bairros Centro e Bacuri");
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

  it("usa 'no bairro X', não um 'em' bruto antes do nome", () => {
    const d = descricaoMedico("Mayara Viana", "Cardiologia", [
      "Nova Imperatriz",
    ]);
    expect(d).toContain("no bairro Nova Imperatriz");
    expect(d).not.toMatch(/\bem Nova Imperatriz\b/);
  });
});

describe("tituloDePagina", () => {
  it("usa o sufixo que a spec fixa, e só ele", () => {
    /* O ramo chegou à revisão final com três convenções concorrentes:
       "| Associação Médica de Imperatriz", "| AMI" e sufixo nenhum. A spec,
       seção 7, fixa "| AMI". */
    expect(tituloDePagina("Estatuto")).toBe("Estatuto | AMI");
  });

  it("descarta o sufixo antes de estourar o limite", () => {
    /* Título de matéria vem do Studio e pode ser longo. Concatenado à mão,
       ele passa dos 60 e o Google corta onde quiser, às vezes no meio do
       "| AMI". Perder o sufixo é melhor que perdê-lo pela metade. */
    const longo =
      "Campanha de vacinação contra a gripe começa nas unidades de Imperatriz";
    const titulo = tituloDePagina(longo);
    expect(titulo).not.toContain("| AMI");
    expect(titulo.length).toBeLessThanOrEqual(LIMITE_TITULO);
  });

  it("corta no espaço quando nem a cabeça sozinha cabe", () => {
    const titulo = tituloDePagina(
      "Assembleia geral extraordinária da Associação Médica de Imperatriz convocada",
    );
    expect(titulo.length).toBeLessThanOrEqual(LIMITE_TITULO);
    expect(titulo.endsWith(" ")).toBe(false);
    /* Sem corte no meio de palavra: cada pedaço do resultado é uma palavra
       inteira do original. */
    for (const palavra of titulo.split(" ")) {
      expect(
        "Assembleia geral extraordinária da Associação Médica de Imperatriz convocada".split(
          " ",
        ),
      ).toContain(palavra);
    }
  });
});
