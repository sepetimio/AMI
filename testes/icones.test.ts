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

  it("decorativos ficam fora do leitor de tela", () => {
    const html = renderToString(createElement(LadrilhoIcone, { nome: "selo" }));
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("ladrilho-icone");
  });

  it("importa so os icones usados, pelo caminho de servidor", () => {
    const src = fonte("../components/base/Icone.tsx");
    expect(src).toContain("@phosphor-icons/react/dist/ssr");
    expect(src).not.toMatch(/from "@phosphor-icons\/react"\s*;/);
  });
});
