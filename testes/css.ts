import { expect } from "vitest";

/*
  Para ler CSS nos testes: o navegador é quem aplica, então o teste confere a
  regra escrita. Sem comentário (a prosa que explica uma regra não pode casar
  com a asserção que a procura), por bloco de @media e por regra.
*/

/** O CSS sem os comentários. */
export function semNotas(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** O conteúdo entre as chaves do bloco que começa com `abre` (um @media), contando chaves. */
export function bloco(css: string, abre: string): string {
  const ini = css.indexOf(`${abre} {`);
  expect(ini, `falta o bloco ${abre}`).toBeGreaterThan(-1);
  let nivel = 0;
  for (let i = css.indexOf("{", ini); i < css.length; i++) {
    if (css[i] === "{") nivel++;
    if (css[i] === "}" && --nivel === 0) return css.slice(css.indexOf("{", ini) + 1, i);
  }
  throw new Error(`bloco ${abre} sem fim`);
}

/** O corpo de `seletor { ... }`, com o seletor começando a linha. */
export function regra(css: string, seletor: string): string {
  const alvo = `${seletor} {`;
  for (let k = css.indexOf(alvo); k > -1; k = css.indexOf(alvo, k + 1)) {
    if (css.slice(css.lastIndexOf("\n", k - 1) + 1, k).trim() === "") {
      return css.slice(k, css.indexOf("}", k));
    }
  }
  throw new Error(`falta a regra ${seletor}`);
}

/** O CSS fora de qualquer @media: o que vale no computador. */
export function base(css: string): string {
  let saida = "";
  let i = 0;
  while (i < css.length) {
    const m = css.indexOf("@media", i);
    if (m === -1) return saida + css.slice(i);
    saida += css.slice(i, m);
    let nivel = 0;
    let j = css.indexOf("{", m);
    for (; j < css.length; j++) {
      if (css[j] === "{") nivel++;
      if (css[j] === "}" && --nivel === 0) break;
    }
    i = j + 1;
  }
  return saida;
}
