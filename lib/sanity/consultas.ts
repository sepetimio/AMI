import { defineQuery } from "next-sanity";
import { obterCliente } from "@/lib/sanity/cliente";
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
  As seis páginas de prosa institucional e legal, e o endereço de cada uma.

  O slug do Sanity não é o caminho da URL: três páginas vivem sob
  `/associacao` (a mesma lista que `app/(site)/associacao/[pagina]/page.tsx`
  aceita) e três são rotas de primeiro nível, cujo slug já é o segmento
  inteiro. Essa correspondência é o defeito que o brief da tarefa 11 tinha:
  ele mandava listar as seis no sitemap como entradas fixas, mas todas dão
  404 hoje porque o dataset está vazio. A correção é derivar do que existe
  publicado, e fazer isso a partir de UM mapeamento, aqui, em vez de espalhar
  "estatuto vira /associacao/estatuto" pelo sitemap e por qualquer outro
  lugar que um dia precise da mesma tradução.
*/
export const CAMINHO_DAS_PAGINAS: Readonly<Record<string, string>> = {
  beneficios: "/associacao/beneficios",
  estatuto: "/associacao/estatuto",
  "politica-editorial": "/associacao/politica-editorial",
  "politica-de-privacidade": "/politica-de-privacidade",
  "termos-de-uso": "/termos-de-uso",
  "politica-de-cookies": "/politica-de-cookies",
};

/*
  Achado da rodada 1 de revisão: `CAMINHO_DAS_PAGINAS` não era, de fato, a
  fonte única. `app/(site)/associacao/[pagina]/page.tsx` mantinha seu próprio
  array `PAGINAS`, escrito à mão, com os mesmos três slugs. Nada impedia as
  duas listas de divergirem: alguém acrescenta uma sétima página sob
  `/associacao` aqui e esquece de tocar `PAGINAS`, e a página nunca aparece
  no sitemap, em silêncio, para sempre. É a mesma classe de defeito que esta
  tarefa corrigiu no sitemap, um nível abaixo.

  A correção deriva `PAGINAS` DESTA função, não o contrário. Função pura
  aqui, em vez de o `page.tsx` decidir e este arquivo importar de lá, por
  duas razões: `lib/` é a camada que `app/` consulta, nunca o inverso (o
  `sitemap.ts` já depende deste módulo; se este módulo passasse a depender
  de um arquivo de rota, o sentido da dependência viraria bagunça e abriria
  caminho para import circular); e as três chaves de `/associacao/*` já
  precisam ficar decididas aqui mesmo, porque `CAMINHO_DAS_PAGINAS` é onde
  o endereço completo de qualquer página nova (sob `/associacao` ou raiz)
  é escolhido primeiro. `PAGINAS`, ao contrário, é só um recorte que
  interessa a uma rota específica.

  Função pura, sem `obterCliente`: `generateStaticParams` do `page.tsx`
  chama isto em tempo de build, de forma síncrona, e puxar o cliente do
  Sanity para dentro de um módulo que hoje é seguro de importar sem
  `.env.local` foi exatamente o defeito Crítico da tarefa 3.
*/
export function slugsDePaginasSobAssociacao(): string[] {
  return Object.entries(CAMINHO_DAS_PAGINAS)
    .filter(([, caminho]) => caminho.startsWith("/associacao/"))
    .map(([slug]) => slug);
}

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
