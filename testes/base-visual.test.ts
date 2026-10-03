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
    for (const seletor of [".botao svg {", ".botao-linha svg {", ".botao-arte svg {"]) {
      const ini = CSS.indexOf(seletor);
      expect(ini, `falta ${seletor}`).toBeGreaterThan(-1);
      const bloco = CSS.slice(ini, CSS.indexOf("}", ini));
      expect(bloco, seletor).toContain("cubic-bezier(0.2, 0.7, 0.2, 1)");
    }
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

  it("a textura e uma imagem pequena, nao filtro SVG", () => {
    expect(CSS).toContain("/textura/grao.png");
    expect(CSS).not.toContain("feTurbulence");
  });
});
