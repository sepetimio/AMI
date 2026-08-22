import { describe, expect, it } from "vitest";
import { agrupar } from "@/lib/importador/agrupar";
import type { EnderecoLido, LinhaLida } from "@/lib/importador/tipos";

function endereco(linha: number, logradouro: string): EnderecoLido {
  return {
    linha, logradouro, numero: null, complemento: null,
    bairro: "Centro", cep: null, telefone: null, whatsapp: null,
  };
}

function lida(p: Partial<LinhaLida> & { linha: number; nome: string; crm: string }): LinhaLida {
  return {
    crmUf: "MA", especialidade: null, rqe: null, telemedicina: null,
    endereco: null, avisos: [], ...p,
  } as LinhaLida;
}

describe("agrupar", () => {
  it("uma linha vira um médico", () => {
    const { medicos, erros } = agrupar([lida({ linha: 2, nome: "Ana Souza", crm: "1" })]);
    expect(erros).toEqual([]);
    expect(medicos).toHaveLength(1);
    expect(medicos[0].nome).toBe("Ana Souza");
    expect(medicos[0].linhas).toEqual([2]);
  });

  it("mesmo CRM e mesmo nome juntam, somando endereços", () => {
    const { medicos, erros } = agrupar([
      lida({ linha: 2, nome: "Ana Souza", crm: "1", endereco: endereco(2, "Rua A") }),
      lida({ linha: 3, nome: "Ana Souza", crm: "1", endereco: endereco(3, "Rua B") }),
    ]);
    expect(erros).toEqual([]);
    expect(medicos).toHaveLength(1);
    expect(medicos[0].enderecos.map((e) => e.logradouro)).toEqual(["Rua A", "Rua B"]);
    expect(medicos[0].linhas).toEqual([2, 3]);
  });

  it("mesmo CRM com nome diferente é erro na segunda linha, não médico novo", () => {
    const { medicos, erros } = agrupar([
      lida({ linha: 97, nome: "Ana Souza", crm: "4821" }),
      lida({ linha: 214, nome: "Bruno Lima", crm: "4821" }),
    ]);
    expect(medicos).toHaveLength(1);
    expect(medicos[0].nome).toBe("Ana Souza");
    expect(erros).toHaveLength(1);
    expect(erros[0].linha).toBe(214);
    expect(erros[0].motivo).toContain("97");
  });

  it("diferença só de acento ou caixa no nome não é erro", () => {
    const { medicos, erros } = agrupar([
      lida({ linha: 2, nome: "João Peçanha", crm: "1" }),
      lida({ linha: 3, nome: "joao pecanha", crm: "1" }),
    ]);
    expect(erros).toEqual([]);
    expect(medicos).toHaveLength(1);
    /* A primeira grafia vence: é a que já entrou. */
    expect(medicos[0].nome).toBe("João Peçanha");
  });

  it("mesmo CRM em UF diferente são dois médicos", () => {
    const { medicos } = agrupar([
      lida({ linha: 2, nome: "Ana", crm: "1", crmUf: "MA" }),
      lida({ linha: 3, nome: "Bia", crm: "1", crmUf: "TO" }),
    ]);
    expect(medicos).toHaveLength(2);
  });

  it("junta especialidades diferentes do mesmo médico, com o RQE de cada", () => {
    const { medicos } = agrupar([
      lida({ linha: 2, nome: "Ana", crm: "1", especialidade: "Cardiologia", rqe: "11" }),
      lida({ linha: 3, nome: "Ana", crm: "1", especialidade: "Clínica Médica", rqe: null }),
    ]);
    expect(medicos[0].especialidades).toEqual([
      { texto: "Cardiologia", rqe: "11", linha: 2 },
      { texto: "Clínica Médica", rqe: null, linha: 3 },
    ]);
  });

  it("a mesma especialidade repetida não duplica", () => {
    const { medicos } = agrupar([
      lida({ linha: 2, nome: "Ana", crm: "1", especialidade: "Cardiologia", rqe: "11" }),
      lida({ linha: 3, nome: "Ana", crm: "1", especialidade: "cardiologia", rqe: null }),
    ]);
    expect(medicos[0].especialidades).toHaveLength(1);
    expect(medicos[0].especialidades[0].rqe).toBe("11");
  });

  it("telemedicina preenchida em qualquer linha vale para o médico", () => {
    const { medicos } = agrupar([
      lida({ linha: 2, nome: "Ana", crm: "1", telemedicina: null }),
      lida({ linha: 3, nome: "Ana", crm: "1", telemedicina: true }),
    ]);
    expect(medicos[0].telemedicina).toBe(true);
  });

  it("preserva a ordem de aparição na planilha", () => {
    const { medicos } = agrupar([
      lida({ linha: 2, nome: "Zeca", crm: "9" }),
      lida({ linha: 3, nome: "Ana", crm: "1" }),
    ]);
    expect(medicos.map((m) => m.nome)).toEqual(["Zeca", "Ana"]);
  });
});
