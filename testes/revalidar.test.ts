import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/revalidar/route";
import { etiquetasDoDocumento } from "@/lib/sanity/etiquetasDoDocumento";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("etiquetasDoDocumento", () => {
  it("uma notícia invalida a própria matéria e o índice", () => {
    expect(
      etiquetasDoDocumento({
        _type: "noticia",
        slug: { current: "congresso-2026" },
      }).sort(),
    ).toEqual(["noticia:congresso-2026", "noticias"]);
  });

  it("uma página institucional invalida só ela mesma", () => {
    /* Página institucional não entra em listagem nenhuma, então invalidar o
       índice de notícias por causa dela seria descartar cache útil de graça. */
    expect(
      etiquetasDoDocumento({
        _type: "paginaInstitucional",
        slug: { current: "estatuto" },
      }),
    ).toEqual(["pagina:estatuto"]);
  });

  it("um autor invalida o índice inteiro de notícias", () => {
    /* O autor aparece resolvido dentro de cada notícia. Corrigir o CRM dele
       precisa alcançar todas as matérias que assinou, e o webhook não sabe
       quais são. Invalidar o coletivo é o custo de não manter um índice
       reverso para uma correção que acontece uma vez por ano. */
    expect(etiquetasDoDocumento({ _type: "autor" })).toEqual(["noticias"]);
  });

  it("documento sem slug não produz etiqueta específica", () => {
    expect(etiquetasDoDocumento({ _type: "noticia" })).toEqual(["noticias"]);
  });

  it("tipo desconhecido não invalida nada", () => {
    /* Um tipo novo criado no Studio não deve derrubar o cache do site inteiro
       por engano. Devolver lista vazia é o comportamento seguro. */
    expect(etiquetasDoDocumento({ _type: "algoNovo" })).toEqual([]);
    expect(etiquetasDoDocumento({})).toEqual([]);
  });
});

/*
  Único teste da suíte que importa de `app/`, e a exceção é consciente: esta
  é a única rota pública do site, o caminho de 400 existe por causa de um
  ataque real (assinatura inventada mais corpo que não é JSON arrancavam um
  500 antes da tarefa 4), e ele não precisa de mock nenhum para ser
  exercitado. Um teste equivalente em `lib/` provaria menos: mediria uma
  função extraída, e não a rota que a internet alcança. Ver o comentário em
  vitest.config.ts.
*/
describe("POST /api/revalidar", () => {
  const pedido = (corpo: string) =>
    new NextRequest("http://localhost:3000/api/revalidar", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        /* Nome público: vem da biblioteca aberta @sanity/webhook. Qualquer
           pessoa monta este cabeçalho. */
        "sanity-webhook-signature": "t=1,v1=assinatura-inventada",
      },
      body: corpo,
    });

  it("responde 400 a corpo malformado, não 500", async () => {
    /* `parseBody` do next-sanity faz JSON.parse antes de consultar o
       resultado da assinatura, então o corpo malformado lança antes de
       qualquer decisão nossa. Sem o cerco da tarefa 4, isto era um 500
       arrancável de uma rota pública sem credencial nenhuma. */
    vi.stubEnv("SANITY_WEBHOOK_SECRET", "segredo-de-teste-bem-longo");
    const r = await POST(pedido("isto não é json"));
    expect(r.status).toBe(400);
  });

  it("responde 401 quando a assinatura não confere, com corpo válido", async () => {
    /* O caminho vizinho, para provar que o 400 acima é sobre o corpo e não
       um atalho que engole tudo. */
    vi.stubEnv("SANITY_WEBHOOK_SECRET", "segredo-de-teste-bem-longo");
    const r = await POST(pedido(JSON.stringify({ _type: "noticia" })));
    expect(r.status).toBe(401);
  });

  it("falha fechado sem segredo configurado", async () => {
    /* Endpoint de invalidação aberto é negação de serviço barata: cada
       chamada força a próxima visita a buscar tudo de novo no Sanity. */
    vi.stubEnv("SANITY_WEBHOOK_SECRET", "");
    const r = await POST(pedido(JSON.stringify({ _type: "noticia" })));
    expect(r.status).toBe(500);
  });
});
