import { describe, expect, it } from "vitest";
import { fonte } from "@/testes/apoio";

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
    for (const c of [".botao", ".botao-linha", ".rotulo-secao", ".ladrilho-icone", ".textura-verde", ".brilho"]) {
      expect(CSS, `falta ${c}`).toContain(`${c} {`);
    }
  });

  it("nenhuma sombra tem tom de verde", () => {
    /* Os dois lugares onde nasce sombra: a propriedade e os tokens `--shadow-*`
       do @theme. Ler so `box-shadow:` deixaria o token passar com verde. */
    const sombras = CSS.match(/(?:box-shadow|--shadow-[a-z]+):[^;]*;/g) ?? [];
    expect(sombras.length, "a varredura nao achou sombra nenhuma").toBeGreaterThanOrEqual(4);
    /* Regra geral, nao uma lista de verdes conhecidos: em qualquer
       rgba(r, g, b, a) de sombra o canal verde nao pode passar dos outros dois
       por mais de 10. Pega o verde da marca, o lima e qualquer verde novo. */
    for (const s of sombras) {
      for (const m of s.matchAll(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,/g)) {
        const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
        expect(g > r + 10 && g > b + 10, `${m[0]} tem tom de verde em: ${s}`).toBe(false);
      }
    }
  });

  it("a ancora para abaixo do cabecalho preso: 88px no computador, 76px no celular", () => {
    /* O cabeçalho preso termina a 72px do topo (60px no celular), medido no
       navegador; a âncora fica 16px abaixo. */
    const html = CSS.match(/\n {2}html \{[^}]*\}/)?.[0] ?? "";
    expect(html, "nao achei a regra html da base").not.toBe("");
    expect(html).toMatch(/scroll-padding-top:\s*88px;/);
    const celular = CSS.match(/@media \(max-width: 700px\) \{\s*html \{[^}]*\}/)?.[0] ?? "";
    expect(celular, "nao achei o html do celular").not.toBe("");
    expect(celular).toMatch(/scroll-padding-top:\s*76px;/);
  });

  it("a textura e uma imagem pequena, nao filtro SVG", () => {
    expect(CSS).toContain("/textura/grao.png");
    expect(CSS).not.toContain("feTurbulence");
  });
});
