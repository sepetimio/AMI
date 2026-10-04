import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowLeft, CaretDown, UsersThree } from "@phosphor-icons/react/dist/ssr";
import estilosBusca from "@/components/busca/FaixaDaBusca.module.css";
import { IndiceNestaPagina, IndiceRecolhido } from "@/components/editorial/IndiceNestaPagina";
import estilosIndice from "@/components/editorial/IndiceNestaPagina.module.css";
import estilosFaixa from "@/components/layout/FaixaCurta.module.css";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { ancorasUnicas } from "@/lib/nestaPagina";
import { VOLTA_ASSOCIACAO, VOLTA_INICIO } from "@/lib/paginaDeTexto";
import { fonte, semComentarios } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";

/*
  A faixa verde curta (a diretoria e as páginas de texto) e o índice "Nesta
  página", no HTML de servidor. O CSS se lê do arquivo. A marcação da seção
  lida, ao rolar, é conferida no navegador pela auditoria
  (scripts/auditoria-visual.js, conferência 16); aqui, a ligação do
  componente com a rolagem se lê do código.
*/

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

describe("a faixa curta", () => {
  const html = renderToString(
    createElement(
      FaixaCurta,
      {
        volta: VOLTA_ASSOCIACAO,
        titulo: "Diretoria da AMI",
        texto: "Quem responde pela associação.",
        icone: "pessoas",
      },
      createElement("p", { className: "extra" }, "Logo depois do texto"),
    ),
  );

  it("faixa verde de ponta a ponta que abre a página, com a forma da faixa da especialidade", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="topo" data-faixa="" data-abertura="" aria-labelledby="pagina-titulo" class="textura-verde ${estilosBusca.faixa} ${estilosFaixa.especialidade}">`,
      ),
    );
    expect(html).toContain('<div class="brilho" aria-hidden="true"></div>');
    expect(html).not.toContain("<form");
    expect(html).not.toContain('id="encontre"');
  });

  it("no lugar do rótulo, o link de volta, na coluna do texto, com a seta para a esquerda", () => {
    const link = /<a [^>]*href="\/associacao"[^>]*>/.exec(html)![0];
    expect(link).toContain(`class="rotulo-secao link-de-volta ${estilosBusca.sobre}"`);
    expect(link).toContain('data-coluna=""');
    const ini = html.indexOf(link) + link.length;
    const dentro = html.slice(ini, html.indexOf("</a>", ini));
    expect(dentro.startsWith(desenho(ArrowLeft, 20, "regular"))).toBe(true);
    expect(tela(dentro)).toBe("A Associação");

    const legal = renderToString(
      createElement(FaixaCurta, { volta: VOLTA_INICIO, titulo: "Termos de uso", texto: "x", icone: "documento" }),
    );
    expect(tela(/<a [^>]*href="\/"[^>]*>[\s\S]*?<\/a>/.exec(legal)![0])).toBe("Início");
  });

  it("o título, o texto, e o que vier junto logo depois do texto", () => {
    expect(html).toContain(
      `<h1 id="pagina-titulo" class="${estilosBusca.titulo}">Diretoria da AMI</h1>` +
        `<p class="${estilosBusca.texto}">Quem responde pela associação.</p>` +
        `<p class="extra">Logo depois do texto</p></div>`,
    );
  });

  it("à direita, o ícone da página no ladrilho de vidro, fora do leitor de tela", () => {
    expect(html).toContain(
      `<div class="${estilosFaixa.selo}" aria-hidden="true">${desenho(UsersThree, 84, "duotone")}</div></section>`,
    );
  });
});

describe("o índice Nesta página", () => {
  const itens = ancorasUnicas(["O que é a AMI", "Quem pode se associar", "Como se associar"]);
  const lateral = renderToString(createElement(IndiceNestaPagina, { itens }));
  const recolhido = renderToString(createElement(IndiceRecolhido, { itens }));

  it("à direita: o título e um link por seção, para a âncora dela", () => {
    expect(lateral).toMatch(
      new RegExp(
        `^<aside class="${estilosIndice.lateral}" aria-labelledby="nesta-pagina-titulo" data-nesta-pagina="">` +
          `<p id="nesta-pagina-titulo" class="${estilosIndice.titulo}">Nesta página</p>` +
          `<ol class="${estilosIndice.lista}">`,
      ),
    );
    expect([...lateral.matchAll(/<a href="#([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => [m[1], m[2]])).toEqual([
      ["secao-o-que-e-a-ami", "O que é a AMI"],
      ["secao-quem-pode-se-associar", "Quem pode se associar"],
      ["secao-como-se-associar", "Como se associar"],
    ]);
  });

  it("no HTML do servidor, nenhum item se diz o atual: quem marca é o navegador, ao rolar", () => {
    expect(lateral).not.toContain("aria-current");
    expect(lateral).not.toContain(estilosIndice.atual);
  });

  it("no celular: recolhido, com a seta para baixo, e os mesmos links", () => {
    expect(recolhido).toMatch(
      new RegExp(`^<details class="${estilosIndice.recolhido}"><summary>Nesta página <svg`),
    );
    expect(recolhido).toContain(`${desenho(CaretDown, 20, "regular")}</summary>`);
    expect([...recolhido.matchAll(/<a href="#([^"]+)"/g)].map((m) => m[1])).toEqual(itens.map((i) => i.id));
  });

  it("a ligação com o navegador: a rolagem chama a função pura, com a linha de leitura", () => {
    const codigo = semComentarios(fonte("../components/editorial/IndiceNestaPagina.tsx"));
    expect(codigo.startsWith('"use client";')).toBe(true);
    expect(codigo).toContain('window.addEventListener("scroll", marcar, { passive: true });');
    expect(codigo).toContain("secaoAtual(topos, LINHA_DE_LEITURA, noFim)");
    expect(codigo).toContain('window.removeEventListener("scroll", marcar);');
  });
});

describe("o CSS do índice", () => {
  const css = semNotas(fonte("../components/editorial/IndiceNestaPagina.module.css"));
  const tablet = () => bloco(css, "@media (max-width: 980px)");

  it("no computador, preso à direita ao rolar; o recolhido não aparece", () => {
    expect(regra(base(css), ".lateral")).toMatch(/position: sticky;/);
    expect(regra(base(css), ".lateral")).toMatch(/top: 104px;/);
    expect(regra(base(css), ".recolhido")).toMatch(/display: none;/);
  });

  it("o item atual: verde escuro, em negrito, com o fio verde à esquerda; nada lima", () => {
    const r = regra(base(css), ".lista a.atual");
    expect(r).toMatch(/color: var\(--color-ami-green-800\);/);
    expect(r).toMatch(/font-weight: 600;/);
    expect(r).toMatch(/border-left-color: var\(--color-ami-green-600\);/);
    expect(css).not.toMatch(/lima/);
  });

  it("do tablet para baixo, o da lateral sai e o recolhido entra, já com a borda e o fundo", () => {
    expect(regra(tablet(), ".lateral")).toMatch(/display: none;/);
    const r = regra(tablet(), ".recolhido");
    expect(r).toMatch(/display: block;/);
    expect(r).toMatch(/border: 1px solid var\(--color-line\);/);
    expect(r).toMatch(/background: var\(--color-surface\);/);
    expect(regra(tablet(), ".recolhido[open] summary svg")).toMatch(/rotate\(180deg\)/);
  });
});
