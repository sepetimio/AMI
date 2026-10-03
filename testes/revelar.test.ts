import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MARGEM_DO_OBSERVADOR, revelarNaAbertura } from "@/lib/revelar";
import { fonte, semComentarios } from "@/testes/apoio";

/*
  A entrada dos blocos ao rolar (`.revelar`).

  A decisão "fica ou espera" é função pura e se testa aqui sem navegador. A
  ligação com o navegador (observar, deixar de observar, desconectar, limpar
  o atributo) só existe no navegador, e o projeto não tem jsdom: ela é
  travada lendo o código como texto. O CSS também. E o HTML do servidor,
  renderizado, não pode trazer o estado escondido.
*/
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const COMPONENTE = semComentarios(fonte("../components/layout/Revelar.tsx"));
const LAYOUT = semComentarios(fonte("../app/(site)/layout.tsx"));
const CSS = semComentarios(fonte("../app/globals.css"));

describe("revelarNaAbertura", () => {
  const H = 844;

  it("o bloco com o topo dentro da janela fica como está", () => {
    expect(revelarNaAbertura(0, H, false)).toBe("fica");
    expect(revelarNaAbertura(400, H, false)).toBe("fica");
    expect(revelarNaAbertura(H - 1, H, false)).toBe("fica");
  });

  it("o bloco acima da janela (já passou) fica como está", () => {
    expect(revelarNaAbertura(-2000, H, false)).toBe("fica");
  });

  it("o bloco que começa na borda de baixo ou abaixo dela espera", () => {
    expect(revelarNaAbertura(H, H, false)).toBe("espera");
    expect(revelarNaAbertura(H + 1, H, false)).toBe("espera");
    expect(revelarNaAbertura(5000, H, false)).toBe("espera");
  });

  it("quem pediu menos movimento não espera nada", () => {
    expect(revelarNaAbertura(5000, H, true)).toBe("fica");
    expect(revelarNaAbertura(H, H, true)).toBe("fica");
    expect(revelarNaAbertura(0, H, true)).toBe("fica");
  });

  it("o observador entra 40px antes da borda, sem limiar", () => {
    expect(MARGEM_DO_OBSERVADOR).toBe("0px 0px -40px 0px");
    expect(COMPONENTE).toContain("{ rootMargin: MARGEM_DO_OBSERVADOR }");
    expect(COMPONENTE).not.toContain("threshold");
  });
});

describe("o componente Revelar, lido como texto", () => {
  it("decide pela função pura, com a altura da janela e o menos movimento", () => {
    expect(COMPONENTE).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches');
    expect(COMPONENTE).toMatch(
      /revelarNaAbertura\(bloco\.getBoundingClientRect\(\)\.top, alturaDaJanela, menosMovimento\)/,
    );
    expect(COMPONENTE).toContain('document.querySelectorAll<HTMLElement>(".revelar")');
  });

  it("põe em espera e observa só os que esperam", () => {
    expect(COMPONENTE).toMatch(
      /for \(const bloco of emEspera\) \{\s*bloco\.setAttribute\("data-revelar", "espera"\);\s*observador\.observe\(bloco\);/,
    );
  });

  it("ao entrar: vira \"entrou\" e deixa de ser observado", () => {
    expect(COMPONENTE).toMatch(
      /if \(!entrada\.isIntersecting\) continue;\s*entrada\.target\.setAttribute\("data-revelar", "entrou"\);\s*observador\.unobserve\(entrada\.target\);/,
    );
  });

  it("ao sair da página: desconecta e tira a espera dos que sobraram", () => {
    const limpeza = COMPONENTE.slice(COMPONENTE.indexOf("return () => {"));
    expect(limpeza).toContain("observador.disconnect();");
    expect(limpeza).toMatch(
      /if \(bloco\.getAttribute\("data-revelar"\) === "espera"\) bloco\.removeAttribute\("data-revelar"\);/,
    );
  });

  it("refaz tudo a cada troca de caminho: o layout persiste entre as páginas", () => {
    expect(COMPONENTE).toMatch(/\},\s*\[caminho\]\);/);
    expect(COMPONENTE).toContain("const caminho = usePathname();");
  });

  it("mora no layout do site", () => {
    expect(LAYOUT).toContain("<Revelar />");
  });
});

describe("o CSS da entrada", () => {
  /* O corpo de `seletor { ... }`, a partir de onde o seletor aparece. */
  function regra(css: string, seletor: string, de = 0): string {
    const ini = css.indexOf(`${seletor} {`, de);
    expect(ini, `falta a regra ${seletor}`).toBeGreaterThan(-1);
    return css.slice(ini, css.indexOf("}", ini));
  }

  it("a transição de opacidade, deslocamento e desfoque fica em todo [data-revelar]", () => {
    const r = regra(CSS, "[data-revelar]");
    expect(r).toMatch(/opacity 0\.9s/);
    expect(r).toMatch(/transform 0\.9s/);
    expect(r).toMatch(/filter 0\.9s/);
  });

  it("o estado escondido só existe com no-preference", () => {
    const media = CSS.indexOf("@media (prefers-reduced-motion: no-preference) {");
    expect(media).toBeGreaterThan(-1);
    /* A regra que esconde é a de seletor só `[data-revelar="espera"]`; a da
       margem da âncora (`main [id][data-revelar="espera"]`) não esconde nada. */
    const sozinho = /\n\s*\[data-revelar="espera"\] \{/g;
    const achadas = [...CSS.matchAll(sozinho)];
    expect(achadas).toHaveLength(1);
    expect(achadas[0].index).toBeGreaterThan(media);
    const espera = regra(CSS, '[data-revelar="espera"]', achadas[0].index);
    for (const outra of CSS.matchAll(/([^{}\n]*\[data-revelar="espera"\]) \{([^}]*)\}/g)) {
      if (outra[1].trim() === '[data-revelar="espera"]') continue;
      expect(outra[2], outra[1]).not.toMatch(/opacity|transform|filter|visibility|display/);
    }
    expect(espera).toMatch(/opacity:\s*0;/);
    expect(espera).toMatch(/transform:\s*translateY\(28px\);/);
    expect(espera).toMatch(/filter:\s*blur\(6px\);/);
  });

  it("o estado final não tem filter: nenhuma regra para \"entrou\"", () => {
    expect(CSS).not.toContain('[data-revelar="entrou"]');
    expect(regra(CSS, "[data-revelar]")).not.toMatch(/(^|[\s{;])filter:/);
  });

  it("o impresso mostra tudo", () => {
    const impresso = regra(CSS, "[data-revelar]", CSS.indexOf("@media print {"));
    expect(CSS.indexOf("@media print {")).toBeGreaterThan(-1);
    expect(impresso).toMatch(/opacity:\s*1 !important;/);
    expect(impresso).toMatch(/transform:\s*none !important;/);
    expect(impresso).toMatch(/filter:\s*none !important;/);
  });

  it("a animação antiga, presa à rolagem, saiu", () => {
    expect(CSS).not.toContain("animation-timeline");
    expect(CSS).not.toContain("revelar-entrada");
  });
});

describe("no servidor", () => {
  it("o componente não desenha nada", () => {
    return import("@/components/layout/Revelar").then(({ Revelar }) => {
      expect(renderToString(createElement(Revelar))).toBe("");
    });
  });

  it("o layout inteiro sai sem data-revelar", async () => {
    const { default: LayoutSite } = await import("@/app/(site)/layout");
    const html = renderToString(
      createElement(LayoutSite, null, createElement("section", { className: "revelar" }, "x")),
    );
    expect(html).toContain('class="revelar"');
    expect(html).not.toContain("data-revelar");
  });
});
