import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";
import { GROQ_NOTICIA, groqListaNoticias } from "@/lib/sanity/consultas";

/*
  As consultas de notícia, executadas de verdade pelo `groq-js` sobre
  documentos escritos aqui (o mesmo método de testes/banners-consulta.test.ts):
  a capa precisa trazer o ponto de interesse (`hotspot`) e o recorte
  (`crop`) que a AMI marca no Studio, senão a capa da notícia aberta sai
  recortada pelo meio. Texto da consulta conferido por expressão regular
  não mostraria o que a projeção devolve.
*/

const CAPA = {
  _type: "image",
  asset: { _type: "reference", _ref: "image-abc123def456-2000x1333-jpg" },
  alt: "Plateia no auditório",
  hotspot: { _type: "sanity.imageHotspot", x: 0.5, y: 0.9, width: 0.2, height: 0.2 },
  crop: { _type: "sanity.imageCrop", top: 0, bottom: 0, left: 0.25, right: 0 },
};

const DOCUMENTOS = [
  { _type: "autor", _id: "autor-rafael", nome: "Rafael Coelho", crm: "10137", crmUf: "MA", slugDoPerfil: "rafael-coelho" },
  {
    _type: "noticia",
    _id: "jornada",
    titulo: "Jornada",
    slug: { _type: "slug", current: "jornada" },
    resumo: "Resumo.",
    publicadoEm: "2026-09-18T12:00:00Z",
    capa: CAPA,
    autor: { _type: "reference", _ref: "autor-rafael" },
    corpo: [],
  },
  {
    _type: "noticia",
    _id: "comunicado",
    titulo: "Comunicado",
    slug: { _type: "slug", current: "comunicado" },
    resumo: "Resumo.",
    publicadoEm: "2026-07-30T12:00:00Z",
    autor: { _type: "reference", _ref: "autor-rafael" },
    corpo: [],
  },
];

type Linha = { titulo: string; capa: unknown };

async function consultar(consulta: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const valor = await evaluate(parse(consulta), { dataset: DOCUMENTOS, params });
  return valor.get();
}

const ESPERADA = { asset: CAPA.asset, alt: CAPA.alt, hotspot: CAPA.hotspot, crop: CAPA.crop };

describe("a capa nas consultas de notícia", () => {
  it("a notícia aberta traz o ponto de interesse e o recorte da capa", async () => {
    const n = (await consultar(GROQ_NOTICIA, { slug: "jornada" })) as Linha;
    expect(n.capa).toEqual(ESPERADA);
  });

  it("a lista também: o destaque e os cartões usam a mesma projeção", async () => {
    const [primeira] = (await consultar(groqListaNoticias(20))) as Linha[];
    expect(primeira.titulo).toBe("Jornada");
    expect(primeira.capa).toEqual(ESPERADA);
  });

  it("sem capa, a capa volta nula e a notícia vem", async () => {
    const n = (await consultar(GROQ_NOTICIA, { slug: "comunicado" })) as Linha;
    expect(n.titulo).toBe("Comunicado");
    expect(n.capa).toBeNull();
  });
});
