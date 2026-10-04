import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { deveIrAoTopo } from "@/lib/volta-ao-topo";
import { fonte, semComentarios } from "@/testes/apoio";

/*
  A volta ao topo na troca de página.

  A decisão (topo ou não) é função pura e se testa aqui sem navegador. A
  ligação com o navegador (o ouvinte do voltar, a remoção dele, o efeito
  antes da pintura e a rolagem) só existe no navegador, e o projeto não tem
  jsdom: ela é travada lendo o código como texto. A medida na tela, com
  cliques de verdade, está no relatório da correção.
*/
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const COMPONENTE = semComentarios(fonte("../components/layout/VoltaAoTopo.tsx"));
const LAYOUT = semComentarios(fonte("../app/(site)/layout.tsx"));
const RAIZ = semComentarios(fonte("../app/layout.tsx"));

describe("deveIrAoTopo", () => {
  it("troca por link, sem #: vai ao topo", () => {
    expect(deveIrAoTopo({ doHistorico: false, ancora: false })).toBe(true);
  });

  it("voltar ou avançar: não rola, a posição é do navegador", () => {
    expect(deveIrAoTopo({ doHistorico: true, ancora: false })).toBe(false);
  });

  it("endereço com #: não rola, o Next leva ao trecho", () => {
    expect(deveIrAoTopo({ doHistorico: false, ancora: true })).toBe(false);
  });

  it("voltar para um endereço com #: não rola", () => {
    expect(deveIrAoTopo({ doHistorico: true, ancora: true })).toBe(false);
  });
});

describe("o componente VoltaAoTopo, lido como texto", () => {
  it("o ouvinte do voltar guarda o caminho de destino numa variável do módulo", () => {
    expect(COMPONENTE).toMatch(/^let caminhoDoHistorico: string \| null = null;$/m);
    expect(COMPONENTE).toMatch(
      /function marcarHistorico\(\) \{\s*caminhoDoHistorico = window\.location\.pathname;\s*\}/,
    );
  });

  it("põe o ouvinte de popstate e o tira ao sair", () => {
    expect(COMPONENTE).toMatch(
      /useEffect\(\(\) => \{\s*window\.addEventListener\("popstate", marcarHistorico\);\s*return \(\) => window\.removeEventListener\("popstate", marcarHistorico\);\s*\}, \[\]\);/,
    );
  });

  it("decide antes da pintura, a cada troca de caminho", () => {
    expect(COMPONENTE).toContain("const caminho = usePathname();");
    expect(COMPONENTE).toMatch(/useLayoutEffect\(\(\) => \{[\s\S]*\}, \[caminho\]\);/);
  });

  it("lê e apaga a marca sempre, antes de qualquer saída", () => {
    const efeito = COMPONENTE.slice(COMPONENTE.indexOf("useLayoutEffect(() => {"));
    expect(efeito).toMatch(
      /^useLayoutEffect\(\(\) => \{\s*const doHistorico = caminhoDoHistorico === window\.location\.pathname;\s*caminhoDoHistorico = null;/,
    );
  });

  it("a abertura do site e a passada repetida do mesmo caminho não rolam", () => {
    expect(COMPONENTE).toMatch(
      /const anterior = caminhoAnterior\.current;\s*caminhoAnterior\.current = caminho;\s*if \(anterior === null \|\| anterior === caminho\) return;/,
    );
  });

  it("pergunta à função pura, com o # do endereço, e vai ao topo na hora", () => {
    expect(COMPONENTE).toMatch(
      /if \(deveIrAoTopo\(\{ doHistorico, ancora: window\.location\.hash !== "" \}\)\) \{\s*window\.scrollTo\(\{ top: 0, left: 0, behavior: "instant" \}\);\s*\}/,
    );
  });

  it("não toma do navegador a posição do voltar", () => {
    expect(COMPONENTE).not.toContain("scrollRestoration");
    expect(LAYOUT).not.toContain("scrollRestoration");
    expect(RAIZ).not.toContain("scrollRestoration");
  });

  it("mora no layout do site, antes do Revelar", () => {
    expect(LAYOUT).toContain('import { VoltaAoTopo } from "@/components/layout/VoltaAoTopo";');
    /* Entre os dois, só o `{}` que sobra do comentário JSX tirado. */
    expect(LAYOUT).toMatch(/<VoltaAoTopo \/>\s*(\{\}\s*)?<Revelar \/>/);
  });

  it("o atributo da rolagem suave continua no <html>", () => {
    expect(RAIZ).toMatch(/<html\b[^>]*\bdata-scroll-behavior="smooth"/);
  });
});

describe("no servidor", () => {
  it("o componente não desenha nada", async () => {
    const { VoltaAoTopo } = await import("@/components/layout/VoltaAoTopo");
    expect(renderToString(createElement(VoltaAoTopo))).toBe("");
  });
});
