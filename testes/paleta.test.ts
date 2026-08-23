import { describe, expect, it } from "vitest";
import { fonte } from "@/testes/apoio";

/*
  As razões de contraste da paleta, calculadas — não lidas de comentário.

  `app/globals.css` diz "Quem alterar qualquer tom aqui mede de novo". Isso é
  um comentário, e comentário não mede nada: ele foi ignorado uma vez, e o
  próprio arquivo registra o resultado — `ink-400` foi para 3,48:1 e reprovava
  em AA no uso dele, que é texto de corpo.

  Este arquivo lê os tokens do CSS e faz a conta. Não confere o que está
  escrito ao lado do valor; confere o valor.
*/

/** Todos os `--color-x: #hex` de um CSS, por nome. */
export function tokensDeCor(css: string): Record<string, string> {
  const mapa: Record<string, string> = {};
  for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)) {
    mapa[m[1]] = m[2].toUpperCase();
  }
  return mapa;
}

/** Luminância relativa, fórmula da WCAG 2.1. */
export function luminancia(hex: string): number {
  const canais = [0, 2, 4]
    .map((i) => parseInt(hex.replace("#", "").slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

export function razaoDeContraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

const CSS = fonte("../app/globals.css");
const T = tokensDeCor(CSS);

/** Mínimo da WCAG AA para texto de corpo. */
const MINIMO = 4.5;

describe("a conta", () => {
  it("bate com valores conhecidos", () => {
    /*
      Preto sobre branco é 21:1 exato. Sem esta âncora, um erro na fórmula
      passaria despercebido e todas as asserções abaixo mediriam a coisa errada
      com confiança.
    */
    expect(razaoDeContraste("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(razaoDeContraste("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 2);
  });
});

describe("os tokens existem", () => {
  const EXIGIDOS = [
    "canvas",
    "surface",
    "ink-900",
    "ink-600",
    "ink-400",
    "ink-300",
    "line",
    "line-strong",
  ];

  it("todos os papéis do sistema estão declarados", () => {
    for (const nome of EXIGIDOS) {
      expect(T[nome], `falta --color-${nome} em app/globals.css`).toBeTruthy();
    }
  });
});

describe("texto sobre os dois fundos claros", () => {
  const TEXTO_DE_CORPO = ["ink-900", "ink-600", "ink-400", "warn"];

  for (const fundo of ["canvas", "surface"]) {
    for (const tinta of TEXTO_DE_CORPO) {
      it(`${tinta} sobre ${fundo}`, () => {
        const r = razaoDeContraste(T[tinta], T[fundo]);
        expect(
          r,
          `--color-${tinta} sobre --color-${fundo} dá ${r.toFixed(2)}:1, abaixo de ${MINIMO}:1`,
        ).toBeGreaterThanOrEqual(MINIMO);
      });
    }
  }

  it("ink-300 fica de fora de propósito", () => {
    /*
      `ink-300` é placeholder e ícone desabilitado — nunca texto que alguém
      precisa ler. Se um dia ele passar de 4,5:1, o motivo dele deixou de
      existir e o comentário de globals.css precisa ser revisto.
    */
    expect(razaoDeContraste(T["ink-300"], T["canvas"])).toBeLessThan(MINIMO);
  });
});
