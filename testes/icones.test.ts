import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { fonte } from "@/testes/apoio";
import { Icone, LadrilhoIcone } from "@/components/base/Icone";

describe("os icones", () => {
  it("saem como SVG no servidor, sem fonte de icones", () => {
    const html = renderToString(createElement(Icone, { nome: "estetoscopio" }));
    expect(html).toMatch(/^<svg/);
  });

  it("className passa para o SVG", () => {
    const html = renderToString(createElement(Icone, { nome: "seta", className: "x" }));
    expect(html).toContain('class="x"');
  });

  it("o ladrilho tem aria-hidden no span externo", () => {
    const html = renderToString(createElement(LadrilhoIcone, { nome: "selo" }));
    expect(html).toContain('<span class="ladrilho-icone" aria-hidden="true">');
  });

  it("cada icone renderiza um SVG diferente", () => {
    const html1 = renderToString(createElement(Icone, { nome: "selo" }));
    const html2 = renderToString(createElement(Icone, { nome: "seta" }));
    expect(html1).not.toBe(html2);
  });

  it("duotone inclui opacity 0.2, regular nao", () => {
    const htmlDuotone = renderToString(createElement(Icone, { nome: "selo", duotone: true }));
    const htmlRegular = renderToString(createElement(Icone, { nome: "selo", duotone: false }));
    expect(htmlDuotone).toContain('opacity="0.2"');
    expect(htmlRegular).not.toContain('opacity="0.2"');
  });

  it("tamanho pequeno do ladrilho sai com width 23 e classe --pequeno", () => {
    const html = renderToString(createElement(LadrilhoIcone, { nome: "selo", pequeno: true }));
    expect(html).toContain('width="23"');
    expect(html).toContain('class="ladrilho-icone ladrilho-icone--pequeno"');
  });

  it("tamanho normal do ladrilho sai com width 28 e sem classe --pequeno", () => {
    const html = renderToString(createElement(LadrilhoIcone, { nome: "selo", pequeno: false }));
    expect(html).toContain('width="28"');
    expect(html).toContain('class="ladrilho-icone" aria-hidden="true">');
  });

  it("importa so os icones usados, pelo caminho de servidor", () => {
    const src = fonte("../components/base/Icone.tsx");
    expect(src).toContain("@phosphor-icons/react/dist/ssr");
    expect(src).not.toMatch(/import\s+\*\s+from\s+"@phosphor-icons\/react/);
    expect(src).not.toMatch(/import\s+\{[^}]*\}\s+from\s+"@phosphor-icons\/react";/);
  });
});
