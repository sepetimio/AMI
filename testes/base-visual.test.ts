import { describe, expect, it } from "vitest";
import { fonte } from "@/testes/apoio";

const CSS = fonte("../app/globals.css");
const FONTES = fonte("../lib/fontes.ts");

describe("a base visual", () => {
  it("titulo em Bricolage Grotesque e texto em Plus Jakarta Sans", () => {
    expect(FONTES).toMatch(/Bricolage_Grotesque\(/);
    expect(FONTES).toMatch(/Plus_Jakarta_Sans\(/);
  });

  it("o CRM continua em Geist Mono", () => {
    expect(FONTES).toMatch(/Geist_Mono\(/);
  });

  it("existem as pecas que as secoes usam", () => {
    for (const c of [".botao", ".botao-linha", ".botao-arte", ".rotulo-secao", ".ladrilho-icone", ".textura-verde", ".brilho"]) {
      expect(CSS, `falta ${c}`).toContain(`${c} {`);
    }
  });

  it("nenhuma sombra tem tom de verde", () => {
    /* Os dois lugares onde nasce sombra: a propriedade e os tokens `--shadow-*`
       do @theme. Ler so `box-shadow:` deixaria o token passar com verde. */
    const sombras = CSS.match(/(?:box-shadow|--shadow-[a-z]+):[^;]*;/g) ?? [];
    expect(sombras.length, "a varredura nao achou sombra nenhuma").toBeGreaterThanOrEqual(4);
    for (const s of sombras) {
      expect(s, s).not.toMatch(/rgba\(\s*(7|13|26|36)\s*,\s*(26|46|94|131)\s*,/);
    }
  });

  it("a textura e uma imagem pequena, nao filtro SVG", () => {
    expect(CSS).toContain("/textura/grao.png");
    expect(CSS).not.toContain("feTurbulence");
  });
});
