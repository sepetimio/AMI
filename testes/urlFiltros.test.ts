import { describe, expect, it } from "vitest";
import { filtrosDaQuery, queryDosFiltros } from "@/lib/dados/urlFiltros";

describe("filtrosDaQuery", () => {
  it("lê os filtros não indexáveis da querystring", () => {
    expect(
      filtrosDaQuery({
        termo: "cardio",
        bairro: "centro",
        telemedicina: "1",
        sabado: "1",
        acessibilidade: "acesso_cadeirante",
        associados: "1",
        ordem: "nome",
      }),
    ).toEqual({
      termo: "cardio",
      bairro: "centro",
      telemedicina: true,
      atendeSabado: true,
      acessibilidade: ["acesso_cadeirante"],
      somenteAssociados: true,
      ordem: "nome",
    });
  });

  it("devolve objeto vazio quando não há query", () => {
    expect(filtrosDaQuery({})).toEqual({});
  });

  it("aceita acessibilidade repetida", () => {
    const f = filtrosDaQuery({
      acessibilidade: ["acesso_cadeirante", "elevador"],
    });
    expect(f.acessibilidade).toEqual(["acesso_cadeirante", "elevador"]);
  });

  it("ignora ordem desconhecida em vez de confiar na entrada", () => {
    expect(filtrosDaQuery({ ordem: "melhores" }).ordem).toBeUndefined();
  });
});

describe("queryDosFiltros", () => {
  it("omite o que está desligado, para não sujar a URL", () => {
    expect(queryDosFiltros({ telemedicina: false })).toBe("");
  });

  it("monta a query na ordem estável", () => {
    expect(
      queryDosFiltros({ termo: "cardio", telemedicina: true, ordem: "nome" }),
    ).toBe("?termo=cardio&telemedicina=1&ordem=nome");
  });

  it("faz o caminho de ida e volta", () => {
    const original = {
      termo: "jose",
      bairro: "bacuri",
      atendeSabado: true,
      acessibilidade: ["elevador" as const],
    };
    const query = queryDosFiltros(original);
    const sp = Object.fromEntries(new URLSearchParams(query.slice(1)));
    expect(filtrosDaQuery({ ...sp, acessibilidade: ["elevador"] })).toEqual(
      original,
    );
  });
});
