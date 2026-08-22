import { describe, expect, it } from "vitest";
import { POR_PAGINA, faixaDaPagina, paraLista, termoSeguro } from "@/lib/painel/consultas";

describe("faixaDaPagina", () => {
  it("a primeira página começa em zero", () => {
    expect(faixaDaPagina(1)).toEqual({ de: 0, ate: POR_PAGINA - 1 });
  });

  it("a segunda começa onde a primeira acabou, sem repetir nem pular", () => {
    const um = faixaDaPagina(1);
    const dois = faixaDaPagina(2);
    expect(dois.de).toBe(um.ate + 1);
  });

  it("página zero ou negativa é tratada como a primeira", () => {
    expect(faixaDaPagina(0)).toEqual(faixaDaPagina(1));
    expect(faixaDaPagina(-3)).toEqual(faixaDaPagina(1));
  });
});

describe("paraLista", () => {
  const linha = {
    id: 7, slug: "ana-souza", nome: "Ana Souza", crm: "4821", crm_uf: "MA",
    publicado: false,
    profissional_especialidade: [
      { principal: false, especialidade: { nome: "Clínica Médica" } },
      { principal: true, especialidade: { nome: "Cardiologia" } },
    ],
    atendimento: [
      { local: { bairro: { nome: "Centro" } } },
      { local: { bairro: { nome: "Juçara" } } },
      { local: { bairro: { nome: "Centro" } } },
    ],
  };

  it("traduz para o domínio, em português", () => {
    const m = paraLista(linha);
    expect(m.id).toBe(7);
    expect(m.crmUf).toBe("MA");
    expect(m.publicado).toBe(false);
  });

  it("a especialidade mostrada é a marcada como principal", () => {
    expect(paraLista(linha).especialidade).toBe("Cardiologia");
  });

  it("sem principal marcada, cai na primeira", () => {
    const semPrincipal = {
      ...linha,
      profissional_especialidade: [
        { principal: false, especialidade: { nome: "Clínica Médica" } },
      ],
    };
    expect(paraLista(semPrincipal).especialidade).toBe("Clínica Médica");
  });

  it("sem especialidade nenhuma devolve nulo, não texto vazio", () => {
    expect(paraLista({ ...linha, profissional_especialidade: [] }).especialidade).toBeNull();
  });

  it("bairro repetido aparece uma vez só", () => {
    expect(paraLista(linha).bairros).toEqual(["Centro", "Juçara"]);
  });

  it("aguenta laço ausente sem estourar", () => {
    const cru = { id: 1, slug: "x", nome: "X", crm: "1", crm_uf: "MA", publicado: true };
    const m = paraLista(cru);
    expect(m.especialidade).toBeNull();
    expect(m.bairros).toEqual([]);
  });
});

describe("termoSeguro", () => {
  it("neutraliza o que quebraria a gramática do filtro", () => {
    expect(termoSeguro("Silva )")).toBe("Silva  ");
    expect(termoSeguro("(Ana")).toBe(" Ana");
    expect(termoSeguro('Jo"ao')).toBe("Jo ao");
  });

  it("neutraliza os curingas, que mudariam o alcance em silêncio", () => {
    expect(termoSeguro("Ana%")).toBe("Ana ");
    expect(termoSeguro("Ana*")).toBe("Ana ");
  });

  it("não mexe em nome comum, inclusive com acento e hífen", () => {
    expect(termoSeguro("João Peçanha-Silva")).toBe("João Peçanha-Silva");
  });
});
