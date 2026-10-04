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
   e as propriedades arbitrárias, sem hífen antes do colchete
   (`[color:#fff]`, `hover:[background:ivory]`), com `_` virando espaço. */
function arbitrarios(tsx: string): string {
  const valores = [...tsx.matchAll(/-\[([^\]\s"'`]+)\]/g)].map((m) => m[1]);
  const propriedades = [...tsx.matchAll(/(?<=^|[\s"'`{:!])\[([a-z-]+:[^\]\s"'`]+)\]/gm)].map((m) => m[1]);
  return [...valores, ...propriedades].map((v) => v.replaceAll("_", " ")).join("\n");
}

type Arquivo = { arquivo: string; texto: string };

/* Cada cor dos arquivos, com o arquivo de onde veio: dos `.css`, todas; dos
   `.tsx`, as dos valores arbitrários. Recebe a lista, para o teste provar
   os dois ramos com arquivos escritos aqui. */
function coresDoSite(
  arquivos: Arquivo[] = [...arquivosDoSite(".css"), ...arquivosDoSite(".tsx")],
): (CorAchada & { arquivo: string })[] {
  return [
    ...arquivos
      .filter(({ arquivo }) => arquivo.endsWith(".css"))
      .flatMap(({ arquivo, texto }) => coresNoTexto(semComentarios(texto)).map((c) => ({ ...c, arquivo }))),
    ...arquivos
      .filter(({ arquivo }) => arquivo.endsWith(".tsx"))
      .flatMap(({ arquivo, texto }) =>
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
    /* E os valores arbitrários dos `.tsx`: nenhum componente do site precisa
       ter um, então a prova de que a varredura os lê é um escrito aqui, com
       um tom creme que a regra tem de achar. */
    expect(arquivosDoSite(".tsx").length).toBeGreaterThan(50);
    const doTsx = coresNoTexto(arbitrarios('className="shadow-[0_1px_0_rgba(168,212,112,0.22)] bg-[#FAF0E6]"'));
    expect(doTsx).toHaveLength(2);
    expect(doTsx.filter((c) => ehQuente(c.rgb)).map((c) => c.rgb)).toEqual([[250, 240, 230]]);
  });

  it("nenhuma cor quente fora das permitidas", () => {
    const quentes = cores
      .filter((c) => ehQuente(c.rgb))
      .filter((c) => !(c.texto.toUpperCase() in PERMITIDAS))
      .map((c) => `${c.arquivo}: ${c.texto} (rgb ${c.rgb.join(", ")})`);
    expect(quentes).toEqual([]);
  });

  it("a varredura lê os dois ramos: um .css e um .tsx falsos, cada um com um tom creme", () => {
    const falsos = coresDoSite([
      { arquivo: "components/Falso.module.css", texto: ".a { background: #FDF6E3; color: #0c0e12; }" },
      { arquivo: "components/Falso.tsx", texto: '<div className="p-4 bg-[#FAF0E6]" />' },
    ]);
    expect(falsos.filter((c) => ehQuente(c.rgb)).map((c) => `${c.arquivo}: ${c.texto}`)).toEqual([
      "components/Falso.module.css: #FDF6E3",
      "components/Falso.tsx: #FAF0E6",
    ]);
  });

  it("toda cor permitida ainda existe: a lista não guarda exceção morta", () => {
    for (const p of Object.keys(PERMITIDAS)) {
      expect(cores.some((c) => c.texto.toUpperCase() === p), p).toBe(true);
    }
  });
});

describe("a leitura das cores", () => {
  it("os valores e as propriedades arbitrárias do Tailwind", () => {
    const tsx = `<div className="bg-[#FAF0E6] [color:#FFFFF0] hover:[background:linen] p-4" data-x={lista[0]} />`;
    expect(coresNoTexto(arbitrarios(tsx)).map((c) => c.texto)).toEqual(["#FAF0E6", "#FFFFF0", "linen"]);
  });

  it("cor montada com var() fica de fora, sem quebrar a varredura", () => {
    const comVar = "color: rgb(var(--x)); background: hsl(var(--h) 50% 90%); fill: oklch(var(--l) 0.1 80)";
    expect(coresNoTexto(comVar)).toEqual([]);
    expect(coresNoTexto(`${comVar}; border-color: #FAF0E6`).map((c) => c.texto)).toEqual(["#FAF0E6"]);
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
      "papayawhip",
      "blanchedalmond",
      "moccasin",
      "navajowhite",
      "lemonchiffon",
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
