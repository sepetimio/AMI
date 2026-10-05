import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import estilosPagina from "@/app/(site)/encontre.module.css";
import PaginaNoticia, { generateMetadata, generateStaticParams, revalidate } from "@/app/(site)/noticias/[slug]/page";
import { AutorDaNoticia } from "@/components/editorial/AutorDaNoticia";
import { CapaDaNoticia } from "@/components/editorial/CapaDaNoticia";
import { FaixaDaNoticia } from "@/components/editorial/FaixaDaNoticia";
import estilos from "@/components/editorial/NoticiaAberta.module.css";
import estilosLista from "@/components/editorial/Noticias.module.css";
import { OutrasNoticias } from "@/components/editorial/OutrasNoticias";
import estilosTexto from "@/components/editorial/PaginaDeTexto.module.css";
import estilosHome from "@/components/editorial/UltimasNoticias.module.css";
import { tamanhoDosCartoes } from "@/lib/arranjo-das-noticias";
import { SIZES_DA_CAPA, arranjoDasOutras, capaDaNoticia } from "@/lib/noticias";
import type { Noticia, ResumoNoticia } from "@/lib/sanity/tipos";
import { tituloDePagina } from "@/lib/seo/metadados";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe, topoSemAVolta } from "@/testes/renderizar";

/*
  A notícia aberta (/noticias/[slug]): a faixa com a assinatura, a capa, o
  corpo na coluna de leitura, o fim da notícia, "Outras notícias" e a página
  de verdade, com o Sanity trocado por um dublê. As notícias daqui são de
  exemplo e só existem neste teste; o autor é o da diretoria de teste do
  banco.

  A página não depende da chave de demonstração: sem notícia publicada, ela
  dá 404 nos dois modos.

  O endereço da capa sai do CDN do Sanity, com o projeto do ambiente: o
  teste o fixa por `stubEnv`, e `CONFIG` é o mesmo projeto, para o
  `capaDaNoticia` daqui dar o mesmo endereço que a página desenha.
*/

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const sanity = vi.hoisted(() => ({
  noticias: {} as Record<string, unknown>,
  publicadas: [] as unknown[],
  limites: [] as number[],
}));

vi.mock("@/lib/sanity/consultas", () => ({
  noticiaPorSlug: async (slug: string) => sanity.noticias[slug] ?? null,
  listarNoticias: async (limite: number) => {
    sanity.limites.push(limite);
    return sanity.publicadas.slice(0, limite);
  },
  slugsDeNoticias: async () => Object.keys(sanity.noticias),
}));

const CONFIG = { projectId: "abcd1234", dataset: "production" };

const desenho = (Componente: Icon, size: number, weight: "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** Sem o `<link rel="preload">` que o React 19 põe antes do HTML para a capa. */
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

const AUTOR = { nome: "Rafael Coelho", crm: "10137", crmUf: "MA", slugDoPerfil: "rafael-coelho" };
const CAPA = {
  asset: { _ref: "image-abc123def456-2000x1333-jpg" },
  alt: "Plateia sentada num auditório escuro, de frente para o palco",
  hotspot: { x: 0.5, y: 0.9, width: 0.2, height: 0.2 },
};

const JORNADA: Noticia = {
  titulo: "Jornada Médica de Imperatriz abre inscrições para a edição de novembro",
  slug: "jornada",
  resumo: "Dois dias de palestras e oficinas para médicos e estudantes, na sede da AMI.",
  publicadoEm: "2026-09-18T09:00:00-03:00",
  atualizadoEm: "2026-09-20T10:00:00-03:00",
  capa: CAPA,
  autor: AUTOR,
  corpo: [
    b("a", "normal", "A AMI abre as inscrições para a Jornada Médica de Imperatriz."),
    b("b", "h2", "Programação"),
    b("c", "normal", "Os dois dias se dividem entre palestras e oficinas."),
    b("d", "blockquote", "Queremos que o médico saia da jornada com algo que use no consultório."),
    b("e", "h2", "Como se inscrever"),
    b("f", "normal", "Tenha à mão o número de inscrição no CRM.", { listItem: "number", level: 1 }),
  ],
};

const COMUNICADO: Noticia = {
  titulo: "Comunicado aos associados: atualização do cadastro no diretório",
  slug: "comunicado",
  resumo: "Os associados podem conferir e corrigir os dados que aparecem no diretório do site.",
  publicadoEm: "2026-07-30T09:00:00-03:00",
  autor: { nome: "Rafael Coelho", crm: "10137", crmUf: "MA" },
  corpo: [b("a", "normal", "A AMI pede aos associados que confiram os dados do diretório.")],
};

function resumo(n: Noticia): ResumoNoticia {
  return { titulo: n.titulo, slug: n.slug, resumo: n.resumo, capa: n.capa, autor: n.autor, publicadoEm: n.publicadoEm };
}

const outra = (n: number): ResumoNoticia => ({
  titulo: `Outra notícia ${n}`,
  slug: `outra-${n}`,
  resumo: `Resumo da outra notícia ${n}.`,
  autor: AUTOR,
  publicadoEm: `2026-09-0${n}T12:00:00-03:00`,
});

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
  vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");
  sanity.noticias = { jornada: JORNADA, comunicado: COMUNICADO };
  sanity.publicadas = [resumo(JORNADA), outra(5), outra(4), outra(3), resumo(COMUNICADO)];
  sanity.limites = [];
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("a faixa da notícia", () => {
  const html = () => renderToString(createElement(FaixaDaNoticia, { noticia: JORNADA }));

  it("a faixa curta com a classe da notícia, sem ícone fora do link de volta, nem na assinatura", () => {
    expect(html()).toMatch(
      new RegExp(`^<section data-bloco="topo" data-faixa="" data-abertura="" [^>]*class="textura-verde [^"]* ${estilos.materia}">`),
    );
    expect(topoSemAVolta(html())).not.toContain("<svg");
    const sem = renderToString(createElement(FaixaDaNoticia, { noticia: COMUNICADO }));
    expect(topoSemAVolta(sem)).not.toContain("<svg");
  });

  it("← NOTÍCIAS, o título e o resumo", () => {
    expect(tela(/<a [^>]*href="\/noticias"[^>]*>[\s\S]*?<\/a>/.exec(html())![0])).toBe("Notícias");
    expect(html()).toContain(`>${JORNADA.titulo}</h1>`);
    expect(html()).toContain(`>${JORNADA.resumo}</p>`);
  });

  it("embaixo do fio, a assinatura: Por e o link do perfil, MÉDICO · CRM e a data", () => {
    expect(html()).toContain(
      `<div class="${estilos.assinatura}">` +
        `<div><p class="${estilos.nome}">Por <a href="/medico/rafael-coelho">Rafael Coelho</a></p>` +
        `<p class="${estilos.meta}">MÉDICO · CRM/MA 10137<span class="${estilos.ponto}"> · </span>` +
        `<time dateTime="2026-09-18T09:00:00-03:00">18 de setembro de 2026</time></p></div></div></div></section>`,
    );
  });

  it("autor sem perfil: o nome sem link", () => {
    const sem = renderToString(createElement(FaixaDaNoticia, { noticia: COMUNICADO }));
    expect(sem).toContain(`<p class="${estilos.nome}">Por Rafael Coelho</p>`);
    expect(sem).not.toContain("/medico/");
  });
});

describe("a capa", () => {
  it("em 16:9, recortada pelo ponto de interesse, com prioridade, na largura dos painéis", () => {
    const capa = capaDaNoticia(CAPA, CONFIG)!;
    expect(semPreload(renderToString(createElement(CapaDaNoticia, { capa })))).toBe(
      `<figure data-bloco="capa" class="${estilos.capa}"><img src="${atributo(capa.src)}" srcSet="${atributo(capa.srcSet)}" ` +
        `sizes="${SIZES_DA_CAPA}" alt="${CAPA.alt}" width="1600" height="900" fetchPriority="high" decoding="async"/></figure>`,
    );
  });
});

describe("o fim da notícia", () => {
  it("quem assina, sem ladrilho, com Ver perfil, e o aviso de saúde", () => {
    expect(renderToString(createElement(AutorDaNoticia, { autor: AUTOR }))).toBe(
      `<div class="${estilosTexto.autorFim}">` +
        `<div><p class="${estilosTexto.autorNome}">Por Rafael Coelho</p><p class="${estilosTexto.autorCrm}">MÉDICO · CRM/MA 10137</p></div>` +
        `<div class="${estilosTexto.autorAcoes}"><a class="botao-contorno" href="/medico/rafael-coelho">Ver perfil ${desenho(ArrowRight, 20, "regular")}</a></div></div>` +
        `<p class="${estilosTexto.avisoSaude}">Conteúdo informativo publicado pela Associação Médica de Imperatriz. Não substitui a consulta médica.</p>`,
    );
  });

  it("o único ícone do fim da notícia é a seta de Ver perfil; sem perfil, nenhum", () => {
    const com = renderToString(createElement(AutorDaNoticia, { autor: AUTOR }));
    expect(com).not.toContain("ladrilho-icone");
    expect(com.match(/<svg/g)).toHaveLength(1);
    expect(com).toContain(`Ver perfil ${desenho(ArrowRight, 20, "regular")}</a>`);
    const sem = renderToString(createElement(AutorDaNoticia, { autor: COMUNICADO.autor }));
    expect(sem).not.toContain("ladrilho-icone");
    expect(sem).not.toContain("<svg");
  });

  it("sem perfil, sem o botão, e o nome sem link", () => {
    const html = renderToString(createElement(AutorDaNoticia, { autor: COMUNICADO.autor }));
    expect(html).not.toContain(estilosTexto.autorAcoes);
    expect(html).not.toContain("<a ");
    expect(html).toContain(`<p class="${estilosTexto.autorNome}">Por Rafael Coelho</p>`);
  });
});

describe("Outras notícias", () => {
  const outras = (n: number) => [outra(5), outra(4), outra(3)].slice(0, n);
  const html = (n: number) => renderToString(createElement(OutrasNoticias, { noticias: outras(n) }));

  it("o cabeçalho de seção das notícias da home, com Ver todas as notícias; entra ao rolar", () => {
    expect(html(3).startsWith(
      `<section data-bloco="outras" aria-labelledby="outras-titulo" class="revelar ${estilosLista.outras}">` +
        `<div class="${estilosHome.cabSecao}"><div><span class="rotulo-secao" data-coluna="">Notícias</span>` +
        `<h2 id="outras-titulo" class="${estilosHome.titulo}">Outras notícias</h2></div>` +
        `<a class="botao-linha" href="/noticias">Ver todas as notícias ${desenho(ArrowUpRight, 13, "regular")}</a></div>`,
    )).toBe(true);
  });

  it("três: três por linha, com o cartão da lista", () => {
    expect(html(3)).toContain(`<ul class="${estilosLista.grade}" style="--colunas:3" role="list">`);
    expect(html(3).match(/data-cartao-noticia=""/g)).toHaveLength(3);
  });

  it("duas: duas colunas, nenhuma vazia", () => {
    expect(html(2)).toContain(`<ul class="${estilosLista.grade}" style="--colunas:2" role="list">`);
    expect(html(2).match(/data-cartao-noticia=""/g)).toHaveLength(2);
  });

  it("uma: o cartão deitado, numa coluna", () => {
    expect(html(1)).toContain(`<ul class="${estilosLista.grade}" style="--colunas:1" data-deitado="" role="list">`);
    expect(html(1).match(/data-cartao-noticia=""/g)).toHaveLength(1);
  });

  it("nenhuma: o bloco não sai", () => {
    expect(html(0)).toBe("");
  });

  it("o tamanho da foto segue o arranjo: o de uma coluna de três, de duas ou o do cartão deitado", () => {
    for (const n of [1, 2, 3]) {
      const comCapa = outras(n).map((o) => ({ ...o, capa: CAPA }));
      const h = renderToString(createElement(OutrasNoticias, { noticias: comCapa }));
      const sizes = [...h.matchAll(/ sizes="([^"]+)"/g)].map((m) => m[1]);
      expect(sizes).toEqual(Array(n).fill(tamanhoDosCartoes(arranjoDasOutras(n)!)));
    }
  });
});

async function renderiza(slug: string) {
  return semPreload(await htmlDe(await PaginaNoticia({ params: Promise.resolve({ slug }) })));
}

const blocos = (html: string) => [...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);

const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]) as Record<string, unknown>,
  );

const outrasDaPagina = (html: string) => {
  const secao = /<section data-bloco="outras"[\s\S]*<\/section>/.exec(html)![0];
  return [...secao.matchAll(/<a href="\/noticias\/([^"]+)"/g)].map((m) => m[1]);
};

describe("a página da notícia", () => {
  it("a faixa, a capa, o texto e Outras notícias, no invólucro de coluna e ritmo, com um h1 só", async () => {
    const html = await renderiza("jornada");
    expect(html).toContain(`<div class="${estilosPagina.pagina}"><section data-bloco="topo"`);
    expect(blocos(html)).toEqual(["topo", "capa", "texto", "outras"]);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("o corpo na faixa branca: a data de atualização, o índice dos dois títulos, a citação e a lista numerada", async () => {
    const html = await renderiza("jornada");
    expect(html).toContain(
      `<section data-bloco="texto" data-faixa="" aria-label="Texto da notícia" class="${estilosTexto.faixa}">`,
    );
    expect(html).toMatch(/Atualizado em <time dateTime="2026-09-20T10:00:00-03:00">20 de setembro de 2026<\/time>/);
    expect([...html.matchAll(/<a href="#(secao-[^"]+)"/g)].map((m) => m[1])).toEqual([
      "secao-programacao",
      "secao-como-se-inscrever",
      "secao-programacao",
      "secao-como-se-inscrever",
    ]);
    expect(html).toContain('<h2 id="secao-programacao">Programação</h2>');
    expect(html).toContain("<blockquote>Queremos que o médico saia da jornada com algo que use no consultório.</blockquote>");
    expect(html).toContain(`<ol class="${estilosTexto.numerada}"><li>Tenha à mão o número de inscrição no CRM.</li></ol>`);
  });

  it("no fim da coluna, quem assina e o aviso de saúde", async () => {
    const html = await renderiza("jornada");
    expect(html).toMatch(new RegExp(`<p class="${estilosTexto.avisoSaude}">[^<]+</p></article>`));
    expect(html).toContain('<a class="botao-contorno" href="/medico/rafael-coelho">Ver perfil');
  });

  it("Outras notícias: as três mais recentes, sem a aberta, e pede uma a mais ao Sanity", async () => {
    const html = await renderiza("jornada");
    expect(outrasDaPagina(html)).toEqual(["outra-5", "outra-4", "outra-3"]);
    expect(html).toContain('style="--colunas:3" role="list"');
    expect(sanity.limites).toEqual([4]);
  });

  it("Outras notícias com duas: duas colunas", async () => {
    sanity.publicadas = [resumo(JORNADA), outra(5), outra(4)];
    const html = await renderiza("jornada");
    expect(outrasDaPagina(html)).toEqual(["outra-5", "outra-4"]);
    expect(html).toContain('style="--colunas:2" role="list"');
  });

  it("Outras notícias com uma: o cartão deitado", async () => {
    sanity.publicadas = [outra(5), resumo(JORNADA)];
    const html = await renderiza("jornada");
    expect(outrasDaPagina(html)).toEqual(["outra-5"]);
    expect(html).toContain('style="--colunas:1" data-deitado="" role="list"');
  });

  it("o JSON-LD é só o NewsArticle de antes; sem BreadcrumbList, Cabeceira nem trilha", async () => {
    const html = await renderiza("jornada");
    const dados = jsonLd(html);
    expect(dados.map((d) => d["@type"])).toEqual(["NewsArticle"]);
    expect(dados[0].headline).toBe(JORNADA.titulo);
    expect(html).not.toContain("BreadcrumbList");
    expect(html).not.toContain("Trilha de navegação");
    expect(html).not.toContain("-mt-32");
  });

  it("nenhum link abre em aba nova", async () => {
    const html = await renderiza("jornada");
    expect(html).not.toContain("target=");
  });

  it("o comunicado curto: sem capa, sem índice, sem atualização e sem outras; o texto fecha a página", async () => {
    sanity.publicadas = [resumo(COMUNICADO)];
    const html = await renderiza("comunicado");
    expect(blocos(html)).toEqual(["topo", "texto"]);
    expect(html).not.toContain("data-nesta-pagina");
    expect(html).not.toContain("Atualizado em");
    expect(html).toMatch(/<section data-bloco="texto" data-faixa=""[\s\S]*<\/section><\/div>$/);
  });

  it("capa com a referência quebrada: a notícia sai sem a capa", async () => {
    sanity.noticias.jornada = { ...JORNADA, capa: { ...CAPA, asset: { _ref: "nao-e-um-ref-valido" } } };
    expect(blocos(await renderiza("jornada"))).toEqual(["topo", "texto", "outras"]);
  });

  it("endereço sem notícia: página não encontrada", async () => {
    await expect(renderiza("nao-existe")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("os metadados e os endereços gerados no build continuam os de antes", async () => {
    const m = await generateMetadata({ params: Promise.resolve({ slug: "jornada" }) });
    expect(m.title).toBe(tituloDePagina(JORNADA.titulo));
    expect(m.description).toBe(JORNADA.resumo);
    expect(m.alternates).toEqual({ canonical: "/noticias/jornada" });
    expect(await generateMetadata({ params: Promise.resolve({ slug: "nao-existe" }) })).toEqual({});
    expect(await generateStaticParams()).toEqual([{ slug: "jornada" }, { slug: "comunicado" }]);
  });

  it("refeita de hora em hora (revalidate de 3600s), além da etiqueta do Sanity", () => {
    expect(revalidate).toBe(3600);
  });
});

describe("o CSS da notícia aberta", () => {
  const css = semNotas(fonte("../components/editorial/NoticiaAberta.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("a coluna é a da faixa curta, e a assinatura não tem coluna de ícone", () => {
    /* Nenhuma regra na própria faixa: a grade é a da FaixaCurta. */
    expect(css).not.toMatch(/^\s*\.materia\[data-faixa\](?:\[[^\]]*\])*\s*\{/m);
    expect(regra(base(css), ".assinatura")).not.toContain("grid-template-columns");
    expect(regra(cel(), ".assinatura")).not.toContain("grid-template-columns");
    expect(css).not.toContain(".vidro");
    expect(css).not.toContain("svg");
  });

  it("o título menor que o das outras faixas: de 34 a 50px, até 24 caracteres; 30px no celular", () => {
    const r = regra(base(css), ".materia[data-faixa] h1");
    expect(r).toMatch(/font-size: clamp\(34px, 3\.6vw, 50px\);/);
    expect(r).toMatch(/max-width: 24ch;/);
    expect(regra(cel(), ".materia[data-faixa] h1")).toMatch(/font-size: 30px;/);
  });

  it("a assinatura embaixo de um fio claro; no celular, a data desce para uma linha própria", () => {
    expect(regra(base(css), ".assinatura")).toMatch(/border-top: 1px solid rgba\(255, 255, 255, 0\.16\);/);
    expect(regra(base(css), ".meta")).toMatch(/color: #DDE7D6;/);
    expect(regra(cel(), ".ponto")).toMatch(/display: none;/);
    expect(regra(cel(), ".meta time")).toMatch(/display: block;/);
  });

  it("a capa em 16:9, com o canto dos painéis e a foto cobrindo a caixa", () => {
    expect(regra(base(css), ".capa")).toMatch(/aspect-ratio: 16 \/ 9;/);
    expect(regra(base(css), ".capa")).toMatch(/border-radius: var\(--radius-painel\);/);
    expect(regra(base(css), ".capa img")).toMatch(/object-fit: cover;/);
  });
});

describe("o CSS do fim da notícia", () => {
  const css = semNotas(fonte("../components/editorial/PaginaDeTexto.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("quem assina: embaixo de um fio, o nome na borda esquerda e o botão à direita", () => {
    const r = regra(base(css), ".coluna .autorFim");
    expect(r).toMatch(/border-top: 1px solid var\(--color-line\);/);
    expect(r).toMatch(/grid-template-columns: minmax\(0, 1fr\) auto;/);
    expect(r).toMatch(/margin-top: 56px;/);
  });

  it("a linha MÉDICO · CRM no cinza do texto da coluna, como o desenho a mostra; 0,08em entre as letras no celular", () => {
    expect(regra(base(css), ".coluna .autorFim .autorCrm")).toMatch(/color: var\(--color-ink-600\);/);
    expect(regra(base(css), ".coluna .autorFim .autorCrm")).toMatch(/letter-spacing: 0\.1em;/);
    expect(regra(cel(), ".coluna .autorFim .autorCrm")).toMatch(/letter-spacing: 0\.08em;/);
  });

  it("o aviso de saúde, cinza e menor", () => {
    const r = regra(base(css), ".coluna .avisoSaude");
    expect(r).toMatch(/font-size: 14px;/);
    expect(r).toMatch(/color: var\(--color-ink-400\);/);
  });

  it("no celular, uma coluna só: o nome e, embaixo, Ver perfil na largura toda", () => {
    expect(regra(cel(), ".coluna .autorFim")).toMatch(/grid-template-columns: minmax\(0, 1fr\);/);
    expect(regra(cel(), ".autorFim .autorAcoes > a")).toMatch(/width: 100%;/);
  });

  it("sem ladrilho: nenhuma regra dele, e nenhuma coluna para ele", () => {
    expect(css).not.toContain("ladrilho");
    expect(regra(base(css), ".coluna .autorFim")).not.toMatch(/grid-template-columns: \d+px/);
    expect(regra(cel(), ".coluna .autorFim")).not.toMatch(/grid-template-columns: \d+px/);
  });
});
