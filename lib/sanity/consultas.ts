import type { PortableTextBlock } from "@portabletext/react";
import { defineQuery } from "next-sanity";
import { mesDeAno } from "@/lib/especialidades";
import { imagemComSrcset } from "@/lib/sanity/banners";
import { obterCliente } from "@/lib/sanity/cliente";
import { CAMINHO_DAS_PAGINAS } from "@/lib/sanity/paginas";
import type {
  EmpresaParceira,
  ImagemSanity,
  Noticia,
  PaginaInstitucional,
  ResumoNoticia,
  TextoDeEspecialidade,
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
export const ETIQUETA_PARCEIRAS = "parceiras";
export const ETIQUETA_TEXTOS_DE_ESPECIALIDADE = "textos-de-especialidade";
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
  `CAMINHO_DAS_PAGINAS` (o endereço das sete páginas de prosa) e
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
  publicadas no Sanity, restrito às sete que `CAMINHO_DAS_PAGINAS` conhece.

  O filtro `slug.current in $slugs` acontece na própria consulta, e não
  depois em memória: um documento `paginaInstitucional` fora da lista (um
  rascunho de página futura, por exemplo) nunca devolve do banco, então nunca
  arrisca aparecer aqui sem que alguém tenha decidido o endereço dele antes.

  As sete etiquetas de cache, uma por página, são exatamente as que o webhook
  da tarefa 4 já invalida por `etiquetaDePagina(slug)`. Não existe etiqueta
  coletiva para `paginaInstitucional`, ao contrário de `ETIQUETA_NOTICIAS`;
  então esta consulta se inscreve nas sete, e publicar qualquer uma delas
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

/* --- empresas parceiras --- */

/*
  As empresas parceiras da faixa "Quem caminha com a AMI" e do quarto número
  da home. Sem nome ou sem logotipo, a empresa nem sai do banco: não há o
  que desenhar, e ela não pode contar no número sem aparecer na faixa.

  A ordem não é decidida aqui, e sim em `paraEmpresasParceiras`: o GROQ
  compara texto letra a letra pelo código, e um nome com acento no começo
  ("Óptica") iria para depois do "Z".
*/
export const GROQ_EMPRESAS_PARCEIRAS = defineQuery(`
  *[_type == "empresaParceira" && defined(nome) && defined(logotipo.asset)]{
    "id": _id,
    nome,
    logotipo{asset},
    site,
    ordem
  }
`);

/* As larguras pedidas ao CDN. A caixa do logotipo tem até 266px de largura
   útil (no tablet, a 980px de tela); 640 cobre essa caixa numa tela de
   densidade 2. Quem diz ao navegador a largura de cada caixa é o `sizes` de
   components/home/EmpresasParceiras.tsx. */
export const LARGURAS_DO_LOGOTIPO = [160, 320, 480, 640] as const;

export type EmpresaParceiraCrua = {
  id: string;
  nome: string | null;
  logotipo: { asset: ImagemSanity["asset"] } | null;
  site: string | null;
  ordem: number | null;
};

/* Só endereço http ou https vira link. O campo `site` do Studio já recusa
   outro esquema, mas é o site que põe o endereço num `href`: um
   `javascript:` que passasse por fora do Studio seria código rodando no
   clique. */
export function siteSeguro(site: string | null | undefined): string | null {
  if (!site) return null;
  try {
    const u = new URL(site);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

/*
  Pura, como `paraBanner`, para testar sem rede. Monta as parceiras a partir
  do que o GROQ devolveu, nesta ordem: primeiro as que têm `ordem`, da menor
  para a maior; depois as sem ordem. Em cada grupo, e no empate, pelo nome,
  em ordem alfabética do português.

  Nome em branco e logotipo cujo endereço o CDN não monta (o `_ref`
  quebrado de `paraBanner`) tiram a empresa da lista.
*/
export function paraEmpresasParceiras(cruas: EmpresaParceiraCrua[]): EmpresaParceira[] {
  const montadas: { parceira: EmpresaParceira; ordem: number | null }[] = [];
  for (const c of cruas) {
    const nome = c.nome?.trim() ?? "";
    const logotipo = imagemComSrcset(c.logotipo, LARGURAS_DO_LOGOTIPO);
    if (!nome || !logotipo) continue;
    montadas.push({
      parceira: {
        id: c.id,
        nome,
        logotipo: logotipo.url,
        logotipoSrcset: logotipo.srcset,
        site: siteSeguro(c.site),
      },
      ordem: typeof c.ordem === "number" && Number.isFinite(c.ordem) ? c.ordem : null,
    });
  }

  montadas.sort((a, b) => {
    if (a.ordem !== b.ordem) {
      if (a.ordem === null) return 1;
      if (b.ordem === null) return -1;
      return a.ordem - b.ordem;
    }
    return a.parceira.nome.localeCompare(b.parceira.nome, "pt-BR");
  });

  return montadas.map((m) => m.parceira);
}

export async function listarEmpresasParceiras(): Promise<EmpresaParceira[]> {
  const cliente = await obterCliente();
  const cruas: EmpresaParceiraCrua[] = await cliente.fetch(
    GROQ_EMPRESAS_PARCEIRAS,
    {},
    { next: { tags: [ETIQUETA_PARCEIRAS] } },
  );
  return paraEmpresasParceiras(cruas ?? []);
}

/* --- textos de especialidade --- */

/*
  O "Sobre a {especialidade}" de uma especialidade, pelo slug. Com dois
  documentos da mesma especialidade, o que o Studio recusa mas pode chegar
  por fora dele, vale o atualizado por último.
*/
export const GROQ_TEXTO_DE_ESPECIALIDADE = defineQuery(`
  *[_type == "textoDeEspecialidade" && especialidade.current == $especialidade]
  | order(_updatedAt desc)[0]{
    oQueFaz,
    quandoProcurar,
    revisorNome,
    revisorCrm,
    revisadoEm
  }
`);

export type TextoDeEspecialidadeCru = {
  oQueFaz: PortableTextBlock[] | null;
  quandoProcurar: PortableTextBlock[] | null;
  revisorNome: string | null;
  revisorCrm: string | null;
  revisadoEm: string | null;
};

/* Um texto rico tem texto quando algum trecho de algum bloco dele não está
   em branco. */
function temTexto(blocos: PortableTextBlock[] | null): blocos is PortableTextBlock[] {
  if (!Array.isArray(blocos)) return false;
  return blocos.some((b) => {
    const { _type, children } = b as { _type?: unknown; children?: unknown };
    return (
      _type === "block" &&
      Array.isArray(children) &&
      children.some((t) => {
        const texto = (t as { text?: unknown } | null)?.text;
        return typeof texto === "string" && texto.trim() !== "";
      })
    );
  });
}

/*
  Pura, como `paraEmpresasParceiras`, para testar sem rede. Monta o texto a
  partir do que o GROQ devolveu, só se estiver completo:
  - os dois textos com alguma letra;
  - o nome e o CRM do revisor preenchidos;
  - a data no formato do Studio.

  Faltando qualquer um, devolve null, e a página trata como especialidade
  sem texto (`sobreDaEspecialidade`, lib/especialidades.ts).
*/
export function paraTextoDeEspecialidade(
  cru: TextoDeEspecialidadeCru | null,
): TextoDeEspecialidade | null {
  if (!cru) return null;
  const revisorNome = cru.revisorNome?.trim() ?? "";
  const revisorCrm = cru.revisorCrm?.trim() ?? "";
  const mesDaRevisao = mesDeAno(cru.revisadoEm);
  if (
    !temTexto(cru.oQueFaz) ||
    !temTexto(cru.quandoProcurar) ||
    !revisorNome ||
    !revisorCrm ||
    !mesDaRevisao
  ) {
    return null;
  }
  return {
    oQueFaz: cru.oQueFaz,
    quandoProcurar: cru.quandoProcurar,
    revisorNome,
    revisorCrm,
    mesDaRevisao,
  };
}

export async function textoDaEspecialidade(
  especialidade: string,
): Promise<TextoDeEspecialidade | null> {
  const cliente = await obterCliente();
  const cru: TextoDeEspecialidadeCru | null = await cliente.fetch(
    GROQ_TEXTO_DE_ESPECIALIDADE,
    { especialidade },
    { next: { tags: [ETIQUETA_TEXTOS_DE_ESPECIALIDADE] } },
  );
  return paraTextoDeEspecialidade(cru ?? null);
}
