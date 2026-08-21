import { describe, expect, it } from "vitest";
import {
  agruparPorDia,
  atendeNoDia,
  estaAbertoAgora,
  type Horario,
} from "@/lib/dados/horarios";

/* Terça-feira, 18/08/2026. Datas fixas: o teste não pode depender do dia
   em que roda. */
const terca = (hora: string) => new Date(`2026-08-18T${hora}:00`);

const comercial: Horario[] = [
  { diaSemana: 2, abre: "08:00", fecha: "12:00" },
  { diaSemana: 2, abre: "14:00", fecha: "18:00" },
  { diaSemana: 6, abre: "08:00", fecha: "12:00" },
];

describe("estaAbertoAgora", () => {
  it("está aberto dentro da faixa da manhã", () => {
    expect(estaAbertoAgora(comercial, terca("09:30"))).toBe(true);
  });

  it("está fechado no intervalo do almoço", () => {
    expect(estaAbertoAgora(comercial, terca("12:30"))).toBe(false);
  });

  it("está aberto dentro da faixa da tarde", () => {
    expect(estaAbertoAgora(comercial, terca("17:59"))).toBe(true);
  });

  it("fecha no minuto de fechamento", () => {
    expect(estaAbertoAgora(comercial, terca("18:00"))).toBe(false);
  });

  it("abre no minuto de abertura", () => {
    expect(estaAbertoAgora(comercial, terca("08:00"))).toBe(true);
  });

  it("está fechado num dia sem atendimento", () => {
    const domingo = new Date("2026-08-16T10:00:00");
    expect(estaAbertoAgora(comercial, domingo)).toBe(false);
  });

  it("está fechado quando não há horário nenhum", () => {
    expect(estaAbertoAgora([], terca("10:00"))).toBe(false);
  });
});

describe("atendeNoDia", () => {
  it("reconhece atendimento no sábado", () => {
    expect(atendeNoDia(comercial, 6)).toBe(true);
  });

  it("nega atendimento no domingo", () => {
    expect(atendeNoDia(comercial, 0)).toBe(false);
  });
});

describe("agruparPorDia", () => {
  it("devolve os sete dias, de domingo a sábado", () => {
    const dias = agruparPorDia(comercial);
    expect(dias).toHaveLength(7);
    expect(dias[0].nome).toBe("Domingo");
    expect(dias[6].nome).toBe("Sábado");
  });

  it("junta as faixas do mesmo dia em ordem", () => {
    const dias = agruparPorDia(comercial);
    expect(dias[2].faixas).toEqual(["08:00 às 12:00", "14:00 às 18:00"]);
  });

  it("deixa vazio o dia sem atendimento", () => {
    expect(agruparPorDia(comercial)[0].faixas).toEqual([]);
  });
});
