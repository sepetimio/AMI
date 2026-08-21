import { describe, expect, it } from "vitest";
import {
  SINONIMOS,
  comoProfissional,
  especialidadeCasaTermo,
} from "@/lib/dados/sinonimos";

describe("comoProfissional", () => {
  for (const s of SINONIMOS) {
    it(`${s.especialidade} -> ${s.singular} / ${s.plural}`, () => {
      expect(comoProfissional(s.especialidade)).toEqual([s.singular, s.plural]);
    });
  }

  it("especialidade fora da tabela cai no rótulo neutro", () => {
    expect(comoProfissional("Angiologia")).toEqual([
      "médico de Angiologia",
      "médicos de Angiologia",
    ]);
  });
});

describe("especialidadeCasaTermo", () => {
  for (const s of SINONIMOS) {
    it(`"${s.singular}" acha ${s.especialidade}`, () => {
      expect(especialidadeCasaTermo(s.especialidade, s.singular)).toBe(true);
    });

    it(`"${s.plural}" acha ${s.especialidade}`, () => {
      expect(especialidadeCasaTermo(s.especialidade, s.plural)).toBe(true);
    });
  }

  it('"cardiolo" ainda acha Cardiologia (prefixo de palavra parcial)', () => {
    expect(especialidadeCasaTermo("Cardiologia", "cardiolo")).toBe(true);
  });

  it('"uro" acha Urologia', () => {
    expect(especialidadeCasaTermo("Urologia", "uro")).toBe(true);
  });

  it('"uro" NÃO acha Neurologia (não é substring, é prefixo de token)', () => {
    expect(especialidadeCasaTermo("Neurologia", "uro")).toBe(false);
  });

  it('"otorrino" acha Otorrinolaringologia', () => {
    expect(especialidadeCasaTermo("Otorrinolaringologia", "otorrino")).toBe(
      true,
    );
  });

  it('"clinico geral" sem acento acha Clínica Médica', () => {
    expect(especialidadeCasaTermo("Clínica Médica", "clinico geral")).toBe(
      true,
    );
  });

  it("termo com menos de 3 caracteres não acha nada", () => {
    expect(especialidadeCasaTermo("Urologia", "ur")).toBe(false);
    expect(especialidadeCasaTermo("Cardiologia", "ca")).toBe(false);
    expect(especialidadeCasaTermo("Pediatria", "p")).toBe(false);
  });

  it("especialidade fora da tabela ainda é achável pelo próprio nome formal", () => {
    expect(especialidadeCasaTermo("Angiologia", "angiologia")).toBe(true);
    expect(especialidadeCasaTermo("Angiologia", "angio")).toBe(true);
  });

  it("especialidade fora da tabela não casa com termo não relacionado", () => {
    expect(especialidadeCasaTermo("Angiologia", "cardio")).toBe(false);
  });
});
