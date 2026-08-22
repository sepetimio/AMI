import { describe, expect, it } from "vitest";
import { ehErro, ehLinhaVazia, lerLinha } from "@/lib/importador/linha";
import { NOMES_DE_COLUNA, type Cabecalho, type Celula } from "@/lib/importador/tipos";

/* Cabeçalho completo, na ordem de NOMES_DE_COLUNA, para os testes. */
const CAB: Cabecalho = {
  indices: Object.fromEntries(NOMES_DE_COLUNA.map((c, i) => [c, i] as const)),
  ignoradas: [],
};

/** Monta uma linha a partir de pares coluna/valor. */
function linha(valores: Partial<Record<(typeof NOMES_DE_COLUNA)[number], Celula>>): Celula[] {
  return NOMES_DE_COLUNA.map((c) => valores[c] ?? null);
}

describe("ehLinhaVazia", () => {
  it("reconhece a linha em branco do meio da planilha", () => {
    expect(ehLinhaVazia([null, null, null])).toBe(true);
    expect(ehLinhaVazia([null, "   ", null])).toBe(true);
    expect(ehLinhaVazia([])).toBe(true);
  });

  it("não confunde com linha que só tem o nome", () => {
    expect(ehLinhaVazia([null, "Ana", null])).toBe(false);
  });

  it("não confunde com o número zero", () => {
    expect(ehLinhaVazia([0])).toBe(false);
  });
});

describe("lerLinha — o que rejeita a linha inteira", () => {
  it("nome vazio", () => {
    const r = lerLinha(linha({ crm: 4821 }), CAB, 5);
    expect(ehErro(r) && r.motivo).toContain("nome");
    expect(ehErro(r) && r.linha).toBe(5);
  });

  it("crm vazio", () => {
    const r = lerLinha(linha({ nome: "Ana Souza" }), CAB, 88);
    expect(ehErro(r) && r.motivo).toContain("CRM");
  });

  it("crm sem dígito nenhum", () => {
    const r = lerLinha(linha({ nome: "Ana", crm: "a definir" }), CAB, 9);
    expect(ehErro(r)).toBe(true);
  });

  it("uf que não existe", () => {
    const r = lerLinha(linha({ nome: "Ana", crm: 1, uf_do_crm: "MAA" }), CAB, 355);
    expect(ehErro(r) && r.motivo).toContain("MAA");
  });
});

describe("lerLinha — o que entra", () => {
  it("crm chegando como número vira texto", () => {
    const r = lerLinha(linha({ nome: "Ana Souza", crm: 4821 }), CAB, 2);
    expect(ehErro(r)).toBe(false);
    if (ehErro(r)) return;
    expect(r.crm).toBe("4821");
  });

  it("crm com pontuação perde a pontuação", () => {
    const r = lerLinha(linha({ nome: "Ana", crm: "CRM 4.821" }), CAB, 2);
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.crm).toBe("4821");
  });

  it("crm em texto preserva o zero à esquerda", () => {
    const r = lerLinha(linha({ nome: "Ana", crm: "00512" }), CAB, 2);
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.crm).toBe("00512");
  });

  it("uf vazia vira MA, e uf minúscula vira maiúscula", () => {
    const a = lerLinha(linha({ nome: "Ana", crm: 1 }), CAB, 2);
    const b = lerLinha(linha({ nome: "Bia", crm: 2, uf_do_crm: "to" }), CAB, 3);
    if (ehErro(a) || ehErro(b)) throw new Error("não deveria rejeitar");
    expect(a.crmUf).toBe("MA");
    expect(b.crmUf).toBe("TO");
  });

  it("colapsa espaço duplicado do nome, que a biblioteca não apara", () => {
    const r = lerLinha(linha({ nome: "Ana   Paula  Souza", crm: 1 }), CAB, 2);
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.nome).toBe("Ana Paula Souza");
  });

  it("telemedicina entende sim, não, s, n, x e vazio", () => {
    const casos: [Celula, boolean | null][] = [
      ["sim", true], ["SIM", true], ["s", true], ["x", true], [true, true],
      ["não", false], ["nao", false], ["n", false], [false, false],
      [null, null], ["", null],
    ];
    for (const [valor, esperado] of casos) {
      const r = lerLinha(linha({ nome: "Ana", crm: 1, telemedicina: valor }), CAB, 2);
      if (ehErro(r)) throw new Error("não deveria rejeitar");
      expect(r.telemedicina, `valor ${JSON.stringify(valor)}`).toBe(esperado);
    }
  });
});

describe("lerLinha — o que descarta só o campo", () => {
  it("telefone curto some e o médico fica", () => {
    const r = lerLinha(
      linha({ nome: "Ana", crm: 1, logradouro: "Rua A", bairro: "Centro", telefone: "3524" }),
      CAB,
      102,
    );
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.endereco?.telefone).toBeNull();
    expect(r.avisos).toContainEqual(
      expect.objectContaining({ tipo: "campo-descartado", campo: "telefone", linha: 102 }),
    );
  });

  it("telefone de 10 e de 11 dígitos entram, só com dígitos", () => {
    const a = lerLinha(
      linha({ nome: "Ana", crm: 1, logradouro: "R", bairro: "Centro", telefone: "(99) 3524-3716" }),
      CAB, 2,
    );
    const b = lerLinha(
      linha({ nome: "Bia", crm: 2, logradouro: "R", bairro: "Centro", whatsapp: "99988020205" }),
      CAB, 3,
    );
    if (ehErro(a) || ehErro(b)) throw new Error("não deveria rejeitar");
    expect(a.endereco?.telefone).toBe("9935243716");
    expect(b.endereco?.whatsapp).toBe("99988020205");
  });

  it("cep de 8 dígitos entra, com ou sem hífen, e o curto some", () => {
    const bom = lerLinha(
      linha({ nome: "Ana", crm: 1, logradouro: "R", bairro: "Centro", cep: "65900-330" }),
      CAB, 2,
    );
    const numero = lerLinha(
      linha({ nome: "Bia", crm: 2, logradouro: "R", bairro: "Centro", cep: 65900330 }),
      CAB, 3,
    );
    const ruim = lerLinha(
      linha({ nome: "Cid", crm: 3, logradouro: "R", bairro: "Centro", cep: "6590" }),
      CAB, 267,
    );
    if (ehErro(bom) || ehErro(numero) || ehErro(ruim)) throw new Error("não deveria rejeitar");
    expect(bom.endereco?.cep).toBe("65900330");
    expect(numero.endereco?.cep).toBe("65900330");
    expect(ruim.endereco?.cep).toBeNull();
    expect(ruim.avisos).toContainEqual(
      expect.objectContaining({ tipo: "campo-descartado", campo: "cep", linha: 267 }),
    );
  });
});

describe("lerLinha — o endereço", () => {
  it("sem logradouro não há endereço, e isso não é problema", () => {
    const r = lerLinha(linha({ nome: "Ana", crm: 1 }), CAB, 2);
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.endereco).toBeNull();
    expect(r.avisos).toEqual([]);
  });

  it("logradouro sem bairro não vira endereço, e avisa", () => {
    const r = lerLinha(linha({ nome: "Ana", crm: 1, logradouro: "Rua A" }), CAB, 40);
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.endereco).toBeNull();
    expect(r.avisos).toContainEqual({ tipo: "endereco-sem-bairro", linha: 40 });
  });

  it("número chegando como número vira texto", () => {
    const r = lerLinha(
      linha({ nome: "Ana", crm: 1, logradouro: "Rua Coriolano Milhomem", numero: 39, bairro: "Centro" }),
      CAB, 2,
    );
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.endereco?.numero).toBe("39");
    expect(r.endereco?.logradouro).toBe("Rua Coriolano Milhomem");
    expect(r.endereco?.bairro).toBe("Centro");
  });
});

describe("lerLinha — especialidade e RQE", () => {
  it("guarda o texto cru da especialidade, sem resolver", () => {
    const r = lerLinha(
      linha({ nome: "Ana", crm: 1, especialidade: "  Cardiologia ", rqe: 1234 }),
      CAB, 2,
    );
    if (ehErro(r)) throw new Error("não deveria rejeitar");
    expect(r.especialidade).toBe("Cardiologia");
    expect(r.rqe).toBe("1234");
  });
});
