import { describe, expect, it, vi } from "vitest";
import type { Medico } from "@/lib/dados/tipos";

/*
  Os metadados de /medicos/[especialidade], chamados como o Next os chama,
  com as fontes de dados trocadas por dublês. A página sai pronta do build
  (`generateStaticParams`) e é refeita a cada `revalidate`; por isso os
  metadados não leem a querystring, e o canonical, que aponta para o
  endereço limpo, é o que tira do índice os endereços com parâmetros.
*/

const MEDICO = {
  id: 1,
  slug: "mayara-exemplo",
  nome: "Mayara Exemplo",
  crm: "1234",
  crmUf: "MA",
  foto: null,
  bio: null,
  telemedicina: false,
  associadoAmi: true,
  especialidades: [{ nome: "Cardiologia", slug: "cardiologia", rqe: null, principal: true }],
  locais: [],
} satisfies Medico;

const dados = vi.hoisted(() => ({ medicos: [] as unknown[] }));
vi.mock("@/lib/dados/medicos", () => ({ buscarMedicos: async () => dados.medicos }));
vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () => [{ nome: "Cardiologia", slug: "cardiologia", total: 1 }],
  especialidadePorSlug: async (slug: string) =>
    slug === "cardiologia" ? { nome: "Cardiologia", slug } : null,
}));

const pagina = await import("@/app/(site)/medicos/[especialidade]/page");
const metadados = (especialidade: string) =>
  pagina.generateMetadata({ params: Promise.resolve({ especialidade }) });

describe("os metadados de uma especialidade", () => {
  it("título, descrição e o canonical no endereço limpo, sem robots", async () => {
    dados.medicos = [MEDICO];
    const m = await metadados("cardiologia");
    expect(m.title).toMatch(/^Cardiologia em Imperatriz/);
    expect(m.description).toMatch(/^1 cardiologista em Imperatriz/);
    expect(m.alternates).toEqual({ canonical: "/medicos/cardiologia" });
    expect(m).not.toHaveProperty("robots");
  });

  it("especialidade sem cadastro ou sem médico: nada", async () => {
    dados.medicos = [MEDICO];
    expect(await metadados("nao-existe")).toEqual({});
    dados.medicos = [];
    expect(await metadados("cardiologia")).toEqual({});
  });

  /* Que a página, metadados inclusive, não lê `searchParams` e segue com
     `generateStaticParams` e `revalidate` está em
     testes/pagina-de-especialidade.test.ts. */
});
