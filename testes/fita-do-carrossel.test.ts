import { describe, expect, it } from "vitest";
import {
  INTERVALO,
  LIMIAR_DO_DEDO,
  destinoDoPasso,
  direcaoDoDedo,
  indiceReal,
  movimentoAte,
  posicaoNaFita,
  precisaSaltar,
} from "@/lib/carrossel";

/*
  A fita do carrossel: n slides reais viram n + 2 posições, com uma cópia do
  último antes do primeiro e uma cópia do primeiro depois do último. É o que
  faz o giro ser contínuo (do último para o primeiro, sempre para a direita).
*/
describe("a fita do carrossel", () => {
  it("o primeiro real fica na posicao 1, depois da copia do ultimo", () => {
    expect(posicaoNaFita(0)).toBe(1);
  });

  it("do ultimo, proximo anda para a copia do primeiro, sempre para a direita", () => {
    expect(posicaoNaFita(4)).toBe(5); // n = 4: destino 4 é a cópia do primeiro
    expect(indiceReal(4, 4)).toBe(0);
  });

  it("do primeiro, anterior anda para a copia do ultimo, para a esquerda", () => {
    expect(posicaoNaFita(-1)).toBe(0);
    expect(indiceReal(-1, 4)).toBe(3);
  });

  it("indices reais ficam como estao", () => {
    for (const i of [0, 1, 2, 3]) expect(indiceReal(i, 4)).toBe(i);
  });

  it("o passo: do ultimo com +1, a copia do primeiro (n + 1), para a direita", () => {
    expect(destinoDoPasso(3, 1, 4)).toEqual({ indice: 0, posicao: 5 });
  });

  it("o passo: do primeiro com -1, a copia do ultimo (0), para a esquerda", () => {
    expect(destinoDoPasso(0, -1, 4)).toEqual({ indice: 3, posicao: 0 });
  });

  it("o passo no meio e o passo 0 (bolinha) caem nas posicoes reais", () => {
    expect(destinoDoPasso(1, 1, 4)).toEqual({ indice: 2, posicao: 3 });
    expect(destinoDoPasso(2, -1, 4)).toEqual({ indice: 1, posicao: 2 });
    expect(destinoDoPasso(3, 0, 4)).toEqual({ indice: 3, posicao: 4 });
  });

  it("o movimento desliza ate a posicao do passo, mesmo quando ela e uma copia", () => {
    expect(movimentoAte(destinoDoPasso(3, 1, 4), false)).toEqual({ posicao: 5, animar: true });
    expect(movimentoAte(destinoDoPasso(0, -1, 4), false)).toEqual({ posicao: 0, animar: true });
  });

  it("com menos movimento, salta direto para o real, sem passar pela copia", () => {
    expect(movimentoAte(destinoDoPasso(3, 1, 4), true)).toEqual({ posicao: 1, animar: false });
    expect(movimentoAte(destinoDoPasso(0, -1, 4), true)).toEqual({ posicao: 4, animar: false });
  });

  it("chegando na copia do primeiro, salta sem animacao para o primeiro de verdade", () => {
    expect(precisaSaltar(5, 4)).toBe(1);
  });

  it("chegando na copia do ultimo, salta para o ultimo de verdade", () => {
    expect(precisaSaltar(0, 4)).toBe(4);
  });

  it("posicoes reais nao saltam", () => {
    for (const p of [1, 2, 3, 4]) expect(precisaSaltar(p, 4)).toBeNull();
  });

  it("deslizar o dedo para o lado troca; para cima e para baixo, nao", () => {
    expect(direcaoDoDedo(-80, 10)).toBe(1);
    expect(direcaoDoDedo(80, 10)).toBe(-1);
    expect(direcaoDoDedo(30, 0)).toBe(0);
    expect(direcaoDoDedo(60, 50)).toBe(0);
  });

  it("o limiar do dedo e estrito: 45px nao troca, 46px troca", () => {
    expect(LIMIAR_DO_DEDO).toBe(45);
    expect(direcaoDoDedo(-45, 0)).toBe(0);
    expect(direcaoDoDedo(-46, 0)).toBe(1);
  });

  it("o lado precisa vencer o vertical por mais de 1,5 vez", () => {
    expect(direcaoDoDedo(-90, 60)).toBe(0); // exatamente 1,5 vez: não troca
    expect(direcaoDoDedo(-91, 60)).toBe(1);
    expect(direcaoDoDedo(91, -60)).toBe(-1);
  });

  it("a bolinha enche em seis segundos", () => {
    expect(INTERVALO).toBe(6000);
  });
});
