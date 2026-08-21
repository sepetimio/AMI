import { afterEach, describe, expect, it, vi } from "vitest";
import {
  breadcrumbList,
  comoItensDeLista,
  faqPage,
  itemList,
  newsArticle,
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

  it("declara apenas o horário do endereço que declarou", () => {
    /* Dois consultórios: o segundo abre num dia em que o primeiro não abre.
       Se o horário do segundo aparecer sob o endereço do primeiro, o Google
       lê expediente que não acontece ali. */
    const comDois = physician(
      {
        ...medico,
        locais: [
          medico.locais[0],
          {
            ...medico.locais[0],
            id: 2,
            logradouro: "Rua Segunda",
            horarios: [{ diaSemana: 5, abre: "14:00", fecha: "18:00" }],
          },
        ],
      },
      SITE,
    ) as Record<string, unknown>;

    const dias = (comDois.openingHoursSpecification as { dayOfWeek: string }[])
      .map((h) => h.dayOfWeek);
    expect(dias).toEqual(["Tuesday"]);
    expect(dias).not.toContain("Friday");
    expect(
      (comDois.address as Record<string, string>).streetAddress,
    ).toContain("Rua Projetada 100");
  });

  it("descarta dia da semana fora da faixa em vez de emitir indefinido", () => {
    const torto = physician(
      {
        ...medico,
        locais: [
          {
            ...medico.locais[0],
            horarios: [
              { diaSemana: 2, abre: "08:00", fecha: "12:00" },
              { diaSemana: 9, abre: "08:00", fecha: "12:00" },
            ],
          },
        ],
      },
      SITE,
    ) as Record<string, unknown>;

    const horas = torto.openingHoursSpecification as { dayOfWeek: string }[];
    expect(horas).toHaveLength(1);
    for (const h of horas) expect(h.dayOfWeek).toBeDefined();
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
  it("preserva a ordem dos resultados do diretório", () => {
    const l = itemList(
      comoItensDeLista([medico, { ...medico, slug: "outro" }]),
      SITE,
    ) as { itemListElement: { position: number; url: string }[] };
    expect(l.itemListElement[0].position).toBe(1);
    expect(l.itemListElement[1].url).toBe(`${SITE}/medico/outro`);
  });

  it("serve uma listagem editorial com a mesma função", () => {
    /* Enquanto `itemList` recebia `Medico[]`, o índice de notícias não tinha
       como reusar e ficou sem o ItemList que a spec, seção 7, pede em toda
       listagem. */
    const l = itemList(
      [
        { nome: "Primeira nota", caminho: "/noticias/primeira-nota" },
        { nome: "Segunda nota", caminho: "/noticias/segunda-nota" },
      ],
      SITE,
    ) as {
      numberOfItems: number;
      itemListElement: { position: number; name: string; url: string }[];
    };
    expect(l.numberOfItems).toBe(2);
    expect(l.itemListElement[1].position).toBe(2);
    expect(l.itemListElement[1].name).toBe("Segunda nota");
    expect(l.itemListElement[1].url).toBe(`${SITE}/noticias/segunda-nota`);
  });

  it("monta endereço absoluto, nunca caminho solto", () => {
    /* O Google resolve URL relativa em JSON-LD contra a página, mas o
       schema.org pede endereço absoluto, e um erro aqui falha calado. */
    const l = itemList([{ nome: "Estatuto", caminho: "/associacao/estatuto" }], SITE) as {
      itemListElement: { url: string }[];
    };
    expect(l.itemListElement[0].url.startsWith("https://")).toBe(true);
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

const NOTICIA = {
  titulo: "AMI abre inscrições para o congresso de 2026",
  slug: "congresso-2026",
  resumo: "As inscrições vão até 30 de setembro, com desconto para associados.",
  publicadoEm: "2026-08-21T12:00:00Z",
  atualizadoEm: "2026-08-22T09:00:00Z",
  autor: { nome: "Larissa Nogueira", crm: "10274", crmUf: "MA" },
  corpo: [],
};

describe("newsArticle", () => {
  it("declara o tipo e o endereço canônico", () => {
    const j = newsArticle(NOTICIA, "https://ami.org.br");
    expect(j["@type"]).toBe("NewsArticle");
    expect(j.mainEntityOfPage).toBe("https://ami.org.br/noticias/congresso-2026");
  });

  it("credita o autor com CRM", () => {
    /* Autoria verificável é o que separa conteúdo de saúde que ranqueia de
       conteúdo que o Google trata como anônimo. */
    const j = newsArticle(NOTICIA, "https://ami.org.br");
    expect(j.author.name).toBe("Larissa Nogueira");
    expect(JSON.stringify(j.author)).toContain("10274");
  });

  it("declara data de publicação e de atualização, sem trocar uma pela outra", () => {
    /* Os dois campos só têm um teste de omissão até aqui; nada travava que
       datePublished e dateModified saíssem com os valores certos, então uma
       inversão entre os dois passaria despercebida. */
    const j = newsArticle(NOTICIA, "https://ami.org.br");
    expect(j.datePublished).toBe("2026-08-21T12:00:00Z");
    expect(j.dateModified).toBe("2026-08-22T09:00:00Z");
  });

  it("omite dateModified quando não houve revisão", () => {
    /* Repetir a data de publicação em dateModified diz ao Google que a
       matéria foi revisada no mesmo instante em que saiu, o que é falso e
       gasta o sinal de frescor sem entregar nada. */
    const j = newsArticle({ ...NOTICIA, atualizadoEm: undefined }, "https://x");
    expect(j).not.toHaveProperty("dateModified");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("inclui a capa como image, com as dimensões reais do arquivo", () => {
    /* image é o que o Google exige para elegibilidade em Top Stories e
       Discover; omitir a capa aqui devolveria o dado ao alcance sem usá-lo.

       O projeto entra por `stubEnv` porque `newsArticle` chama
       `urlDaImagem` sem configuração, e desde a revisão final faltar
       `projectId` é erro alto em vez de URL vazia. É o mesmo estado que a
       renderização real tem: a página só monta este JSON-LD depois de ter
       buscado a matéria no Sanity. */
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
    const capa = {
      asset: { _ref: "image-abc123def-1600x900-jpg" },
      alt: "Mesa de inscrição do congresso da AMI",
    };
    const j = newsArticle({ ...NOTICIA, capa }, "https://ami.org.br") as Record<
      string,
      unknown
    >;
    const imagem = j.image as Record<string, unknown>;
    expect(imagem["@type"]).toBe("ImageObject");
    expect(typeof imagem.url).toBe("string");
    expect(imagem.url).not.toBe("");
    expect(imagem.width).toBe(1600);
    expect(imagem.height).toBe(900);
  });

  it("omite image quando a notícia não tem capa", () => {
    const j = newsArticle(NOTICIA, "https://ami.org.br");
    expect(j).not.toHaveProperty("image");
  });

  it("não emite nota nem avaliação", () => {
    /* CFM 2.336/2023, Art. 11, XIII. */
    const j = JSON.stringify(newsArticle(NOTICIA, "https://x"));
    expect(j).not.toContain("AggregateRating");
    expect(j).not.toContain("ratingValue");
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
