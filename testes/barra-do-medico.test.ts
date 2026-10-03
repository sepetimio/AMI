import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BarraDoMedico } from "@/components/perfil/BarraDoMedico";
import estilos from "@/components/layout/BarraDoPe.module.css";
import { acoesSairamPorCima, destinoDaBusca } from "@/lib/barra-do-pe";
import { fonte, semComentarios } from "@/testes/apoio";
import { bloco, regra, semNotas } from "@/testes/css";

/*
  A barra do pé do perfil, no celular: "Ligar" e "WhatsApp" do consultório
  principal, quando os botões do topo saem da tela por cima. O desenho é o
  da barra padrão (BarraDoPe.module.css); o observador só roda no navegador,
  e por isso a ligação se lê do código.
*/

const CODIGO = semComentarios(fonte("../components/perfil/BarraDoMedico.tsx"));
const CSS = semNotas(fonte("../components/layout/BarraDoPe.module.css"));

describe("a barra do médico", () => {
  const html = renderToString(
    createElement(BarraDoMedico, { nome: "Aline Peixoto", telefone: "(99) 3018-9994", whatsapp: "(99) 3018-9994" }),
  );

  it("é um nav com nome, marcado, e começa escondida", () => {
    const abre = /^<nav [^>]*>/.exec(html)![0];
    expect(abre).toContain('aria-label="Contato de Aline Peixoto"');
    expect(abre).toContain('data-barra-do-medico=""');
    expect(abre).toContain(estilos.barra);
    expect(abre).toContain(estilos.doMedico);
    expect(abre).not.toContain(estilos.visivel);
  });

  it("Ligar em verde e WhatsApp em branco, do consultório principal", () => {
    expect(html).toMatch(
      new RegExp(`<a href="tel:\\+559930189994" class="botao ${estilos.buscar}" aria-label="Ligar para Aline Peixoto">`),
    );
    expect(html).toMatch(
      new RegExp(`<a href="https://wa.me/559930189994" class="${estilos.ligar}" aria-label="WhatsApp de Aline Peixoto">`),
    );
  });

  it("sem WhatsApp, só o Ligar", () => {
    const so = renderToString(createElement(BarraDoMedico, { nome: "A", telefone: "(99) 3018-9994", whatsapp: null }));
    expect(so).not.toContain("wa.me");
    expect(so).toContain("tel:+559930189994");
  });
});

describe("quando ela aparece", () => {
  it("quando os botões do topo saem por cima, e só aí", () => {
    expect(acoesSairamPorCima(false, -10)).toBe(true);
    expect(acoesSairamPorCima(true, -10)).toBe(false);
    expect(acoesSairamPorCima(false, 900)).toBe(false);
    expect(acoesSairamPorCima(true, 300)).toBe(false);
  });

  it("o observador olha os botões do topo e passa o que leu à decisão", () => {
    expect(CODIGO).toContain('document.querySelector("[data-acoes-do-medico]")');
    expect(CODIGO).toContain("acoesSairamPorCima(entrada.isIntersecting, entrada.boundingClientRect.top)");
    expect(CODIGO).toMatch(/threshold: 0\b/);
    expect(CODIGO).toContain("observador.disconnect()");
  });

  it("o que a barra leva ao navegador não importa a busca: o WhatsApp vem de lib/contato.ts, sem dependência", () => {
    /* Por lib/encontre.ts, a barra levaria ao navegador a tabela de
       sinônimos da busca (lib/dados/sinonimos.ts). */
    const importados = [...CODIGO.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
    expect(importados).toContain("@/lib/contato");
    expect(importados.filter((i) => i.startsWith("@/lib/"))).toEqual(["@/lib/ami", "@/lib/barra-do-pe", "@/lib/contato"]);
    for (const lib of ["../lib/contato.ts", "../lib/ami.ts", "../lib/barra-do-pe.ts"]) {
      const deps = [...semComentarios(fonte(lib)).matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
      expect(deps.filter((d) => d !== "@/lib/contato"), lib).toEqual([]);
    }
  });
});

describe("as duas barras", () => {
  it("na busca, Encontrar médico leva à faixa da própria página", () => {
    expect(destinoDaBusca("/busca")).toBe("#encontre");
    expect(destinoDaBusca("/")).toBe("#encontre");
    expect(destinoDaBusca("/medico/aline-peixoto")).toBe("/busca");
  });

  it("no celular, Ligar e WhatsApp meio a meio, e a barra padrão some quando a do médico existe", () => {
    const cel = bloco(CSS, "@media (max-width: 700px)");
    expect(regra(cel, ".doMedico .ligar")).toMatch(/flex: 1/);
    expect(regra(cel, ":global(body:has([data-barra-do-medico])) .barra:not([data-barra-do-medico])")).toMatch(
      /display: none/,
    );
  });
});
