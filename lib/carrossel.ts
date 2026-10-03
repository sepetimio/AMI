/*
  A lógica do carrossel que não precisa de navegador, fora do componente para
  poder ser testada sem ele (ver testes/fita-do-carrossel.test.ts).

  Giro contínuo: uma cópia do último slide antes do primeiro e uma cópia do
  primeiro depois do último. Do último, "próximo" anda para a cópia do
  primeiro (sempre para a direita); terminado o movimento, a fita salta sem
  animação para o primeiro de verdade, que é idêntico. O mesmo ao contrário.

  Sem as cópias, do último para o primeiro a fita voltaria passando por todos
  os slides, da direita para a esquerda — foi o que o cliente viu e recusou.

  Os nomes: "índice" é a contagem dos itens reais (0 a n − 1); "posição" é o
  lugar na fita, que tem n + 2 lugares (0 é a cópia do último, n + 1 é a
  cópia do primeiro).
*/

/** Fita com cópia do último antes e do primeiro depois: n reais viram n + 2 posições. */
export function posicaoNaFita(indice: number): number {
  /* O índice pode ser −1 (anterior do primeiro) ou n (próximo do último): as
     cópias, nas posições 0 e n + 1. */
  return indice + 1;
}

/** O item real que um destino representa: −1 é o último, n é o primeiro. */
export function indiceReal(destino: number, n: number): number {
  return ((destino % n) + n) % n;
}

/**
 * Terminado o movimento, para onde a fita salta sem animação: da cópia do
 * último (0) para o último de verdade (n), da cópia do primeiro (n + 1) para
 * o primeiro de verdade (1). Numa posição real, não salta: `null`.
 */
export function precisaSaltar(posicao: number, n: number): number | null {
  if (posicao === 0) return n;
  if (posicao === n + 1) return 1;
  return null;
}

/** Quanto a bolinha do slide atual leva para encher, em milissegundos. */
export const INTERVALO = 6000;

/** Quanto o dedo precisa andar de lado, em pixels, para trocar o slide. */
export const LIMIAR_DO_DEDO = 45;

/**
 * Deslizar o dedo: para a esquerda (dx negativo) vai ao próximo (1), para a
 * direita ao anterior (−1). Só conta quando o lado passa do limiar E vence o
 * vertical por mais de 1,5 vez; senão é rolagem da página e fica 0.
 */
export function direcaoDoDedo(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) > LIMIAR_DO_DEDO && Math.abs(dx) > Math.abs(dy) * 1.5) {
    return dx < 0 ? 1 : -1;
  }
  return 0;
}
