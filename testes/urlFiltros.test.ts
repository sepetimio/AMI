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

  it("descarta recurso de acessibilidade inventado", () => {
    /* A entrada vem da URL e pode ser qualquer coisa. */
    expect(
      filtrosDaQuery({ acessibilidade: ["elevador", "teleporte"] })
        .acessibilidade,
    ).toEqual(["elevador"]);
    expect(
      filtrosDaQuery({ acessibilidade: "inventado" }).acessibilidade,
    ).toBeUndefined();
  });

  it("dois conjuntos iguais em ordem diferente geram a mesma URL", () => {
    /* Marcar e desmarcar caixas reordenava os parâmetros. O mesmo filtro
       com dois endereços é conteúdo duplicado. */
    const a = queryDosFiltros({
      acessibilidade: ["elevador", "acesso_cadeirante"],
    });
    const b = queryDosFiltros({
      acessibilidade: ["acesso_cadeirante", "elevador"],
    });
    expect(a).toBe(b);
    expect(a).toBe(
      "?acessibilidade=acesso_cadeirante&acessibilidade=elevador",
    );
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
