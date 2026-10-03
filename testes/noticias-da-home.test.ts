import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LadrilhosBairros } from "@/components/diretorio/LadrilhosBairros";
import { NoticiasDaHome, UltimasNoticias } from "@/components/editorial/UltimasNoticias";
import { BairrosEParceiros } from "@/components/home/BairrosEParceiros";
import estilosNoticias from "@/components/editorial/UltimasNoticias.module.css";
import estilosBairros from "@/components/diretorio/LadrilhosBairros.module.css";
import estilosFaixa from "@/components/home/BairrosEParceiros.module.css";
import estilosParceiros from "@/components/home/EmpresasParceiras.module.css";
import { arranjoDasNoticias, tamanhosDasCapas } from "@/lib/arranjo-das-noticias";
import type { ResumoNoticia } from "@/lib/sanity/tipos";
import { fonte } from "@/testes/apoio";

/*
  As notícias, os bairros e os parceiros da home, medidos no HTML de
  servidor (`renderToString`). `NoticiasDaHome` é a peça pura que desenha;
  `UltimasNoticias` só busca no Sanity, que aqui é um dublê.

  O CSS só se lê do arquivo, porque quem o aplica é o navegador: no fim
  deste arquivo, regra por regra. A altura igual das duas colunas foi
  medida à mão no navegador; aqui não há como medi-la.
*/

const sanity = vi.hoisted(() => ({ publicadas: [] as ResumoNoticia[], limites: [] as number[] }));
vi.mock("@/lib/sanity/consultas", () => ({
  listarNoticias: async (limite: number) => {
    sanity.limites.push(limite);
    return sanity.publicadas.slice(0, limite);
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

function noticia(n: number, extra: Partial<ResumoNoticia> = {}): ResumoNoticia {
  return {
    titulo: `Título da notícia ${n}`,
    slug: `noticia-${n}`,
    resumo: `Resumo da notícia ${n}.`,
    autor: { nome: "Fulano de Tal", crm: "1234", crmUf: "MA" },
    publicadoEm: "2026-09-30T12:00:00-03:00",
    ...extra,
  };
}

const QUATRO = [1, 2, 3, 4].map((n) => noticia(n));

function html(noticias: ResumoNoticia[], provisorias?: boolean): string {
  return renderToString(createElement(NoticiasDaHome, { noticias, provisorias }));
}

/** O texto que o leitor vê, pedaço por pedaço, sem as tags. */
function visivel(saida: string): string[] {
  return saida
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Quantas vezes `trecho` aparece em `texto`. */
function vezes(texto: string, trecho: string): number {
  return texto.split(trecho).length - 1;
}

/** Do elemento que abre com a classe `classe` até o fim da tag dele. */
function bloco(saida: string, tag: string, classe: string): string {
  const abre = new RegExp(`<${tag} [^>]*class="${classe}"[^>]*>`).exec(saida);
  if (!abre) return `(sem <${tag}> com a classe ${classe})`;
  let nivel = 0;
  const re = new RegExp(`<${tag}[ >]|</${tag}>`, "g");
  re.lastIndex = abre.index;
  for (let m = re.exec(saida); m; m = re.exec(saida)) {
    nivel += m[0].startsWith("</") ? -1 : 1;
    if (nivel === 0) return saida.slice(abre.index, m.index + m[0].length);
  }
  return saida.slice(abre.index);
}

/** A tag de abertura da grade das notícias (destaque + lista). */
function grade(saida: string): string {
  return (
    new RegExp(`<div class="${estilosNoticias.noticias}"[^>]*>`).exec(saida)?.[0] ?? "(sem a grade das notícias)"
  );
}

/* A ordem das peças dentro da lista: "item" (cada notícia) ou "sep". */
function pecasDaLista(lista: string): string[] {
  const sep = `<div class="${estilosNoticias.sep}" aria-hidden="true"></div>`;
  return [...lista.matchAll(new RegExp(`<article>|${sep}`, "g"))].map((m) =>
    m[0] === "<article>" ? "item" : "sep",
  );
}

describe("o arranjo das notícias", () => {
  it("por quantidade: nada, só o destaque, embaixo com uma coluna por notícia, ou ao lado", () => {
    expect([0, 1, 2, 3, 4, 5].map(arranjoDasNoticias)).toEqual([
      null,
      { arranjo: "so-destaque", colunas: 0, deitado: false },
      { arranjo: "embaixo", colunas: 1, deitado: true },
      { arranjo: "embaixo", colunas: 2, deitado: false },
      { arranjo: "ao-lado", colunas: 3, deitado: false },
      { arranjo: "ao-lado", colunas: 3, deitado: false },
    ]);
  });
});

/* O `sizes` esperado, faixa por faixa (a conta está no comentário de
   `tamanhosDasCapas`, em lib/arranjo-das-noticias.ts). */
const LARGURA_TODA =
  "(min-width: 1240px) 1096px, (min-width: 981px) calc(100vw - 144px), (min-width: 701px) calc(100vw - 104px), calc(100vw - 64px)";
const SIZES = {
  1: { destaque: LARGURA_TODA, item: "(min-width: 701px) 128px, 88px", itemDePe: false },
  2: { destaque: LARGURA_TODA, item: "(min-width: 701px) 128px, 88px", itemDePe: false },
  3: {
    destaque: LARGURA_TODA,
    item: "(min-width: 1240px) 536px, (min-width: 981px) calc((100vw - 144px - 24px) / 2), (min-width: 701px) calc((100vw - 104px - 24px) / 2), 88px",
    itemDePe: true,
  },
  4: {
    destaque:
      "(min-width: 1240px) 582px, (min-width: 1181px) calc((100vw - 192px) * 5 / 9), (min-width: 981px) calc(100vw - 144px), (min-width: 701px) calc(100vw - 104px), calc(100vw - 64px)",
    item: "(min-width: 1181px) 128px, (min-width: 981px) calc((100vw - 144px - 48px) / 3), (min-width: 701px) calc((100vw - 104px - 48px) / 3), 88px",
    itemDePe: false,
  },
} as const;

describe("o tamanho das capas, por arranjo", () => {
  it("por valor, de 1 a 4 notícias", () => {
    for (const n of [1, 2, 3, 4] as const) {
      expect(tamanhosDasCapas(arranjoDasNoticias(n)!), `${n} notícias`).toEqual(SIZES[n]);
    }
  });

  it("os números batem com a grade medida no navegador a 1440px (destaque 582 ou 1096; item de pé 536)", () => {
    /* Medido na rodada 1: destaque "ao-lado" 582,22; "embaixo" 1096; os
       dois itens de pé com três notícias, 536. */
    expect(SIZES[4].destaque).toMatch(/^\(min-width: 1240px\) 582px/);
    expect(SIZES[3].destaque).toMatch(/^\(min-width: 1240px\) 1096px/);
    expect(SIZES[3].item).toMatch(/^\(min-width: 1240px\) 536px/);
  });

  it("renderizado: cada img sai com o sizes do arranjo, e o item de pé pede as larguras grandes", () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "projeto");
    vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");
    const capa = { asset: { _ref: "image-abc123-1600x1000-jpg" }, alt: "" };
    for (const n of [1, 2, 3, 4] as const) {
      const saida = html(
        [1, 2, 3, 4].slice(0, n).map((i) => noticia(i, { capa } as Partial<ResumoNoticia>)),
      );
      const imgs = [...saida.matchAll(/<img [^>]*>/g)].map((m) => m[0]);
      const atributo = (img: string, nome: string) => new RegExp(`${nome}="([^"]*)"`).exec(img)?.[1];
      expect(imgs, `${n} notícias`).toHaveLength(n);
      expect(atributo(imgs[0], "sizes"), `destaque com ${n}`).toBe(SIZES[n].destaque);
      for (const img of imgs.slice(1)) {
        expect(atributo(img, "sizes"), `item com ${n}`).toBe(SIZES[n].item);
        const larguras = (atributo(img, "srcSet") ?? "").split(", ").map((s) => Number(/ (\d+)w$/.exec(s)?.[1]));
        /* De pé, o item chega a 536px: precisa de arquivo de pelo menos
           1072 para densidade 2. A miniatura pequena para em 960. */
        expect(Math.max(...larguras), `maior arquivo do item com ${n}`).toBe(SIZES[n].itemDePe ? 2200 : 960);
        /* No celular todo item, de pé ou não, é a miniatura de 88px: o
           menor arquivo é o de 160, e o de 320 serve a densidade 2 e 3. */
        expect(larguras.slice(0, 2), `menores arquivos do item com ${n}`).toEqual([160, 320]);
      }
      const maiorDestaque = Math.max(
        ...(atributo(imgs[0], "srcSet") ?? "").split(", ").map((s) => Number(/ (\d+)w$/.exec(s)?.[1])),
      );
      expect(maiorDestaque).toBe(2200);
    }
  });
});

describe("o bloco de notícias", () => {
  it("sem notícia e sem provisórias, não existe", () => {
    expect(html([])).toBe("");
    expect(html([], false)).toBe("");
  });

  it("é o bloco noticias, nomeado pelo título, com o rótulo na coluna e o h2 da seção", () => {
    for (const saida of [html(QUATRO), html([], true)]) {
      const secao = /^<section [^>]*>/.exec(saida)?.[0] ?? "";
      expect(secao).toContain('data-bloco="noticias"');
      expect(secao).toContain('aria-labelledby="noticias-titulo"');
      expect(saida).toMatch(/<span class="rotulo-secao" data-coluna="">Notícias<\/span>/);
      expect(saida).toMatch(/<h2 [^>]*id="noticias-titulo"[^>]*>Fique por dentro da AMI<\/h2>/);
      expect(saida).toContain("Comunicados, eventos e o que acontece na medicina em Imperatriz.");
    }
  });

  it("leva a /noticias pelo botão 'Ver todas as notícias'", () => {
    expect(html(QUATRO)).toMatch(
      /<a class="botao-linha" href="\/noticias">Ver todas as notícias <svg[^>]*aria-hidden="true"/,
    );
  });

  it("com quatro reais, a primeira é o destaque: título h3 sobre a foto, link para a notícia", () => {
    const saida = html(QUATRO);
    const destaque = bloco(saida, "article", estilosNoticias.destaque);
    expect(destaque).toMatch(new RegExp(`^<article class="${estilosNoticias.destaque}"><a class="${estilosNoticias.destaqueCorpo}" href="/noticias/noticia-1">`));
    /* O título e o resumo ficam na camada sobre a foto, depois dela. */
    const foto = destaque.indexOf(`class="${estilosNoticias.foto}"`);
    const sobre = destaque.indexOf(`class="${estilosNoticias.sobreFoto}"`);
    expect(foto).toBeGreaterThan(-1);
    expect(sobre).toBeGreaterThan(foto);
    const camada = destaque.slice(sobre);
    expect(camada).toMatch(/<h3 [^>]*>Título da notícia 1<\/h3>/);
    expect(camada).toContain("Resumo da notícia 1.");
    expect(camada).toContain(`<span class="${estilosNoticias.data}">30 de setembro de 2026</span>`);
    expect(destaque).not.toContain("notícia 2");
  });

  it("e as outras três ficam na lista, em ordem, com uma divisória entre duas", () => {
    const saida = html(QUATRO);
    const lista = bloco(saida, "div", estilosNoticias.lista);
    expect(pecasDaLista(lista)).toEqual(["item", "sep", "item", "sep", "item"]);
    const titulos = [...lista.matchAll(/<h3 [^>]*>([^<]+)<\/h3>/g)].map((m) => m[1]);
    expect(titulos).toEqual(["Título da notícia 2", "Título da notícia 3", "Título da notícia 4"]);
    const links = [...lista.matchAll(/<a class="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]);
    expect(links).toEqual([
      [estilosNoticias.item, "/noticias/noticia-2"],
      [estilosNoticias.item, "/noticias/noticia-3"],
      [estilosNoticias.item, "/noticias/noticia-4"],
    ]);
    /* A lista vem depois do destaque, na mesma grade. */
    expect(saida.indexOf(lista)).toBeGreaterThan(saida.indexOf(estilosNoticias.destaque));
  });

  it("todo título de notícia é h3, sob o h2 da seção", () => {
    const saida = html(QUATRO);
    expect(vezes(saida, "<h3 ")).toBe(4);
    expect(vezes(saida, "<h2 ")).toBe(1);
    expect(saida).not.toMatch(/<h[456]/);
  });

  it("uma quinta notícia não entra", () => {
    const saida = html([...QUATRO, noticia(5)]);
    expect(saida).not.toContain("notícia 5");
  });

  it("com uma real e provisórias pedidas, só a real sai, sozinha na largura toda", () => {
    const saida = html([noticia(1)], true);
    expect(saida).not.toMatch(/a entrar/i);
    expect(saida).not.toContain('role="img"');
    expect(vezes(saida, "<article")).toBe(1);
    expect(saida).toContain("Título da notícia 1");
    expect(grade(saida)).toBe(`<div class="${estilosNoticias.noticias}" data-arranjo="so-destaque">`);
    expect(saida).not.toContain(`class="${estilosNoticias.lista}"`);
  });

  it("com duas reais, o destaque em cima e a outra embaixo, deitada, numa coluna só", () => {
    const saida = html([noticia(1), noticia(2)]);
    expect(grade(saida)).toBe(
      `<div class="${estilosNoticias.noticias}" data-arranjo="embaixo" data-deitado="" style="--colunas:1">`,
    );
    expect(pecasDaLista(bloco(saida, "div", estilosNoticias.lista))).toEqual(["item"]);
  });

  it("com três reais, o destaque em cima e as outras duas embaixo, em duas colunas", () => {
    const saida = html([noticia(1), noticia(2), noticia(3)]);
    expect(grade(saida)).toBe(`<div class="${estilosNoticias.noticias}" data-arranjo="embaixo" style="--colunas:2">`);
    expect(pecasDaLista(bloco(saida, "div", estilosNoticias.lista))).toEqual(["item", "sep", "item"]);
  });

  it("com quatro reais, ou as quatro provisórias, a lista fica ao lado, em três", () => {
    const ao = `<div class="${estilosNoticias.noticias}" data-arranjo="ao-lado" style="--colunas:3">`;
    expect(grade(html(QUATRO))).toBe(ao);
    expect(grade(html([], true))).toBe(ao);
  });

  it("sem real e com provisórias, quatro peças 'Notícia a entrar' na forma do desenho, sem link", () => {
    const saida = html([], true);
    expect(vezes(saida, ">Notícia a entrar</h3>")).toBe(4);
    expect(bloco(saida, "article", estilosNoticias.destaque)).toContain(">Notícia a entrar</h3>");
    expect(pecasDaLista(bloco(saida, "div", estilosNoticias.lista))).toEqual([
      "item",
      "sep",
      "item",
      "sep",
      "item",
    ]);
    /* O único link do bloco é o "Ver todas". */
    expect([...saida.matchAll(/<a [^>]*href="([^"]*)"/g)].map((m) => m[1])).toEqual(["/noticias"]);
    /* A capa é a moldura provisória, uma por peça, e não inventa data. */
    expect(vezes(saida, 'role="img"')).toBe(4);
    expect(saida).not.toContain(`class="${estilosNoticias.data}"`);
  });

  it("a capa real vem do CDN do Sanity, com srcset e sem alt (o nome do link é o título)", () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "projeto");
    vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");
    const capa = { asset: { _ref: "image-abc123-1600x1000-jpg" }, alt: "Plenário da AMI" };
    const saida = html([noticia(1, { capa } as Partial<ResumoNoticia>), noticia(2, { capa } as Partial<ResumoNoticia>)]);
    const imgs = [...saida.matchAll(/<img [^>]*>/g)].map((m) => m[0]);
    expect(imgs).toHaveLength(2);
    for (const img of imgs) {
      expect(img).toMatch(/src="https:\/\/cdn\.sanity\.io\/images\/projeto\/production\/abc123-1600x1000\.jpg\?/);
      expect(img).toMatch(/srcSet="[^"]+ \d+w, /);
      expect(img).toContain('alt=""');
      expect(img).toContain('loading="lazy"');
    }
    expect(saida).not.toContain("Plenário da AMI");
  });

  it("notícia real sem capa: o verde da marca no lugar, escondido do leitor, sem <img> e sem 'a entrar'", () => {
    const saida = html([noticia(1), noticia(2)]);
    expect(saida).not.toContain("<img");
    expect(vezes(saida, `<div class="${estilosNoticias.semCapa}" aria-hidden="true"></div>`)).toBe(2);
    expect(saida).not.toMatch(/a entrar/i);
  });

  it("UltimasNoticias pede quatro ao Sanity e entrega à peça que desenha", async () => {
    sanity.publicadas = [...QUATRO, noticia(5)];
    sanity.limites = [];
    const elemento = await UltimasNoticias({ provisorias: true });
    expect(sanity.limites).toEqual([4]);
    expect(renderToString(elemento)).toBe(html(QUATRO, true));
    sanity.publicadas = [];
    expect(renderToString(await UltimasNoticias())).toBe("");
    expect(renderToString(await UltimasNoticias({ provisorias: true }))).toBe(html([], true));
  });
});

const BAIRROS = [
  { nome: "Centro", slug: "centro", total: 8 },
  { nome: "Bacuri", slug: "bacuri", total: 1 },
];

describe("os ladrilhos de bairro", () => {
  it("cada um leva à busca filtrada, com o nome e a contagem", () => {
    const saida = renderToString(createElement(LadrilhosBairros, { itens: BAIRROS }));
    const ladrilhos = [...saida.matchAll(/<a class="([^"]+)" href="([^"]+)">(.*?)<\/a>/g)].map((m) => [
      m[1],
      m[2],
      visivel(m[3]),
    ]);
    expect(ladrilhos).toEqual([
      [estilosBairros.bairro, "/busca?bairro=centro", ["Centro", "8 médicos"]],
      [estilosBairros.bairro, "/busca?bairro=bacuri", ["Bacuri", "1 médico"]],
    ]);
    expect(saida).toMatch(new RegExp(`^<ul class="${estilosBairros.bairros}">`));
  });

  it("aceita outro destino e a nota embaixo da contagem, só onde ela existe", () => {
    const saida = renderToString(
      createElement(LadrilhosBairros, {
        itens: BAIRROS,
        href: (slug: string) => `/medicos/cardiologia/${slug}`,
        nota: (b: { total: number }) => (b.total < 3 ? "menos de 3 profissionais" : null),
      }),
    );
    const ladrilhos = [...saida.matchAll(/<a class="[^"]+" href="([^"]+)">(.*?)<\/a>/g)].map((m) => [
      m[1],
      visivel(m[2]),
    ]);
    expect(ladrilhos).toEqual([
      ["/medicos/cardiologia/centro", ["Centro", "8 médicos"]],
      ["/medicos/cardiologia/bacuri", ["Bacuri", "1 médico", "menos de 3 profissionais"]],
    ]);
    expect(vezes(saida, `class="${estilosBairros.nota}"`)).toBe(1);
    expect(saida).not.toContain("/busca?");
  });
});

describe("a faixa dos bairros e dos parceiros", () => {
  const com = renderToString(createElement(BairrosEParceiros, { bairros: BAIRROS, parceiros: true }));
  const sem = renderToString(createElement(BairrosEParceiros, { bairros: BAIRROS, parceiros: false }));

  it("é o bloco bairros, com id bairros, nomeado pelo título, rótulo na coluna", () => {
    for (const saida of [com, sem]) {
      const secao = /^<section [^>]*>/.exec(saida)?.[0] ?? "";
      expect(secao).toContain('id="bairros"');
      expect(secao).toContain('data-bloco="bairros"');
      expect(secao).toContain('aria-labelledby="bairros-titulo"');
      /* A faixa, a marca de faixa que o rodapé lê e a entrada na tela. */
      expect(secao).toContain(`class="revelar ${estilosFaixa.faixa}"`);
      expect(secao).toContain('data-faixa=""');
      expect(saida).toMatch(/<span class="rotulo-secao" data-coluna="">Onde os médicos atendem<\/span>/);
      expect(saida).toMatch(/<h2 [^>]*id="bairros-titulo"[^>]*>Escolha o seu bairro<\/h2>/);
    }
  });

  it("cada bairro com link para a busca filtrada e a contagem", () => {
    for (const saida of [com, sem]) {
      expect(saida).toMatch(/href="\/busca\?bairro=centro">.*?Centro.*?8 médicos/);
      expect(saida).toMatch(/href="\/busca\?bairro=bacuri">.*?Bacuri.*?1 médico</);
    }
  });

  it("sem parceiros, nada deles: nem título, nem espaços, nem o fio", () => {
    expect(sem).not.toContain("Logotipo");
    expect(sem).not.toContain("parceiros");
    expect(sem).not.toContain("Quem caminha");
    expect(sem).not.toContain(`class="${estilosFaixa.separa}"`);
  });

  it("com parceiros: o fio, o título e seis 'Logotipo a entrar', nessa ordem", () => {
    const fio = com.indexOf(`<div class="${estilosFaixa.separa}" aria-hidden="true"></div>`);
    const titulo = com.indexOf(">Quem caminha com a AMI</h2>");
    expect(fio).toBeGreaterThan(com.indexOf("Bacuri"));
    expect(titulo).toBeGreaterThan(fio);
    expect(com).toMatch(/<section id="parceiros" aria-labelledby="parceiros-titulo">/);
    expect(com).toMatch(/<h2 [^>]*id="parceiros-titulo"/);
    const espacos = [...com.matchAll(/<li class="([^"]+)">([^<]*)<\/li>/g)].map((m) => [m[1], m[2]]);
    expect(espacos).toEqual(Array(6).fill([estilosParceiros.logoVazio, "Logotipo a entrar"]));
    expect(com.indexOf(`<ul class="${estilosParceiros.parceiros}">`)).toBeGreaterThan(titulo);
  });

  it("não escreve nome de empresa nenhuma: o texto inteiro dos parceiros", () => {
    const parte = com.slice(com.indexOf('<section id="parceiros"'));
    expect(visivel(parte)).toEqual([
      "Empresas parceiras da AMI",
      "Quem caminha com a AMI",
      ...Array<string>(6).fill("Logotipo a entrar"),
    ]);
  });

  it("sem bairro nenhum, a parte dos bairros não sai; sem bairro e sem parceiros, nem a faixa", () => {
    expect(renderToString(createElement(BairrosEParceiros, { bairros: [], parceiros: false }))).toBe("");
    const so = renderToString(createElement(BairrosEParceiros, { bairros: [], parceiros: true }));
    expect(so).toMatch(/^<section [^>]*aria-labelledby="parceiros-titulo"/);
    expect(so).not.toContain("Escolha o seu bairro");
    expect(so).not.toContain(`class="${estilosFaixa.separa}"`);
    expect(vezes(so, "Logotipo a entrar")).toBe(6);
  });
});

/* =====================================================================
   CSS. Só o navegador aplica; aqui se confere a regra escrita.
   ===================================================================== */

const semComentario = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const CSS_NOTICIAS = semComentario(fonte("../components/editorial/UltimasNoticias.module.css"));
const CSS_BAIRROS = semComentario(fonte("../components/diretorio/LadrilhosBairros.module.css"));
const CSS_FAIXA = semComentario(fonte("../components/home/BairrosEParceiros.module.css"));
const CSS_PARCEIROS = semComentario(fonte("../components/home/EmpresasParceiras.module.css"));
const CSS_GLOBAL = fonte("../app/globals.css");

/* O conteúdo entre as chaves do @media que começa com `abre`. */
function media(css: string, abre: string): string {
  const ini = css.indexOf(`${abre} {`);
  expect(ini, `falta o bloco ${abre}`).toBeGreaterThan(-1);
  let nivel = 0;
  for (let i = css.indexOf("{", ini); i < css.length; i++) {
    if (css[i] === "{") nivel++;
    if (css[i] === "}" && --nivel === 0) return css.slice(css.indexOf("{", ini) + 1, i);
  }
  throw new Error(`bloco ${abre} sem fim`);
}

/* O CSS fora de qualquer @media. */
function base(css: string): string {
  return css.replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*[^{}]*\}/g, "");
}

/* O corpo da regra `seletor { ... }`, com o seletor exato começando a linha. */
function regra(css: string, seletor: string): string {
  const m = new RegExp(`(^|\\n)\\s*${seletor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{([^}]*)\\}`).exec(css);
  if (!m) throw new Error(`falta a regra ${seletor}`);
  return m[2];
}

/** Razão de contraste WCAG entre duas cores RGB. */
function contraste(a: number[], b: number[]): number {
  const canal = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = (c: number[]) => 0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2]);
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function hex(token: string): number[] {
  const h = new RegExp(`--color-${token}: (#[0-9A-Fa-f]{6})`).exec(CSS_GLOBAL)?.[1] ?? "";
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** `cima` com opacidade `alfa` sobre `baixo`. */
function mistura(cima: number[], alfa: number, baixo: number[]): number[] {
  return cima.map((c, i) => c * alfa + baixo[i] * (1 - alfa));
}

describe("o CSS das notícias", () => {
  it("a coluna da direita tem a altura da foto do destaque: a conta sai das próprias regras", () => {
    const b = base(CSS_NOTICIAS);
    const colunas = /grid-template-columns: ([\d.]+)fr ([\d.]+)fr/.exec(regra(b, ".noticias"));
    const foto = /aspect-ratio: (\d+) \/ (\d+)/.exec(regra(b, ".foto"));
    const lista = /aspect-ratio: (\d+) \/ (\d+)/.exec(regra(b, ".lista"));
    expect(colunas && foto && lista, "faltam colunas ou proporções").toBeTruthy();
    /* Largura da direita sobre a da esquerda, dividida pela altura da foto
       sobre a largura da esquerda: a proporção que a lista precisa ter. */
    const direita = Number(colunas![2]) / Number(colunas![1]);
    const alturaDaFoto = Number(foto![2]) / Number(foto![1]);
    expect(Number(lista![1]) / Number(lista![2])).toBeCloseTo(direita / alturaDaFoto, 10);
    expect(lista![0]).toBe("aspect-ratio: 32 / 25");
    expect(regra(b, ".lista")).toMatch(/display: flex;\s*flex-direction: column;\s*justify-content: space-between/);
    expect(regra(b, ".destaque")).toMatch(/align-self: start/);
    expect(regra(b, ".sep")).toMatch(/height: 1px/);
    expect(regra(b, ".sep")).toMatch(/background: var\(--color-line\)/);
    expect(regra(b, ".item")).toMatch(/grid-template-columns: 128px 1fr/);
  });

  it("abaixo de 1180px, o destaque em cima e as três lado a lado, sem divisória", () => {
    const m = media(CSS_NOTICIAS, "@media (max-width: 1180px)");
    expect(regra(m, ".noticias")).toMatch(/grid-template-columns: 1fr;/);
    /* Três, porque com quatro notícias o componente escreve --colunas:3
       (teste de renderização acima). */
    expect(regra(m, ".lista")).toMatch(/grid-template-columns: repeat\(var\(--colunas\), 1fr\)/);
    expect(regra(m, ".lista")).toMatch(/aspect-ratio: auto/);
    expect(regra(m, ".sep")).toMatch(/display: none/);
    expect(regra(m, ".item")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("com menos de quatro, do tablet para cima: destaque na largura toda e nada ao lado dele", () => {
    const m = media(CSS_NOTICIAS, "@media (min-width: 701px)");
    expect(m).toMatch(
      /\.noticias\[data-arranjo="so-destaque"\],\s*\.noticias\[data-arranjo="embaixo"\] \{\s*grid-template-columns: 1fr;/,
    );
    const embaixo = (s: string) => regra(m, `.noticias[data-arranjo="embaixo"] ${s}`);
    expect(embaixo(".lista")).toMatch(/display: grid;\s*grid-template-columns: repeat\(var\(--colunas\), 1fr\)/);
    expect(embaixo(".lista")).toMatch(/aspect-ratio: auto/);
    expect(embaixo(".sep")).toMatch(/display: none/);
    expect(embaixo(".item")).toMatch(/grid-template-columns: 1fr;/);
    /* Uma só embaixo: deitada, e a regra dela vem depois da de pé. */
    expect(regra(m, ".noticias[data-deitado] .item")).toMatch(/grid-template-columns: 128px 1fr/);
    expect(m.indexOf(".noticias[data-deitado] .item")).toBeGreaterThan(
      m.indexOf('.noticias[data-arranjo="embaixo"] .item'),
    );
    /* No celular, o arranjo não muda nada: nenhuma regra dele em 700px. */
    expect(media(CSS_NOTICIAS, "@media (max-width: 700px)")).not.toMatch(/data-arranjo|data-deitado/);
  });

  it("no celular, destaque grande e lista com miniatura quadrada de 88px; nada desliza", () => {
    const m = media(CSS_NOTICIAS, "@media (max-width: 700px)");
    expect(regra(m, ".foto")).toMatch(/aspect-ratio: 4 \/ 3/);
    expect(regra(m, ".lista")).toMatch(/display: flex;\s*flex-direction: column/);
    expect(regra(m, ".sep")).toMatch(/display: block/);
    expect(regra(m, ".item")).toMatch(/grid-template-columns: 88px 1fr/);
    expect(regra(m, ".miniatura")).toMatch(/width: 88px/);
    expect(regra(m, ".miniatura")).toMatch(/aspect-ratio: 1 \/ 1/);
    expect(CSS_NOTICIAS).not.toMatch(/overflow-x|scroll-snap/);
  });

  it("o texto branco sobre a foto passa em AA mesmo com uma foto branca atrás", () => {
    const sobre = regra(base(CSS_NOTICIAS), ".sobreFoto");
    /* O texto começa depois da folga de cima, e é ali que o degradê chega
       ao valor mais baixo debaixo do texto. */
    expect(sobre).toMatch(/padding: var\(--folga\) /);
    const paradas = [...sobre.matchAll(/rgba\((\d+), (\d+), (\d+), ([\d.]+)\) (0%|100%|calc\([^\n]*\)\))/g)];
    const sobTexto = paradas.filter((p) => p[5].trim() !== "100%");
    expect(paradas.at(-1)?.[5].trim()).toBe("100%");
    expect(sobTexto.map((p) => p[5].trim())).toEqual(["0%", "calc(100% - var(--folga))"]);
    const piso = Math.min(...sobTexto.map((p) => Number(p[4])));
    const escuro = [1, 2, 3].map((i) => Number(sobTexto[0][i]));
    const fundo = mistura(escuro, piso, [255, 255, 255]);
    const branco = [255, 255, 255];
    const alfaData = Number(/rgba\(255, 255, 255, ([\d.]+)\)/.exec(regra(base(CSS_NOTICIAS), ".sobreFoto .data"))?.[1]);
    const alfaResumo = Number(/rgba\(255, 255, 255, ([\d.]+)\)/.exec(regra(base(CSS_NOTICIAS), ".resumo"))?.[1]);
    expect(regra(base(CSS_NOTICIAS), ".destaqueTitulo")).toMatch(/color: var\(--color-white\)/);
    for (const [nome, alfa] of [
      ["data", alfaData],
      ["resumo", alfaResumo],
      ["título", 1],
    ] as const) {
      expect(contraste(mistura(branco, alfa, fundo), fundo), nome).toBeGreaterThanOrEqual(4.5);
    }
    /* No celular a folga muda, e a regra continua a mesma variável. */
    expect(regra(media(CSS_NOTICIAS, "@media (max-width: 700px)"), ".sobreFoto")).toMatch(
      /--folga: 70px;\s*padding: var\(--folga\) 18px 18px/,
    );
  });

  it("a data das notícias da lista em ink-400, que passa em AA no canvas da página", () => {
    expect(regra(base(CSS_NOTICIAS), ".data")).toMatch(/color: var\(--color-ink-400\)/);
    expect(contraste(hex("ink-400"), hex("canvas"))).toBeGreaterThanOrEqual(4.5);
    expect(contraste(hex("ink-400"), hex("surface"))).toBeGreaterThanOrEqual(4.5);
  });
});

describe("o CSS dos bairros e dos parceiros", () => {
  it("faixa branca de ponta a ponta com a margem das faixas, sem repetir a fórmula, sem margem embaixo", () => {
    expect(regra(base(CSS_FAIXA), ".faixa")).toMatch(/padding: 96px var\(--borda-faixa\)/);
    expect(regra(base(CSS_FAIXA), ".faixa")).toMatch(/background: var\(--color-surface\)/);
    expect(regra(media(CSS_FAIXA, "@media (max-width: 700px)"), ".faixa")).toMatch(
      /padding: 44px var\(--borda-faixa\)/,
    );
    expect(CSS_FAIXA).not.toContain("1240px");
    expect(regra(base(CSS_FAIXA), ".faixa")).not.toMatch(/margin/);
    expect(regra(base(CSS_FAIXA), ".separa")).toMatch(/margin: 72px 0/);
    expect(regra(media(CSS_FAIXA, "@media (max-width: 980px)"), ".separa")).toMatch(/margin: 48px 0/);
  });

  it("bairros em quatro colunas, contagem embaixo abaixo de 1180px, duas colunas abaixo de 980px", () => {
    expect(regra(base(CSS_BAIRROS), ".bairros")).toMatch(/grid-template-columns: repeat\(4, 1fr\)/);
    expect(regra(base(CSS_BAIRROS), ".bairro")).toMatch(/justify-content: space-between/);
    expect(regra(media(CSS_BAIRROS, "@media (max-width: 1180px)"), ".bairro")).toMatch(
      /flex-direction: column/,
    );
    expect(regra(media(CSS_BAIRROS, "@media (max-width: 980px)"), ".bairros")).toMatch(
      /grid-template-columns: 1fr 1fr/,
    );
  });

  it("a nota tem uma linha só dela, e não espreme o nome ao lado da contagem", () => {
    /* Medido em /medicos/clinica-medica a 1440px: com a nota ao lado da
       contagem, "Nova Imperatriz" quebrava no meio da palavra. */
    expect(regra(base(CSS_BAIRROS), ".bairro")).toMatch(/flex-wrap: wrap/);
    /* `.nota` aparece duas vezes (a cor é dividida com a contagem). */
    expect(base(CSS_BAIRROS)).toMatch(/\n\.nota \{[^}]*flex-basis: 100%/);
    expect(regra(base(CSS_BAIRROS), ".contagem")).toMatch(/flex: none/);
    expect(regra(media(CSS_BAIRROS, "@media (max-width: 1180px)"), ".bairro")).toMatch(/flex-wrap: nowrap/);
    /* Em coluna, o `space-between` de cima mandava a contagem para o pé do
       ladrilho quando o vizinho de fileira tinha nota (medido a 375px). */
    expect(regra(media(CSS_BAIRROS, "@media (max-width: 1180px)"), ".bairro")).toMatch(
      /justify-content: flex-start/,
    );
  });

  it("parceiros: seis lado a lado, três por linha abaixo de 980px e no celular, nada desliza", () => {
    expect(regra(base(CSS_PARCEIROS), ".parceiros")).toMatch(/grid-template-columns: repeat\(6, 1fr\)/);
    expect(regra(media(CSS_PARCEIROS, "@media (max-width: 980px)"), ".parceiros")).toMatch(
      /grid-template-columns: repeat\(3, 1fr\)/,
    );
    expect(regra(media(CSS_PARCEIROS, "@media (max-width: 700px)"), ".parceiros")).not.toMatch(
      /grid-template-columns|display/,
    );
    expect(CSS_PARCEIROS).not.toMatch(/overflow-x|scroll-snap/);
    expect(regra(base(CSS_PARCEIROS), ".logoVazio")).toMatch(/border: 1px dashed var\(--color-line-strong\)/);
    expect(regra(base(CSS_PARCEIROS), ".logoVazio")).toMatch(/color: var\(--color-ink-400\)/);
  });

  it("nenhum hex, nenhum tom quente, só tokens neutros e os verdes da marca", () => {
    for (const css of [CSS_NOTICIAS, CSS_BAIRROS, CSS_FAIXA, CSS_PARCEIROS]) {
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      for (const m of css.matchAll(/rgba\((\d+), (\d+), (\d+),/g)) {
        const [r, , b] = [m[1], m[2], m[3]].map(Number);
        /* Neutro: o vermelho nunca passa o azul (um tom quente passa). */
        expect(r, m[0]).toBeLessThanOrEqual(b);
      }
      expect(css).not.toMatch(
        /--color-(?!surface\b|line\b|line-strong\b|canvas\b|white\b|ink-(?:400|600)\b|ami-green-(?:700|800|900)\b|ami-lima-400\b)[a-z0-9-]+/,
      );
    }
    /* O lima só entra no símbolo da notícia sem capa, sobre o verde. */
    expect(CSS_NOTICIAS.match(/ami-lima-400/g)).toHaveLength(1);
    expect(regra(base(CSS_NOTICIAS), ".semCapa::after")).toContain("ami-lima-400");
    for (const css of [CSS_BAIRROS, CSS_FAIXA, CSS_PARCEIROS]) expect(css).not.toContain("lima");
  });
});
