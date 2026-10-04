/*
  O índice "Nesta página" das páginas de texto, em funções puras:
  - a âncora de cada título de seção;
  - quando o índice aparece;
  - qual seção está sendo lida.

  Sem import nenhum, de propósito: o índice da lateral é componente de
  navegador (components/editorial/IndiceNestaPagina.tsx) e leva este
  arquivo junto para lá.
*/

export type ItemDoIndice = { id: string; titulo: string };

/**
 * A âncora de um título: sem acento, em minúsculas, com hífen no lugar do
 * resto, e o prefixo "secao-". O prefixo não deixa a âncora colidir com um
 * id fixo da página, como o `conteudo` do `<main>` ou a `gaveta` do menu.
 */
export function ancoraDoTitulo(titulo: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `secao-${base}` : "secao";
}

/** Os títulos com âncora única, na ordem: a repetida ganha "-2", "-3". */
export function ancorasUnicas(titulos: string[]): ItemDoIndice[] {
  const usadas = new Set<string>();
  return titulos.map((titulo) => {
    const base = ancoraDoTitulo(titulo);
    let id = base;
    for (let n = 2; usadas.has(id); n++) id = `${base}-${n}`;
    usadas.add(id);
    return { id, titulo };
  });
}

/** Com menos de dois títulos, um índice não ajuda a ler. */
export const MINIMO_DO_INDICE = 2;

/** O índice "Nesta página": os itens, ou nenhum quando são menos de dois. */
export function indiceNestaPagina(itens: ItemDoIndice[]): ItemDoIndice[] {
  return itens.length >= MINIMO_DO_INDICE ? itens : [];
}

/**
 * A linha de leitura, em pixels do topo da janela: o título que passou
 * dela abre a seção que está sendo lida. É a do desenho aprovado, abaixo
 * do cabeçalho preso.
 */
export const LINHA_DE_LEITURA = 140;

/**
 * A seção que está sendo lida, pela posição de cada título (`topos`, o
 * topo de cada um em relação à janela, na ordem da página): a última cujo
 * título já chegou à linha de leitura; nenhuma passou, a primeira. No fim
 * da página (`noFim`), a última, porque o título dela pode nunca chegar à
 * linha. Sem títulos, -1.
 */
export function secaoAtual(topos: number[], linha: number, noFim: boolean): number {
  if (topos.length === 0) return -1;
  if (noFim) return topos.length - 1;
  let atual = 0;
  topos.forEach((topo, i) => {
    if (topo <= linha) atual = i;
  });
  return atual;
}
