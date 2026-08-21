import type { Medico } from "@/lib/dados/tipos";
import type { Noticia } from "@/lib/sanity/tipos";

/*
  Construtores de JSON-LD. Puros, e testados porque erro aqui falha calado:
  a página continua bonita e o Google apenas ignora o bloco.

  Não existe AggregateRating em lugar nenhum: o site não tem avaliações, o que
  também afasta o Art. 11, XIII da Resolução CFM 2.336/2023, que veda ranking
  e premiação.
*/

const DIAS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function enderecoDaAmi() {
  return {
    "@type": "PostalAddress",
    streetAddress: "[PROVISÓRIO] endereço da sede",
    addressLocality: "Imperatriz",
    addressRegion: "MA",
    addressCountry: "BR",
  };
}

export function organizationAmi(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Associação Médica de Imperatriz",
    alternateName: "AMI",
    url: siteUrl,
    logo: `${siteUrl}/marca/ami-marca-2400.png`,
    address: enderecoDaAmi(),
    areaServed: "Imperatriz, MA, Brasil",
  };
}

export function physician(m: Medico, siteUrl: string) {
  const principal = m.especialidades.find((e) => e.principal) ?? m.especialidades[0];
  const local = m.locais[0];

  /*
    Horário sai APENAS do local cujo endereço está sendo declarado.
    Agregar os horários de todos os consultórios sob um endereço só faria o
    Google ler expediente que não acontece naquele lugar — dado estruturado
    errado é pior que dado estruturado ausente.

    Dia fora de 0..6 é descartado em vez de virar dayOfWeek indefinido, que
    JSON.stringify apagaria sem avisar. A coluna tem CHECK no banco, então
    isto é cinto e suspensório.
  */
  const horarios = (local?.horarios ?? [])
    .filter((h) => DIAS[h.diaSemana] !== undefined)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DIAS[h.diaSemana],
      opens: h.abre,
      closes: h.fecha,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: m.nome,
    url: `${siteUrl}/medico/${m.slug}`,
    ...(m.foto ? { image: m.foto } : {}),
    ...(principal ? { medicalSpecialty: principal.nome } : {}),
    identifier: [
      {
        "@type": "PropertyValue",
        propertyID: "CRM",
        value: `${m.crmUf}-${m.crm}`,
      },
      ...(principal?.rqe
        ? [{ "@type": "PropertyValue", propertyID: "RQE", value: principal.rqe }]
        : []),
    ],
    ...(local
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: [local.logradouro, local.numero]
              .filter(Boolean)
              .join(", "),
            addressLocality: "Imperatriz",
            addressRegion: "MA",
            addressCountry: "BR",
          },
          ...(local.telefone ? { telephone: local.telefone } : {}),
        }
      : {}),
    ...(horarios.length ? { openingHoursSpecification: horarios } : {}),
    ...(m.telemedicina
      ? { availableService: { "@type": "MedicalTherapy", name: "Telemedicina" } }
      : {}),
    memberOf: {
      "@type": "Organization",
      name: "Associação Médica de Imperatriz",
      url: siteUrl,
    },
  };
}

/*
  NewsArticle das publicações da AMI.

  `author` sai como Person com `identifier` carregando o CRM. Não existe
  propriedade padrão do schema.org para inscrição em conselho profissional, e
  `identifier` é o campo genérico previsto exatamente para registro externo.
  Inventar `crm: "10274"` produziria uma chave que nenhum consumidor lê.

  Nenhum `AggregateRating` em lugar nenhum: CFM 2.336/2023, Art. 11, XIII.
*/
export function newsArticle(
  n: Pick<
    Noticia,
    "titulo" | "slug" | "resumo" | "publicadoEm" | "atualizadoEm" | "autor"
  >,
  siteUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle" as const,
    headline: n.titulo,
    description: n.resumo,
    mainEntityOfPage: `${siteUrl}/noticias/${n.slug}`,
    datePublished: n.publicadoEm,
    /* Espalhado condicionalmente: a chave some do objeto quando não houve
       revisão, em vez de sair como null, que o Google trata como valor. */
    ...(n.atualizadoEm ? { dateModified: n.atualizadoEm } : {}),
    author: {
      "@type": "Person" as const,
      name: n.autor.nome,
      identifier: `CRM/${n.autor.crmUf} ${n.autor.crm}`,
    },
    publisher: {
      "@type": "Organization" as const,
      name: "Associação Médica de Imperatriz",
      url: siteUrl,
    },
  };
}

/** Entra em toda página de listagem, com a ordem exata dos resultados. */
export function itemList(medicos: Medico[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: medicos.length,
    itemListElement: medicos.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nome,
      url: `${siteUrl}/medico/${m.slug}`,
    })),
  };
}

/** Sempre acompanhado de um breadcrumb visível na tela, nunca sozinho. */
export function breadcrumbList(
  itens: { nome: string; caminho: string }[],
  siteUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.nome,
      item: `${siteUrl}${it.caminho === "/" ? "" : it.caminho}`,
    })),
  };
}

export function faqPage(perguntas: { pergunta: string; resposta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: perguntas.map((p) => ({
      "@type": "Question",
      name: p.pergunta,
      acceptedAnswer: { "@type": "Answer", text: p.resposta },
    })),
  };
}
