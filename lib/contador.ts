/*
  A conta do contador dos números da home, fora do componente para poder ser
  testada sem navegador (ver testes/numeros-e-busca.test.ts).

  É a do desenho aprovado: de 0 até o valor final em 1,4s, com a curva
  `easeOutCubic` (rápida no começo, freando no fim), e o valor de cada quadro
  arredondado para inteiro.
*/

/** Quanto dura a contagem, em milissegundos. */
export const DURACAO_DO_CONTADOR = 1400;

/** A fração da curva no instante `k` (de 0 a 1): 1 − (1 − k)³. */
export function easeOutCubic(k: number): number {
  return 1 - Math.pow(1 - k, 3);
}

/**
 * O número que aparece `decorrido` milissegundos depois do início da
 * contagem: 0 no começo, o valor final do fim em diante, inteiro sempre.
 */
export function valorNoInstante(fim: number, decorrido: number): number {
  const k = Math.min(1, Math.max(0, decorrido / DURACAO_DO_CONTADOR));
  return Math.round(fim * easeOutCubic(k));
}
