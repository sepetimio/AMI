import { describe, expect, it } from "vitest";
import { enderecoDaBusca, filtrosDaQuery, queryDosFiltros } from "@/lib/dados/urlFiltros";

describe("filtrosDaQuery", () => {
  it("lê o termo e a especialidade", () => {
    expect(filtrosDaQuery({ termo: "cardio", especialidade: "cardiologia" })).toEqual({
      termo: "cardio",
      especialidade: "cardiologia",
    });
  });

  it("ignora os parâmetros de antes: bairro, telemedicina, acessibilidade, associados e ordem", () => {
    expect(
      filtrosDaQuery({
        termo: "cardio",
        bairro: "centro",
        telemedicina: "1",
        acessibilidade: ["acesso_cadeirante", "elevador"],
        associados: "1",
        ordem: "nome",
      }),
    ).toEqual({ termo: "cardio" });
  });

  it("devolve objeto vazio quando não há query, e tira espaço sobrando", () => {
    expect(filtrosDaQuery({})).toEqual({});
    expect(filtrosDaQuery({ termo: "  ana  ", especialidade: " " })).toEqual({ termo: "ana" });
  });

  it("parâmetro repetido: vale o primeiro", () => {
    expect(filtrosDaQuery({ especialidade: ["pediatria", "cardiologia"] })).toEqual({
      especialidade: "pediatria",
    });
  });
});

describe("queryDosFiltros e enderecoDaBusca", () => {
  it("ordem fixa: termo, depois especialidade; o vazio não suja a URL", () => {
    expect(queryDosFiltros({ especialidade: "cardiologia", termo: "ana" })).toBe(
      "?termo=ana&especialidade=cardiologia",
    );
    expect(queryDosFiltros({})).toBe("");
  });

  it("o endereço da busca", () => {
    expect(enderecoDaBusca({ termo: "ana" })).toBe("/busca?termo=ana");
    expect(enderecoDaBusca({})).toBe("/busca");
  });

  it("faz o caminho de ida e volta", () => {
    const original = { termo: "josé", especialidade: "pediatria" };
    const sp = Object.fromEntries(new URLSearchParams(queryDosFiltros(original).slice(1)));
    expect(filtrosDaQuery(sp)).toEqual(original);
  });
});
