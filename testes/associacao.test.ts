import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import estilosPagina from "@/app/(site)/encontre.module.css";
import { DiretoriaEmDestaque } from "@/components/associacao/DiretoriaEmDestaque";
import { FechoAssocie } from "@/components/associacao/FechoAssocie";
import { SaibaMais } from "@/components/associacao/SaibaMais";
import estilos from "@/components/associacao/SecoesDaAssociacao.module.css";
import estilosMedicos from "@/components/diretorio/GradeMedicos.module.css";
import estilosEsp from "@/components/especialidades/GradeDeEspecialidades.module.css";
import estilosAssocie from "@/components/home/SejaAssociado.module.css";
import { anosDeAmi } from "@/lib/ami";
import { atalhosDoSaibaMais } from "@/lib/associacao";
import type { Diretor } from "@/lib/dados/diretoria";
import { tituloDePagina } from "@/lib/seo/metadados";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  A Associação: os três blocos de baixo (a diretoria em destaque, "Saiba
  mais" e o fecho) e a página de verdade (app/(site)/associacao/page.tsx),
  com o Sanity, a diretoria e o banco trocados por dublês, nas duas chaves
  de demonstração.

  A chave de demonstração é lida quando lib/demonstracao.ts é importado:
  cada caso troca a chave e importa a página de novo.
*/

const dados = vi.hoisted(() => ({
  associacao: null as unknown,
  publicadas: [] as string[],
  diretoria: [] as Diretor[],
}));

vi.mock("@/lib/sanity/consultas", () => ({
  paginaPorSlug: async (slug: string) => (slug === "associacao" ? dados.associacao : null),
  caminhosDePaginasPublicadas: async () => dados.publicadas,
}));
vi.mock("@/lib/dados/diretoria", () => ({ listarDiretoria: async () => dados.diretoria }));
vi.mock("@/lib/dados/medicos", () => ({
  buscarMedicos: async () => Array.from({ length: 24 }, (_, i) => ({ id: i + 1 })),
}));
vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () =>
    Array.from({ length: 14 }, (_, i) => ({ nome: `Especialidade ${i}`, slug: `especialidade-${i}`, total: 1 })),
}));

function diretor(id: number): Diretor {
  return {
    id,
    nome: `Diretor ${id}`,
    cargo: `Cargo ${id}`,
    ordem: id * 10,
    slugDoPerfil: `diretor-${id}`,
    crm: String(10000 + id),
    crmUf: "MA",
    medico: true,
    foto: null,
  };
}
const SEIS = [1, 2, 3, 4, 5, 6].map(diretor);

afterEach(() => {
  vi.unstubAllEnvs();
  dados.associacao = null;
  dados.publicadas = [];
  dados.diretoria = SEIS;
});
dados.diretoria = SEIS;

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** A tag de abertura do link para `href`. */
const link = (html: string, href: string) => new RegExp(`<a [^>]*href="${href}"[^>]*>`).exec(html)?.[0] ?? "";

describe("a diretoria em destaque", () => {
  const html = renderToString(createElement(DiretoriaEmDestaque, { diretores: SEIS.slice(0, 4) }));

  it("o cabeçalho de seção da home, com o botão-linha à direita", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="diretoria" aria-labelledby="diretoria-titulo"><div class="${estilos.cabSecao}"><div>` +
          `<span class="rotulo-secao" data-coluna="">Diretoria</span>` +
          `<h2 id="diretoria-titulo" class="${estilos.titulo}">Quem responde pela AMI</h2>` +
          `<p class="${estilos.texto}">Cada nome traz o número de inscrição no CRM.</p></div>`,
      ),
    );
    expect(link(html, "/associacao/diretoria")).toContain('class="botao-linha"');
    /* A seta de 13px, a do desenho (o ícone na letra de 13px do botão), como
       o "Ver todos de…" do perfil. */
    expect(html).toContain(`Ver a diretoria ${desenho(ArrowRight, 13, "regular")}</a></div>`);
  });

  it("os cartões de diretor, na grade da busca", () => {
    expect(html).toContain(`<ul class="${estilosMedicos.grade}">`);
    expect(html.match(/data-diretor=""/g)).toHaveLength(4);
  });
});

describe("Saiba mais", () => {
  const atalhos = atalhosDoSaibaMais(true, ["/associacao/seja-associado"]);
  const html = renderToString(createElement(SaibaMais, { atalhos }));
  const cartoes = [...html.matchAll(/<li [^>]*data-atalho=""[\s\S]*?<\/li>/g)].map((m) => m[0]);

  it("o cabeçalho de seção e a grade do índice de especialidades, em três colunas", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="saiba-mais" aria-labelledby="saiba-mais-titulo"><div class="${estilos.cabSecao}"><div>` +
          `<span class="rotulo-secao" data-coluna="">A Associação</span>` +
          `<h2 id="saiba-mais-titulo" class="${estilos.titulo}">Saiba mais</h2></div></div>` +
          `<ul class="${estilosEsp.grade} ${estilos.atalhos}" data-atalhos="">`,
      ),
    );
    expect(cartoes).toHaveLength(3);
  });

  it("o atalho da página que existe: o título com o link abre o cartão, depois a frase e a seta", () => {
    expect(cartoes[0]).toMatch(
      new RegExp(
        `^<li class="${estilosEsp.cartao} ${estilos.atalho}" data-atalho="">` +
          `<h3 class="${estilosEsp.nome} ${estilos.nome}" data-nome=""><a href="/associacao/seja-associado">Seja associado</a></h3>`,
      ),
    );
    expect(cartoes[0]).toContain(
      `<p class="${estilosEsp.pe} ${estilos.pe}"><span class="${estilosEsp.conta} ${estilos.frase}">Quem pode se associar à AMI e como fazer isso.</span>` +
        `<span class="${estilosEsp.seta} ${estilos.seta}" aria-hidden="true" data-seta="">${desenho(ArrowRight, 20, "regular")}</span></p>`,
    );
  });

  it("a página que ainda não existe: sem link, com a etiqueta texto a entrar", () => {
    expect(cartoes[1]).toMatch(/^<li [^>]*data-atalho="" data-a-entrar=""><h3 /);
    expect(cartoes[1]).toContain(`data-nome="">Estatuto<!-- --> <span class="${estilos.etiqueta}">texto a entrar</span></h3>`);
    expect(cartoes[1]).not.toContain("<a ");
    expect(cartoes[2]).toMatch(/^<li [^>]*data-atalho="" data-a-entrar=""><h3 /);
    expect(cartoes[2]).toContain(">Política editorial<!-- --> <span");
  });

  it("o único ícone é a seta do atalho que leva a uma página: o atalho a entrar, sem link, sai sem svg", () => {
    expect(cartoes[0].match(/<svg/g)).toHaveLength(1);
    expect(cartoes[0]).toContain(
      `<span class="${estilosEsp.seta} ${estilos.seta}" aria-hidden="true" data-seta="">${desenho(ArrowRight, 20, "regular")}</span>`,
    );
    for (const c of cartoes.slice(1)) {
      expect(c).toContain("data-a-entrar");
      expect(c).not.toContain("<svg");
      expect(c).not.toContain("data-seta");
    }
    expect(html.match(/<svg/g)).toHaveLength(1);
  });

  it("o texto do título, como o leitor de tela lê: o nome e a etiqueta separados por espaço", () => {
    const texto = (h3: string) => h3.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, "");
    const titulos = cartoes.map((c) => texto(/<h3 [\s\S]*?<\/h3>/.exec(c)![0]));
    expect(titulos).toEqual(["Seja associado", "Estatuto texto a entrar", "Política editorial texto a entrar"]);
  });
});

describe("o fecho", () => {
  const html = renderToString(createElement(FechoAssocie));

  it("faixa branca de ponta a ponta, que entra ao rolar, em duas colunas", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="associe" data-faixa="" aria-labelledby="associe-titulo" class="revelar ${estilosAssocie.faixa}"><div class="${estilos.fecho}">`,
      ),
    );
  });

  it("o texto aprovado da faixa da home e o botão Quero me associar", () => {
    expect(html).toContain(
      `<div><span class="rotulo-secao" data-coluna="">Seja associado</span>` +
        `<h2 id="associe-titulo" class="${estilos.fechoTitulo}">Associe-se à AMI e fortaleça a medicina em Imperatriz</h2></div>` +
        `<div><p class="${estilos.fechoTexto}">Médico com inscrição no CRM pode se associar. Fale com a AMI para saber como.</p>`,
    );
    expect(link(html, "/associacao/seja-associado")).toContain(`class="botao ${estilos.fechoAcao}"`);
    expect(html).toContain(`Quero me associar ${desenho(ArrowRight, 20, "regular")}</a></div></div></section>`);
  });

  it("não traz Missão, visão e valores junto, como o bloco da home traria", () => {
    expect(html).not.toContain("Quem é a AMI?");
  });
});

async function pagina(chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const modulo = await import("@/app/(site)/associacao/page");
  return { html: await htmlDe(await modulo.default()), modulo };
}

const blocos = (html: string) => [...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);

describe("a página A Associação", () => {
  it("na demonstração: os cinco blocos, na ordem do desenho", async () => {
    const { html } = await pagina("true");
    expect(html).toMatch(new RegExp(`^<div class="${estilosPagina.pagina}"><section data-bloco="topo"`));
    expect(blocos(html)).toEqual(["topo", "quem-somos", "diretoria", "saiba-mais", "associe"]);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("os números da faixa saem dos dados: os anos de lib/ami.ts, os médicos e as especialidades do banco", async () => {
    const { html } = await pagina("true");
    expect(html).toContain(`>${anosDeAmi(new Date())}</span>`);
    expect(html).toContain(">24</span>");
    expect(html).toContain(">14</span>");
  });

  it("a diretoria em destaque: os quatro primeiros, e o link para a diretoria inteira", async () => {
    const { html } = await pagina("true");
    expect(html.match(/data-diretor=""/g)).toHaveLength(4);
    expect(html).toContain(">Diretor 4<");
    expect(html).not.toContain(">Diretor 5<");
    expect(link(html, "/associacao/diretoria")).toContain('class="botao-linha"');
    expect(html).toMatch(/<a [^>]*href="\/associacao\/diretoria"[^>]*>Ver a diretoria/);
  });

  it("na demonstração, as molduras: a apresentação, a foto, os três princípios e dois atalhos a entrar", async () => {
    const { html } = await pagina("true");
    expect(html).toContain('data-a-entrar="apresentação"');
    expect(html).toContain("Fotografia a entrar");
    expect(html.match(/Texto da AMI a entrar\./g)).toHaveLength(4);
    expect(html.match(/texto a entrar</g)).toHaveLength(2);
    /* Cada moldura leva a marca: a apresentação, a foto, os três cartões e os dois atalhos. */
    expect(html.match(/ data-a-entrar="/g)).toHaveLength(7);
  });

  it("os únicos svg da página são os de botão e link: dentro de um link, na seta de um atalho com link ou no Ver perfil do cartão", async () => {
    const esperado = { true: 9, false: 8 };
    for (const chave of ["true", "false"] as const) {
      const { html } = await pagina(chave);
      const total = html.match(/<svg/g)?.length ?? 0;
      const emLink = [...html.matchAll(/<a [^>]*>[\s\S]*?<\/a>/g)].reduce((n, m) => n + (m[0].match(/<svg/g)?.length ?? 0), 0);
      const setaDeAtalho = html.match(/data-seta=""><svg/g)?.length ?? 0;
      const verPerfil = html.match(/<span class="botao [^"]*" aria-hidden="true" data-ligar="">Ver perfil[^<]*(?:<!-- -->)? ?<svg/g)?.length ?? 0;
      expect(total, chave).toBe(esperado[chave]);
      expect(emLink + setaDeAtalho + verPerfil, chave).toBe(total);
    }
  });

  it("fora da demonstração, sem o Studio: nenhuma moldura, sem Princípios e sem Saiba mais (sobraria só Seja associado)", async () => {
    const { html } = await pagina("false");
    expect(blocos(html)).toEqual(["topo", "quem-somos", "diretoria", "associe"]);
    expect(html).not.toContain("data-a-entrar");
    expect(html).not.toContain("a entrar");
    expect(html).not.toContain("Princípios");
  });

  it("fora da demonstração, com o Estatuto publicado: Saiba mais com os dois que existem", async () => {
    dados.publicadas = ["/associacao/estatuto"];
    const { html } = await pagina("false");
    expect(blocos(html)).toContain("saiba-mais");
    expect(html.match(/data-atalho=""/g)).toHaveLength(2);
    expect(html).not.toContain("texto a entrar");
  });

  it("com a apresentação da AMI no Studio, ela sai nos dois modos", async () => {
    dados.associacao = {
      titulo: "A Associação Médica de Imperatriz",
      slug: "associacao",
      resumo: "A AMI, desde 1975.",
      atualizadoEm: "2026-11-01T12:00:00Z",
      corpo: [
        { _type: "block", _key: "a", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", text: "Texto oficial da AMI.", marks: [] }] },
      ],
    };
    for (const chave of ["true", "false"]) {
      expect((await pagina(chave)).html, chave).toContain("<p>Texto oficial da AMI.</p>");
    }
  });

  it("sem diretor publicado, o bloco da diretoria sai", async () => {
    dados.diretoria = [];
    const { html } = await pagina("true");
    expect(blocos(html)).not.toContain("diretoria");
  });

  it("o fecho é o último bloco: o rodapé emenda nele", async () => {
    for (const chave of ["true", "false"]) {
      expect((await pagina(chave)).html, chave).toMatch(/<section data-bloco="associe" data-faixa=""[\s\S]*<\/section><\/div>$/);
    }
  });

  it("nenhum PROVISÓRIO, Cabeceira, trilha ou BreadcrumbList", async () => {
    for (const chave of ["true", "false"]) {
      const { html } = await pagina(chave);
      expect(html, chave).not.toContain("PROVISÓRIO");
      expect(html, chave).not.toContain("Trilha de navegação");
      expect(html, chave).not.toContain("-mt-32");
      expect(html, chave).not.toContain("BreadcrumbList");
    }
  });

  it("os metadados continuam os de antes", async () => {
    const { modulo } = await pagina("true");
    const m = await modulo.generateMetadata();
    expect(m.title).toBe(tituloDePagina("A Associação Médica de Imperatriz"));
    expect(m.description).toBe("Quem é a AMI, o que faz e como se associar.");
    expect(m.alternates).toEqual({ canonical: "/associacao" });
  });
});

describe("o CSS dos blocos de baixo", () => {
  const css = semNotas(fonte("../components/associacao/SecoesDaAssociacao.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("os atalhos em três colunas, duas no tablet e uma no celular, valendo sobre a grade do índice", () => {
    expect(regra(base(css), ".atalhos[data-atalhos]")).toMatch(/grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".atalhos[data-atalhos]")).toMatch(/repeat\(2, minmax\(0, 1fr\)\)/);
    expect(regra(cel(), ".atalhos[data-atalhos]")).toMatch(/grid-template-columns: 1fr;/);
    expect(regra(cel(), ".atalhos[data-atalhos]")).toMatch(/grid-auto-rows: auto;/);
  });

  it("a frase no pé, no cinza do texto, e a seta presa embaixo", () => {
    const r = regra(base(css), ".atalho .frase");
    expect(r).toMatch(/color: var\(--color-ink-600\);/);
    expect(r).toMatch(/font-weight: 500;/);
    expect(regra(base(css), ".atalho .pe")).toMatch(/align-items: flex-end;/);
  });

  it("o atalho a entrar não é link: o mouse não o ergue", () => {
    expect(regra(base(css), ".atalhos .atalho[data-a-entrar]:hover")).toMatch(/transform: none;/);
  });

  it("no celular, cada atalho numa linha: o título com a frase embaixo, e a seta", () => {
    expect(regra(cel(), ".atalhos .atalho")).toMatch(/grid-template-columns: minmax\(0, 1fr\) 28px;/);
    expect(regra(cel(), ".atalho .pe")).toMatch(/display: contents;/);
    expect(regra(cel(), ".atalho .nome")).toMatch(/grid-column: 1;/);
    expect(regra(cel(), ".atalho .frase")).toMatch(/grid-column: 1;/);
    expect(regra(cel(), ".atalho .seta")).toMatch(/grid-column: 2;/);
  });

  it("sem ladrilho: nenhuma regra dele, e o título abre o cartão, sem espaço em cima", () => {
    expect(css).not.toContain("ladrilho");
    /* O título do atalho é o `.nome` da grade do índice, que já abre o
       cartão sem espaço em cima: aqui, nenhuma regra para desfazer isso. */
    const grade = semNotas(fonte("../components/especialidades/GradeDeEspecialidades.module.css"));
    expect(regra(base(grade), ".nome")).not.toMatch(/margin/);
    expect(base(css)).not.toContain(".atalho .nome {");
  });

  it("o fecho em duas colunas, uma do tablet para baixo", () => {
    expect(regra(base(css), ".fecho")).toMatch(/grid-template-columns: minmax\(0, 1\.15fr\) minmax\(0, 1fr\);/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".fecho")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("a frase da diretoria e o texto do fecho quebram com text-wrap: pretty, como o p do desenho", () => {
    expect(regra(base(css), ".texto")).toMatch(/text-wrap: pretty;/);
    expect(regra(base(css), ".fechoTexto")).toMatch(/text-wrap: pretty;/);
  });

  it("a frase do atalho também, pelo pé, que é o p do desenho", () => {
    expect(regra(base(css), ".atalho .pe")).toMatch(/text-wrap: pretty;/);
  });

  it("a etiqueta: cinza neutro, sem tom quente", () => {
    expect(regra(base(css), ".etiqueta")).toMatch(/background: var\(--color-surface-fundo\);/);
  });

  it("a etiqueta herda a entrelinha do título, como no desenho: a pílula não alonga o cartão", () => {
    expect(regra(base(css), ".etiqueta")).toMatch(/line-height: inherit;/);
  });

  it("a margem da etiqueta desconta o espaço antes dela: a pílula fica onde o desenho a põe", () => {
    expect(regra(base(css), ".etiqueta")).toMatch(/margin-left: calc\(8px - 4\.78px\);/);
    expect(regra(cel(), ".etiqueta")).toMatch(/margin-left: calc\(6px - 3\.73px\);/);
  });
});
