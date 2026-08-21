import {
  ETIQUETA_NOTICIAS,
  etiquetaDeNoticia,
  etiquetaDePagina,
} from "@/lib/sanity/consultas";

type DocumentoDoWebhook = {
  _type?: string;
  slug?: { current?: string };
};

/*
  Traduz o documento que o Sanity mandou no webhook para as etiquetas de cache
  que precisam ser invalidadas.

  Separado do handler de rota porque isto é função pura e o handler não é:
  ele depende de assinatura HMAC e do `revalidateTag` do Next, nenhum dos dois
  testável barato. Aqui a regra fica coberta; lá sobram cinco linhas.
*/
export function etiquetasDoDocumento(doc: DocumentoDoWebhook): string[] {
  const slug = doc.slug?.current;

  switch (doc._type) {
    case "noticia":
      return slug
        ? [etiquetaDeNoticia(slug), ETIQUETA_NOTICIAS]
        : [ETIQUETA_NOTICIAS];

    case "paginaInstitucional":
      return slug ? [etiquetaDePagina(slug)] : [];

    case "autor":
      /* Ver o comentário longo no teste: o autor vem resolvido dentro de cada
         notícia, e o webhook não sabe quais ele assinou. */
      return [ETIQUETA_NOTICIAS];

    default:
      return [];
  }
}
