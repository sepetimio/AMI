import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";
import { arquivosDoSite, coresNoTexto } from "@/testes/cores";

const CSS = fonte("../app/globals.css");
const FONTES = fonte("../lib/fontes.ts");

describe("a base visual", () => {
  it("titulo em Bricolage Grotesque e texto em Plus Jakarta Sans", () => {
    /* Cada familia amarrada ao papel dela: so ver os dois nomes no arquivo
       passaria com as duas trocadas de lugar. */
    expect(FONTES).toMatch(/export const fonteTitulo = Bricolage_Grotesque\(/);
    expect(FONTES).toMatch(/export const fonteCorpo = Plus_Jakarta_Sans\(/);
  });

  it("os titulos h1 a h3 sao verde-escuro da marca, como no desenho", () => {
    const bloco = CSS.match(/h1,\s*h2,\s*h3\s*\{[^}]*\}/)?.[0] ?? "";
    expect(bloco, "nao achei a regra de h1, h2, h3 na base").not.toBe("");
    expect(bloco).toMatch(/(?<![-\w])color:\s*var\(--color-ami-green-800\)/);
  });

  it("a seta dos botoes anda com a curva do desenho", () => {
    for (const seletor of [".botao svg {", ".botao-linha svg {"]) {
      const ini = CSS.indexOf(seletor);
      expect(ini, `falta ${seletor}`).toBeGreaterThan(-1);
      const bloco = CSS.slice(ini, CSS.indexOf("}", ini));
      expect(bloco, seletor).toContain("cubic-bezier(0.2, 0.7, 0.2, 1)");
    }
  });

  it("o CRM continua em Geist Mono", () => {
    expect(FONTES).toMatch(/Geist_Mono\(/);
  });

  it("a Geist Mono nao e pre-carregada: a home e o rodape nao a usam", () => {
    /* `preload` é opção do next/font (node_modules/next/dist/docs, Font):
       com `false`, o <link rel="preload"> some do <head> de toda página. */
    const mono = FONTES.slice(FONTES.indexOf("Geist_Mono({"));
    expect(mono.slice(0, mono.indexOf("});"))).toMatch(/preload:\s*false,/);
    for (const outra of ["Plus_Jakarta_Sans({", "Bricolage_Grotesque({"]) {
      const bloco = FONTES.slice(FONTES.indexOf(outra));
      expect(bloco.slice(0, bloco.indexOf("});")), outra).not.toContain("preload");
    }
  });

  it("existem as pecas que as secoes usam", () => {
    for (const c of [".botao", ".botao-linha", ".botao-contorno", ".rotulo-secao", ".textura-verde", ".brilho"]) {
      expect(CSS, `falta ${c}`).toContain(`${c} {`);
    }
  });

  it("nenhuma sombra tem tom de verde, em nenhum CSS do site e em nenhuma notacao", () => {
    /* Onde nasce sombra: `box-shadow`, `text-shadow`, `drop-shadow()` e os
       tokens `--shadow-*` do @theme. Ler so `box-shadow:` deixaria o token
       passar com verde. As cores saem em qualquer notação (hex, rgb, hsl,
       oklch: testes/cores.ts), e a varredura pega todo CSS de app/ e
       components/, não só este arquivo. */
    const sombras = arquivosDoSite(".css").flatMap(({ arquivo, texto }) =>
      (semComentarios(texto).match(/(?:box-shadow|text-shadow|--shadow-[a-z]+):[^;]*;|drop-shadow\([^;]*/g) ?? []).map(
        (s) => `${arquivo}: ${s}`,
      ),
    );
    expect(sombras.length, "a varredura nao achou sombra nenhuma").toBeGreaterThanOrEqual(10);
    /* Regra geral, nao uma lista de verdes conhecidos: em qualquer cor de
       sombra o canal verde nao pode passar dos outros dois por mais de 10.
       Pega o verde da marca, o lima e qualquer verde novo. */
    for (const s of sombras) {
      for (const { texto, rgb } of coresNoTexto(s)) {
        const [r, g, b] = rgb;
        expect(g > r + 10 && g > b + 10, `${texto} tem tom de verde em: ${s}`).toBe(false);
      }
    }
  });

  it("a ancora para abaixo do cabecalho preso: 88px no computador, 76px no celular", () => {
    /* O cabeçalho preso termina a 72px do topo (60px no celular), medido no
       navegador; a âncora fica 16px abaixo. A margem vai nos alvos dentro do
       <main>, e não como `scroll-padding-top` no html: com o padding, cada
       Tab pelo menu preso, com a página rolada, a levava de volta ao topo. */
    const semNotas = semComentarios(CSS);
    expect(semNotas).not.toContain("scroll-padding");
    const alvos = semNotas.match(/\n {2}main \[id\] \{[^}]*\}/)?.[0] ?? "";
    expect(alvos, "nao achei a regra main [id] da base").not.toBe("");
    expect(alvos).toMatch(/scroll-margin-top:\s*88px;/);
    const celular = semNotas.match(/@media \(max-width: 700px\) \{\s*main \[id\] \{[^}]*\}/)?.[0] ?? "";
    expect(celular, "nao achei o main [id] do celular").not.toBe("");
    expect(celular).toMatch(/scroll-margin-top:\s*76px;/);
  });

  it("o alvo que ainda espera a entrada ganha o deslocamento dela na margem da ancora", () => {
    /* O navegador calcula o destino com o bloco ainda deslocado; quando ele
       entra e sobe, tem de parar abaixo do cabeçalho. O deslocamento é lido
       da regra da espera, não escrito aqui. */
    const semNotas = semComentarios(CSS);
    const desloca = /\[data-revelar="espera"\] \{[^}]*translateY\((\d+)px\)/.exec(semNotas)?.[1];
    expect(desloca, "nao achei o translateY da espera").toBeDefined();
    const regras = [...semNotas.matchAll(/main \[id\]\[data-revelar="espera"\] \{\s*scroll-margin-top:\s*calc\((\d+)px \+ (\d+)px\);/g)];
    expect(regras.map((m) => [Number(m[1]), m[2]])).toEqual([
      [88, desloca],
      [76, desloca],
    ]);
  });

  it("a textura e uma imagem pequena, nao filtro SVG", () => {
    expect(CSS).toContain("/textura/grao.png");
    expect(CSS).not.toContain("feTurbulence");
  });

  it("o grao tem 128px e no maximo 24KB: o rodape o carrega em toda pagina", () => {
    /* Ruído não comprime: o ladrilho de 240px tinha 72KB. A largura e a
       altura estão no cabeçalho IHDR do PNG, nos bytes 16 a 23. */
    const png = readFileSync(fileURLToPath(new URL("../public/textura/grao.png", import.meta.url)));
    expect(png.length).toBeLessThanOrEqual(24 * 1024);
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([128, 128]);
    expect(fonte("../scripts/gerar-grao.mjs")).toMatch(/\nconst L = 128;/);
  });
});
