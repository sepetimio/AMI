import { describe, expect, it } from "vitest";
import { estaNoAr } from "@/lib/sanity/banners";

const AGORA = new Date("2026-08-23T12:00:00Z");

describe("estaNoAr", () => {
  it("sem data de validade, fica para sempre", () => {
    expect(estaNoAr({ expiraEm: null }, AGORA)).toBe(true);
  });

  it("com data no futuro, aparece", () => {
    expect(estaNoAr({ expiraEm: "2026-09-01" }, AGORA)).toBe(true);
  });

  it("com data de ontem, some", () => {
    expect(estaNoAr({ expiraEm: "2026-08-22" }, AGORA)).toBe(false);
  });

  it("no proprio dia da validade, ainda aparece", () => {
    /*
      "Aparece até 23/08" significa que 23/08 é o último dia em que aparece,
      não o primeiro em que some. Quem preenche pensa na data do evento.
    */
    expect(estaNoAr({ expiraEm: "2026-08-23" }, AGORA)).toBe(true);
  });

  it("no ultimo segundo do proprio dia, ainda aparece", () => {
    /*
      O teste anterior usa AGORA ao meio-dia, quase doze horas antes do fim
      do dia de validade (23:59:59Z) - por isso ele passa tanto com `>=`
      quanto com `>`, e sozinho não prova que o "igual" da comparação
      importa. Este caso fecha esse buraco: coloca AGORA exatamente no
      último instante do próprio dia de validade, o único ponto em que
      `fim.getTime()` e `agora.getTime()` são iguais e `>=` e `>` discordam.
    */
    const ultimoInstanteDoDia = new Date("2026-08-23T23:59:59Z");
    expect(estaNoAr({ expiraEm: "2026-08-23" }, ultimoInstanteDoDia)).toBe(
      true,
    );
  });

  it("com data que o Date nao entende, degrada em vez de quebrar", () => {
    /*
      O campo `expiraEm` e um `date` do Studio, cuja UI so escreve
      "AAAA-MM-DD" - por essa porta, uma string invalida nao acontece. Mas
      `estaNoAr` recebe o que veio do banco, e o banco pode ter sido escrito
      por outra coisa (migracao, API, edicao manual do documento).

      `new Date("lixo" + "T23:59:59Z")` produz uma Invalid Date, cujo
      `getTime()` e NaN. Toda comparacao com NaN e falsa, entao a funcao nao
      lanca excecao: ela devolve `false`, e o banner some como se tivesse
      vencido. E a mesma filosofia de `urlDaImagem` em lib/sanity/imagem.ts -
      uma entrada quebrada custa aquele item, nunca a pagina inteira. Fica
      registrado aqui para que ninguem troque a comparacao por algo que lance
      em cima de NaN sem perceber que muda esse comportamento.
    */
    expect(() =>
      estaNoAr({ expiraEm: "nao-e-uma-data" }, AGORA),
    ).not.toThrow();
    expect(estaNoAr({ expiraEm: "nao-e-uma-data" }, AGORA)).toBe(false);
  });
});
