import type { PortableTextBlock } from "@portabletext/react";
import { ancorasUnicas, type ItemDoIndice } from "@/lib/nestaPagina";
import type { AvisoDoRascunho, RascunhoLegal } from "@/lib/rascunhosLegais";
import type { PaginaInstitucional } from "@/lib/sanity/tipos";

/*
  O que o modelo de página de texto decide, em funções puras
  (testes/paginas-de-texto.test.ts):
  - o link de volta da faixa verde;
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

/**
 * A marca do que falta num rascunho, no começo do parágrafo. É a mesma do
 * documento que vai ao advogado (scripts/gerar-doc-legal.ts), onde ela
 * fica; na tela, ela nunca aparece.
 */
export const MARCA_PROVISORIA = "[PROVISÓRIO] ";

export type ParagrafoNaTela = { estilo: "normal" | "aEntrar"; texto: string };

/**
 * Um parágrafo do rascunho na tela. O comum sai como está. O marcado sai
 * sem a marca, desenhado como moldura "a entrar", quando `comMoldura`;
 * senão, não existe (null). Quem decide é a rota: nas páginas da
 * associação, é a chave de demonstração; nos três textos legais, é sempre
 * `true`, porque um texto legal não pode perder calado um item
 * obrigatório.
 */
export function paragrafoDoRascunho(texto: string, comMoldura: boolean): ParagrafoNaTela | null {
  if (!texto.startsWith(MARCA_PROVISORIA)) return { estilo: "normal", texto };
  return comMoldura ? { estilo: "aEntrar", texto: texto.slice(MARCA_PROVISORIA.length) } : null;
}

/*
  Os números que não podem quebrar no meio da linha: telefone com DDD,
  CNPJ e CEP. O navegador quebra depois do hífen, e "65900-" numa linha com
  "330" na seguinte é o que o desenho evita (`.coluna .num`, sem quebra).
*/
const NUMERO_INTEIRO = /\(\d{2}\) \d{4,5}-\d{4}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{5}-\d{3}/g;

/** O texto em trechos, com os números de `NUMERO_INTEIRO` em trechos próprios. */
export function trechosDoTexto(texto: string): { texto: string; numero: boolean }[] {
  const trechos: { texto: string; numero: boolean }[] = [];
  let desde = 0;
  for (const m of texto.matchAll(NUMERO_INTEIRO)) {
    if (m.index > desde) trechos.push({ texto: texto.slice(desde, m.index), numero: false });
    trechos.push({ texto: m[0], numero: true });
    desde = m.index + m[0].length;
  }
  if (desde < texto.length) trechos.push({ texto: texto.slice(desde), numero: false });
  return trechos;
}

/**
 * O rascunho em texto rico, no formato do Studio: cada seção vira um h2,
 * cada parágrafo um bloco (o marcado, no estilo "aEntrar", e só com
 * `comMoldura`: ver `paragrafoDoRascunho`), o subtítulo da lista um h3 e
 * cada item da lista um bloco com marcador. As chaves
 * ("r0", "r1"…) são únicas na página: o índice acha os h2 por elas. O
 * telefone, o CNPJ e o CEP no meio do texto vão num trecho com a marca
 * "numero" (`trechosDoTexto`), que o corpo desenha sem quebra.
 */
export function blocosDoRascunho(rascunho: RascunhoLegal, comMoldura: boolean): PortableTextBlock[] {
  const blocos: PortableTextBlock[] = [];
  const bloco = (estilo: string, texto: string, lista = false) => {
    const chave = `r${blocos.length}`;
    const trechos = trechosDoTexto(texto);
    const children =
      trechos.some((t) => t.numero)
        ? trechos.map((t, i) => ({
            _type: "span",
            _key: `${chave}s${i}`,
            text: t.texto,
            marks: t.numero ? ["numero"] : [],
          }))
        : [{ _type: "span", _key: `${chave}s`, text: texto, marks: [] }];
    blocos.push({
      _type: "block",
      _key: chave,
      style: estilo,
      markDefs: [],
      children,
      ...(lista ? { listItem: "bullet", level: 1 } : {}),
    });
  };

  for (const secao of rascunho.secoes) {
    bloco("h2", secao.titulo);
    for (const paragrafo of secao.paragrafos) {
      const naTela = paragrafoDoRascunho(paragrafo, comMoldura);
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

export function conteudoDoRascunho(rascunho: RascunhoLegal, comMoldura: boolean): ConteudoDaPagina {
  return {
    titulo: rascunho.titulo,
    resumo: rascunho.resumo,
    atualizadoEm: rascunho.atualizadoEm,
    aviso: rascunho.aviso,
    corpo: blocosDoRascunho(rascunho, comMoldura),
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
  comMoldura: boolean,
): ConteudoDaPagina | null {
  if (revisado) return conteudoDoSanity(revisado);
  if (rascunho) return conteudoDoRascunho(rascunho, comMoldura);
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
