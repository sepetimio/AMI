import { describe, expect, it, vi } from "vitest";
import type { Medico } from "@/lib/dados/tipos";
import { fonte } from "@/testes/apoio";
import { htmlDe } from "@/testes/renderizar";

/*
  Bairro saiu do site (spec, item 1.7). Continua só como parte do endereço do
  consultório, no perfil. Aqui, as duas páginas de diretório renderizadas de
  verdade, com dublês no lugar do banco: nenhuma lista de bairros, nenhum
  link para busca por bairro ou para especialidade por bairro; e o texto de
  abertura da especialidade sem bairro, telemedicina, acessibilidade nem
  associado.
*/

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound() não devia ser chamado neste teste");
  },
}));

const MEDICO: Medico = {
  id: 1,
  slug: "mayara-exemplo",
  nome: "Mayara Exemplo",
  crm: "1234",
  crmUf: "MA",
  foto: null,
  bio: null,
  telemedicina: true,
  associadoAmi: true,
  especialidades: [{ nome: "Cardiologia", slug: "cardiologia", rqe: null, principal: true }],
  locais: [
    {
      id: 1,
      logradouro: "Rua Exemplo",
      numero: "1",
      bairro: { id: 1, nome: "Centro", slug: "centro" },
      telefone: "(99) 3000-0000",
      whatsapp: null,
      estacionamento: true,
      acessibilidade: ["acesso_cadeirante"],
    },
  ],
};

vi.mock("@/lib/dados/medicos", () => ({ buscarMedicos: async () => [MEDICO] }));
vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () => [{ nome: "Cardiologia", slug: "cardiologia", total: 1 }],
  especialidadePorSlug: async () => ({ nome: "Cardiologia", slug: "cardiologia", oQueFaz: null, quandoProcurar: null }),
}));

const { default: PaginaMedicos } = await import("@/app/(site)/medicos/page");
const { default: PaginaEspecialidade } = await import("@/app/(site)/medicos/[especialidade]/page");

const MEDICOS = await htmlDe(await PaginaMedicos());
const ESPECIALIDADE = await htmlDe(
  await PaginaEspecialidade({
    params: Promise.resolve({ especialidade: "cardiologia" }),
  }),
);

/* O texto que aparece, sem as tags e sem o JSON-LD (que não é tela). */
const tela = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");

describe("nenhum bairro nas páginas de diretório", () => {
  for (const [nome, html] of [
    ["/medicos", MEDICOS],
    ["/medicos/cardiologia", ESPECIALIDADE],
  ] as const) {
    it(`${nome}: nem lista, nem link de bairro`, () => {
      expect(html).not.toContain("por-bairro");
      expect(html).not.toContain("/busca?bairro");
      expect(html).not.toMatch(/href="\/medicos\/cardiologia\/[^"]+"/);
      expect(tela(html)).not.toMatch(/bairro/i);
    });
  }

  it("/medicos ainda tem o índice de especialidades (a página não quebrou)", () => {
    expect(MEDICOS).toContain('href="/medicos/cardiologia"');
  });
});

describe("o texto de abertura da especialidade", () => {
  it("sem telemedicina, acessibilidade nem associado", () => {
    for (const fora of ["telemedicina", "cadeirante", "acessibilidade", "associad", "Centro"]) {
      expect(tela(ESPECIALIDADE).toLowerCase(), fora).not.toContain(fora.toLowerCase());
    }
  });
});

describe("a camada de dados", () => {
  it("não conta mais bairros", () => {
    expect(fonte("../lib/dados/especialidades.ts")).not.toContain("bairrosComContagem");
  });
});
