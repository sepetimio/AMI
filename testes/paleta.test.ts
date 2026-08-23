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
    "surface-fundo",
    "ami-lima-100",
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

describe("texto sobre os quatro fundos claros", () => {
  /*
    Todo token usado como cor de texto entra nesta lista — não é seleção do
    que parece arriscado. `ami-green-600` ficou de fora numa primeira
    passada porque parecia cor de botão, e uma mutação mostrou que ele
    podia cair para 2,86:1 sem nada reclamar. Se um token aparece em
    `text-<nome>` em qualquer componente, ele pertence aqui.

    Exceção real, não descuido: tokens usados como texto só sobre fundo
    ESCURO (`ami-lima-400`) ficam de fora de propósito. Esta lista testa
    contra os quatro fundos claros do sistema — medir esse token aqui
    testaria o par errado. `ami-lima-400` dá 1,48:1 em canvas e 1,63:1 em
    surface: não é regressão, é a física que barra esse tom como texto
    sobre fundo claro. Quem usar esse token sobre fundo escuro tem um teste
    próprio contra `ami-green-800`/`ami-green-900` no describe abaixo.
  */
  const TEXTO_DE_CORPO = ["ink-900", "ink-600", "ink-400", "warn", "ami-green-600", "ami-green-700"];

  /*
    Os fundos, e por que são quatro e não dois.

    A lista era `["canvas", "surface"]`, e deixava de fora dois fundos que
    carregam texto de verdade. A prova de que o buraco era real: apagar
    `--color-ami-lima-100` inteiro do `@theme` deixava os 22 testes desta
    suíte verdes, e treze classes `bg-` do site viravam nada.

    `ami-lima-100` é fundo PERMANENTE de texto em `components/base/Chip.tsx`
    (a pílula "Associado AMI", `bg-ami-lima-100 text-ami-green-700`) e fundo
    de passagem de mouse em outros doze lugares — 13 usos de `bg-`, mais que
    `bg-canvas`, que tem 11. É também o par mais apertado de todo o sistema:
    `ink-400` sobre ele dá 4,61:1, onze centésimos acima do mínimo, e o uso é
    real (`app/(site)/associacao/page.tsx`, o cartão que muda de fundo no
    hover).

    `surface-fundo` é o fundo de `.moldura`, em `app/globals.css`.

    Esta lista continua escrita à mão, e isso é a fraqueza conhecida: ela não
    sabe de um fundo novo que ninguém acrescentar aqui. Derivá-la de um grep
    por `bg-<token>` e `text-<token>` é a primeira tarefa da fatia seguinte;
    até lá, quem criar um fundo que recebe texto acrescenta o nome aqui.
  */
  const FUNDOS_CLAROS = ["canvas", "surface", "surface-fundo", "ami-lima-100"];

  for (const fundo of FUNDOS_CLAROS) {
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

  for (const fundo of FUNDOS_CLAROS) {
    it(`ink-300 fica de fora de propósito, sobre ${fundo}`, () => {
      /*
        `ink-300` é placeholder e ícone desabilitado — nunca texto que alguém
        precisa ler. Se um dia ele passar de 4,5:1, o motivo dele deixou de
        existir e o comentário de globals.css precisa ser revisto.

        Os quatro fundos precisam da mesma checagem: `surface` é o mais
        claro deles, então é onde qualquer tom escurecido cruza o mínimo
        primeiro. Testar só `canvas` deixa passar um token que já está em
        conformidade sobre `surface` — foi o que a revisão da tarefa 1
        mostrou mutando para `#727272`: 4,18:1 sobre canvas (ainda abaixo,
        teste único não pega) mas 4,60:1 sobre surface (já acima).
      */
      expect(razaoDeContraste(T["ink-300"], T[fundo])).toBeLessThan(MINIMO);
    });
  }
});

describe("texto sobre fundo escuro", () => {
  /*
    Ficou de fora do plano original porque, segundo a autorrevisão, "esses
    pares dependem de saber qual token vai sobre qual, e essa informação não
    está no CSS, está nos componentes" — cobri-los exigiria uma lista escrita
    à mão, que apodrece.

    A varredura da rodada anterior (grep de `text-<token>` em app/ e
    components/) resolveu isso: o token da família antiga (a que a tarefa 3
    migrou) era usado só sobre verde escuro, nunca sobre fundo claro, e
    `ami-lima-400` é o token novo com o mesmo papel (marca sobre o verde,
    ou fundo de texto escuro). O par deixou de ser suposição.

    Este describe testa o par novo, `ami-lima-400`, que é o que continua
    existindo depois da tarefa 3 migrar e apagar a família antiga do
    `@theme`.
  */
  const PARES_ESCUROS: [string, string][] = [
    ["surface", "ami-green-900"],
    ["surface", "ami-green-800"],
    ["ami-lima-400", "ami-green-900"],
    ["ami-lima-400", "ami-green-800"],
    ["ink-900", "ami-lima-400"],
  ];

  for (const [tinta, fundo] of PARES_ESCUROS) {
    it(`${tinta} sobre ${fundo}`, () => {
      const r = razaoDeContraste(T[tinta], T[fundo]);
      expect(
        r,
        `--color-${tinta} sobre --color-${fundo} dá ${r.toFixed(2)}:1, abaixo de ${MINIMO}:1`,
      ).toBeGreaterThanOrEqual(MINIMO);
    });
  }

  it("o acento nunca serve como letra sobre fundo claro", () => {
    /*
      `ami-lima-400` sobre o creme dá pouco mais de 1:1 — invisível. Ele só
      existe como fundo de texto escuro, ou como marca sobre o verde.

      Esta asserção falha se alguém um dia clarear o creme ou escurecer o
      acento até o par virar legível: nesse momento a regra "nunca é letra"
      deixou de ser física e virou escolha, e o comentário que a afirma
      precisa ser revisto.
    */
    expect(razaoDeContraste(T["ami-lima-400"], T["canvas"])).toBeLessThan(MINIMO);
  });
});

