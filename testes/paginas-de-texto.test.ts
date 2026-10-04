import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { Article, Cookie, FileText, Handshake, Scroll, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import { Icone } from "@/components/base/IconeServidor";
import {
  ICONE_DE_PAGINA_PADRAO,
  MARCA_PROVISORIA,
  VOLTA_ASSOCIACAO,
  VOLTA_INICIO,
  ancorasDoCorpo,
  blocosDoRascunho,
  conteudoDaPagina,
  conteudoDoRascunho,
  conteudoDoSanity,
  iconeDaPagina,
  paragrafoDoRascunho,
} from "@/lib/paginaDeTexto";
import { COOKIES, PRIVACIDADE, SEJA_ASSOCIADO, TERMOS, type RascunhoLegal } from "@/lib/rascunhosLegais";
import type { PaginaInstitucional } from "@/lib/sanity/tipos";

/*
  O que o modelo de página de texto decide, em funções puras: o link de
  volta, o ícone de cada página, o rascunho em código transformado em texto
  rico (o mesmo formato do Studio) e qual dos dois textos a página mostra.
  O desenho de cada bloco é testado por renderização em
  testes/modelo-de-texto.test.ts.
*/

/* Um bloco de texto rico, como o Studio grava e como `blocosDoRascunho` monta. */
function b(chave: string, estilo: string, texto: string, lista = false): PortableTextBlock {
  return {
    _type: "block",
    _key: chave,
    style: estilo,
    markDefs: [],
    children: [{ _type: "span", _key: `${chave}s`, text: texto, marks: [] }],
    ...(lista ? { listItem: "bullet", level: 1 } : {}),
  } as PortableTextBlock;
}

describe("o link de volta", () => {
  it("as páginas da associação voltam a ela; as legais, ao início", () => {
    expect(VOLTA_ASSOCIACAO).toEqual({ href: "/associacao", rotulo: "A Associação" });
    expect(VOLTA_INICIO).toEqual({ href: "/", rotulo: "Início" });
  });
});

describe("o ícone de cada página", () => {
  /* A lista da spec, seção 3.1, escrita aqui de novo, do slug ao componente
     Phosphor: comparar o desenho que sai com o do componente é o que pega
     dois ícones trocados de lugar. */
  const TABELA: [string, Icon][] = [
    ["seja-associado", Handshake],
    ["estatuto", Scroll],
    ["politica-editorial", Article],
    ["politica-de-privacidade", ShieldCheck],
    ["politica-de-cookies", Cookie],
    ["termos-de-uso", FileText],
  ];
  const desenho = (Componente: Icon) =>
    renderToString(createElement(Componente, { size: 84, weight: "duotone", className: "", "aria-hidden": "true" }));

  it("cada página da lista desenha o ícone dela, em duotone", () => {
    for (const [slug, Componente] of TABELA) {
      const nosso = renderToString(createElement(Icone, { nome: iconeDaPagina(slug), duotone: true, tamanho: 84 }));
      expect(nosso, slug).toBe(desenho(Componente));
    }
  });

  it("página fora da lista (Benefícios, uma nova) fica com o documento", () => {
    expect(ICONE_DE_PAGINA_PADRAO).toBe("documento");
    for (const slug of ["beneficios", "", "constructor", "toString"]) {
      expect(iconeDaPagina(slug), slug).toBe(ICONE_DE_PAGINA_PADRAO);
    }
  });
});

describe("um parágrafo do rascunho na tela", () => {
  it("a marca é a que o documento do advogado usa", () => {
    expect(MARCA_PROVISORIA).toBe("[PROVISÓRIO] ");
  });

  it("parágrafo comum sai igual, nos dois modos", () => {
    for (const demo of [true, false]) {
      expect(paragrafoDoRascunho("Texto comum.", demo)).toEqual({ estilo: "normal", texto: "Texto comum." });
    }
  });

  it("parágrafo marcado: na demonstração, a entrar e sem a marca", () => {
    expect(paragrafoDoRascunho("[PROVISÓRIO] Prazo de guarda: texto da AMI a entrar.", true)).toEqual({
      estilo: "aEntrar",
      texto: "Prazo de guarda: texto da AMI a entrar.",
    });
  });

  it("parágrafo marcado, fora da demonstração: não existe", () => {
    expect(paragrafoDoRascunho("[PROVISÓRIO] Prazo de guarda: texto da AMI a entrar.", false)).toBeNull();
  });
});

describe("o rascunho em texto rico", () => {
  const RASCUNHO: RascunhoLegal = {
    slug: "seja-associado",
    titulo: "Título",
    resumo: "Resumo.",
    atualizadoEm: "2026-08-23",
    aviso: { titulo: "Aviso", texto: "Texto do aviso." },
    secoes: [
      {
        titulo: "Primeira",
        paragrafos: ["Um.", "[PROVISÓRIO] Falta: texto da AMI a entrar."],
        tituloDaLista: "Dados",
        lista: ["A.", "B."],
      },
      { titulo: "Segunda", paragrafos: ["Dois."] },
    ],
  };

  it("cada seção vira um h2, cada parágrafo um bloco, o subtítulo um h3 e a lista itens com marcador", () => {
    expect(blocosDoRascunho(RASCUNHO, true)).toEqual([
      b("r0", "h2", "Primeira"),
      b("r1", "normal", "Um."),
      b("r2", "aEntrar", "Falta: texto da AMI a entrar."),
      b("r3", "h3", "Dados"),
      b("r4", "normal", "A.", true),
      b("r5", "normal", "B.", true),
      b("r6", "h2", "Segunda"),
      b("r7", "normal", "Dois."),
    ]);
  });

  it("fora da demonstração, o parágrafo marcado não existe, e as chaves continuam únicas", () => {
    expect(blocosDoRascunho(RASCUNHO, false)).toEqual([
      b("r0", "h2", "Primeira"),
      b("r1", "normal", "Um."),
      b("r2", "h3", "Dados"),
      b("r3", "normal", "A.", true),
      b("r4", "normal", "B.", true),
      b("r5", "h2", "Segunda"),
      b("r6", "normal", "Dois."),
    ]);
  });

  it("o conteúdo do rascunho: título, resumo, data, aviso e os blocos", () => {
    expect(conteudoDoRascunho(RASCUNHO, false)).toEqual({
      titulo: "Título",
      resumo: "Resumo.",
      atualizadoEm: "2026-08-23",
      aviso: { titulo: "Aviso", texto: "Texto do aviso." },
      corpo: blocosDoRascunho(RASCUNHO, false),
    });
  });

  const DOC: PaginaInstitucional = {
    titulo: "Estatuto",
    slug: "estatuto",
    resumo: "As regras que organizam a associação.",
    atualizadoEm: "2026-09-10T12:00:00Z",
    corpo: [b("a", "h2", "Capítulo um")],
  };

  it("o conteúdo do Studio: sem quadro de aviso, o texto como veio", () => {
    expect(conteudoDoSanity(DOC)).toEqual({
      titulo: "Estatuto",
      resumo: "As regras que organizam a associação.",
      atualizadoEm: "2026-09-10T12:00:00Z",
      aviso: null,
      corpo: DOC.corpo,
    });
  });

  it("o revisado sempre vence; sem ele, o rascunho; sem os dois, nada", () => {
    expect(conteudoDaPagina(DOC, RASCUNHO, true)).toEqual(conteudoDoSanity(DOC));
    expect(conteudoDaPagina(null, RASCUNHO, true)).toEqual(conteudoDoRascunho(RASCUNHO, true));
    expect(conteudoDaPagina(null, RASCUNHO, false)).toEqual(conteudoDoRascunho(RASCUNHO, false));
    expect(conteudoDaPagina(null, undefined, true)).toBeNull();
    expect(conteudoDaPagina(null, null, false)).toBeNull();
  });
});

describe("as âncoras dos títulos de seção", () => {
  it("só os h2 com texto, na ordem, com a âncora única e a chave do bloco", () => {
    const dois = {
      ...b("g", "h2", ""),
      children: [
        { _type: "span", _key: "g1", text: "O que ", marks: [] },
        { _type: "span", _key: "g2", text: "é", marks: ["strong"] },
      ],
    } as PortableTextBlock;
    const corpo = [
      b("a", "h2", "Quem é o responsável"),
      b("b", "normal", "Texto."),
      b("c", "h3", "Subtítulo"),
      b("d", "h2", "Alterações"),
      b("e", "h2", "   "),
      b("f", "h2", "Alterações"),
      dois,
    ];
    expect(ancorasDoCorpo(corpo)).toEqual([
      { id: "secao-quem-e-o-responsavel", titulo: "Quem é o responsável", chave: "a" },
      { id: "secao-alteracoes", titulo: "Alterações", chave: "d" },
      { id: "secao-alteracoes-2", titulo: "Alterações", chave: "f" },
      { id: "secao-o-que-e", titulo: "O que é", chave: "g" },
    ]);
  });

  it("sem h2, nenhuma", () => {
    expect(ancorasDoCorpo([b("a", "normal", "Só texto.")])).toEqual([]);
  });
});

describe("nenhum PROVISÓRIO na tela, vindo dos rascunhos", () => {
  const RASCUNHOS: RascunhoLegal[] = [PRIVACIDADE, TERMOS, COOKIES, SEJA_ASSOCIADO];

  it("a marca só aparece no começo de um parágrafo, e em nenhum outro texto", () => {
    for (const r of RASCUNHOS) {
      for (const t of [r.titulo, r.resumo, r.aviso.titulo, r.aviso.texto]) {
        expect(t, r.slug).not.toContain("PROVISÓRIO");
      }
      for (const s of r.secoes) {
        for (const t of [s.titulo, s.tituloDaLista ?? "", ...(s.lista ?? [])]) {
          expect(t, `${r.slug}: ${s.titulo}`).not.toContain("PROVISÓRIO");
        }
        for (const p of s.paragrafos) {
          const resto = p.startsWith(MARCA_PROVISORIA) ? p.slice(MARCA_PROVISORIA.length) : p;
          expect(resto, `${r.slug}: ${p}`).not.toContain("PROVISÓRIO");
        }
      }
    }
  });

  it("em nenhum dos dois modos o texto rico leva a palavra", () => {
    for (const r of RASCUNHOS) {
      for (const demo of [true, false]) {
        expect(JSON.stringify(blocosDoRascunho(r, demo)), `${r.slug} ${demo}`).not.toContain("PROVISÓRIO");
      }
    }
  });

  it("a política de privacidade tem dois trechos a entrar, que só existem na demonstração", () => {
    const aEntrar = (demo: boolean) => blocosDoRascunho(PRIVACIDADE, demo).filter((x) => x.style === "aEntrar");
    expect(aEntrar(true)).toHaveLength(2);
    expect(aEntrar(false)).toHaveLength(0);
  });
});
