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

/*
  A largura DESENHADA de cada imagem do carrossel, conforme a janela.

  A arte e a foto cobrem a caixa delas com `object-fit: cover`: quando a
  proporção da imagem não é a da caixa, a imagem é desenhada maior que a
  caixa e recortada. O `sizes` precisa dizer essa largura desenhada, e não a
  da caixa, senão o navegador baixa um arquivo pequeno e estica.

  As caixas, de components/home/Carrossel.module.css e da coluna da home
  (app/(site)/inicio.module.css):
  - o carrossel tem 1192px a partir de 1240px de janela, a janela menos 48px
    de 701 a 1239px, e a janela menos 24px até 700px;
  - o slide é 1192/512 a partir de 981px, 3/2 de 701 a 980px e 4/5 até 700px;
  - a foto do slide com texto é a segunda coluna dele: a partir de 981px,
    (carrossel − 48 − 24 − 48) × 1,05 / 2,05 de largura e o slide menos
    24 + 76px de altura; de 701 a 980px, (carrossel − 28 − 20 − 28) / 2 de
    largura e o slide menos 20 + 70px de altura; até 700px, o cartão
    inteiro.

  A arte larga é 3000 × 1288. A foto não tem proporção combinada (o Studio
  só pede 1600px de largura): a conta supõe 3:2, a das câmeras, que é a mais
  larga das comuns. Uma foto 4:3 sai desenhada um pouco menor e baixa até
  12% a mais que o necessário; uma mais larga que 3:2 (16:9) sairia um pouco
  esticada no tablet e no celular.
*/
export const PROPORCAO_DA_ARTE = 3000 / 1288;
export const PROPORCAO_DA_FOTO = 3 / 2;

type Caixa = { largura: number; altura: number };

function larguraDoCarrossel(janela: number): number {
  if (janela >= 1240) return 1192;
  return janela > 700 ? janela - 48 : janela - 24;
}

function alturaDoSlide(janela: number): number {
  const w = larguraDoCarrossel(janela);
  if (janela >= 981) return (w * 512) / 1192;
  return janela > 700 ? (w * 2) / 3 : (w * 5) / 4;
}

export function caixaDaArte(janela: number): Caixa {
  return { largura: larguraDoCarrossel(janela), altura: alturaDoSlide(janela) };
}

export function caixaDaFoto(janela: number): Caixa {
  const w = larguraDoCarrossel(janela);
  const h = alturaDoSlide(janela);
  if (janela >= 981) return { largura: ((w - 120) * 1.05) / 2.05, altura: h - 100 };
  if (janela > 700) return { largura: (w - 76) / 2, altura: h - 90 };
  return { largura: w, altura: h };
}

/** A largura com que uma imagem de `proporcao` (largura/altura) cobre a caixa. */
export function larguraDesenhada(caixa: Caixa, proporcao: number): number {
  return Math.max(caixa.largura, caixa.altura * proporcao);
}

/*
  O `sizes` de cada imagem: a largura desenhada acima, faixa por faixa,
  arredondada para cima (testes/carrossel.test.ts confere, janela a janela de
  320 a 1920px, que o `sizes` nunca fica abaixo dela nem passa dela em mais
  de 8px).
  - arte: a 1240px ou mais, 512 × 3000/1288 = 1192,5px; de 981 a 1239, a
    proporção do slide é quase a da arte, a janela menos 47px; de 701 a 980,
    o slide 3/2 corta os lados e a arte sai com (janela − 48) × 1,5528; até
    700, sem a versão 4:5, o cartão 4/5 corta muito mais: (janela − 24) ×
    2,9115;
  - arte de celular, 4:5 numa caixa 4/5: a caixa, a janela menos 24px;
  - foto 3:2: em toda faixa a altura manda.
*/
export const TAMANHO_DA_ARTE =
  "(min-width: 1240px) 1193px, (min-width: 981px) calc(100vw - 47px), " +
  "(min-width: 701px) calc(155.3vw - 74px), calc(291.2vw - 69px)";
export const TAMANHO_DA_ARTE_CELULAR = "calc(100vw - 24px)";
export const TAMANHO_DA_FOTO =
  "(min-width: 1240px) 618px, (min-width: 981px) calc(64.43vw - 180px), " +
  "(min-width: 701px) calc(100vw - 182px), calc(187.5vw - 45px)";

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
