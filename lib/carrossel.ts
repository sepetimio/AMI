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

/** Para onde um passo leva: o item real e o lugar da fita onde ele entra. */
export type Destino = { indice: number; posicao: number };

/**
 * Um passo a partir do item `atual`: +1 é "próximo", −1 é "anterior", 0 é
 * "este mesmo" (o clique numa bolinha passa o índice dela com passo 0).
 *
 * A posição sai do índice SEM dar a volta: do último com +1, a posição é
 * n + 1 (a cópia do primeiro), e a fita anda para a direita; do primeiro com
 * −1, é 0 (a cópia do último). Dar a volta aqui (a posição do real) faria o
 * último→primeiro voltar pela esquerda, passando por todos.
 */
export function destinoDoPasso(atual: number, passo: -1 | 0 | 1, n: number): Destino {
  const alvo = atual + passo;
  return { indice: indiceReal(alvo, n), posicao: posicaoNaFita(alvo) };
}

/**
 * Como a fita vai até um destino: deslizando até a posição do passo (que
 * pode ser uma cópia), ou, para quem pediu menos movimento, saltando direto
 * para a posição do real — sem deslizar, não há por que passar pela cópia.
 */
export function movimentoAte(
  destino: Destino,
  semMovimento: boolean,
): { posicao: number; animar: boolean } {
  if (semMovimento) return { posicao: posicaoNaFita(destino.indice), animar: false };
  return { posicao: destino.posicao, animar: true };
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
