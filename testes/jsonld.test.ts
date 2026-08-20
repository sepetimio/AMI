import { describe, expect, it } from "vitest";
import {
  breadcrumbList,
  faqPage,
  itemList,
  organizationAmi,
  physician,
} from "@/lib/seo/jsonld";
import type { Medico } from "@/lib/dados/tipos";

const SITE = "https://ami.org.br";

const medico: Medico = {
  id: 1,
  slug: "mayara-viana",
  nome: "Mayara Viana",
  crm: "12345",
  crmUf: "MA",
  foto: null,
  bio: "Bio",
  telemedicina: true,
  associadoAmi: true,
  especialidades: [
    { nome: "Cardiologia", slug: "cardiologia", rqe: "678", principal: true },
  ],
  locais: [
    {
      id: 1,
      logradouro: "Rua Projetada 100",
      numero: "100",
      bairro: { id: 1, nome: "Centro", slug: "centro" },
      telefone: "9933334444",
      whatsapp: "9933334444",
      estacionamento: true,
      acessibilidade: ["acesso_cadeirante"],
      horarios: [{ diaSemana: 2, abre: "08:00", fecha: "12:00" }],
    },
  ],
};

describe("physician", () => {
  const p = physician(medico, SITE) as Record<string, unknown>;

  it("declara o tipo e a URL canônica do perfil", () => {
    expect(p["@type"]).toBe("Physician");
    expect(p.url).toBe(`${SITE}/medico/mayara-viana`);
  });

  it("leva o CRM como identifier", () => {
    expect(JSON.stringify(p.identifier)).toContain("12345");
  });

  it("leva o endereço completo, não só a cidade", () => {
    const e = p.address as Record<string, string>;
    expect(e["@type"]).toBe("PostalAddress");
    expect(e.addressLocality).toBe("Imperatriz");
    expect(e.addressRegion).toBe("MA");
    expect(e.streetAddress).toContain("Rua Projetada 100");
  });

  it("declara horário de funcionamento", () => {
    expect(Array.isArray(p.openingHoursSpecification)).toBe(true);
  });

  it("aponta a AMI como organização de origem", () => {
    expect(JSON.stringify(p.memberOf)).toContain("Associação Médica");
  });

  it("nunca traz nota agregada — não existem avaliações neste site", () => {
    expect(p.aggregateRating).toBeUndefined();
  });
});

describe("organizationAmi", () => {
  it("é uma organização com endereço", () => {
    const o = organizationAmi(SITE) as Record<string, unknown>;
    expect(o["@type"]).toBe("Organization");
    expect(o.url).toBe(SITE);
    expect(o.address).toBeDefined();
  });
});

describe("itemList", () => {
  it("preserva a ordem dos resultados", () => {
    const l = itemList([medico, { ...medico, slug: "outro" }], SITE) as {
      itemListElement: { position: number; url: string }[];
    };
    expect(l.itemListElement[0].position).toBe(1);
    expect(l.itemListElement[1].url).toBe(`${SITE}/medico/outro`);
  });
});

describe("breadcrumbList", () => {
  it("numera as posições a partir de 1", () => {
    const b = breadcrumbList(
      [
        { nome: "Início", caminho: "/" },
        { nome: "Médicos", caminho: "/medicos" },
      ],
      SITE,
    ) as { itemListElement: { position: number; item: string }[] };
    expect(b.itemListElement[0].position).toBe(1);
    expect(b.itemListElement[1].item).toBe(`${SITE}/medicos`);
  });
});

describe("faqPage", () => {
  it("monta pergunta e resposta", () => {
    const f = faqPage([{ pergunta: "P?", resposta: "R." }]) as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(f.mainEntity[0].name).toBe("P?");
    expect(f.mainEntity[0].acceptedAnswer.text).toBe("R.");
  });
});
