import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { Cookie, FileText, Handshake, Scroll, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import estilosPagina from "@/app/(site)/encontre.module.css";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import estilos from "@/components/editorial/PaginaDeTexto.module.css";
import { VOLTA_ASSOCIACAO, type ConteudoDaPagina } from "@/lib/paginaDeTexto";
import type { PaginaInstitucional } from "@/lib/sanity/tipos";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  O modelo de página de texto, de duas formas:
  - o componente, renderizado com um texto escrito aqui;
  - as rotas de verdade (/associacao/[pagina] e as três legais), com o
    Sanity trocado por um dublê e as duas chaves de demonstração.

  A chave de demonstração é lida quando lib/demonstracao.ts é importado:
  cada caso troca a chave e importa a rota de novo, como
  testes/pagina-de-especialidade.test.ts.

  O CSS se lê do arquivo; o alinhamento e o ritmo são medidos pela
  auditoria (scripts/auditoria-visual.js).
*/

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const dados = vi.hoisted(() => ({ paginas: {} as Record<string, unknown> }));

vi.mock("@/lib/sanity/consultas", () => ({
  paginaPorSlug: async (slug: string) => dados.paginas[slug] ?? null,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  dados.paginas = {};
});

const desenho = (Componente: Icon) =>
  renderToString(createElement(Componente, { size: 84, weight: "duotone", className: "", "aria-hidden": "true" }));

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

const CONTEUDO: ConteudoDaPagina = {
  titulo: "Estatuto",
  resumo: "As regras que organizam a associação.",
  atualizadoEm: "2026-09-10T12:00:00Z",
  aviso: null,
  corpo: [
    b("a", "h2", "Capítulo um"),
    b("b", "normal", "Texto um."),
    b("c", "h3", "Seção"),
    b("d", "normal", "Item.", { listItem: "bullet", level: 1 }),
    b("e", "h2", "Capítulo dois"),
    {
      ...b("f", "normal", ""),
      markDefs: [{ _type: "link", _key: "l", href: "/associacao/diretoria" }],
      children: [
        { _type: "span", _key: "f1", text: "Veja ", marks: [] },
        { _type: "span", _key: "f2", text: "a diretoria", marks: ["l"] },
        { _type: "span", _key: "f3", text: " e o ", marks: [] },
        { _type: "span", _key: "f4", text: "presidente", marks: ["strong"] },
        { _type: "span", _key: "f5", text: ".", marks: [] },
      ],
    } as PortableTextBlock,
  ],
};

const componente = (conteudo: ConteudoDaPagina, filho?: string) =>
  renderToString(
    createElement(
      PaginaDeTexto,
      { conteudo, volta: VOLTA_ASSOCIACAO, icone: "pergaminho" },
      filho ? createElement("p", { className: "fim" }, filho) : undefined,
    ),
  );

describe("o modelo, renderizado", () => {
  const html = componente(CONTEUDO, "Fim da coluna");

  it("a faixa verde curta e o corpo numa faixa branca de ponta a ponta, no invólucro de coluna e ritmo", () => {
    expect(html).toMatch(new RegExp(`^<div class="${estilosPagina.pagina}"><section data-bloco="topo"`));
    expect(html).toContain('<h1 id="pagina-titulo"');
    expect(html).toContain(">Estatuto</h1>");
    expect(html).toContain(desenho(Scroll));
    expect(html).toContain(
      `<section data-bloco="texto" data-faixa="" aria-label="Texto da página" class="${estilos.faixa}"><div class="${estilos.grade}"><article class="${estilos.coluna}" data-coluna="">`,
    );
  });

  it("a data por extenso, com o relógio, no alto da coluna", () => {
    expect(html).toMatch(
      new RegExp(
        `<article class="${estilos.coluna}" data-coluna=""><p class="${estilos.atualizado}"><svg[^]*?</svg>Atualizado em <time dateTime="2026-09-10T12:00:00Z">10 de setembro de 2026</time></p>`,
        "i",
      ),
    );
  });

  it("o texto: h2 com âncora, h3, lista, link interno e negrito", () => {
    expect(html).toContain(
      '<h2 id="secao-capitulo-um">Capítulo um</h2><p>Texto um.</p><h3>Seção</h3><ul><li>Item.</li></ul>' +
        '<h2 id="secao-capitulo-dois">Capítulo dois</h2>',
    );
    const link = /<a [^>]*href="\/associacao\/diretoria"[^>]*>a diretoria<\/a>/.exec(html)![0];
    expect(link).toContain(`class="${estilos.link}"`);
    expect(html).toContain("<strong>presidente</strong>");
  });

  it("a lista numerada do texto leva a classe dela; o ol do índice recolhido, não", () => {
    const comLista = componente({
      ...CONTEUDO,
      corpo: [
        ...CONTEUDO.corpo,
        b("g", "normal", "Um.", { listItem: "number", level: 1 }),
        b("h", "normal", "Dois.", { listItem: "number", level: 1 }),
      ],
    });
    expect(comLista).toContain(`<ol class="${estilos.numerada}"><li>Um.</li><li>Dois.</li></ol>`);
    expect(comLista.split(estilos.numerada)).toHaveLength(2);
    const recolhido = /<details>[\s\S]*?<\/details>/.exec(comLista)![0];
    expect(recolhido).toMatch(/<\/summary><ol>/);
    expect(recolhido).not.toContain(estilos.numerada);
  });

  it("o que vem junto entra no fim da coluna, depois do texto", () => {
    expect(html).toContain('<p class="fim">Fim da coluna</p></article>');
  });

  it("com dois títulos de seção ou mais: o índice à direita e o recolhido no alto da coluna", () => {
    expect(html).toContain('data-nesta-pagina=""');
    expect(html).toMatch(/<\/time><\/p><nav [^>]*aria-labelledby="nesta-pagina-recolhido"><details>/);
    expect(html).toMatch(/<\/article><nav [^>]*data-nesta-pagina=""/);
    expect([...html.matchAll(/<a href="#(secao-[^"]+)"/g)].map((m) => m[1])).toEqual([
      "secao-capitulo-um",
      "secao-capitulo-dois",
      "secao-capitulo-um",
      "secao-capitulo-dois",
    ]);
  });

  it("com um só, nenhum índice; o título continua com a âncora", () => {
    const um = componente({ ...CONTEUDO, corpo: CONTEUDO.corpo.slice(0, 2) });
    expect(um).not.toContain("data-nesta-pagina");
    expect(um).not.toContain("<details");
    expect(um).toContain('<h2 id="secao-capitulo-um">');
  });

  it("sem aviso, sem quadro", () => {
    expect(html).not.toContain('role="note"');
  });

  it("sem data, sem a linha de atualização: a coluna começa pelo índice", () => {
    const semData = componente({ ...CONTEUDO, atualizadoEm: "" });
    expect(semData).not.toContain("Atualizado em");
    expect(semData).not.toContain("<time");
    expect(semData).not.toContain(`class="${estilos.atualizado}"`);
    expect(semData).toMatch(
      new RegExp(`<article class="${estilos.coluna}" data-coluna=""><nav [^>]*aria-labelledby="nesta-pagina-recolhido"><details>`),
    );
  });

  it("com aviso: o quadro cinza, com o ícone, o título e o texto, antes do texto", () => {
    const comAviso = componente({ ...CONTEUDO, aviso: { titulo: "Esta página é provisória", texto: "Texto do aviso." } });
    expect(comAviso).toMatch(
      new RegExp(
        `<div class="${estilos.quadro}" role="note"><svg[^]*?</svg><div><p class="${estilos.quadroTitulo}">Esta página é provisória</p><p>Texto do aviso.</p></div></div><h2 id="secao-capitulo-um">`,
      ),
    );
  });

  it("nenhuma Cabeceira, trilha ou BreadcrumbList", () => {
    expect(html).not.toContain("Trilha de navegação");
    expect(html).not.toContain("-mt-32");
    expect(html).not.toContain("BreadcrumbList");
  });
});

const PRIVACIDADE_REVISADA: PaginaInstitucional = {
  titulo: "Política de privacidade",
  slug: "politica-de-privacidade",
  resumo: "O texto revisado pelo advogado.",
  atualizadoEm: "2026-11-01T12:00:00Z",
  corpo: [b("a", "h2", "Quem trata os dados"), b("b", "normal", "A AMI.")],
};

const ROTAS = {
  privacidade: () => import("@/app/(site)/politica-de-privacidade/page"),
  termos: () => import("@/app/(site)/termos-de-uso/page"),
  cookies: () => import("@/app/(site)/politica-de-cookies/page"),
};

async function legal(qual: keyof typeof ROTAS, chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const { default: Pagina } = await ROTAS[qual]();
  return htmlDe(await Pagina());
}

async function daAssociacao(pagina: string, chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const { default: Pagina } = await import("@/app/(site)/associacao/[pagina]/page");
  return htmlDe(await Pagina({ params: Promise.resolve({ pagina }) }));
}

describe("as páginas legais", () => {
  it("com o rascunho: voltam ao início, com o ícone de cada uma, o aviso de advogado e a data", async () => {
    const html = await legal("privacidade", "true");
    expect(/<a [^>]*href="\/"[^>]*>/.exec(html)![0]).toContain('data-coluna=""');
    expect(html).toContain(">Política de privacidade</h1>");
    expect(html).toContain(desenho(ShieldCheck));
    expect(html).toContain("Este texto é um rascunho e ainda não foi revisado por advogado");
    expect(html).toMatch(/<time dateTime="2026-08-21">21 de agosto de 2026<\/time>/i);
    expect(html).toContain('<h2 id="secao-quem-e-o-responsavel">Quem é o responsável</h2>');
    expect(await legal("termos", "true")).toContain(desenho(FileText));
    expect(await legal("cookies", "true")).toContain(desenho(Cookie));
  });

  /* Um texto legal não pode perder calado um item obrigatório: o que falta
     no rascunho sai como moldura nos dois modos, e não só na demonstração,
     como nas páginas da associação (docs/decisoes-sem-o-cliente.md). */
  it.each(["true", "false"])(
    "com a chave %s, o que falta no rascunho legal sai como moldura a entrar, sem a marca",
    async (chave) => {
      const html = await legal("privacidade", chave);
      const aEntrar = [...html.matchAll(new RegExp(`<p class="${estilos.falta}" data-a-entrar="">([^<]+)</p>`, "g"))];
      expect(aEntrar.map((m) => m[1].slice(0, 40))).toEqual([
        "A AMI precisa designar formalmente um en",
        "O prazo de guarda desses registros depen",
      ]);
    },
  );

  it("nenhum PROVISÓRIO, Cabeceira, trilha ou BreadcrumbList, nos dois modos", async () => {
    for (const qual of ["privacidade", "termos", "cookies"] as const) {
      for (const chave of ["true", "false"]) {
        const html = await legal(qual, chave);
        expect(html, `${qual} ${chave}`).not.toContain("PROVISÓRIO");
        expect(html, `${qual} ${chave}`).not.toContain("Trilha de navegação");
        expect(html, `${qual} ${chave}`).not.toContain("-mt-32");
        expect(html, `${qual} ${chave}`).not.toContain("BreadcrumbList");
      }
    }
  });

  it("publicado o texto revisado, ele vence: sem o quadro de aviso, com o texto e a data dele", async () => {
    dados.paginas["politica-de-privacidade"] = PRIVACIDADE_REVISADA;
    const html = await legal("privacidade", "true");
    expect(html).not.toContain('role="note"');
    expect(html).not.toContain("rascunho");
    expect(html).toContain("<p>A AMI.</p>");
    expect(html).toContain("1 de novembro de 2026");
    expect(html).toContain("O texto revisado pelo advogado.");
  });

  it("o corpo é o último bloco: o rodapé emenda nele", async () => {
    const html = await legal("termos", "true");
    expect(html).toMatch(/<section data-bloco="texto" data-faixa=""[\s\S]*<\/section><\/div>$/);
    expect([...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1])).toEqual(["topo", "texto"]);
  });
});

describe("as páginas da associação", () => {
  it("Seja associado, do rascunho: volta à associação, com o aperto de mãos", async () => {
    const html = await daAssociacao("seja-associado", "true");
    expect(/<a [^>]*href="\/associacao"/.test(html)).toBe(true);
    expect(html).toContain(">Seja associado</h1>");
    expect(html).toContain(desenho(Handshake));
    expect(html).toContain("Esta página é provisória");
    expect(html).not.toContain("PROVISÓRIO");
  });

  it("na demonstração, o que falta em Seja associado sai como moldura a entrar", async () => {
    const html = await daAssociacao("seja-associado", "true");
    const aEntrar = [...html.matchAll(new RegExp(`<p class="${estilos.falta}" data-a-entrar="">([^<]+)</p>`, "g"))];
    expect(aEntrar.map((m) => m[1].slice(0, 40))).toEqual(["Valor de anuidade, benefícios do quadro "]);
  });

  it("fora da demonstração, o que falta em Seja associado não existe", async () => {
    const html = await daAssociacao("seja-associado", "false");
    expect(html).toContain(">Seja associado</h1>");
    expect(html).not.toContain("data-a-entrar");
    expect(html).not.toContain("Valor de anuidade");
    expect(html).not.toContain("PROVISÓRIO");
  });

  it("Estatuto sem documento nem rascunho, e um endereço que não existe: página não encontrada", async () => {
    await expect(daAssociacao("estatuto", "true")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(daAssociacao("nao-existe", "true")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("Estatuto publicado no Studio: a página, com o pergaminho", async () => {
    dados.paginas.estatuto = { ...PRIVACIDADE_REVISADA, titulo: "Estatuto", slug: "estatuto" };
    const html = await daAssociacao("estatuto", "false");
    expect(html).toContain(">Estatuto</h1>");
    expect(html).toContain(desenho(Scroll));
  });
});

describe("o CSS da página de texto", () => {
  const css = semNotas(fonte("../components/editorial/PaginaDeTexto.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("faixa branca de ponta a ponta: 96px, 64px no tablet, 44px no celular, sem margem embaixo", () => {
    const f = regra(base(css), ".faixa");
    expect(f).toMatch(/padding: 96px var\(--borda-faixa\);/);
    expect(f).toMatch(/background: var\(--color-surface\);/);
    expect(f).not.toMatch(/margin/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".faixa")).toMatch(/padding-top: 64px;/);
    expect(regra(cel(), ".faixa")).toMatch(/padding: 44px var\(--borda-faixa\);/);
  });

  it("coluna de leitura de 680px e o índice de 248px; 220px até 1180px; uma coluna do tablet para baixo", () => {
    expect(regra(base(css), ".grade")).toMatch(/grid-template-columns: minmax\(0, 680px\) 248px;/);
    expect(regra(base(css), ".grade")).toMatch(/justify-content: space-between;/);
    expect(regra(base(css), ".grade")).toMatch(/align-items: start;/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".grade")).toMatch(/minmax\(0, 1fr\) 220px/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".grade")).toMatch(/grid-template-columns: minmax\(0, 1fr\);/);
  });

  it("o texto em 17,5px com entrelinha de 1,7, como a leitura do perfil; 16px no celular", () => {
    expect(regra(base(css), ".coluna p,\n.coluna li")).toMatch(/font-size: 17\.5px;/);
    expect(regra(base(css), ".coluna p,\n.coluna li")).toMatch(/line-height: 1\.7;/);
    expect(regra(cel(), ".coluna p,\n  .coluna li")).toMatch(/font-size: 16px;/);
  });

  it("o número no meio do texto não quebra, e leva algarismos tabulares, como o .num do desenho", () => {
    const r = regra(base(css), ".coluna .inteiro");
    expect(r).toMatch(/white-space: nowrap;/);
    expect(r).toMatch(/font-variant-numeric: tabular-nums;/);
  });

  it("os parágrafos quebram com text-wrap: pretty, como o p do desenho; os itens de lista, não", () => {
    expect(regra(base(css), ".coluna p")).toMatch(/text-wrap: pretty;/);
    expect(regra(base(css), ".coluna p,\n.coluna li")).not.toMatch(/text-wrap/);
  });

  it("o relógio da data fica na linha do texto, e não num bloco acima dele", () => {
    expect(regra(base(css), ".atualizado svg")).toMatch(/display: inline-block;/);
  });

  it("o quadro de aviso é cinza neutro, sem tom quente", () => {
    const q = regra(base(css), ".quadro");
    expect(q).toMatch(/background: var\(--color-surface-fundo\);/);
    expect(q).toMatch(/border: 1px solid var\(--color-line\);/);
    expect(css).not.toMatch(/warn/);
  });

  it("o texto a entrar: cinza e em itálico, como nas outras molduras", () => {
    const r = regra(base(css), ".coluna .falta");
    expect(r).toMatch(/color: var\(--color-ink-400\);/);
    expect(r).toMatch(/font-style: italic;/);
  });

  it("a lista com o ponto verde do desenho", () => {
    expect(regra(base(css), ".coluna ul")).toMatch(/list-style: none;/);
    expect(regra(base(css), ".coluna ul > li::before")).toMatch(/background: var\(--color-ami-green-600\);/);
  });

  it("a lista numerada do Studio com o número, que a camada base do Tailwind tira: o do desenho da notícia, num círculo", () => {
    expect(regra(base(css), ".coluna .numerada > li::before")).toMatch(/content: counter\(passo\);/);
    expect(regra(base(css), ".coluna .numerada > li + li")).toMatch(/margin-top: 10px;/);
  });

  it("nenhuma regra alcança um ol pela tag: o índice recolhido é um ol dentro da coluna", () => {
    const seletores = [...css.matchAll(/([^{};]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith("@"))
      .flatMap((s) => s.split(",").map((p) => p.trim()));
    expect(seletores.length).toBeGreaterThan(40);
    expect(seletores).toContain(".coluna .numerada");
    expect(seletores.filter((s) => /(^|[\s>+~(])ol\b/.test(s))).toEqual([]);
  });
});
