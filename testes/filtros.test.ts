import { describe, expect, it, vi } from "vitest";
import { aplicarFiltros, emOrdemAlfabetica } from "@/lib/dados/filtros";
import { buscarMedicos } from "@/lib/dados/medicos";
import type { Medico } from "@/lib/dados/tipos";

/* O banco devolve fora de ordem de propósito: quem põe em ordem é o
   `buscarMedicos`. */
const LINHAS = ["José Andrade", "Ana Bezerra", "Ângela Prado"].map((nome, i) => ({
  id: i + 1,
  slug: nome,
  nome,
  crm: String(i + 1),
  crm_uf: "MA",
  foto: null,
  bio: null,
  telemedicina: false,
  associado_ami: true,
  profissional_especialidade: [],
  atendimento: [],
}));

vi.mock("@/lib/dados/cliente", () => {
  const consulta: Record<string, unknown> = {};
  consulta.select = () => consulta;
  consulta.eq = () => consulta;
  consulta.order = () => Promise.resolve({ data: LINHAS, error: null });
  return { clienteServidor: () => ({ from: () => consulta }) };
});

function medico(over: Partial<Medico> & { nome: string }): Medico {
  return {
    id: 1,
    slug: "x",
    crm: "1",
    crmUf: "MA",
    foto: null,
    bio: null,
    telemedicina: false,
    associadoAmi: false,
    especialidades: [],
    locais: [],
    ...over,
  };
}

const local = (bairroSlug: string, extras: Partial<Medico["locais"][0]> = {}) => ({
  id: 1,
  logradouro: "Rua A",
  numero: "1",
  bairro: { id: 1, nome: bairroSlug, slug: bairroSlug },
  telefone: null,
  whatsapp: null,
  estacionamento: false,
  acessibilidade: [],
  ...extras,
});

const josé = medico({
  nome: "José Andrade",
  slug: "jose-andrade",
  especialidades: [
    { nome: "Cardiologia", slug: "cardiologia", rqe: "1", principal: true },
  ],
  locais: [local("centro")],
});

const ana = medico({
  nome: "Ana Bezerra",
  slug: "ana-bezerra",
  telemedicina: true,
  associadoAmi: true,
  especialidades: [
    { nome: "Pediatria", slug: "pediatria", rqe: null, principal: true },
  ],
  locais: [
    local("bacuri", {
      acessibilidade: ["acesso_cadeirante"],
    }),
  ],
});

const todos = [josé, ana];

describe("aplicarFiltros", () => {
  it("sem filtro, devolve todos", () => {
    expect(aplicarFiltros(todos, {})).toHaveLength(2);
  });

  it("filtra por especialidade", () => {
    const r = aplicarFiltros(todos, { especialidade: "pediatria" });
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra"]);
  });

  it("acha por nome ignorando acento e caixa", () => {
    expect(aplicarFiltros(todos, { termo: "jose" })).toHaveLength(1);
    expect(aplicarFiltros(todos, { termo: "JOSÉ" })).toHaveLength(1);
  });

  it("acha por nome da especialidade", () => {
    const r = aplicarFiltros(todos, { termo: "cardio" });
    expect(r.map((m) => m.nome)).toEqual(["José Andrade"]);
  });

  it("acha por nome da profissão, não só pelo nome formal da especialidade", () => {
    const r = aplicarFiltros(todos, { termo: "cardiologista" });
    expect(r.map((m) => m.nome)).toEqual(["José Andrade"]);
  });

  it("pediatra acha quem tem especialidade Pediatria", () => {
    const r = aplicarFiltros(todos, { termo: "pediatra" });
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra"]);
  });

  it('"uro" acha urologista e não neurologista (prefixo de token, não substring)', () => {
    const urologista = medico({
      nome: "Uriel Osório",
      slug: "uriel-osorio",
      especialidades: [
        { nome: "Urologia", slug: "urologia", rqe: "1", principal: true },
      ],
      locais: [local("centro")],
    });
    const neurologista = medico({
      nome: "Nina Elói",
      slug: "nina-eloi",
      especialidades: [
        { nome: "Neurologia", slug: "neurologia", rqe: "1", principal: true },
      ],
      locais: [local("centro")],
    });
    const r = aplicarFiltros([urologista, neurologista], { termo: "uro" });
    expect(r.map((m) => m.nome)).toEqual(["Uriel Osório"]);
  });

  it("combina termo e especialidade com E, não com OU", () => {
    const r = aplicarFiltros(todos, { termo: "jose", especialidade: "pediatria" });
    expect(r).toHaveLength(0);
  });

  it("os campos de antes, se chegarem, não filtram nada", () => {
    const antigos = { bairro: "centro", telemedicina: true, somenteAssociados: true } as never;
    expect(aplicarFiltros(todos, antigos)).toHaveLength(2);
  });
});

describe("emOrdemAlfabetica", () => {
  it("em ordem alfabética que respeita acento", () => {
    const angela = medico({ nome: "Ângela Prado", slug: "angela-prado" });
    const r = emOrdemAlfabetica([josé, angela, ana]);
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra", "Ângela Prado", "José Andrade"]);
  });

  it("não altera a lista recebida", () => {
    const lista = [josé, ana];
    emOrdemAlfabetica(lista);
    expect(lista.map((m) => m.nome)).toEqual(["José Andrade", "Ana Bezerra"]);
  });
});

describe("buscarMedicos", () => {
  it("devolve sempre em ordem alfabética, com ou sem filtro", async () => {
    expect((await buscarMedicos()).map((m) => m.nome)).toEqual([
      "Ana Bezerra",
      "Ângela Prado",
      "José Andrade",
    ]);
    expect((await buscarMedicos({ termo: "an" })).map((m) => m.nome)).toEqual([
      "Ana Bezerra",
      "Ângela Prado",
      "José Andrade",
    ]);
  });
});
