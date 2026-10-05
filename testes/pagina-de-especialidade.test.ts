import { afterEach, describe, expect, it, vi } from "vitest";
import type { PortableTextBlock } from "@portabletext/react";
import estilosPagina from "@/app/(site)/encontre.module.css";
import type { Medico } from "@/lib/dados/tipos";
import type { TextoDeEspecialidade } from "@/lib/sanity/tipos";
import { fonte, semComentarios } from "@/testes/apoio";
import { htmlDe, topoSemAVolta } from "@/testes/renderizar";

/*
  A página de uma especialidade de verdade, renderizada:
  app/(site)/medicos/[especialidade]/page.tsx com as três fontes trocadas
  por dublês (os médicos, a especialidade e o texto do Sanity).

  A chave de demonstração é lida quando lib/demonstracao.ts é importado:
  cada caso troca a chave e importa a página de novo, como
  testes/renderizar.ts faz com o cabeçalho.

  O exemplo é o da spec, seção 2.3: na página de Ortopedia, Aline Peixoto
  (principal Neurologia, secundária Ortopedia) aparece como ortopedista.
*/

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const dados = vi.hoisted(() => ({
  medicos: [] as Medico[],
  texto: null as TextoDeEspecialidade | null,
  pedidos: [] as string[],
}));

vi.mock("@/lib/dados/medicos", () => ({ buscarMedicos: async () => dados.medicos }));
vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () => [
    { nome: "Ortopedia e Traumatologia", slug: "ortopedia-e-traumatologia", total: 2 },
  ],
  especialidadePorSlug: async (slug: string) =>
    slug === "ortopedia-e-traumatologia" ? { nome: "Ortopedia e Traumatologia", slug } : null,
}));
vi.mock("@/lib/sanity/consultas", () => ({
  textoDaEspecialidade: async (slug: string) => {
    dados.pedidos.push(slug);
    return dados.texto;
  },
}));

const ORTOPEDIA = { nome: "Ortopedia e Traumatologia", slug: "ortopedia-e-traumatologia" };

function medico(id: number, nome: string, especialidades: Medico["especialidades"]): Medico {
  return {
    id,
    slug: `medico-${id}`,
    nome,
    crm: String(10000 + id),
    crmUf: "MA",
    foto: null,
    bio: null,
    telemedicina: false,
    associadoAmi: true,
    especialidades,
    locais: [],
  };
}

const ALINE = medico(1, "Aline Peixoto", [
  { nome: "Neurologia", slug: "neurologia", rqe: "12222", principal: true },
  { ...ORTOPEDIA, rqe: "30111", principal: false },
]);
const GUSTAVO = medico(2, "Gustavo Serra", [{ ...ORTOPEDIA, rqe: "30222", principal: true }]);

const bloco = (texto: string) =>
  ({
    _type: "block",
    _key: "b",
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: "s", text: texto, marks: [] }],
  }) as PortableTextBlock;

const TEXTO: TextoDeEspecialidade = {
  oQueFaz: [bloco("O ortopedista cuida dos ossos e das articulações.")],
  quandoProcurar: [bloco("Dor nas articulações que não passa.")],
  revisorNome: "Dra. Exemplo Revisora",
  revisorCrm: "CRM/MA 10000",
  mesDaRevisao: "setembro de 2026",
};

async function pagina(chave: string, especialidade = "ortopedia-e-traumatologia") {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const { default: Pagina } = await import("@/app/(site)/medicos/[especialidade]/page");
  return htmlDe(await Pagina({ params: Promise.resolve({ especialidade }) }));
}

const blocos = (html: string) => [...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);
const tela = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

afterEach(() => {
  vi.unstubAllEnvs();
  dados.medicos = [ALINE, GUSTAVO];
  dados.texto = null;
  dados.pedidos = [];
});
dados.medicos = [ALINE, GUSTAVO];

describe("a página de uma especialidade", () => {
  it("abre com a faixa verde, sem Cabeceira, sem trilha e sem BreadcrumbList", async () => {
    const html = await pagina("true");
    expect(html).toMatch(new RegExp(`<div class="${estilosPagina.pagina}"><section data-bloco="topo"`));
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/<h1 id="pagina-titulo"[^>]*>Ortopedia e Traumatologia em Imperatriz<\/h1>/);
    expect(html).not.toContain("Trilha de navegação");
    expect(html).not.toContain("-mt-32");
    expect(html).not.toContain("BreadcrumbList");
  });

  it("o parágrafo de abertura curto, gerado dos dados, e nenhum ícone na faixa", async () => {
    const html = await pagina("true");
    expect(tela(html)).toContain(
      "A Associação Médica de Imperatriz reúne 2 ortopedistas em Imperatriz, no Maranhão. " +
        "Cada perfil traz o número de registro no Conselho Regional de Medicina.",
    );
    for (const chave of ["true", "false"]) {
      expect(topoSemAVolta(await pagina(chave)), chave).not.toContain("<svg");
    }
  });

  it("a contagem e a grade, com a especialidade da página no cartão de quem a tem como secundária", async () => {
    const html = await pagina("true");
    expect(html).toMatch(/<h2 id="contagem"[^>]*>2 médicos<\/h2>/);
    const aline = html.slice(html.indexOf(">Aline Peixoto<"), html.indexOf(">Gustavo Serra<"));
    /* No HTML, o RQE tem o espaço que não quebra; `tela` o troca por espaço
       comum (`\s` do JavaScript inclui o U+00A0). */
    expect(aline).toContain("RQE 30111");
    expect(tela(aline)).toContain("Ortopedia e Traumatologia RQE 30111");
    expect(aline).not.toContain("Neurologia");
  });

  it("o ItemList dos médicos continua", async () => {
    const html = await pagina("true");
    expect(html).toContain('"@type":"ItemList"');
    expect(html).toContain('"name":"Aline Peixoto"');
  });

  it("pede ao Sanity o texto da especialidade da página", async () => {
    await pagina("true");
    expect(dados.pedidos).toEqual(["ortopedia-e-traumatologia"]);
  });

  it("com o texto da AMI, o Sobre sai nos dois modos, e é o último bloco: o rodapé emenda nele", async () => {
    for (const chave of ["true", "false"]) {
      dados.texto = TEXTO;
      const html = await pagina(chave);
      expect(blocos(html), chave).toEqual(["topo", "medicos", "sobre"]);
      expect(tela(html), chave).toContain("O ortopedista cuida dos ossos e das articulações.");
      expect(tela(html), chave).toContain("Revisado por Dra. Exemplo Revisora · CRM/MA 10000 · revisão em setembro de 2026");
      /* O último elemento do invólucro, que é o último do `<main>`, é a faixa
         do Sobre (components/layout/Rodape.module.css). */
      expect(html, chave).toMatch(/<section data-bloco="sobre" data-faixa=""[\s\S]*<\/section><\/div>$/);
    }
  });

  it("sem texto, na demonstração: o Sobre com o texto a entrar e sem revisor", async () => {
    const html = await pagina("true");
    expect(blocos(html)).toEqual(["topo", "medicos", "sobre"]);
    expect(html.match(/Texto da AMI a entrar\./g)).toHaveLength(2);
    expect(html).not.toContain("Revisado por");
  });

  it("sem texto, fora da demonstração: sem o Sobre, e a grade fecha a página", async () => {
    const html = await pagina("false");
    expect(blocos(html)).toEqual(["topo", "medicos"]);
    expect(html).not.toContain("Sobre a ");
    expect(html).not.toContain("a entrar");
    expect(html).toMatch(/<section data-bloco="medicos"[\s\S]*<\/ul><\/section><\/div>$/);
  });

  it("nenhum texto provisório, nem Outras especialidades", async () => {
    for (const chave of ["true", "false"]) {
      const html = await pagina(chave);
      expect(html, chave).not.toContain("PROVISÓRIO");
      expect(html, chave).not.toContain("Outras especialidades");
    }
  });

  it("especialidade que não existe: página não encontrada", async () => {
    await expect(pagina("true", "nao-existe")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("especialidade sem médico: página não encontrada", async () => {
    dados.medicos = [];
    await expect(pagina("true")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("continua pronta no build: sem searchParams, com generateStaticParams e revalidate", async () => {
    /* Ligação com o Next: é a leitura de `searchParams` que tira a página
       do pré-render. */
    expect(semComentarios(fonte("../app/(site)/medicos/[especialidade]/page.tsx"))).not.toContain("searchParams");
    vi.resetModules();
    const modulo = await import("@/app/(site)/medicos/[especialidade]/page");
    expect(modulo.revalidate).toBe(3600);
    expect(await modulo.generateStaticParams()).toEqual([{ especialidade: "ortopedia-e-traumatologia" }]);
  });
});
