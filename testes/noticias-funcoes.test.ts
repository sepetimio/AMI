import { describe, expect, it } from "vitest";
import {
  LARGURAS_DO_CARTAO,
  LARGURAS_DO_DESTAQUE_DA_LISTA,
  SIZES_DO_DESTAQUE_DA_LISTA,
  arranjoDaLista,
  tamanhoDosCartoes,
} from "@/lib/arranjo-das-noticias";
import {
  LARGURAS_DA_CAPA,
  LARGURAS_DA_IMAGEM_DO_TEXTO,
  LIMITE_DA_LISTA,
  LIMITE_DE_OUTRAS,
  SIZES_DA_CAPA,
  SIZES_DA_IMAGEM_DO_TEXTO,
  TRES_POR_LINHA,
  VOLTA_NOTICIAS,
  alturaDaCapa,
  arranjoDasOutras,
  assinaturaDoAutor,
  capaDaNoticia,
  imagemDoTexto,
  listaDeNoticias,
  outrasNoticias,
} from "@/lib/noticias";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  O que as páginas de notícias decidem, em funções puras: o arranjo da
  lista, o que ela mostra sem notícia, "Outras notícias", a assinatura do
  autor, a capa em 16:9 pelo ponto de interesse, a imagem no meio do texto
  e o `sizes` de cada imagem. O desenho de cada peça é testado por
  renderização em testes/lista-de-noticias.test.ts e
  testes/noticia-aberta.test.ts.

  Os endereços esperados do CDN foram gerados pelo `@sanity/image-url`
  instalado, com o projeto fixo daqui (`CONFIG`), e não escritos à mão.
*/

const CONFIG = { projectId: "abcd1234", dataset: "production" };
const REF = "image-abc123def456-2000x1333-jpg";
const CDN = "https://cdn.sanity.io/images/abcd1234/production/abc123def456-2000x1333.jpg";

function noticia(n: number): ResumoNoticia {
  return {
    titulo: `Título da notícia ${n}`,
    slug: `noticia-${n}`,
    resumo: `Resumo da notícia ${n}.`,
    autor: { nome: "Rafael Coelho", crm: "10137", crmUf: "MA" },
    publicadoEm: "2026-09-18T12:00:00-03:00",
  };
}

const varias = (quantas: number) => Array.from({ length: quantas }, (_, i) => noticia(i + 1));

describe("o arranjo da lista", () => {
  it("a regra da home: só o destaque, um cartão deitado, duas colunas, três por linha", () => {
    expect([0, 1, 2, 3, 4, 7, 20].map(arranjoDaLista)).toEqual([
      null,
      { colunas: 0, deitado: false },
      { colunas: 1, deitado: true },
      { colunas: 2, deitado: false },
      { colunas: 3, deitado: false },
      { colunas: 3, deitado: false },
      { colunas: 3, deitado: false },
    ]);
  });
});

describe("a lista na tela", () => {
  it("com notícia: a mais recente em destaque e as outras na grade, na ordem", () => {
    expect(listaDeNoticias(true, varias(7))).toEqual({
      tipo: "noticias",
      destaque: noticia(1),
      grade: varias(7).slice(1),
      arranjo: { colunas: 3, deitado: false },
    });
  });

  it("1, 2, 3 e 4 notícias, iguais nos dois modos", () => {
    const casos: [number, { colunas: number; deitado: boolean }][] = [
      [1, { colunas: 0, deitado: false }],
      [2, { colunas: 1, deitado: true }],
      [3, { colunas: 2, deitado: false }],
      [4, { colunas: 3, deitado: false }],
    ];
    for (const demonstracao of [true, false]) {
      for (const [quantas, arranjo] of casos) {
        const lista = listaDeNoticias(demonstracao, varias(quantas));
        if (lista.tipo !== "noticias") throw new Error(`${quantas}: ${lista.tipo}`);
        expect(lista.grade, `${quantas}`).toHaveLength(quantas - 1);
        expect(lista.arranjo, `${quantas}`).toEqual(arranjo);
      }
    }
  });

  it("no máximo 20, como hoje: a 21ª não entra", () => {
    expect(LIMITE_DA_LISTA).toBe(20);
    const lista = listaDeNoticias(false, varias(25));
    if (lista.tipo !== "noticias") throw new Error(lista.tipo);
    expect(lista.grade).toHaveLength(19);
    expect(lista.grade.at(-1)?.slug).toBe("noticia-20");
  });

  it("sem notícia: na demonstração, as molduras; fora dela, a lista vazia", () => {
    expect(listaDeNoticias(true, [])).toEqual({ tipo: "a-entrar" });
    expect(listaDeNoticias(false, [])).toEqual({ tipo: "nenhuma" });
  });
});

describe("o sizes da lista, pela largura desenhada", () => {
  it("o destaque: a largura dos painéis (1192px); no celular, a coluna do texto", () => {
    expect(SIZES_DO_DESTAQUE_DA_LISTA).toBe(
      "(min-width: 1240px) 1192px, (min-width: 701px) calc(100vw - 48px), calc(100vw - 64px)",
    );
  });

  it("três por linha (quatro notícias ou mais, e Outras notícias com três); duas no tablet; 88px no celular", () => {
    expect(tamanhoDosCartoes({ colunas: 3, deitado: false })).toBe(
      "(min-width: 1240px) 381px, (min-width: 981px) calc((100vw - 48px - 48px) / 3), " +
        "(min-width: 701px) calc((100vw - 48px - 16px) / 2), 88px",
    );
  });

  it("duas colunas (três notícias)", () => {
    expect(tamanhoDosCartoes({ colunas: 2, deitado: false })).toBe(
      "(min-width: 1240px) 584px, (min-width: 981px) calc((100vw - 48px - 24px) / 2), " +
        "(min-width: 701px) calc((100vw - 48px - 16px) / 2), 88px",
    );
  });

  it("o cartão deitado (duas notícias): a foto na largura de uma coluna de três", () => {
    expect(tamanhoDosCartoes({ colunas: 1, deitado: true })).toBe(
      "(min-width: 1240px) 381px, (min-width: 981px) calc((100vw - 48px - 48px) / 3), " +
        "(min-width: 701px) calc((100vw - 48px - 32px) / 3), 88px",
    );
  });

  it("as larguras pedidas ao CDN cobrem a maior caixa em densidade 2, e a miniatura de 88px", () => {
    expect(LARGURAS_DO_DESTAQUE_DA_LISTA.at(-1)).toBeGreaterThanOrEqual(1192 * 2);
    expect(LARGURAS_DO_CARTAO.at(-1)).toBeGreaterThanOrEqual(584 * 2);
    expect(LARGURAS_DO_CARTAO[0]).toBeLessThanOrEqual(88 * 2);
  });
});

describe("Outras notícias", () => {
  it("as três mais recentes que não são a aberta, na ordem", () => {
    expect(LIMITE_DE_OUTRAS).toBe(3);
    expect(outrasNoticias(varias(5), "noticia-2").map((n) => n.slug)).toEqual([
      "noticia-1",
      "noticia-3",
      "noticia-4",
    ]);
  });

  it("com menos, as que houver; sem outra, nenhuma", () => {
    expect(outrasNoticias(varias(2), "noticia-1").map((n) => n.slug)).toEqual(["noticia-2"]);
    expect(outrasNoticias([noticia(1)], "noticia-1")).toEqual([]);
    expect(outrasNoticias([], "noticia-1")).toEqual([]);
  });

  it("tantas colunas quantas houver, até três, sem coluna vazia; uma sozinha, deitada", () => {
    /* A grade embaixo do destaque da lista: três outras são a lista com
       quatro notícias; uma só é a lista com duas, o cartão deitado. */
    expect([0, 1, 2, 3].map(arranjoDasOutras)).toEqual([
      null,
      { colunas: 1, deitado: true },
      { colunas: 2, deitado: false },
      { colunas: 3, deitado: false },
    ]);
    expect(arranjoDasOutras(3)).toEqual(TRES_POR_LINHA);
    expect(TRES_POR_LINHA).toEqual({ colunas: 3, deitado: false });
  });
});

describe("a assinatura", () => {
  it("o nome, o link do perfil e MÉDICO · CRM/UF", () => {
    expect(
      assinaturaDoAutor({ nome: "Rafael Coelho", crm: "10137", crmUf: "MA", slugDoPerfil: "rafael-coelho" }),
    ).toEqual({ nome: "Rafael Coelho", perfil: "/medico/rafael-coelho", registro: "MÉDICO · CRM/MA 10137" });
  });

  it("sem perfil, ou com o campo em branco, sem link", () => {
    for (const slugDoPerfil of [undefined, "", "   "]) {
      expect(assinaturaDoAutor({ nome: "Rafael Coelho", crm: "10137", crmUf: "ma", slugDoPerfil })).toEqual({
        nome: "Rafael Coelho",
        perfil: null,
        registro: "MÉDICO · CRM/MA 10137",
      });
    }
  });

  it("o perfil só vira link com a forma de um slug: letras minúsculas, algarismos e hífen", () => {
    const perfil = (slugDoPerfil: string) =>
      assinaturaDoAutor({ nome: "Rafael Coelho", crm: "10137", crmUf: "MA", slugDoPerfil }).perfil;
    expect(perfil("rafael-coelho-2")).toBe("/medico/rafael-coelho-2");
    expect(perfil("  rafael-coelho  ")).toBe("/medico/rafael-coelho");
    for (const fora of [
      "../painel",
      "rafael/coelho",
      "rafael coelho",
      "Rafael-Coelho",
      "rafael-coelho?x=1",
      "rafael-coelho#topo",
      "rafaél",
      "javascript:alert(1)",
      "https://exemplo.com",
    ]) {
      expect(perfil(fora), fora).toBeNull();
    }
  });

  it("a volta da notícia aberta é a lista", () => {
    expect(VOLTA_NOTICIAS).toEqual({ href: "/noticias", rotulo: "Notícias" });
  });
});

describe("a capa da notícia aberta, em 16:9", () => {
  it("a altura de cada largura pedida ao CDN", () => {
    expect(LARGURAS_DA_CAPA.map(alturaDaCapa)).toEqual([360, 540, 675, 900, 1125, 1350]);
  });

  it("sem ponto de interesse marcado, o CDN recorta pelo meio", () => {
    const capa = capaDaNoticia({ asset: { _ref: REF }, alt: "Plateia", hotspot: null, crop: null }, CONFIG);
    expect(capa?.src).toBe(`${CDN}?rect=0,105,2000,1125&w=1600&h=900&fit=crop&auto=format`);
  });

  it("com o ponto de interesse embaixo, o recorte desce até ele, em todas as larguras", () => {
    const capa = capaDaNoticia(
      {
        asset: { _ref: REF },
        alt: "Plateia sentada num auditório escuro",
        hotspot: { x: 0.5, y: 0.9, width: 0.2, height: 0.2 },
      },
      CONFIG,
    );
    expect(capa).toEqual({
      src: `${CDN}?rect=0,208,2000,1125&w=1600&h=900&fit=crop&auto=format`,
      srcSet: LARGURAS_DA_CAPA.map(
        (l) => `${CDN}?rect=0,208,2000,1125&w=${l}&h=${alturaDaCapa(l)}&fit=crop&auto=format ${l}w`,
      ).join(", "),
      alt: "Plateia sentada num auditório escuro",
      largura: 1600,
      altura: 900,
    });
  });

  it("o recorte que a AMI marcou no Studio também vale", () => {
    const capa = capaDaNoticia(
      {
        asset: { _ref: REF },
        alt: "x",
        hotspot: { x: 0.5, y: 0.1, width: 0.2, height: 0.2 },
        crop: { top: 0, bottom: 0, left: 0.25, right: 0 },
      },
      CONFIG,
    );
    expect(capa?.src).toBe(`${CDN}?rect=500,0,1500,844&w=1600&h=900&fit=crop&auto=format`);
  });

  it("sem capa, ou com a referência quebrada, nada", () => {
    expect(capaDaNoticia(undefined, CONFIG)).toBeNull();
    expect(capaDaNoticia({ asset: { _ref: "nao-e-um-ref-valido" }, alt: "" }, CONFIG)).toBeNull();
  });

  it("o sizes: a largura dos painéis; no celular, de 12 a 378", () => {
    expect(SIZES_DA_CAPA).toBe(
      "(min-width: 1240px) 1192px, (min-width: 701px) calc(100vw - 48px), calc(100vw - 24px)",
    );
    expect(LARGURAS_DA_CAPA.at(-1)).toBeGreaterThanOrEqual(1192 * 2);
  });
});

describe("a imagem no meio do texto", () => {
  const CDN_DO_TEXTO = "https://cdn.sanity.io/images/abcd1234/production/fed654cba321-1400x934.jpg";

  it("na proporção do arquivo, sem recorte, com o srcset", () => {
    expect(
      imagemDoTexto({ asset: { _ref: "image-fed654cba321-1400x934-jpg" }, alt: "Auditório vazio" }, CONFIG),
    ).toEqual({
      src: `${CDN_DO_TEXTO}?w=960&fit=crop&auto=format`,
      srcSet: LARGURAS_DA_IMAGEM_DO_TEXTO.map((l) => `${CDN_DO_TEXTO}?w=${l}&fit=crop&auto=format ${l}w`).join(", "),
      alt: "Auditório vazio",
      largura: 1360,
      altura: 907,
    });
  });

  it("referência quebrada: nada", () => {
    expect(imagemDoTexto({ asset: { _ref: "nao-e-um-ref-valido" }, alt: "" }, CONFIG)).toBeNull();
  });

  it("o sizes: a coluna de leitura (680px, mais larga de 981 a 1180px); a coluna do texto no tablet e no celular", () => {
    expect(SIZES_DA_IMAGEM_DO_TEXTO).toBe(
      "(min-width: 1181px) 680px, (min-width: 981px) calc(100vw - 412px), " +
        "(min-width: 701px) calc(100vw - 104px), calc(100vw - 64px)",
    );
  });
});
