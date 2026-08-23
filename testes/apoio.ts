import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Lê um arquivo do repositório, a partir da pasta `testes/`. */
export function fonte(relativo: string): string {
  return readFileSync(fileURLToPath(new URL(relativo, import.meta.url)), "utf8");
}

/*
  Comentário não é código.

  Varredura de código-fonte existe para restringir o que o código FAZ, e
  comentário não faz nada: não concede permissão, não chama função, não mostra
  frase a ninguém. Varrer prosa junto produz uma colisão que já apareceu quatro
  vezes neste ramo — o comentário que explica a regra contendo a expressão que
  a regra proíbe.

  Ingênuo de propósito: não entende `//` dentro de string nem de expressão
  regular. Nenhum arquivo do painel usa isso, e errar aqui deixa passar em vez
  de reprovar por engano — daí o teste que segue, que confere que ele ainda vê
  código de verdade.
*/
export function semComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

/*
  O irmão de `semComentarios` para SQL.

  `--` é comentário de linha em SQL, mas é decremento em JavaScript — por isso
  `semComentarios` nunca poderia tratar `--` sem quebrar todo arquivo `.ts`
  que decrementa uma variável. Sem uma função própria para SQL, uma linha como
  `-- Nao existe policy on horario for delete` sobrevive à varredura e casa
  com a regex que procura exatamente essa concessão, derrubando o teste por um
  comentário inócuo em vez de por uma política real.

  Mesmo ingênuo de propósito que o irmão: não entende `--` dentro de string
  nem de expressão regular. Nenhum arquivo `.sql` deste projeto usa isso.
*/
export function semComentariosSql(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "");
}
