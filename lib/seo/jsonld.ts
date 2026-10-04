import type { Medico } from "@/lib/dados/tipos";
import type { Noticia } from "@/lib/sanity/tipos";
import { alturaDaCapa } from "@/lib/noticias";
import { urlRecortada } from "@/lib/sanity/imagem";
import { AMI } from "@/lib/ami";
import { numeroPreenchido } from "@/lib/contato";

/*
  Construtores de JSON-LD. Puros, e testados porque erro aqui falha calado:
  a página continua bonita e o Google apenas ignora o bloco.

  Não existe AggregateRating em lugar nenhum: o site não tem avaliações, o que
  também afasta o Art. 11, XIII da Resolução CFM 2.336/2023, que veda ranking
  e premiação.
*/

function enderecoDaAmi() {
  return {
    "@type": "PostalAddress",
    streetAddress: `${AMI.endereco.logradouro}, ${AMI.endereco.numero}`,
    addressLocality: AMI.endereco.cidade,
    addressRegion: AMI.endereco.uf,
    postalCode: AMI.endereco.cep,
    addressCountry: "BR",
  };
}

export function organizationAmi(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    /*
      `MedicalOrganization` e não `Organization` genérica: é o tipo que o
      schema.org tem para entidade da área de saúde, e é o que permite ao
      Google entender do que se trata sem inferir pelo texto.
    */
    "@type": "MedicalOrganization",
    name: AMI.razaoSocial,
    alternateName: AMI.sigla,
    url: siteUrl,
    logo: `${siteUrl}/marca/ami-marca-2400.png`,
    address: enderecoDaAmi(),
    /* Os dois números, e o primeiro é o fixo da sede. */
    telephone: AMI.telefones,
    /*
      O CNPJ como `identifier` estruturado, e não como texto solto: é o campo
      previsto para registro externo, e `propertyID` é o que diz de que
      registro se trata. Mesmo padrão já usado para o CRM dos médicos.
    */
    identifier: [
      { "@type": "PropertyValue", propertyID: "CNPJ", value: AMI.cnpj },
    ],
    foundingDate: AMI.fundadaEm,
    /* `sameAs` liga a entidade aos perfis oficiais dela em outros lugares.
       É o que impede o Google de tratar o site e o Instagram como duas
       organizações diferentes de nome parecido. */
    sameAs: [AMI.redes.instagram],
    areaServed: "Imperatriz, MA, Brasil",
  };
}

export function physician(m: Medico, siteUrl: string) {
  const principal = m.especialidades.find((e) => e.principal) ?? m.especialidades[0];
  const local = m.locais[0];

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
          ...(numeroPreenchido(local.telefone) ? { telephone: local.telefone } : {}),
        }
      : {}),
    /* Sem `availableService` de telemedicina: o perfil não mostra isso na
       tela, e dado estruturado sem o equivalente visível é marcação
       enganosa. O dado continua no banco e no painel. */
    memberOf: {
      "@type": "Organization",
      name: "Associação Médica de Imperatriz",
      url: siteUrl,
    },
  };
}

/* Uma das larguras do `srcset` da capa (`LARGURAS_DA_CAPA`, lib/noticias.ts). */
export const LARGURA_DA_IMAGEM = 1200;

/*
  NewsArticle das publicações da AMI.

  `author` sai como Person com `identifier` carregando o CRM, na mesma forma
  estruturada que `physician()` usa mais abaixo neste arquivo (array de
  `PropertyValue`, e não uma string solta como `"CRM/MA 10274"`): as duas
  formas são válidas pelo schema.org, mas ter a mesma informação em duas
  formas diferentes no mesmo arquivo, sem explicação, é a dívida que confunde
  quem mexer aqui depois sem saber qual é o padrão da casa. `PropertyValue`
  também é mais preciso: separa o identificador do conselho (`propertyID:
  "CRM"`) do valor em si, em vez de embutir os dois numa única string que um
  consumidor teria de reanalisar.

  `image` é a capa que a página serve (`capaDaNoticia`, lib/noticias.ts):
  a de 1200px de largura do `srcset` dela, recortada em 16:9 pelo ponto de
  interesse, e declarada com o tamanho servido, 1200 × 675, e não com o do
  arquivo original. A documentação de dados estruturados do Google lista
  `image` como necessária para elegibilidade em resultados ricos (Top
  Stories, Discover); omiti-la quando o dado está ao alcance seria abrir mão
  de alcance de graça. Quando a página não desenha a capa (sem capa, ou com
  `_ref` malformado, quando `urlRecortada` devolve "" e `capaDaNoticia`,
  null), a chave some do objeto, no mesmo padrão condicional de
  `dateModified`.

  Nenhum `AggregateRating` em lugar nenhum: CFM 2.336/2023, Art. 11, XIII.
*/
export function newsArticle(
  n: Pick<
    Noticia,
    | "titulo"
    | "slug"
    | "resumo"
    | "publicadoEm"
    | "atualizadoEm"
    | "autor"
    | "capa"
  >,
  siteUrl: string,
) {
  /* O mesmo endereço da largura de 1200px de `capaDaNoticia`; com a
     referência quebrada, "", como lá. */
  const imagemUrl = n.capa ? urlRecortada(n.capa, LARGURA_DA_IMAGEM, alturaDaCapa(LARGURA_DA_IMAGEM)) : "";

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
    ...(imagemUrl
      ? {
          image: {
            "@type": "ImageObject" as const,
            url: imagemUrl,
            width: LARGURA_DA_IMAGEM,
            height: alturaDaCapa(LARGURA_DA_IMAGEM),
          },
        }
      : {}),
    author: {
      "@type": "Person" as const,
      name: n.autor.nome,
      identifier: [
        {
          "@type": "PropertyValue" as const,
          propertyID: "CRM",
          value: `${n.autor.crmUf}-${n.autor.crm}`,
        },
      ],
    },
    publisher: {
      "@type": "Organization" as const,
      name: "Associação Médica de Imperatriz",
      url: siteUrl,
    },
  };
}

/**
 * Entra em toda página de listagem, com a ordem exata dos resultados.
 *
 * Recebe nome e caminho, e não `Medico[]`: enquanto o tipo era o do
 * diretório, o índice de notícias não tinha como reusar e ficou sem o
 * `ItemList` que a spec, seção 7, pede em toda listagem. Com
 * `{ nome, caminho }`, quem escreve uma listagem nova não precisa decidir
 * nada.
 */
export function itemList(
  itens: { nome: string; caminho: string }[],
  siteUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: itens.length,
    itemListElement: itens.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.nome,
      url: `${siteUrl}${it.caminho}`,
    })),
  };
}

/** Adapta a lista do diretório à forma que `itemList` recebe. */
export function comoItensDeLista(medicos: Medico[]) {
  return medicos.map((m) => ({ nome: m.nome, caminho: `/medico/${m.slug}` }));
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
