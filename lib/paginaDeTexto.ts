import type { PortableTextBlock } from "@portabletext/react";
import type { NomeIcone } from "@/components/base/IconeServidor";
import { ancorasUnicas, type ItemDoIndice } from "@/lib/nestaPagina";
import type { AvisoDoRascunho, RascunhoLegal } from "@/lib/rascunhosLegais";
import type { PaginaInstitucional } from "@/lib/sanity/tipos";

/*
  O que o modelo de página de texto decide, em funções puras
  (testes/paginas-de-texto.test.ts):
  - o link de volta da faixa verde;
  - o ícone de cada página;
  - o rascunho em código transformado em texto rico, o mesmo formato do
    Studio, para um componente só desenhar os dois
    (components/editorial/CorpoDoTexto.tsx);
  - qual texto a página mostra: o do Studio, quando a AMI publicou, ou o
    rascunho;
  - as âncoras dos títulos de seção, para o índice "Nesta página".
*/

export type VoltaDaPagina = { href: string; rotulo: string };

/** As páginas sob /associacao voltam à página da associação. */
export const VOLTA_ASSOCIACAO: VoltaDaPagina = { href: "/associacao", rotulo: "A Associação" };

/** As páginas legais, que o rodapé de toda página linka, voltam ao início. */
export const VOLTA_INICIO: VoltaDaPagina = { href: "/", rotulo: "Início" };

/** O ícone da página sem ícone próprio: Benefícios, ou uma nova. */
export const ICONE_DE_PAGINA_PADRAO: NomeIcone = "documento";

/*
  O ícone de cada página de texto, pelo slug, como a spec escolheu
  (Phosphor, duotone). É um `Map`, e não um objeto: num objeto,
  "constructor" e "toString" existiriam como chave.
*/
const ICONES_DAS_PAGINAS = new Map<string, NomeIcone>([
  ["seja-associado", "parceria"],
  ["estatuto", "pergaminho"],
  ["politica-editorial", "artigo"],
  ["politica-de-privacidade", "escudo"],
  ["politica-de-cookies", "biscoito"],
  ["termos-de-uso", "documento"],
]);

export function iconeDaPagina(slug: string): NomeIcone {
  return ICONES_DAS_PAGINAS.get(slug) ?? ICONE_DE_PAGINA_PADRAO;
}

/**
 * A marca do que falta num rascunho, no começo do parágrafo. É a mesma do
 * documento que vai ao advogado (scripts/gerar-doc-legal.ts), onde ela
 * fica; na tela, ela nunca aparece.
 */
export const MARCA_PROVISORIA = "[PROVISÓRIO] ";

export type ParagrafoNaTela = { estilo: "normal" | "aEntrar"; texto: string };

/**
 * Um parágrafo do rascunho na tela. O comum sai como está. O marcado sai
 * sem a marca, desenhado como moldura "a entrar", só na demonstração; fora
 * dela, não existe (null).
 */
export function paragrafoDoRascunho(texto: string, demonstracao: boolean): ParagrafoNaTela | null {
  if (!texto.startsWith(MARCA_PROVISORIA)) return { estilo: "normal", texto };
  return demonstracao ? { estilo: "aEntrar", texto: texto.slice(MARCA_PROVISORIA.length) } : null;
}

/**
 * O rascunho em texto rico, no formato do Studio: cada seção vira um h2,
 * cada parágrafo um bloco (o marcado, no estilo "aEntrar"), o subtítulo da
 * lista um h3 e cada item da lista um bloco com marcador. As chaves
 * ("r0", "r1"…) são únicas na página: o índice acha os h2 por elas.
 */
export function blocosDoRascunho(rascunho: RascunhoLegal, demonstracao: boolean): PortableTextBlock[] {
  const blocos: PortableTextBlock[] = [];
  const bloco = (estilo: string, texto: string, lista = false) => {
    const chave = `r${blocos.length}`;
    blocos.push({
      _type: "block",
      _key: chave,
      style: estilo,
      markDefs: [],
      children: [{ _type: "span", _key: `${chave}s`, text: texto, marks: [] }],
      ...(lista ? { listItem: "bullet", level: 1 } : {}),
    });
  };

  for (const secao of rascunho.secoes) {
    bloco("h2", secao.titulo);
    for (const paragrafo of secao.paragrafos) {
      const naTela = paragrafoDoRascunho(paragrafo, demonstracao);
      if (naTela) bloco(naTela.estilo, naTela.texto);
    }
    if (secao.tituloDaLista) bloco("h3", secao.tituloDaLista);
    for (const item of secao.lista ?? []) bloco("normal", item, true);
  }
  return blocos;
}

/** O que a página de texto desenha, venha do Studio ou do rascunho. */
export type ConteudoDaPagina = {
  titulo: string;
  resumo: string;
  /** "2026-08-23" no rascunho; data e hora no Studio. */
  atualizadoEm: string;
  /** O quadro no alto do texto. Só o rascunho tem. */
  aviso: AvisoDoRascunho | null;
  corpo: PortableTextBlock[];
};

export function conteudoDoRascunho(rascunho: RascunhoLegal, demonstracao: boolean): ConteudoDaPagina {
  return {
    titulo: rascunho.titulo,
    resumo: rascunho.resumo,
    atualizadoEm: rascunho.atualizadoEm,
    aviso: rascunho.aviso,
    corpo: blocosDoRascunho(rascunho, demonstracao),
  };
}

export function conteudoDoSanity(pagina: PaginaInstitucional): ConteudoDaPagina {
  return {
    titulo: pagina.titulo,
    resumo: pagina.resumo,
    atualizadoEm: pagina.atualizadoEm,
    aviso: null,
    corpo: pagina.corpo,
  };
}

/**
 * O texto da página: o revisado, do Studio, sempre vence; sem ele, o
 * rascunho em código; sem os dois, a página não existe (null).
 */
export function conteudoDaPagina(
  revisado: PaginaInstitucional | null,
  rascunho: RascunhoLegal | null | undefined,
  demonstracao: boolean,
): ConteudoDaPagina | null {
  if (revisado) return conteudoDoSanity(revisado);
  if (rascunho) return conteudoDoRascunho(rascunho, demonstracao);
  return null;
}

export type AncoraDoCorpo = ItemDoIndice & { chave: string };

/* O texto de um bloco, das partes dele, sem os espaços das pontas. */
function textoDoBloco(bloco: PortableTextBlock): string {
  return (bloco.children ?? [])
    .map((parte) => {
      const texto = (parte as { text?: unknown }).text;
      return typeof texto === "string" ? texto : "";
    })
    .join("")
    .trim();
}

/**
 * Os títulos de seção (h2) do texto, na ordem, com a âncora única de cada
 * um e a chave do bloco, por onde o h2 recebe o `id`. Título em branco não
 * entra.
 */
export function ancorasDoCorpo(corpo: PortableTextBlock[]): AncoraDoCorpo[] {
  const titulos = corpo
    .filter((bloco) => bloco._type === "block" && bloco.style === "h2")
    .map((bloco) => ({ chave: bloco._key ?? "", titulo: textoDoBloco(bloco) }))
    .filter((t) => t.titulo !== "");
  return ancorasUnicas(titulos.map((t) => t.titulo)).map((item, i) => ({ ...item, chave: titulos[i].chave }));
}
