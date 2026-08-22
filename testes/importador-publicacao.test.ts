import { describe, expect, it } from "vitest";
import { selecionarParaPublicar } from "@/lib/importador/publicacao";
import type { Retrato } from "@/lib/importador/tipos";

function retrato(p: Partial<Retrato> = {}): Retrato {
  return {
    profissionais: [],
    especialidades: [{ id: 1, nome: "Cardiologia", slug: "cardiologia" }],
    bairros: [{ id: 1, nome: "Centro", slug: "centro" }],
    locais: [],
    vinculosEspecialidade: [],
    ...p,
  };
}

const ANA = {
  id: 7, slug: "ana-souza", nome: "Ana Souza", crm: "1", crmUf: "MA",
  telemedicina: false, associadoAmi: true, publicado: false,
};

const TODOS = { comEspecialidade: true, comLocal: true };

describe("selecionarParaPublicar", () => {
  it("médico com especialidade e endereço entra", () => {
    const s = selecionarParaPublicar(
      retrato({
        profissionais: [ANA],
        vinculosEspecialidade: [{ profissionalId: 7, especialidadeId: 1, rqe: null }],
        locais: [{
          id: 30, profissionalId: 7, logradouro: "R", numero: null,
          complemento: null, bairroId: 1, cep: null, telefone: null, whatsapp: null,
        }],
      }),
      TODOS,
    );
    expect(s.publicar.map((c) => c.id)).toEqual([7]);
    expect(s.barrados).toEqual([]);
  });

  it("sem especialidade é barrado, com o motivo", () => {
    const s = selecionarParaPublicar(
      retrato({
        profissionais: [ANA],
        locais: [{
          id: 30, profissionalId: 7, logradouro: "R", numero: null,
          complemento: null, bairroId: 1, cep: null, telefone: null, whatsapp: null,
        }],
      }),
      TODOS,
    );
    expect(s.publicar).toEqual([]);
    expect(s.barrados[0].motivo).toMatch(/especialidade/i);
  });

  it("sem endereço é barrado, com o motivo", () => {
    const s = selecionarParaPublicar(
      retrato({
        profissionais: [ANA],
        vinculosEspecialidade: [{ profissionalId: 7, especialidadeId: 1, rqe: null }],
      }),
      TODOS,
    );
    expect(s.publicar).toEqual([]);
    expect(s.barrados[0].motivo).toMatch(/endereço/i);
  });

  it("quem já está publicado não entra de novo", () => {
    const s = selecionarParaPublicar(
      retrato({
        profissionais: [{ ...ANA, publicado: true }],
        vinculosEspecialidade: [{ profissionalId: 7, especialidadeId: 1, rqe: null }],
        locais: [{
          id: 30, profissionalId: 7, logradouro: "R", numero: null,
          complemento: null, bairroId: 1, cep: null, telefone: null, whatsapp: null,
        }],
      }),
      TODOS,
    );
    expect(s.publicar).toEqual([]);
    expect(s.barrados).toEqual([]);
  });

  it("sem filtro nenhum, publica quem só tem CRM", () => {
    const s = selecionarParaPublicar(
      retrato({ profissionais: [ANA] }),
      { comEspecialidade: false, comLocal: false },
    );
    expect(s.publicar.map((c) => c.id)).toEqual([7]);
  });

  it("acumula os dois motivos quando faltam os dois", () => {
    const s = selecionarParaPublicar(retrato({ profissionais: [ANA] }), TODOS);
    expect(s.barrados[0].motivo).toMatch(/especialidade/i);
    expect(s.barrados[0].motivo).toMatch(/endereço/i);
  });
});
