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

/*
  Cortar um arquivo de ações por ação.

  Toda garantia global de um arquivo de ações precisa valer POR AÇÃO: medida
  no arquivo inteiro, a conferência de uma ação cobre a gravação de outra, e
  uma ação nova que pule a garantia entra verde. As duas famílias abaixo
  existem para que a asserção não tenha escolha senão olhar uma ação de cada
  vez — e ficam aqui, e não num dos dois arquivos de teste, porque
  `painel-locais.test.ts` e `painel-especialidades.test.ts` fazem a mesma
  pergunta sobre arquivos diferentes.

  Recorte ingênuo por `export async function`, do mesmo naipe de
  `semComentarios`: passe o código JÁ sem comentários, senão a prosa que
  explica uma regra entra no corpo medido.
*/
const ESCRITA = /\.(insert|update|delete)\s*\(/;

export type AcaoDoPainel = { nome: string; corpo: string };

function acoesDoArquivo(codigo: string): AcaoDoPainel[] {
  return codigo
    .split("export async function")
    .slice(1)
    .map((corpo) => ({ nome: (/^\s*(\w+)/.exec(corpo)?.[1] ?? "(sem nome)"), corpo }));
}

/** As ações que gravam — as únicas de que as garantias de gravação tratam. */
export function acoesQueGravam(codigo: string): AcaoDoPainel[] {
  return acoesDoArquivo(codigo).filter((a) => ESCRITA.test(a.corpo));
}

export type Gravacao = {
  /** Nome da ação em que a gravação mora. */
  acao: string;
  /** A chamada que grava: `.insert(`, `.update(` ou `.delete(`. */
  escrita: string;
  /*
    O que vem DEPOIS da chamada que grava e antes do fim daquela cadeia. O
    fim é o `;` que fecha a instrução: em PostgREST a cadeia inteira é uma
    expressão só, e `.select()` tem que estar dentro dela para que o banco
    devolva as linhas afetadas. Contar `.select(` no arquivo inteiro deixava
    uma LEITURA solta pagar pela gravação que não pediu nada de volta.
  */
  cadeia: string;
};

export function gravacoes(codigo: string): Gravacao[] {
  const achadas: Gravacao[] = [];

  for (const { nome, corpo } of acoesDoArquivo(codigo)) {
    for (const m of corpo.matchAll(/\.(insert|update|delete)\s*\(/g)) {
      const resto = corpo.slice((m.index ?? 0) + m[0].length);
      const fim = resto.indexOf(";");
      achadas.push({
        acao: nome,
        escrita: `.${m[1]}(`,
        cadeia: fim === -1 ? resto : resto.slice(0, fim),
      });
    }
  }

  return achadas;
}
