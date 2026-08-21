import { defineQuery } from "next-sanity";
import { obterCliente } from "@/lib/sanity/cliente";
import { CAMINHO_DAS_PAGINAS } from "@/lib/sanity/paginas";
import type {
  Noticia,
  PaginaInstitucional,
  ResumoNoticia,
} from "@/lib/sanity/tipos";

/*
  A única porta de leitura do Sanity, espelhando o papel de `lib/dados/`.

  As consultas são constantes exportadas, e não texto embutido nas funções,
  porque os testes as inspecionam. Uma projeção GROQ errada não produz exceção
  nenhuma: o campo volta `undefined` e a tela fica com um buraco silencioso.
  Poder afirmar em teste que a projeção contém `crm` é a única defesa barata
  contra isso.
*/

/* --- etiquetas de cache ---
   O webhook da tarefa 4 invalida por estas strings. Elas são a junta entre os
   dois lados, então vivem aqui e nunca são escritas à mão do outro lado.

   O corte em 200 caracteres respeita o teto de 256 que o Next impõe a
   etiqueta. Um slug absurdamente longo não é caso realista, mas etiqueta
   recusada faria a invalidação falhar em silêncio. */
export const ETIQUETA_NOTICIAS = "noticias";
export const etiquetaDeNoticia = (slug: string) =>
  `noticia:${slug.slice(0, 200)}`;
export const etiquetaDePagina = (slug: string) =>
  `pagina:${slug.slice(0, 200)}`;

const PROJECAO_AUTOR = `autor->{nome, crm, crmUf, slugDoPerfil}`;
const PROJECAO_CAPA = `capa{asset, alt}`;

/*
  A fatia é interpolada no texto, e não passada como parâmetro.

  GROQ NÃO aceita parâmetro em fatia. `[0...$limite]` é recusado pelo
  analisador com "slicing must use constant numbers", porque a sintaxe de
  fatia é ambígua com a de filtro e o analisador exige literal ali. Descoberto
  na varredura anterior à execução; a primeira versão deste plano usava
  parâmetro e teria quebrado só contra o banco real, porque teste de string
  não alcança isso.

  Interpolar valor em consulta é injeção quando o valor vem de fora, então o
  limite passa por uma trava antes de virar texto: inteiro, entre 1 e 100. Hoje
  quem chama é sempre código nosso (a home pede 3, o índice pede 20), e a trava
  é justamente o que garante que continue assim depois que alguém acrescentar
  uma tela nova que passe um valor vindo da URL.
*/
export function groqListaNoticias(limite: number): string {
  const n = Math.trunc(limite);
  if (!Number.isFinite(n) || n < 1 || n > 100) {
    throw new Error(
      `Limite de notícias fora da faixa aceita, de 1 a 100: ${limite}`,
    );
  }

  return `
  *[_type == "noticia" && defined(slug.current)]
  | order(publicadoEm desc)[0...${n}]{
    titulo,
    "slug": slug.current,
    resumo,
    publicadoEm,
    ${PROJECAO_CAPA},
    ${PROJECAO_AUTOR}
  }
`;
}

export const GROQ_NOTICIA = defineQuery(`
  *[_type == "noticia" && slug.current == $slug][0]{
    titulo,
    "slug": slug.current,
    resumo,
    publicadoEm,
    atualizadoEm,
    ${PROJECAO_CAPA},
    ${PROJECAO_AUTOR},
    corpo[]{..., asset, alt, legenda}
  }
`);

export const GROQ_SLUGS_NOTICIAS = defineQuery(`
  *[_type == "noticia" && defined(slug.current)].slug.current
`);

export const GROQ_PAGINA = defineQuery(`
  *[_type == "paginaInstitucional" && slug.current == $slug][0]{
    titulo,
    "slug": slug.current,
    resumo,
    atualizadoEm,
    corpo
  }
`);

/*
  `CAMINHO_DAS_PAGINAS` (o endereço das seis páginas de prosa) e
  `slugsDePaginasSobAssociacao` viviam aqui até a rodada 2 de revisão da
  tarefa 11, que achou uma terceira lista independente da mesma
  correspondência dentro de `sanity/schemas/paginaInstitucional.ts`. Foram
  movidos para `lib/sanity/paginas.ts`, um módulo sem import nenhum, para
  que o schema (carregado pelo Studio no navegador, sem `.env.local`) possa
  importar de lá sem arrastar `obterCliente` e a validação de ambiente deste
  arquivo para dentro do Studio. Ver o comentário completo lá.
*/

export const GROQ_SLUGS_PAGINAS = defineQuery(`
  *[_type == "paginaInstitucional" && slug.current in $slugs].slug.current
`);

/* --- funções ---
   `next: { tags }` é o que liga a consulta à etiqueta. Sem `revalidate`
   declarado: o padrão do segmento (`export const revalidate = 3600` nas
   páginas) já dá o piso de tempo, e a invalidação por webhook cobre o resto.
   Declarar os dois aqui só criaria duas fontes de verdade sobre validade. */

export async function listarNoticias(limite = 20): Promise<ResumoNoticia[]> {
  const cliente = await obterCliente();
  return cliente.fetch(
    groqListaNoticias(limite),
    {},
    { next: { tags: [ETIQUETA_NOTICIAS] } },
  );
}

export async function noticiaPorSlug(slug: string): Promise<Noticia | null> {
  const cliente = await obterCliente();
  return cliente.fetch(
    GROQ_NOTICIA,
    { slug },
    /* Duas etiquetas: a específica, para quando esta matéria é editada, e a
       coletiva, para quando uma matéria nova entra e muda a navegação de
       "anterior/próxima" que a página desenha. */
    { next: { tags: [etiquetaDeNoticia(slug), ETIQUETA_NOTICIAS] } },
  );
}

export async function slugsDeNoticias(): Promise<string[]> {
  const cliente = await obterCliente();
  return cliente.fetch(
    GROQ_SLUGS_NOTICIAS,
    {},
    { next: { tags: [ETIQUETA_NOTICIAS] } },
  );
}

export async function paginaPorSlug(
  slug: string,
): Promise<PaginaInstitucional | null> {
  const cliente = await obterCliente();
  return cliente.fetch(
    GROQ_PAGINA,
    { slug },
    { next: { tags: [etiquetaDePagina(slug)] } },
  );
}

/*
  Endereços completos (não slugs) das páginas de prosa que já estão
  publicadas no Sanity, restrito às seis que `CAMINHO_DAS_PAGINAS` conhece.

  O filtro `slug.current in $slugs` acontece na própria consulta, e não
  depois em memória: um documento `paginaInstitucional` fora da lista (um
  rascunho de página futura, por exemplo) nunca devolve do banco, então nunca
  arrisca aparecer aqui sem que alguém tenha decidido o endereço dele antes.

  As seis etiquetas de cache, uma por página, são exatamente as que o webhook
  da tarefa 4 já invalida por `etiquetaDePagina(slug)`. Não existe etiqueta
  coletiva para `paginaInstitucional`, ao contrário de `ETIQUETA_NOTICIAS`;
  então esta consulta se inscreve nas seis, e publicar qualquer uma delas
  invalida exatamente a entrada de cache que a lista abaixo produziu.
*/
export async function caminhosDePaginasPublicadas(): Promise<string[]> {
  const slugsConhecidos = Object.keys(CAMINHO_DAS_PAGINAS);
  const cliente = await obterCliente();
  const publicados: string[] = await cliente.fetch(
    GROQ_SLUGS_PAGINAS,
    { slugs: slugsConhecidos },
    { next: { tags: slugsConhecidos.map(etiquetaDePagina) } },
  );
  return publicados.map((slug) => CAMINHO_DAS_PAGINAS[slug]);
}
