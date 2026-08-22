import { describe, expect, it } from "vitest";
import { montarPlano, type ContextoDoPlano } from "@/lib/importador/plano";
import type {
  EnderecoLido,
  MedicoDaPlanilha,
  Retrato,
} from "@/lib/importador/tipos";

const VAZIO: Retrato = {
  profissionais: [],
  especialidades: [
    { id: 1, nome: "Clínica Médica", slug: "clinica-medica" },
    { id: 2, nome: "Cardiologia", slug: "cardiologia" },
  ],
  bairros: [{ id: 1, nome: "Centro", slug: "centro" }],
  locais: [],
  vinculosEspecialidade: [],
};

const CONTEXTO: ContextoDoPlano = {
  arquivo: "associados.xlsx",
  linhasLidas: 1,
  colunasIgnoradas: [],
  erros: [],
  avisos: [],
};

function endereco(p: Partial<EnderecoLido> = {}): EnderecoLido {
  return {
    linha: 2, logradouro: "Rua Coriolano Milhomem", numero: "39",
    complemento: null, bairro: "Centro", cep: null,
    telefone: null, whatsapp: null, ...p,
  };
}

function medico(p: Partial<MedicoDaPlanilha> = {}): MedicoDaPlanilha {
  return {
    crm: "4821", crmUf: "MA", nome: "Ana Souza", telemedicina: null,
    especialidades: [], enderecos: [], linhas: [2], ...p,
  };
}

describe("montarPlano — criação", () => {
  it("médico que não existe entra em criar, com slug do nome", () => {
    const p = montarPlano([medico()], VAZIO, CONTEXTO);
    expect(p.atualizar).toEqual([]);
    expect(p.criar).toHaveLength(1);
    expect(p.criar[0].slug).toBe("ana-souza");
    expect(p.criar[0].crm).toBe("4821");
  });

  it("telemedicina vazia vira falso na criação, que é o padrão do banco", () => {
    const p = montarPlano([medico()], VAZIO, CONTEXTO);
    expect(p.criar[0].telemedicina).toBe(false);
  });

  it("dois médicos de mesmo nome recebem slugs diferentes", () => {
    const p = montarPlano(
      [medico({ crm: "1" }), medico({ crm: "2", linhas: [3] })],
      VAZIO,
      CONTEXTO,
    );
    expect(p.criar.map((m) => m.slug)).toEqual(["ana-souza", "ana-souza-2"]);
  });

  it("slug já ocupado no banco não é reusado", () => {
    const retrato: Retrato = {
      ...VAZIO,
      profissionais: [{
        id: 9, slug: "ana-souza", nome: "Ana Souza", crm: "999", crmUf: "MA",
        telemedicina: false, associadoAmi: true, publicado: true,
      }],
    };
    const p = montarPlano([medico({ crm: "1" })], retrato, CONTEXTO);
    expect(p.criar[0].slug).toBe("ana-souza-2");
  });

  it("a primeira especialidade vira a principal", () => {
    const p = montarPlano(
      [medico({
        especialidades: [
          { texto: "Cardiologia", rqe: "11", linha: 2 },
          { texto: "Clínica Médica", rqe: null, linha: 3 },
        ],
      })],
      VAZIO,
      CONTEXTO,
    );
    expect(p.criar[0].especialidades).toEqual([
      { especialidadeId: 2, rqe: "11", principal: true },
      { especialidadeId: 1, rqe: null, principal: false },
    ]);
  });
});

describe("montarPlano — especialidade não resolvida", () => {
  it("o médico entra mesmo assim, sem especialidade", () => {
    const p = montarPlano(
      [medico({ especialidades: [{ texto: "Cirurgia Vascular", rqe: null, linha: 2 }] })],
      VAZIO,
      CONTEXTO,
    );
    expect(p.criar).toHaveLength(1);
    expect(p.criar[0].especialidades).toEqual([]);
    expect(p.avisos).toContainEqual({
      tipo: "especialidade-desconhecida", linha: 2, texto: "Cirurgia Vascular",
    });
  });

  it("o RQE perdido junto é relatado, não some calado", () => {
    const p = montarPlano(
      [medico({ especialidades: [{ texto: "Ortopedía", rqe: "1234", linha: 41 }] })],
      VAZIO,
      CONTEXTO,
    );
    expect(p.avisos).toContainEqual({ tipo: "rqe-perdido", linha: 41, rqe: "1234" });
  });

  it("especialidade conhecida fora do catálogo tem aviso próprio", () => {
    const p = montarPlano(
      [medico({ especialidades: [{ texto: "pediatra", rqe: null, linha: 2 }] })],
      VAZIO,
      CONTEXTO,
    );
    expect(p.avisos).toContainEqual({
      tipo: "especialidade-fora-do-catalogo", linha: 2, texto: "Pediatria",
    });
  });
});

describe("montarPlano — bairros novos", () => {
  it("bairro fora do catálogo entra na lista, com a contagem de médicos", () => {
    const p = montarPlano(
      [
        medico({ crm: "1", enderecos: [endereco({ bairro: "Bacurizinho" })] }),
        medico({ crm: "2", enderecos: [endereco({ bairro: "bacurizinho" })] }),
      ],
      VAZIO,
      CONTEXTO,
    );
    expect(p.bairrosNovos).toEqual([
      { nome: "Bacurizinho", slug: "bacurizinho", medicos: 2, parecidoCom: null },
    ]);
  });

  it("bairro parecido demais com um existente é marcado", () => {
    const retrato: Retrato = {
      ...VAZIO,
      bairros: [
        { id: 1, nome: "Centro", slug: "centro" },
        { id: 2, nome: "Nova Imperatriz", slug: "nova-imperatriz" },
      ],
    };
    const p = montarPlano(
      [medico({ enderecos: [endereco({ bairro: "Nova Imperatris" })] })],
      retrato,
      CONTEXTO,
    );
    expect(p.bairrosNovos[0].parecidoCom).toBe("Nova Imperatriz");
  });

  it("bairro existente não entra na lista de novos", () => {
    const p = montarPlano([medico({ enderecos: [endereco()] })], VAZIO, CONTEXTO);
    expect(p.bairrosNovos).toEqual([]);
    expect(p.criar[0].enderecos[0].bairro).toEqual({ tipo: "existente", id: 1 });
  });
});

describe("montarPlano — atualização", () => {
  const comAna: Retrato = {
    ...VAZIO,
    profissionais: [{
      id: 7, slug: "ana-souza", nome: "Ana Souza", crm: "4821", crmUf: "MA",
      telemedicina: false, associadoAmi: false, publicado: false,
    }],
  };

  it("médico existente vai para atualizar, não para criar", () => {
    const p = montarPlano([medico()], comAna, CONTEXTO);
    expect(p.criar).toEqual([]);
    expect(p.atualizar).toHaveLength(1);
    expect(p.atualizar[0].id).toBe(7);
  });

  it("associado_ami falso no banco vira mudança, porque a planilha é a lista", () => {
    const p = montarPlano([medico()], comAna, CONTEXTO);
    expect(p.atualizar[0].mudancas).toContainEqual({
      campo: "associado_ami", de: "não", para: "sim",
    });
  });

  it("célula vazia não apaga campo preenchido", () => {
    const retrato: Retrato = {
      ...comAna,
      profissionais: [{ ...comAna.profissionais[0], telemedicina: true, associadoAmi: true }],
    };
    const p = montarPlano([medico({ telemedicina: null })], retrato, CONTEXTO);
    expect(p.atualizar[0].mudancas).toEqual([]);
  });

  it("nome corrigido muda o nome e NÃO muda o slug", () => {
    const p = montarPlano([medico({ nome: "Ana Sousa" })], comAna, CONTEXTO);
    expect(p.atualizar[0].mudancas).toContainEqual({
      campo: "nome", de: "Ana Souza", para: "Ana Sousa",
    });
    expect(p.avisos).toContainEqual({
      tipo: "nome-mudou", linha: 2, de: "Ana Souza", para: "Ana Sousa", slug: "ana-souza",
    });
  });

  it("diferença só de acento no nome não é mudança", () => {
    const p = montarPlano([medico({ nome: "ana souza" })], comAna, CONTEXTO);
    expect(p.atualizar[0].mudancas.some((m) => m.campo === "nome")).toBe(false);
  });
});

describe("montarPlano — endereços de médico existente", () => {
  const base: Retrato = {
    ...VAZIO,
    profissionais: [{
      id: 7, slug: "ana-souza", nome: "Ana Souza", crm: "4821", crmUf: "MA",
      telemedicina: false, associadoAmi: true, publicado: false,
    }],
    locais: [{
      id: 30, profissionalId: 7, logradouro: "Rua Coriolano Milhomem",
      numero: "39", complemento: null, bairroId: 1, cep: null,
      telefone: "9935243716", whatsapp: null,
    }],
  };

  it("mesmo logradouro, número e bairro é atualização, não endereço novo", () => {
    const p = montarPlano(
      [medico({ enderecos: [endereco({ telefone: "9988020205" })] })],
      base,
      CONTEXTO,
    );
    expect(p.atualizar[0].enderecosNovos).toEqual([]);
    expect(p.atualizar[0].enderecosAtualizados).toEqual([
      { id: 30, mudancas: [{ campo: "telefone", de: "9935243716", para: "9988020205" }] },
    ]);
  });

  it("logradouro diferente é endereço novo", () => {
    const p = montarPlano(
      [medico({ enderecos: [endereco({ logradouro: "Avenida Bernardo Sayão" })] })],
      base,
      CONTEXTO,
    );
    expect(p.atualizar[0].enderecosNovos).toHaveLength(1);
  });

  it("endereço só no banco é contado, nunca apagado", () => {
    const p = montarPlano([medico({ enderecos: [] })], base, CONTEXTO);
    expect(p.atualizar[0].enderecosSoNoBanco).toBe(1);
    expect(p.atualizar[0].enderecosAtualizados).toEqual([]);
  });
});

describe("montarPlano — ausentes", () => {
  it("quem está no banco e não veio na planilha é só relatado", () => {
    const retrato: Retrato = {
      ...VAZIO,
      profissionais: [{
        id: 9, slug: "outro-medico", nome: "Outro Médico", crm: "999", crmUf: "MA",
        telemedicina: false, associadoAmi: true, publicado: true,
      }],
    };
    const p = montarPlano([medico()], retrato, CONTEXTO);
    expect(p.ausentes).toEqual([{ crm: "999", crmUf: "MA", nome: "Outro Médico" }]);
  });
});

describe("montarPlano — o contexto atravessa intacto", () => {
  it("erros, colunas ignoradas e contagem chegam ao plano", () => {
    const p = montarPlano([medico()], VAZIO, {
      ...CONTEXTO,
      linhasLidas: 523,
      colunasIgnoradas: ["email"],
      erros: [{ linha: 88, motivo: "CRM vazio" }],
      avisos: [{ tipo: "campo-descartado", linha: 102, campo: "telefone", motivo: "curto" }],
    });
    expect(p.linhasLidas).toBe(523);
    expect(p.medicosDistintos).toBe(1);
    expect(p.colunasIgnoradas).toEqual(["email"]);
    expect(p.erros).toHaveLength(1);
    expect(p.avisos).toContainEqual(
      expect.objectContaining({ tipo: "campo-descartado", linha: 102 }),
    );
  });
});
