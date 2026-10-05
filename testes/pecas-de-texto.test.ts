import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import estilosBusca from "@/components/busca/FaixaDaBusca.module.css";
import { CorpoDoTexto } from "@/components/editorial/CorpoDoTexto";
import { FaixaDoTexto } from "@/components/editorial/FaixaDoTexto";
import estilos from "@/components/editorial/PaginaDeTexto.module.css";
import estilosFaixa from "@/components/layout/FaixaCurta.module.css";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { LARGURAS_DA_IMAGEM_DO_TEXTO, SIZES_DA_IMAGEM_DO_TEXTO, VOLTA_NOTICIAS } from "@/lib/noticias";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { topoSemAVolta } from "@/testes/renderizar";

/*
  As peças do plano de A Associação, alargadas para as notícias e o
  contato, no HTML de servidor:
  - a faixa curta com um rótulo no lugar do link de volta (a lista de
    notícias, o contato), e com uma classe a mais (a notícia aberta);
  - o corpo em faixa branca, que saiu de PaginaDeTexto para a notícia
    aberta usar também;
  - o texto rico com a citação, a lista numerada e a imagem com legenda.

  O que essas peças já desenhavam continua provado pelos testes de lá
  (testes/faixa-curta-e-indice.test.ts, testes/modelo-de-texto.test.ts).
  O CSS se lê do arquivo.

  A imagem do texto monta o endereço do CDN com o projeto do ambiente: o
  teste o fixa por `stubEnv`.
*/

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
  vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** O `&` como o HTML o escreve dentro de um atributo. */
const atributo = (texto: string) => texto.replaceAll("&", "&amp;");

function b(chave: string, estilo: string, texto: string, extra: Record<string, unknown> = {}): PortableTextBlock {
  return {
    _type: "block",
    _key: chave,
    style: estilo,
    markDefs: [],
    children: [{ _type: "span", _key: `${chave}s`, text: texto, marks: [] }],
    ...extra,
  } as PortableTextBlock;
}

describe("a faixa curta com rótulo", () => {
  const html = renderToString(
    createElement(FaixaCurta, {
      rotulo: "Notícias",
      titulo: "Notícias da AMI",
      texto: "Comunicados, eventos e notas da associação.",
    }),
  );

  it("a mesma faixa de ponta a ponta, que abre a página", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="topo" data-faixa="" data-abertura="" aria-labelledby="pagina-titulo" class="textura-verde ${estilosBusca.faixa} ${estilosFaixa.especialidade}"><div class="brilho" aria-hidden="true"></div>`,
      ),
    );
  });

  it("o rótulo no lugar do link de volta, na coluna do texto, e nenhum link", () => {
    expect(html).toContain(
      `<div><span class="rotulo-secao ${estilosBusca.sobre}" data-coluna="">Notícias</span>` +
        `<h1 id="pagina-titulo" class="${estilosBusca.titulo}">Notícias da AMI</h1>` +
        `<p class="${estilosBusca.texto}">Comunicados, eventos e notas da associação.</p></div>`,
    );
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("link-de-volta");
  });

  it("nenhum ícone: a faixa termina na coluna do texto", () => {
    expect(topoSemAVolta(html)).not.toContain("<svg");
    expect(html).toMatch(/<\/p><\/div><\/section>$/);
  });
});

describe("a faixa curta com uma classe a mais", () => {
  const html = renderToString(
    createElement(
      FaixaCurta,
      { volta: VOLTA_NOTICIAS, titulo: "Jornada", texto: "Resumo.", className: "materia" },
      createElement("div", { className: "assinatura" }, "Por Rafael Coelho"),
    ),
  );

  it("a classe entra no fim da classe da faixa", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section [^>]*class="textura-verde ${estilosBusca.faixa} ${estilosFaixa.especialidade} materia">`,
      ),
    );
  });

  it("o link de volta para a lista, com a seta, na coluna do texto", () => {
    const link = /<a [^>]*href="\/noticias"[^>]*>[\s\S]*?<\/a>/.exec(html)![0];
    expect(link).toContain(`class="rotulo-secao link-de-volta ${estilosBusca.sobre}"`);
    expect(link).toContain('data-coluna=""');
    expect(link).toContain(desenho(ArrowLeft, 20, "regular"));
    expect(tela(link)).toBe("Notícias");
  });

  it("sem ícone: a faixa termina no que vem junto, logo depois do texto", () => {
    expect(topoSemAVolta(html)).not.toContain("<svg");
    expect(html).toMatch(
      new RegExp(
        `<p class="${estilosBusca.texto}">Resumo\\.</p><div class="assinatura">Por Rafael Coelho</div></div></section>$`,
      ),
    );
  });
});

describe("o corpo em faixa branca", () => {
  const CORPO = [b("a", "h2", "Programação"), b("b", "normal", "Texto."), b("c", "h2", "Como se inscrever")];

  it("a faixa com o nome dado e a coluna de leitura", () => {
    const html = renderToString(createElement(FaixaDoTexto, { rotulo: "Texto da notícia", corpo: CORPO }));
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="texto" data-faixa="" aria-label="Texto da notícia" class="${estilos.faixa}"><div class="${estilos.grade}"><article class="${estilos.coluna}" data-coluna="">`,
      ),
    );
  });

  it("sem data de atualização, sem a linha do relógio", () => {
    const html = renderToString(createElement(FaixaDoTexto, { rotulo: "x", corpo: CORPO }));
    expect(html).not.toContain(estilos.atualizado);
    expect(html).not.toContain("Atualizado em");
  });

  it("com ela, a data por extenso no alto da coluna, sem relógio", () => {
    const html = renderToString(
      createElement(FaixaDoTexto, { rotulo: "x", atualizadoEm: "2026-09-20T13:00:00Z", corpo: CORPO }),
    );
    expect(html).toContain(
      `<article class="${estilos.coluna}" data-coluna=""><p class="${estilos.atualizado}">Atualizado em <time dateTime="2026-09-20T13:00:00Z">20 de setembro de 2026</time></p>`,
    );
  });

  it("com aviso, o quadro só com o título e o texto, sem ícone", () => {
    const html = renderToString(
      createElement(FaixaDoTexto, { rotulo: "x", aviso: { titulo: "Aviso", texto: "Texto do aviso." }, corpo: CORPO }),
    );
    expect(html).toContain(
      `<div class="${estilos.quadro}" role="note"><p class="${estilos.quadroTitulo}">Aviso</p><p>Texto do aviso.</p></div>`,
    );
  });

  it("com dois títulos de seção, o índice; o que vem junto fecha a coluna", () => {
    const html = renderToString(
      createElement(FaixaDoTexto, { rotulo: "x", corpo: CORPO }, createElement("p", { className: "fim" }, "Fim")),
    );
    expect(html).toContain('<h2 id="secao-programacao">Programação</h2>');
    expect(html).toContain('<p class="fim">Fim</p></article><nav ');
    expect(html).toContain('data-nesta-pagina=""');
  });

  it("sem aviso, sem o quadro", () => {
    expect(renderToString(createElement(FaixaDoTexto, { rotulo: "x", corpo: CORPO }))).not.toContain('role="note"');
  });
});

describe("o texto rico", () => {
  const html = (blocos: PortableTextBlock[]) => renderToString(createElement(CorpoDoTexto, { blocos }));
  const CDN = "https://cdn.sanity.io/images/abcd1234/production/fed654cba321-1400x934.jpg";
  const imagem = (extra: Record<string, unknown> = {}) =>
    ({
      _type: "image",
      _key: "i",
      asset: { _type: "reference", _ref: "image-fed654cba321-1400x934-jpg" },
      alt: "Auditório vazio com mesas redondas",
      ...extra,
    }) as unknown as PortableTextBlock;

  it("a citação: uma tag só, sem aspas escritas", () => {
    expect(html([b("q", "blockquote", "Queremos que o médico saia da jornada com algo que use no consultório.")])).toBe(
      "<blockquote>Queremos que o médico saia da jornada com algo que use no consultório.</blockquote>",
    );
  });

  it("a lista numerada, com a classe dela", () => {
    expect(
      html([
        b("1", "normal", "Tenha à mão o número do CRM.", { listItem: "number", level: 1 }),
        b("2", "normal", "Preencha o formulário.", { listItem: "number", level: 1 }),
      ]),
    ).toBe(`<ol class="${estilos.numerada}"><li>Tenha à mão o número do CRM.</li><li>Preencha o formulário.</li></ol>`);
  });

  it("a imagem: na proporção do arquivo, com o srcset e o sizes da coluna, a legenda embaixo e sem moldura", () => {
    const srcSet = LARGURAS_DA_IMAGEM_DO_TEXTO.map((l) => `${CDN}?w=${l}&fit=crop&auto=format ${l}w`).join(", ");
    expect(html([imagem({ legenda: "Palestras pela manhã, oficinas à tarde." })])).toBe(
      `<figure><img src="${atributo(`${CDN}?w=960&fit=crop&auto=format`)}" srcSet="${atributo(srcSet)}" ` +
        `sizes="${SIZES_DA_IMAGEM_DO_TEXTO}" alt="Auditório vazio com mesas redondas" width="1360" height="907" ` +
        `loading="lazy" decoding="async"/><figcaption>Palestras pela manhã, oficinas à tarde.</figcaption></figure>`,
    );
  });

  it("sem legenda, sem figcaption", () => {
    expect(html([imagem()])).not.toContain("<figcaption");
  });

  it("referência quebrada: a imagem some, e o texto continua", () => {
    const saida = html([imagem({ asset: { _type: "reference", _ref: "nao-e-um-ref-valido" } }), b("p", "normal", "Depois.")]);
    expect(saida).toBe("<p>Depois.</p>");
  });

  it("o link do texto leva a classe do desenho", () => {
    const comLink = {
      ...b("l", "normal", ""),
      markDefs: [{ _type: "link", _key: "k", href: "/associacao/seja-associado" }],
      children: [{ _type: "span", _key: "l1", text: "Seja associado", marks: ["k"] }],
    } as PortableTextBlock;
    expect(html([comLink])).toBe(`<p><a class="${estilos.link}" href="/associacao/seja-associado">Seja associado</a></p>`);
  });

  it("o link com endereço que hrefSeguro barra, ou sem endereço, sai como texto", () => {
    const comLink = (href: string | undefined) =>
      ({
        ...b("l", "normal", ""),
        markDefs: [{ _type: "link", _key: "k", href }],
        children: [
          { _type: "span", _key: "l0", text: "Leia ", marks: [] },
          { _type: "span", _key: "l1", text: "o estatuto", marks: ["k"] },
        ],
      }) as PortableTextBlock;
    for (const href of ["javascript:alert(1)", " JavaScript:alert(1)", "data:text/html,x", "vbscript:x", undefined]) {
      /* `<!-- -->` é a costura do React entre dois textos vizinhos. */
      expect(html([comLink(href)]), String(href)).toBe("<p>Leia <!-- -->o estatuto</p>");
    }
    expect(html([comLink("https://portal.cfm.org.br")])).toBe(
      `<p>Leia <a href="https://portal.cfm.org.br" class="${estilos.link}">o estatuto</a></p>`,
    );
    expect(html([comLink("  #fontes ")])).toBe(`<p>Leia <a href="#fontes" class="${estilos.link}">o estatuto</a></p>`);
  });
});

describe("o CSS do texto rico", () => {
  const css = semNotas(fonte("../components/editorial/PaginaDeTexto.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("a lista numerada: sem o número do navegador, o número num círculo cinza com fio", () => {
    const ol = regra(base(css), ".coluna .numerada");
    expect(ol).toMatch(/list-style: none;/);
    expect(ol).toMatch(/counter-reset: passo;/);
    expect(regra(base(css), ".coluna .numerada > li")).toMatch(/counter-increment: passo;/);
    const numero = regra(base(css), ".coluna .numerada > li::before");
    expect(numero).toMatch(/content: counter\(passo\);/);
    expect(numero).toMatch(/width: 26px;/);
    expect(numero).toMatch(/border-radius: 99px;/);
    expect(numero).toMatch(/background: var\(--color-surface-fundo\);/);
    expect(numero).toMatch(/box-shadow: inset 0 0 0 1px var\(--color-line\);/);
    expect(numero).toMatch(/color: var\(--color-ami-green-800\);/);
    expect(regra(cel(), ".coluna .numerada > li::before")).toMatch(/width: 24px;/);
  });

  it("a citação: 20px com o fio verde à esquerda; 17,5px no celular", () => {
    const r = regra(base(css), ".coluna > blockquote");
    expect(r).toMatch(/border-left: 2px solid var\(--color-ami-green-600\);/);
    expect(r).toMatch(/font-size: 20px;/);
    expect(r).not.toMatch(/content/);
    expect(regra(cel(), ".coluna > blockquote")).toMatch(/font-size: 17\.5px;/);
  });

  it("a imagem: na largura da coluna, com canto de 16px, sem borda nem casca; a legenda em cinza", () => {
    const img = regra(base(css), ".coluna > figure img");
    expect(img).toMatch(/width: 100%;/);
    expect(img).toMatch(/border-radius: 16px;/);
    expect(img).not.toMatch(/border:|padding|box-shadow/);
    expect(regra(base(css), ".coluna figcaption")).toMatch(/color: var\(--color-ink-400\);/);
  });

  it("o link: o verde de ação, sublinhado fino; no mouse, o verde escurece", () => {
    const r = regra(base(css), ".link");
    expect(r).toMatch(/color: var\(--color-ami-green-600\);/);
    expect(r).toMatch(/text-decoration-thickness: 1px;/);
    expect(r).toMatch(/text-underline-offset: 3px;/);
    expect(regra(base(css), ".link:hover")).toMatch(/color: var\(--color-ami-green-800\);/);
  });
});
