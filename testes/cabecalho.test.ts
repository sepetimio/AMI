import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";
import { MENU, ehAtual } from "@/components/layout/MenuPrincipal";
import { deveFechar } from "@/lib/gaveta";

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

  it("vira gaveta abaixo de 1180px, com aria-expanded", () => {
    expect(MENU_SRC).toContain("aria-expanded");
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

describe("a decisao de fechar a gaveta", () => {
  it("Esc fecha; outra tecla nao", () => {
    expect(deveFechar({ tipo: "tecla", tecla: "Escape" })).toBe(true);
    expect(deveFechar({ tipo: "tecla", tecla: "Enter" })).toBe(false);
    expect(deveFechar({ tipo: "tecla", tecla: "Tab" })).toBe(false);
  });

  it("clique fora fecha; no botao ou dentro da gaveta nao", () => {
    expect(deveFechar({ tipo: "clique", noBotao: false, naGaveta: false })).toBe(true);
    expect(deveFechar({ tipo: "clique", noBotao: true, naGaveta: false })).toBe(false);
    expect(deveFechar({ tipo: "clique", noBotao: false, naGaveta: true })).toBe(false);
  });

  it("largura larga fecha; estreita nao", () => {
    expect(deveFechar({ tipo: "largura", estreita: false })).toBe(true);
    expect(deveFechar({ tipo: "largura", estreita: true })).toBe(false);
  });
});

describe("o componente usa a decisao e limpa os ouvintes", () => {
  /* O corpo de `const <nome> = ... };`, para olhar um ouvinte de cada vez. */
  function ouvinte(nome: string): string {
    const ini = MENU_SRC.indexOf(`const ${nome} = `);
    expect(ini, `falta o ouvinte ${nome}`).toBeGreaterThan(-1);
    const resto = MENU_SRC.slice(ini);
    return resto.slice(0, resto.search(/\n\s*\};/));
  }

  it("a tecla pergunta a funcao, fecha e devolve o foco ao botao", () => {
    const o = ouvinte("aoTeclar");
    expect(o).toContain('deveFechar({ tipo: "tecla", tecla: e.key })');
    expect(o).toContain("setAberta(false)");
    expect(o).toContain("botao.current?.focus()");
  });

  it("o clique pergunta a funcao com o botao e a gaveta, e fecha", () => {
    const o = ouvinte("aoClicar");
    expect(o).toContain("noBotao = botao.current?.contains(alvo)");
    expect(o).toContain("naGaveta = gaveta.current?.contains(alvo)");
    expect(o).toContain('deveFechar({ tipo: "clique", noBotao, naGaveta })');
    expect(o).toContain("setAberta(false)");
  });

  it("a largura pergunta a funcao com a media query, e fecha", () => {
    const o = ouvinte("aoLargar");
    expect(o).toContain('deveFechar({ tipo: "largura", estreita: estreita.matches })');
    expect(o).toContain("setAberta(false)");
  });

  it("cada addEventListener tem o removeEventListener do mesmo evento e da mesma funcao", () => {
    const adicoes = [...MENU_SRC.matchAll(/(\w+)\.addEventListener\("(\w+)", (\w+)\)/g)];
    /* Sao tres: teclado, clique e mudanca de largura. */
    expect(adicoes.map((m) => m[2]).sort()).toEqual(["change", "click", "keydown"]);
    for (const [, alvo, evento, funcao] of adicoes) {
      expect(
        MENU_SRC,
        `falta ${alvo}.removeEventListener("${evento}", ${funcao})`,
      ).toContain(`${alvo}.removeEventListener("${evento}", ${funcao})`);
    }
  });

  it("o botao se chama Abrir menu ou Fechar menu, conforme `aberta`", () => {
    expect(MENU_SRC).toContain('aria-label={aberta ? "Fechar menu" : "Abrir menu"}');
  });
});

describe("o CSS do cabecalho que importa", () => {
  const SEM_COMENTARIO = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
  const REGRAS = [...SEM_COMENTARIO.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    seletor: m[1].trim(),
    corpo: m[2],
  }));

  it("a gaveta fechada fica visibility hidden e a aberta visible", () => {
    const fechada = REGRAS.filter((r) => r.seletor === ".gaveta" && /visibility/.test(r.corpo));
    expect(fechada, "falta a regra .gaveta com visibility").toHaveLength(1);
    expect(fechada[0].corpo).toMatch(/visibility:\s*hidden/);

    const aberta = REGRAS.filter((r) => r.seletor === '.gaveta[data-aberta="true"]');
    expect(aberta, "falta a regra da gaveta aberta").toHaveLength(1);
    expect(aberta[0].corpo).toMatch(/visibility:\s*visible/);
  });

  it(".topo e sticky e deixa 12px entre a borda da tela e o bloco", () => {
    const topo = REGRAS.find((r) => r.seletor === ".topo")?.corpo ?? "";
    expect(topo).toMatch(/position:\s*sticky/);
    expect(topo).toContain("top: calc(12px - var(--gap))");
  });

  it("nenhum hover usa lima nem verde de acao (o cliente recusou hover verde)", () => {
    const hovers = REGRAS.filter((r) => r.seletor.includes(":hover"));
    expect(hovers.length, "nao achei nenhuma regra :hover").toBeGreaterThan(0);
    for (const h of hovers) {
      expect(h.corpo, h.seletor).not.toMatch(/lima|ami-green-600/);
    }
  });
});
