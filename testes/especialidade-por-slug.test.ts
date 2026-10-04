import { describe, expect, it, vi } from "vitest";

/*
  `especialidadePorSlug` com o cliente do Supabase trocado por um dublê que
  anota o que foi pedido. O "Sobre a especialidade" vem do Sanity, e as
  colunas `o_que_faz` e `quando_procurar` deixaram de ser lidas pelo site.
  Elas continuam no banco: o dublê as devolve, e a função não as repassa.
*/

const pedido = vi.hoisted(() => ({ tabela: "", colunas: "", slug: "" }));

vi.mock("@/lib/dados/cliente", () => {
  const consulta: Record<string, unknown> = {};
  consulta.select = (colunas: string) => {
    pedido.colunas = colunas;
    return consulta;
  };
  consulta.eq = (_coluna: string, valor: string) => {
    pedido.slug = valor;
    return consulta;
  };
  consulta.maybeSingle = () =>
    Promise.resolve({
      data: {
        nome: "Cardiologia",
        slug: "cardiologia",
        o_que_faz: "[PROVISÓRIO] texto antigo",
        quando_procurar: "[PROVISÓRIO] texto antigo",
      },
      error: null,
    });
  return {
    clienteServidor: () => ({
      from: (tabela: string) => {
        pedido.tabela = tabela;
        return consulta;
      },
    }),
  };
});

const { especialidadePorSlug } = await import("@/lib/dados/especialidades");

describe("especialidadePorSlug", () => {
  it("lê do banco só o nome e o slug da especialidade pedida", async () => {
    expect(await especialidadePorSlug("cardiologia")).toEqual({ nome: "Cardiologia", slug: "cardiologia" });
    expect(pedido).toEqual({ tabela: "especialidade", colunas: "nome, slug", slug: "cardiologia" });
  });
});
