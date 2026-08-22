import { describe, expect, it } from "vitest";
import { planoEstaLimpo, relatorio } from "@/lib/importador/relatorio";
import type { Plano } from "@/lib/importador/tipos";

const BASE: Plano = {
  arquivo: "associados.xlsx",
  linhasLidas: 0,
  medicosDistintos: 0,
  colunasIgnoradas: [],
  bairrosNovos: [],
  criar: [],
  atualizar: [],
  erros: [],
  avisos: [],
  ausentes: [],
};

describe("relatorio", () => {
  it("abre com o nome do arquivo e as contagens", () => {
    const t = relatorio({ ...BASE, linhasLidas: 523, medicosDistintos: 498 });
    expect(t).toContain("associados.xlsx");
    expect(t).toContain("523 linhas lidas");
    expect(t).toContain("498 médicos distintos");
  });

  it("lista as colunas que o arquivo trouxe e o importador não usa", () => {
    const t = relatorio({ ...BASE, colunasIgnoradas: ["email", "bio"] });
    expect(t).toContain("email");
    expect(t).toContain("bio");
  });

  it("marca o bairro parecido demais com um existente", () => {
    const t = relatorio({
      ...BASE,
      bairrosNovos: [
        { nome: "Bacurizinho", slug: "bacurizinho", medicos: 12, parecidoCom: null },
        { nome: "Nova Imperatris", slug: "nova-imperatris", medicos: 1, parecidoCom: "Nova Imperatriz" },
      ],
    });
    expect(t).toContain("Bacurizinho");
    expect(t).toContain("Nova Imperatriz");
    expect(t).toMatch(/parecido/i);
  });

  it("cita o número da linha em todo erro", () => {
    const t = relatorio({
      ...BASE,
      erros: [
        { linha: 88, motivo: "CRM vazio" },
        { linha: 355, motivo: 'UF do CRM "MAA" não existe' },
      ],
    });
    expect(t).toContain("linha  88");
    expect(t).toContain("linha 355");
    expect(t).toContain("CRM vazio");
  });

  it("separa as duas pendências de especialidade", () => {
    const t = relatorio({
      ...BASE,
      avisos: [
        { tipo: "especialidade-desconhecida", linha: 2, texto: "Ortopedía" },
        { tipo: "especialidade-fora-do-catalogo", linha: 3, texto: "Cirurgia Vascular" },
      ],
    });
    expect(t).toContain("Ortopedía");
    expect(t).toContain("Cirurgia Vascular");
    expect(t).toMatch(/fora do catálogo/i);
    expect(t).toMatch(/não reconhecida/i);
  });

  it("relata o RQE perdido com a linha", () => {
    const t = relatorio({
      ...BASE,
      avisos: [{ tipo: "rqe-perdido", linha: 41, rqe: "1234" }],
    });
    expect(t).toMatch(/RQE/);
    expect(t).toContain("41");
  });

  it("diz que nada será feito com os ausentes", () => {
    const t = relatorio({
      ...BASE,
      ausentes: [{ crm: "999", crmUf: "MA", nome: "Outro Médico" }],
    });
    expect(t).toMatch(/Nada será feito/i);
  });

  it("mostra o RQE corrigido em especialidade que já estava cadastrada", () => {
    const t = relatorio({
      ...BASE,
      atualizar: [{
        id: 7, crm: "4821", crmUf: "MA", nome: "Ana Souza",
        mudancas: [], especialidadesNovas: [],
        especialidadesAtualizadas: [{ especialidadeId: 2, rqe: "1234" }],
        enderecosNovos: [], enderecosAtualizados: [], enderecosSoNoBanco: 0,
        linhas: [2],
      }],
    });
    expect(t).toMatch(/RQE CORRIGIDO/);
    expect(t).toContain("CRM/MA 4821");
    expect(t).toContain("Ana Souza");
  });

  it("não imprime seção vazia", () => {
    const t = relatorio(BASE);
    expect(t).not.toMatch(/BAIRROS NOVOS/);
    expect(t).not.toMatch(/LINHAS REJEITADAS/);
    expect(t).not.toMatch(/NO BANCO E FORA/);
    expect(t).not.toMatch(/RQE CORRIGIDO/);
  });
});

describe("planoEstaLimpo", () => {
  it("plano sem erro e sem pendência está limpo", () => {
    expect(planoEstaLimpo(BASE)).toBe(true);
  });

  it("erro de linha suja o plano", () => {
    expect(planoEstaLimpo({ ...BASE, erros: [{ linha: 1, motivo: "x" }] })).toBe(false);
  });

  it("especialidade não resolvida suja o plano", () => {
    expect(
      planoEstaLimpo({
        ...BASE,
        avisos: [{ tipo: "especialidade-desconhecida", linha: 2, texto: "x" }],
      }),
    ).toBe(false);
  });

  it("nome que mudou não suja: é informação, não problema", () => {
    expect(
      planoEstaLimpo({
        ...BASE,
        avisos: [{ tipo: "nome-mudou", linha: 2, de: "a", para: "b", slug: "a" }],
      }),
    ).toBe(true);
  });
});
