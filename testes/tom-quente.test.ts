import { describe, expect, it } from "vitest";
import { semComentarios } from "@/testes/apoio";
import { type CorAchada, arquivosDoSite, coresNoTexto, ehQuente, hslDe } from "@/testes/cores";

/*
  Nenhum tom quente nem creme no site inteiro.

  O cliente recusou fundo creme (spec, seção 2), e o creme volta por qualquer
  porta: um hex num CSS de componente, um `rgb()` numa sombra, um `hsl()`, um
  nome de cor como `ivory`, um valor arbitrário do Tailwind num `.tsx`
  (`bg-[#FAF0E6]`). Este teste varre todos os `.css` de app/ e components/ e
  os valores arbitrários `[...]` dos `.tsx` das mesmas pastas, entende as
  notações de cor (testes/cores.ts) e reprova o que for quente pela regra de
  `ehQuente`. Ele substitui as guardas que cada teste de seção tinha, que só
  olhavam hex e `rgba` do próprio arquivo.

  Comentário não conta: a varredura tira os comentários antes.
*/

/* Os valores arbitrários do Tailwind de um `.tsx`: o que está entre os
   colchetes de uma classe como `bg-[#fff]` ou `shadow-[0_1px_0_rgba(...)]`,
   com `_` virando espaço. */
function arbitrarios(tsx: string): string {
  return [...tsx.matchAll(/[\w:!/-]*-\[([^\]\s"'`]+)\]/g)].map((m) => m[1].replaceAll("_", " ")).join("\n");
}

/* Cada cor do site, com o arquivo de onde veio. */
function coresDoSite(): (CorAchada & { arquivo: string })[] {
  return [
    ...arquivosDoSite(".css").flatMap(({ arquivo, texto }) =>
      coresNoTexto(semComentarios(texto)).map((c) => ({ ...c, arquivo })),
    ),
    ...arquivosDoSite(".tsx").flatMap(({ arquivo, texto }) =>
      coresNoTexto(arbitrarios(semComentarios(texto))).map((c) => ({ ...c, arquivo })),
    ),
  ];
}

/* As cores quentes de propósito, e por quê. Fora desta lista, nenhuma. */
const PERMITIDAS: Record<string, string> = {
  "#7C5F00": "o texto de aviso (`--color-warn`): âmbar escuro em texto, nunca fundo",
};

describe("nenhum tom quente nem creme no site", () => {
  const cores = coresDoSite();

  it("a varredura acha as cores do site (e entende cada notação)", () => {
    expect(cores.length, "a varredura não achou cor nenhuma").toBeGreaterThan(40);
    const arquivosComCor = new Set(cores.map((c) => c.arquivo));
    expect(arquivosComCor).toContain("app/globals.css");
    expect(arquivosComCor).toContain("components/diretorio/Placa.tsx");
  });

  it("nenhuma cor quente fora das permitidas", () => {
    const quentes = cores
      .filter((c) => ehQuente(c.rgb))
      .filter((c) => !(c.texto.toUpperCase() in PERMITIDAS))
      .map((c) => `${c.arquivo}: ${c.texto} (rgb ${c.rgb.join(", ")})`);
    expect(quentes).toEqual([]);
  });

  it("toda cor permitida ainda existe: a lista não guarda exceção morta", () => {
    for (const p of Object.keys(PERMITIDAS)) {
      expect(cores.some((c) => c.texto.toUpperCase() === p), p).toBe(true);
    }
  });
});

describe("a regra de quente, por notação", () => {
  const quente = (texto: string) => {
    const achadas = coresNoTexto(texto);
    expect(achadas, `não entendeu ${texto}`).toHaveLength(1);
    return ehQuente(achadas[0].rgb);
  };

  it("o creme reprova em hex, rgb, hsl, oklch e pelo nome", () => {
    for (const creme of [
      "#F5EFE6",
      "#fdf6e3",
      "#ffe",
      "rgb(245, 239, 230)",
      "rgba(250 240 230 / 0.6)",
      "hsl(40, 60%, 93%)",
      "hsl(30deg 40% 90%)",
      "oklch(0.95 0.02 80)",
      "ivory",
      "beige",
      "cornsilk",
      "linen",
      "oldlace",
      "seashell",
      "floralwhite",
      "antiquewhite",
      "wheat",
      "bisque",
    ]) {
      expect(quente(creme), creme).toBe(true);
    }
  });

  it("o branco quente, um cinza claro com o vermelho acima do azul, reprova", () => {
    /* Os dois têm a matiz abaixo de 20°, fora da faixa do creme: só a regra
       do cinza claro os pega. */
    for (const branco of ["#FAF4F3", "rgb(250, 244, 243)"]) {
      const [cor] = coresNoTexto(branco);
      expect(hslDe(cor.rgb).h, branco).toBeLessThan(20);
      expect(quente(branco), branco).toBe(true);
    }
  });

  it("os neutros e os verdes do site passam", () => {
    for (const neutro of [
      "#FFFFFF",
      "#EEF1EF",
      "#F6F7F8",
      "#E5E7EB",
      "#0c0e12",
      "#646B75",
      "rgba(16, 24, 40, 0.06)",
      "#071A07",
      "#1A5E18",
      "#A8D470",
      "#cfd8c9",
      "hsl(210, 10%, 96%)",
    ]) {
      expect(quente(neutro), neutro).toBe(false);
    }
  });
});
