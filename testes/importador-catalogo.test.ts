import { describe, expect, it } from "vitest";
import { resolverBairro, resolverEspecialidade } from "@/lib/importador/catalogo";

const ESPECIALIDADES = [
  { id: 1, nome: "Clínica Médica", slug: "clinica-medica" },
  { id: 2, nome: "Cardiologia", slug: "cardiologia" },
  { id: 3, nome: "Ginecologia e Obstetrícia", slug: "ginecologia-e-obstetricia" },
];

const BAIRROS = [
  { id: 1, nome: "Centro", slug: "centro" },
  { id: 2, nome: "Nova Imperatriz", slug: "nova-imperatriz" },
  { id: 3, nome: "Juçara", slug: "jucara" },
];

describe("resolverEspecialidade — degrau 1, nome exato", () => {
  it("acha pelo nome como está no catálogo", () => {
    expect(resolverEspecialidade("Cardiologia", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 2, nome: "Cardiologia",
    });
  });
});

describe("resolverEspecialidade — degrau 2, sem acento e sem caixa", () => {
  it("acha 'clinica medica' minúsculo e sem acento", () => {
    expect(resolverEspecialidade("clinica medica", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 1, nome: "Clínica Médica",
    });
  });

  it("acha com espaço sobrando", () => {
    expect(resolverEspecialidade("  Cardiologia  ", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 2, nome: "Cardiologia",
    });
  });
});

describe("resolverEspecialidade — degrau 3, mapa de sinônimos", () => {
  it("'clinico geral' acha Clínica Médica pelo singular", () => {
    expect(resolverEspecialidade("clinico geral", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 1, nome: "Clínica Médica",
    });
  });

  it("'internista' acha Clínica Médica por token extra", () => {
    expect(resolverEspecialidade("internista", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 1, nome: "Clínica Médica",
    });
  });

  it("'cardiologista' acha Cardiologia", () => {
    expect(resolverEspecialidade("cardiologista", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 2, nome: "Cardiologia",
    });
  });

  it("'obstetra' acha Ginecologia e Obstetrícia", () => {
    expect(resolverEspecialidade("obstetra", ESPECIALIDADES)).toEqual({
      tipo: "achada", id: 3, nome: "Ginecologia e Obstetrícia",
    });
  });
});

describe("resolverEspecialidade — as duas pendências, que são diferentes", () => {
  it("nome que os sinônimos conhecem mas o banco não tem", () => {
    /* Pediatria está em SINONIMOS e NÃO está no catálogo deste teste. */
    expect(resolverEspecialidade("pediatra", ESPECIALIDADES)).toEqual({
      tipo: "fora-do-catalogo", nome: "Pediatria",
    });
  });

  it("acento errado ainda atravessa o mapa, mas cai fora do catálogo", () => {
    expect(resolverEspecialidade("Ortopedía", ESPECIALIDADES)).toEqual({
      tipo: "fora-do-catalogo", nome: "Ortopedia e Traumatologia",
    });
  });

  it("nome que ninguém conhece", () => {
    expect(resolverEspecialidade("Cirurgia Vascular", ESPECIALIDADES)).toEqual({
      tipo: "desconhecida",
    });
  });

  it("nome formal de especialidade fora do catálogo é fora-do-catalogo, não desconhecida", () => {
    expect(resolverEspecialidade("Otorrinolaringologia", ESPECIALIDADES)).toEqual({
      tipo: "fora-do-catalogo", nome: "Otorrinolaringologia",
    });
  });

  it("texto vazio é desconhecido, não estoura", () => {
    expect(resolverEspecialidade("", ESPECIALIDADES)).toEqual({ tipo: "desconhecida" });
  });
});

describe("resolverBairro", () => {
  it("acha pelo nome exato", () => {
    expect(resolverBairro("Centro", BAIRROS)).toEqual({
      tipo: "existente", id: 1, nome: "Centro",
    });
  });

  it("acha sem acento e sem caixa", () => {
    expect(resolverBairro("jucara", BAIRROS)).toEqual({
      tipo: "existente", id: 3, nome: "Juçara",
    });
  });

  it("acha pelo slug, que é como alguém pode ter copiado da URL", () => {
    expect(resolverBairro("nova-imperatriz", BAIRROS)).toEqual({
      tipo: "existente", id: 2, nome: "Nova Imperatriz",
    });
  });

  it("bairro que não existe vira novo, com slug pronto", () => {
    expect(resolverBairro("Bacurizinho", BAIRROS)).toEqual({
      tipo: "novo", nome: "Bacurizinho", slug: "bacurizinho",
    });
  });

  it("não decide sozinho sobre parecido — isso é do relatório", () => {
    expect(resolverBairro("Nova Imperatris", BAIRROS)).toEqual({
      tipo: "novo", nome: "Nova Imperatris", slug: "nova-imperatris",
    });
  });
});
