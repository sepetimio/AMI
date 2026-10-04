import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowLeft, Newspaper } from "@phosphor-icons/react/dist/ssr";
import estilosPagina from "@/app/(site)/encontre.module.css";
import { CartaoNoticia } from "@/components/editorial/CartaoNoticia";
import { ListaDeNoticias } from "@/components/editorial/ListaDeNoticias";
import estilos from "@/components/editorial/Noticias.module.css";
import estilosHome from "@/components/editorial/UltimasNoticias.module.css";
import {
  LARGURAS_DO_CARTAO,
  LARGURAS_DO_DESTAQUE_DA_LISTA,
  SIZES_DO_DESTAQUE_DA_LISTA,
  tamanhoDosCartoes,
} from "@/lib/arranjo-das-noticias";
import { listaDeNoticias } from "@/lib/noticias";
import type { ResumoNoticia } from "@/lib/sanity/tipos";
import { tituloDePagina } from "@/lib/seo/metadados";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  A lista de notícias (/noticias): o destaque, o cartão, a grade nos
  arranjos de 1, 2, 3, 4 e 7 notícias, os dois estados sem notícia e a
  página de verdade, com o Sanity trocado por um dublê e as duas chaves de
  demonstração. As notícias daqui são de exemplo e só existem neste teste.

  A chave de demonstração é lida quando lib/demonstracao.ts é importado:
  cada caso da página troca a chave e importa a página de novo.

  O endereço das fotos sai do CDN do Sanity, com o projeto do ambiente: o
  teste o fixa por `stubEnv`. O CSS se lê do arquivo; o alinhamento dos
  cartões se mede no navegador, pelas marcas do cartão, na auditoria visual
  (scripts/auditoria-visual.js, conferência 17).
*/

const sanity = vi.hoisted(() => ({ publicadas: [] as ResumoNoticia[], limites: [] as number[] }));

vi.mock("@/lib/sanity/consultas", () => ({
  listarNoticias: async (limite: number) => {
    sanity.limites.push(limite);
    return sanity.publicadas.slice(0, limite);
  },
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
  vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");
});

afterEach(() => {
  vi.unstubAllEnvs();
  sanity.publicadas = [];
  sanity.limites = [];
});

const CDN = "https://cdn.sanity.io/images/abcd1234/production/abc123def456-2000x1333.jpg";

function noticia(n: number, extra: Partial<ResumoNoticia> = {}): ResumoNoticia {
  return {
    titulo: `Título da notícia ${n}`,
    slug: `noticia-${n}`,
    resumo: `Resumo da notícia ${n}.`,
    capa: { asset: { _ref: "image-abc123def456-2000x1333-jpg" }, alt: `Capa ${n}` },
    autor: { nome: "Rafael Coelho", crm: "10137", crmUf: "MA" },
    publicadoEm: `2026-09-${String(30 - n).padStart(2, "0")}T12:00:00-03:00`,
    ...extra,
  };
}

const varias = (quantas: number) => Array.from({ length: quantas }, (_, i) => noticia(i + 1));

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** Sem o `<link rel="preload">` que o React 19 põe antes do HTML para a foto com prioridade. */
const semPreload = (html: string) => html.replace(/<link rel="preload"[^>]*\/>/g, "");

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** O `&` como o HTML o escreve dentro de um atributo. */
const atributo = (texto: string) => texto.replaceAll("&", "&amp;");

const lista = (quantas: number, demonstracao = true) =>
  semPreload(renderToString(createElement(ListaDeNoticias, { lista: listaDeNoticias(demonstracao, varias(quantas)) })));

const cartoes = (html: string) => [...html.matchAll(/<li [^>]*data-cartao-noticia=""[\s\S]*?<\/li>/g)].map((m) => m[0]);

const grade = (html: string) => new RegExp(`<ul class="${estilos.grade}"[^>]*>`).exec(html)?.[0] ?? "(sem grade)";

const destaque = (html: string) => /<article [^>]*>[\s\S]*?<\/article>/.exec(html)?.[0] ?? "(sem destaque)";

/** A tag de abertura do link para `href`. */
const link = (html: string, href: string) => new RegExp(`<a [^>]*href="${href}"[^>]*>`).exec(html)?.[0] ?? "";

describe("o arranjo, renderizado: 1, 2, 3, 4 e 7 notícias", () => {
  it("uma: só o destaque, sem grade", () => {
    const html = lista(1);
    expect(destaque(html)).toContain("Título da notícia 1");
    expect(html).not.toContain("<ul");
  });

  it("duas: um cartão deitado embaixo do destaque", () => {
    const html = lista(2);
    expect(grade(html)).toBe(`<ul class="${estilos.grade}" style="--colunas:1" data-deitado="" role="list">`);
    expect(cartoes(html)).toHaveLength(1);
  });

  it("três: duas colunas", () => {
    const html = lista(3);
    expect(grade(html)).toBe(`<ul class="${estilos.grade}" style="--colunas:2" role="list">`);
    expect(cartoes(html)).toHaveLength(2);
  });

  it("quatro: três por linha", () => {
    const html = lista(4);
    expect(grade(html)).toBe(`<ul class="${estilos.grade}" style="--colunas:3" role="list">`);
    expect(cartoes(html)).toHaveLength(3);
  });

  it("sete: o destaque e seis cartões, na ordem de publicação", () => {
    const html = lista(7);
    expect(grade(html)).toBe(`<ul class="${estilos.grade}" style="--colunas:3" role="list">`);
    expect(cartoes(html).map((c) => /href="\/noticias\/([^"]+)"/.exec(c)?.[1])).toEqual([
      "noticia-2",
      "noticia-3",
      "noticia-4",
      "noticia-5",
      "noticia-6",
      "noticia-7",
    ]);
  });

  it("o sizes dos cartões segue o arranjo", () => {
    expect(cartoes(lista(2))[0]).toContain(`sizes="${tamanhoDosCartoes({ colunas: 1, deitado: true })}"`);
    expect(cartoes(lista(3))[0]).toContain(`sizes="${tamanhoDosCartoes({ colunas: 2, deitado: false })}"`);
    expect(cartoes(lista(7))[5]).toContain(`sizes="${tamanhoDosCartoes({ colunas: 3, deitado: false })}"`);
  });
});

describe("o destaque", () => {
  it("a mais recente, com a data, o título e o resumo sobre a foto; o destaque inteiro é o link", () => {
    const d = destaque(lista(4));
    expect(d).toMatch(new RegExp(`^<article class="${estilos.destaque}"><a [^>]*href="/noticias/noticia-1"`));
    expect(link(d, "/noticias/noticia-1")).toContain(`class="${estilos.casca}"`);
    expect(d).toContain(
      `<div class="${estilos.sobreFoto}"><time class="${estilos.data}" dateTime="2026-09-29T12:00:00-03:00">29 de setembro de 2026</time>` +
        `<h3 class="${estilos.destaqueTitulo}">Título da notícia 1</h3>` +
        `<p class="${estilos.destaqueResumo}">Resumo da notícia 1.</p></div></a></article>`,
    );
  });

  it("a foto: logo, com prioridade, na largura dos painéis, e fora do nome do link", () => {
    const img = new RegExp(`<div class="${estilos.fotoDoDestaque}"><img [^>]*>`).exec(lista(4))![0];
    expect(img).toContain(`src="${atributo(`${CDN}?w=640&fit=crop&auto=format`)}"`);
    expect(img).toContain(
      atributo(LARGURAS_DO_DESTAQUE_DA_LISTA.map((l) => `${CDN}?w=${l}&fit=crop&auto=format ${l}w`).join(", ")),
    );
    expect(img).toContain(`sizes="${SIZES_DO_DESTAQUE_DA_LISTA}"`);
    expect(img).toMatch(/fetchPriority="high"/);
    expect(img).not.toContain('loading="lazy"');
    expect(img).toContain('alt=""');
  });

  it("sem capa: o verde da marca com o símbolo, o mesmo da home", () => {
    const html = renderToString(
      createElement(ListaDeNoticias, { lista: listaDeNoticias(true, [noticia(1, { capa: undefined })]) }),
    );
    expect(html).toContain(
      `<div class="${estilos.fotoDoDestaque}"><div class="${estilosHome.semCapa}" aria-hidden="true"></div></div>`,
    );
  });
});

describe("o cartão", () => {
  const sizes = tamanhoDosCartoes({ colunas: 3, deitado: false });
  const cartao = (n?: ResumoNoticia) => renderToString(createElement(CartaoNoticia, { noticia: n, sizes }));

  it("a foto 16:10, a data, o título com o link esticado e o resumo", () => {
    const html = cartao(noticia(2));
    expect(html).toMatch(
      new RegExp(`^<li class="${estilos.cartao}" data-cartao-noticia=""><div class="${estilos.foto}" data-foto=""><img `),
    );
    expect(html).toContain(
      `<div class="${estilos.corpo}"><time class="${estilos.data}" dateTime="2026-09-28T12:00:00-03:00" data-data="">28 de setembro de 2026</time>` +
        `<h3 class="${estilos.titulo}" data-titulo=""><a href="/noticias/noticia-2">Título da notícia 2</a></h3>` +
        `<p class="${estilos.resumo}">Resumo da notícia 2.</p></div></li>`,
    );
  });

  it("a foto só baixa ao rolar, na largura desenhada, e fora do nome do link", () => {
    const img = /<img [^>]*>/.exec(cartao(noticia(2)))![0];
    expect(img).toContain(`src="${atributo(`${CDN}?w=320&fit=crop&auto=format`)}"`);
    expect(img).toContain(
      atributo(LARGURAS_DO_CARTAO.map((l) => `${CDN}?w=${l}&fit=crop&auto=format ${l}w`).join(", ")),
    );
    expect(img).toContain(`sizes="${sizes}"`);
    expect(img).toContain('loading="lazy"');
    expect(img).not.toMatch(/fetchPriority/);
    expect(img).toContain('alt=""');
  });

  it("notícia sem capa: o verde da marca no lugar da foto", () => {
    expect(cartao(noticia(2, { capa: undefined }))).toContain(
      `<div class="${estilos.foto}" data-foto=""><div class="${estilosHome.semCapa}" aria-hidden="true"></div></div>`,
    );
  });

  it("a moldura: sem link, sem data, com o texto da home", () => {
    const html = cartao();
    expect(html).toMatch(new RegExp(`^<li class="${estilos.cartao}" data-cartao-noticia="" data-a-entrar="notícias">`));
    expect(html).toContain('role="img" aria-label="Espaço reservado para a capa de uma notícia"');
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("<time");
    expect(tela(html)).toBe("Notícia a entrar Espaço reservado para uma publicação da AMI.");
  });
});

describe("sem notícia", () => {
  const vazia = (demonstracao: boolean) =>
    renderToString(createElement(ListaDeNoticias, { lista: listaDeNoticias(demonstracao, []) }));

  it("na demonstração: o destaque e três cartões a entrar, nenhum link", () => {
    const html = vazia(true);
    expect(html.match(/data-a-entrar="notícias"/g)).toHaveLength(4);
    expect(grade(html)).toBe(`<ul class="${estilos.grade}" style="--colunas:3" role="list">`);
    expect(destaque(html)).toContain(`<h3 class="${estilos.destaqueTitulo}">Notícia a entrar</h3>`);
    expect(destaque(html)).toContain('role="img" aria-label="Espaço reservado para a capa de uma notícia"');
    expect(html).not.toContain("<a ");
  });

  it("fora dela: a frase na coluna do texto e o botão para o início, sem moldura", () => {
    const html = vazia(false);
    expect(html).not.toContain("data-a-entrar");
    expect(html).toContain(
      `<div class="${estilos.nenhuma}"><p data-coluna="">Nenhuma notícia publicada ainda.</p><div class="${estilos.acao}">`,
    );
    const botao = /<a [^>]*href="\/"[^>]*>[\s\S]*?<\/a>/.exec(html)![0];
    expect(botao).toContain('class="botao-contorno"');
    expect(botao).toContain(desenho(ArrowLeft, 20, "regular"));
    expect(tela(botao)).toBe("Voltar para o início");
  });

  it("o título da região existe nos três estados, para quem navega por cabeçalhos", () => {
    for (const html of [vazia(true), vazia(false), lista(4)]) {
      expect(html).toMatch(
        new RegExp(
          `^<section data-bloco="noticias" aria-labelledby="publicacoes-titulo" class="${estilos.lista}"><h2 id="publicacoes-titulo" class="sr-only">Publicações</h2>`,
        ),
      );
    }
  });
});

async function pagina(chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const modulo = await import("@/app/(site)/noticias/page");
  return { html: semPreload(await htmlDe(await modulo.default())), modulo };
}

const blocos = (html: string) => [...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);

const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]) as Record<string, unknown>,
  );

describe("a página /noticias", () => {
  it("a faixa curta e a lista, no invólucro de coluna e ritmo, com um h1 só", async () => {
    sanity.publicadas = varias(4);
    const { html } = await pagina("true");
    expect(html).toContain(`<div class="${estilosPagina.pagina}"><section data-bloco="topo"`);
    expect(blocos(html)).toEqual(["topo", "noticias"]);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("a faixa: NOTÍCIAS, o título, a frase e o jornal no ladrilho", async () => {
    const { html } = await pagina("true");
    expect(html).toContain('data-coluna="">Notícias</span>');
    expect(html).toContain(">Notícias da AMI</h1>");
    expect(html).toContain(
      ">Comunicados, eventos e notas da associação. Cada texto é assinado por um médico, com o número de inscrição no CRM.</p>",
    );
    expect(html).toContain(desenho(Newspaper, 84, "duotone"));
  });

  it("pede no máximo 20 notícias ao Sanity", async () => {
    await pagina("true");
    expect(sanity.limites).toEqual([20]);
  });

  it("com notícia: o ItemList com as notícias da tela, na ordem; nenhum BreadcrumbList", async () => {
    sanity.publicadas = varias(3);
    const { html } = await pagina("false");
    const dados = jsonLd(html);
    expect(dados.map((d) => d["@type"])).toEqual(["ItemList"]);
    const itens = dados[0].itemListElement as { url: string }[];
    expect(itens.map((i) => i.url.replace(/^.*\/noticias\//, ""))).toEqual(["noticia-1", "noticia-2", "noticia-3"]);
    expect(html).not.toContain("BreadcrumbList");
  });

  it("sem notícia, sem ItemList: na demonstração as molduras, fora dela a frase", async () => {
    const demo = (await pagina("true")).html;
    expect(demo).not.toContain("application/ld+json");
    expect(demo.match(/data-a-entrar="notícias"/g)).toHaveLength(4);
    const fora = (await pagina("false")).html;
    expect(fora).toContain("Nenhuma notícia publicada ainda.");
    expect(fora).not.toContain("data-a-entrar");
    expect(fora).not.toContain("a entrar");
  });

  it("nenhuma Cabeceira, trilha, BreadcrumbList ou PROVISÓRIO, nos dois modos", async () => {
    for (const chave of ["true", "false"]) {
      sanity.publicadas = chave === "true" ? [] : varias(2);
      const { html } = await pagina(chave);
      expect(html, chave).not.toContain("Trilha de navegação");
      expect(html, chave).not.toContain("-mt-32");
      expect(html, chave).not.toContain("BreadcrumbList");
      expect(html, chave).not.toContain("PROVISÓRIO");
    }
  });

  it("a lista fecha a página e não é faixa: o rodapé fica a --ritmo", async () => {
    sanity.publicadas = varias(2);
    const { html } = await pagina("true");
    expect(html).toMatch(/<section data-bloco="noticias" aria-labelledby="publicacoes-titulo"[\s\S]*<\/section><\/div>$/);
    expect(html).not.toMatch(/data-bloco="noticias" data-faixa/);
  });

  it("os metadados continuam os de antes", async () => {
    const { modulo } = await pagina("true");
    expect(modulo.metadata.title).toBe(tituloDePagina("Notícias da Associação Médica de Imperatriz"));
    expect(modulo.metadata.description).toBe(
      "Comunicados, eventos e notas da Associação Médica de Imperatriz, assinados por médicos com CRM.",
    );
    expect(modulo.metadata.alternates).toEqual({ canonical: "/noticias" });
  });
});

describe("o CSS da lista", () => {
  const css = semNotas(fonte("../components/editorial/Noticias.module.css"));
  const tablet = () => bloco(css, "@media (max-width: 980px)");
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("o destaque: na largura dos painéis, em 2:1, com o canto dos painéis; 4:3 no celular", () => {
    expect(regra(base(css), ".destaque")).toMatch(/border-radius: var\(--radius-painel\);/);
    expect(regra(base(css), ".destaque")).toMatch(/box-shadow: var\(--shadow-erguido\);/);
    expect(regra(base(css), ".fotoDoDestaque")).toMatch(/aspect-ratio: 2 \/ 1;/);
    expect(regra(cel(), ".fotoDoDestaque")).toMatch(/aspect-ratio: 4 \/ 3;/);
  });

  it("o destaque e a grade são um bloco só: --gap entre os dois", () => {
    expect(regra(base(css), ".lista > .grade")).toMatch(/margin-top: var\(--gap\);/);
  });

  it("o degradê do site construído: do alto da data para baixo, nunca abaixo de 75%", () => {
    const r = regra(base(css), ".sobreFoto");
    expect(r).toMatch(/--folga: 96px;/);
    expect(r).toMatch(
      /rgba\(8, 14, 10, 0\.88\) 0%,\s*rgba\(8, 14, 10, 0\.75\) calc\(100% - var\(--folga\)\),\s*rgba\(8, 14, 10, 0\) 100%/,
    );
    expect(regra(base(css), ".sobreFoto .data")).toMatch(/color: rgba\(255, 255, 255, 0\.72\);/);
  });

  it("a grade: uma coluna por cartão até três; duas no tablet, uma com o deitado", () => {
    expect(regra(base(css), ".grade")).toMatch(/grid-template-columns: repeat\(var\(--colunas, 3\), minmax\(0, 1fr\)\);/);
    expect(regra(tablet(), ".grade")).toMatch(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    expect(regra(tablet(), ".grade[data-deitado]")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("o cartão deitado: a foto na largura de uma coluna de três", () => {
    expect(regra(bloco(css, "@media (min-width: 701px)"), ".grade[data-deitado] .cartao")).toMatch(
      /grid-template-columns: calc\(\(100% - 2 \* var\(--gap\)\) \/ 3\) minmax\(0, 1fr\);/,
    );
  });

  it("o cartão: branco, canto de 18px, foto 16:10 e o resumo em duas linhas", () => {
    expect(regra(base(css), ".cartao")).toMatch(/background: var\(--color-surface\);/);
    expect(regra(base(css), ".cartao")).toMatch(/border-radius: 18px;/);
    expect(regra(base(css), ".foto")).toMatch(/aspect-ratio: 16 \/ 10;/);
    expect(regra(base(css), ".resumo")).toMatch(/-webkit-line-clamp: 2;/);
  });

  it("no mouse: só o cartão que é link sobe 3px, com sombra neutra; nada lima", () => {
    const r = regra(base(css), ".cartao:has(a):hover");
    expect(r).toMatch(/transform: translateY\(-3px\);/);
    expect(r).toMatch(/rgba\(16, 24, 40, 0\.1\)/);
    expect(css).not.toMatch(/lima/);
  });

  it("o foco do título vai para o cartão inteiro, só onde o navegador sabe :has", () => {
    const comHas = bloco(css, "@supports selector(:has(a))");
    expect(regra(comHas, ".titulo a:focus-visible")).toMatch(/outline: none;/);
    expect(regra(comHas, ".cartao:has(.titulo a:focus-visible)")).toMatch(
      /outline: 2px solid var\(--color-ami-green-600\);/,
    );
  });

  it("no celular: a lista na coluna do texto, linhas com a miniatura de 88px e fio, sem o resumo", () => {
    expect(regra(cel(), ".lista,\n  .outras > .grade")).toMatch(/padding: 0 var\(--m\);/);
    expect(regra(cel(), ".foto")).toMatch(/width: 88px;/);
    expect(regra(cel(), ".foto")).toMatch(/aspect-ratio: 1 \/ 1;/);
    expect(regra(cel(), ".cartao + .cartao")).toMatch(/border-top: 1px solid var\(--color-line\);/);
    expect(regra(cel(), ".resumo")).toMatch(/display: none;/);
  });

  it("o resumo do destaque, o dos cartões e a frase sem notícia quebram com o text-wrap: pretty do desenho", () => {
    for (const seletor of [".destaqueResumo", ".resumo", ".nenhuma p"])
      expect(regra(base(css), seletor), seletor).toMatch(/text-wrap: pretty;/);
  });

  it("sem notícia: a frase na letra dos títulos, em verde escuro", () => {
    const r = regra(base(css), ".nenhuma p");
    expect(r).toMatch(/font-family: var\(--font-titulo\);/);
    expect(r).toMatch(/color: var\(--color-ami-green-800\);/);
  });
});
