import { describe, expect, it } from "vitest";
import { aplicarFiltros, ordenar } from "@/lib/dados/filtros";
import type { Medico } from "@/lib/dados/tipos";

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
  horarios: [{ diaSemana: 2, abre: "08:00", fecha: "12:00" }],
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
      horarios: [{ diaSemana: 6, abre: "08:00", fecha: "12:00" }],
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

  it("filtra por bairro", () => {
    const r = aplicarFiltros(todos, { bairro: "centro" });
    expect(r.map((m) => m.nome)).toEqual(["José Andrade"]);
  });

  it("filtra por telemedicina", () => {
    expect(aplicarFiltros(todos, { telemedicina: true })).toHaveLength(1);
  });

  it("filtra por atendimento no sábado", () => {
    const r = aplicarFiltros(todos, { atendeSabado: true });
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra"]);
  });

  it("filtra por acessibilidade", () => {
    const r = aplicarFiltros(todos, { acessibilidade: ["acesso_cadeirante"] });
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra"]);
  });

  it("filtra somente associados", () => {
    expect(aplicarFiltros(todos, { somenteAssociados: true })).toHaveLength(1);
  });

  it("acha por nome ignorando acento e caixa", () => {
    expect(aplicarFiltros(todos, { termo: "jose" })).toHaveLength(1);
    expect(aplicarFiltros(todos, { termo: "JOSÉ" })).toHaveLength(1);
  });

  it("acha por nome da especialidade", () => {
    const r = aplicarFiltros(todos, { termo: "cardio" });
    expect(r.map((m) => m.nome)).toEqual(["José Andrade"]);
  });

  it("combina filtros com E, não com OU", () => {
    const r = aplicarFiltros(todos, {
      especialidade: "pediatria",
      bairro: "centro",
    });
    expect(r).toHaveLength(0);
  });
});

describe("ordenar", () => {
  it("por nome, em ordem alfabética que respeita acento", () => {
    const r = ordenar(todos, "nome");
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra", "José Andrade"]);
  });

  it("sem termo, relevância é ordem alfabética", () => {
    const r = ordenar(todos, "relevancia");
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra", "José Andrade"]);
  });

  it("com termo, quem casa no nome vem antes de quem casa na especialidade", () => {
    const r = ordenar(todos, "relevancia", "pediatria");
    expect(r[0].nome).toBe("Ana Bezerra");
  });

  it("não altera a lista recebida", () => {
    const copia = [...todos];
    ordenar(todos, "nome");
    expect(todos).toEqual(copia);
  });
});
