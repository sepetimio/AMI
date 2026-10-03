import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";
import { MENU, ehAtual } from "@/components/layout/MenuPrincipal";

const MENU_SRC = semComentarios(fonte("../components/layout/MenuPrincipal.tsx"));
const CAB = semComentarios(fonte("../components/layout/Cabecalho.tsx"));
const LAYOUT = semComentarios(fonte("../app/(site)/layout.tsx"));
const CSS = fonte("../components/layout/Cabecalho.module.css");

/* O corpo de uma regra `seletor { ... }`, para a asserção olhar a regra
   certa e não o arquivo todo. */
function regra(seletor: string): string {
  const ini = CSS.indexOf(`${seletor} {`);
  expect(ini, `falta a regra ${seletor}`).toBeGreaterThan(-1);
  return CSS.slice(ini, CSS.indexOf("}", ini));
}

describe("o cabecalho", () => {
  it("tem os sete itens aprovados, nesta ordem", () => {
    expect(MENU.map((m) => m.rotulo)).toEqual([
      "Início", "A Associação", "Encontre um médico", "Especialidades", "Sua AMI", "Notícias", "Contato",
    ]);
    expect(MENU.map((m) => m.href)).toEqual([
      "/", "/associacao", "/busca", "/medicos", "/#sua-ami", "/noticias", "/contato",
    ]);
  });

  it("e filho direto do layout, para ficar preso a pagina inteira", () => {
    /* O defeito achado no desenho: preso a um bloco, sumia quando o bloco acabava. */
    expect(LAYOUT).toMatch(/<Cabecalho \/>\s*<main/);
  });

  it("fica preso no topo com `position: sticky`", () => {
    expect(regra(".topo")).toMatch(/position:\s*sticky/);
  });

  it("vira gaveta abaixo de 1180px, com aria-expanded e fecha com Esc", () => {
    expect(MENU_SRC).toContain("aria-expanded");
    expect(MENU_SRC).toContain('"Escape"');
    expect(MENU_SRC).toMatch(/1180/);
    expect(CSS).toMatch(/@media \(max-width: 1180px\)/);
  });

  it("a gaveta fecha ao clicar fora e ao escolher um item", () => {
    expect(MENU_SRC).toMatch(/addEventListener\("click"/);
    expect(MENU_SRC).toMatch(/onClick=\{fechar\}/);
  });

  it("o botao da gaveta aponta para ela e devolve o foco ao fechar com Esc", () => {
    expect(MENU_SRC).toContain('aria-controls="gaveta"');
    expect(MENU_SRC).toContain('id="gaveta"');
    expect(MENU_SRC).toMatch(/botao\.current\?\.focus\(\)/);
  });

  it("tem o botao Seja associado", () => {
    expect(CAB).toContain("Seja associado");
    expect(CAB).toContain("/associacao/seja-associado");
  });

  it("o menu nunca quebra linha: cada item e nowrap", () => {
    expect(regra(".menu a")).toMatch(/white-space:\s*nowrap/);
  });

  it("o sublinhado e verde-escuro e cresce da esquerda", () => {
    const r = regra(".menu a::after");
    expect(r).toContain("var(--color-ami-green-800)");
    expect(r).toMatch(/transform-origin:\s*left/);
  });

  it("o vidro ao rolar e feito em CSS, sem JavaScript", () => {
    expect(CSS).toContain("@supports (animation-timeline: scroll())");
    expect(CSS).toContain("animation-timeline: scroll(root)");
    expect(MENU_SRC).not.toMatch(/scrollY|"scroll"/);
  });

  it("nao ha cor escrita em codigo hexadecimal: so tokens", () => {
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe("ehAtual", () => {
  it("Inicio so e atual em / exato", () => {
    expect(ehAtual("/", "/")).toBe(true);
    expect(ehAtual("/noticias", "/")).toBe(false);
    expect(ehAtual("/associacao/diretoria", "/")).toBe(false);
  });

  it("os outros itens casam por prefixo do caminho", () => {
    expect(ehAtual("/noticias", "/noticias")).toBe(true);
    expect(ehAtual("/noticias/uma-materia", "/noticias")).toBe(true);
    expect(ehAtual("/associacao/seja-associado", "/associacao")).toBe(true);
    expect(ehAtual("/medicos/cardiologia", "/medicos")).toBe(true);
  });

  it("o prefixo respeita a fronteira da barra", () => {
    expect(ehAtual("/medico/fulano", "/medicos")).toBe(false);
    expect(ehAtual("/noticiasx", "/noticias")).toBe(false);
  });

  it("Sua AMI, que aponta para um trecho da home, nunca e atual", () => {
    expect(ehAtual("/", "/#sua-ami")).toBe(false);
  });
});
