import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import {
  Baby,
  Bone,
  Brain,
  ChatsCircle,
  Drop,
  DropHalf,
  Ear,
  Eye,
  ForkKnife,
  GenderFemale,
  Hand,
  HandPalm,
  Heartbeat,
  Stethoscope,
} from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import { Icone } from "@/components/base/IconeServidor";
import {
  ICONE_PADRAO,
  especialidadesComMedico,
  iconeDaEspecialidade,
  linhaDeApoioDoIndice,
  mesDeAno,
  nomeComQuebras,
  sobreDaEspecialidade,
  tituloDoSobre,
} from "@/lib/especialidades";
import type { TextoDeEspecialidade } from "@/lib/sanity/tipos";

/*
  As decisões do índice de especialidades e da página de cada uma, em
  funções puras. Os textos esperados são os da spec de Especialidades
  (docs/superpowers/specs/2026-10-03-especialidades-design.md).
*/

describe("o ícone de cada especialidade", () => {
  /* A tabela da spec, seção 1.4, escrita aqui de novo, do slug ao componente
     Phosphor: comparar o desenho que sai com o do componente é o que pega
     dois ícones trocados de lugar. */
  const TABELA: [string, Icon][] = [
    ["cardiologia", Heartbeat],
    ["clinica-medica", Stethoscope],
    ["dermatologia", HandPalm],
    ["endocrinologia", DropHalf],
    ["gastroenterologia", ForkKnife],
    ["ginecologia-e-obstetricia", GenderFemale],
    ["neurologia", Brain],
    ["oftalmologia", Eye],
    ["ortopedia-e-traumatologia", Bone],
    ["otorrinolaringologia", Ear],
    ["pediatria", Baby],
    ["psiquiatria", ChatsCircle],
    ["reumatologia", Hand],
    ["urologia", Drop],
  ];
  const desenho = (Componente: Icon) =>
    renderToString(
      createElement(Componente, { size: 20, weight: "duotone", className: "", "aria-hidden": "true" }),
    );

  it("cada especialidade da tabela desenha o ícone dela, em duotone", () => {
    for (const [slug, Componente] of TABELA) {
      const nosso = renderToString(createElement(Icone, { nome: iconeDaEspecialidade(slug), duotone: true }));
      expect(nosso, slug).toBe(desenho(Componente));
    }
  });

  it("especialidade sem ícone na tabela, inclusive uma nova, fica com o estetoscópio", () => {
    expect(ICONE_PADRAO).toBe("estetoscopio");
    /* "constructor" e "toString" existem em todo objeto comum do JavaScript:
       uma tabela feita de objeto devolveria uma função, e não um ícone. */
    for (const slug of ["angiologia", "medicina-do-trabalho", "", "constructor", "toString"]) {
      expect(iconeDaEspecialidade(slug), slug).toBe(ICONE_PADRAO);
    }
  });
});

describe("as especialidades do índice", () => {
  const lista = [
    { nome: "Pediatria", slug: "pediatria", total: 3 },
    { nome: "Ortopedia e Traumatologia", slug: "ortopedia-e-traumatologia", total: 2 },
    { nome: "Urologia", slug: "urologia", total: 0 },
    { nome: "Clínica Médica", slug: "clinica-medica", total: 4 },
    { nome: "Cardiologia", slug: "cardiologia", total: 3 },
  ];

  it("em ordem alfabética do português, só as que têm médico", () => {
    expect(especialidadesComMedico(lista).map((e) => e.slug)).toEqual([
      "cardiologia",
      "clinica-medica",
      "ortopedia-e-traumatologia",
      "pediatria",
    ]);
  });

  it("não mexe na lista recebida", () => {
    const copia = structuredClone(lista);
    especialidadesComMedico(lista);
    expect(lista).toEqual(copia);
  });
});

describe("o nome com os pontos de quebra", () => {
  it("os seis nomes longos do desenho ganham o hífen opcional no lugar dele", () => {
    expect(nomeComQuebras("Dermatologia")).toBe("Dermato­logia");
    expect(nomeComQuebras("Endocrinologia")).toBe("Endocrino­logia");
    expect(nomeComQuebras("Gastroenterologia")).toBe("Gastro­enterologia");
    expect(nomeComQuebras("Oftalmologia")).toBe("Oftalmo­logia");
    expect(nomeComQuebras("Otorrinolaringologia")).toBe("Otorrino­laringologia");
    expect(nomeComQuebras("Reumatologia")).toBe("Reumato­logia");
  });

  it("os outros ficam como estão; nome de várias palavras quebra no espaço", () => {
    for (const nome of ["Cardiologia", "Neurologia", "Pediatria", "Ginecologia e Obstetrícia", "Angiologia"]) {
      expect(nomeComQuebras(nome), nome).toBe(nome);
    }
  });

  it("tirado o hífen opcional, o nome volta a ser o mesmo", () => {
    for (const nome of ["Otorrinolaringologia", "Clínica Médica", "Gastroenterologia"]) {
      expect(nomeComQuebras(nome).replaceAll("­", "")).toBe(nome);
    }
  });
});

describe("as frases geradas dos dados", () => {
  it("a linha de apoio do índice, a da spec", () => {
    expect(linhaDeApoioDoIndice(24)).toBe(
      "24 médicos associados, cada um com o número de registro no CRM. Escolha a área para ver quem atende.",
    );
  });

  it("com um médico só, sem o partitivo", () => {
    expect(linhaDeApoioDoIndice(1)).toBe(
      "1 médico associado, com o número de registro no CRM. Escolha a área para ver quem atende.",
    );
  });

  it("o título do Sobre, com o nome da especialidade em minúsculas", () => {
    expect(tituloDoSobre("Cardiologia")).toBe("Sobre a cardiologia");
    expect(tituloDoSobre("Ginecologia e Obstetrícia")).toBe("Sobre a ginecologia e obstetrícia");
    expect(tituloDoSobre("Clínica Médica")).toBe("Sobre a clínica médica");
  });

  it("nome que não termina em a não ganha o artigo feminino", () => {
    expect(tituloDoSobre("Cirurgião")).toBe("Sobre a especialidade");
    expect(tituloDoSobre("Pneumo")).toBe("Sobre a especialidade");
    expect(tituloDoSobre("")).toBe("Sobre a especialidade");
  });

  it("espaço nas pontas do nome não conta", () => {
    expect(tituloDoSobre("  Cardiologia \n")).toBe("Sobre a cardiologia");
    expect(tituloDoSobre(" Clínica Médica ")).toBe("Sobre a clínica médica");
  });
});

describe("o mês da revisão", () => {
  it("a data do Studio vira mês e ano por extenso", () => {
    expect(mesDeAno("2026-09-15")).toBe("setembro de 2026");
    expect(mesDeAno("2026-01-01")).toBe("janeiro de 2026");
    expect(mesDeAno("2025-12-31")).toBe("dezembro de 2025");
    expect(mesDeAno("2026-03-10")).toBe("março de 2026");
  });

  it("sem data, ou data fora do formato do Studio, nada", () => {
    for (const ruim of [null, undefined, "", "2026-13-01", "2026-00-10", "15/09/2026", "2026-9-1", "2026-09-15T10:00:00Z"]) {
      expect(mesDeAno(ruim), String(ruim)).toBeNull();
    }
  });

  it("dia que o mês não tem, nada; o último dia de cada mês, sim", () => {
    for (const ruim of ["2026-09-00", "2026-09-31", "2026-02-29", "2026-02-30", "2026-01-32", "2026-04-31", "2100-02-29"]) {
      expect(mesDeAno(ruim), ruim).toBeNull();
    }
    expect(mesDeAno("2026-01-31")).toBe("janeiro de 2026");
    expect(mesDeAno("2026-02-28")).toBe("fevereiro de 2026");
    expect(mesDeAno("2028-02-29")).toBe("fevereiro de 2028");
    expect(mesDeAno("2000-02-29")).toBe("fevereiro de 2000");
    expect(mesDeAno("2026-04-30")).toBe("abril de 2026");
    expect(mesDeAno("2026-12-31")).toBe("dezembro de 2026");
  });
});

describe("a trava do Sobre", () => {
  const bloco = (texto: string) =>
    ({
      _type: "block",
      _key: "b",
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s", text: texto, marks: [] }],
    }) as PortableTextBlock;
  const TEXTO: TextoDeEspecialidade = {
    oQueFaz: [bloco("Cuida do coração.")],
    quandoProcurar: [bloco("Falta de ar.")],
    revisorNome: "Dra. Exemplo Revisora",
    revisorCrm: "CRM/MA 10000",
    mesDaRevisao: "setembro de 2026",
  };

  it("com o texto completo, o bloco sai nos dois modos", () => {
    expect(sobreDaEspecialidade(true, TEXTO)).toEqual({ tipo: "texto", texto: TEXTO });
    expect(sobreDaEspecialidade(false, TEXTO)).toEqual({ tipo: "texto", texto: TEXTO });
  });

  it("sem texto, só na demonstração, e como texto a entrar", () => {
    expect(sobreDaEspecialidade(true, null)).toEqual({ tipo: "a-entrar" });
  });

  it("sem texto e fora da demonstração, o bloco não existe", () => {
    expect(sobreDaEspecialidade(false, null)).toBeNull();
  });
});
