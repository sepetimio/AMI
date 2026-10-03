import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";
import { GROQ_BANNERS } from "@/lib/sanity/banners";

/*
  A consulta dos banners, executada de verdade.

  `groq-js` é a implementação de GROQ em JavaScript: avalia a mesma consulta
  que o site manda ao Sanity, mas sobre documentos que o teste escreve. É o que
  mostra QUAIS documentos o filtro deixa passar e O QUE a projeção devolve.
  Texto da consulta conferido por expressão regular não mostraria nada disso:
  um filtro virado para `true` continuaria "tendo" todos os nomes de campo.

  Não prova o Sanity de verdade (cache, permissões, rascunhos): só o GROQ.
*/

const REF_ARTE = "image-abc123def456-3000x1288-jpg";
const REF_CELULAR = "image-fed654cba321-1080x1350-jpg";
const REF_FOTO = "image-0123456789ab-1600x900-jpg";

const DOCUMENTOS = [
  /* Cadastrado antes do campo `tipo` existir: só tem imagem. */
  {
    _type: "banner",
    _id: "antiga",
    nome: "Antiga",
    ordem: 40,
    imagem: { asset: { _ref: REF_ARTE }, alt: "Arte antiga" },
  },
  {
    _type: "banner",
    _id: "arte",
    nome: "Arte",
    tipo: "arte",
    ordem: 10,
    imagem: {
      asset: { _ref: REF_ARTE },
      alt: "Assembleia geral no dia 12 de março",
      hotspot: { x: 0.25, y: 0.6, width: 0.3, height: 0.3 },
    },
    /* Com campos além do asset, para a projeção `{asset}` fazer diferença. */
    imagemCelular: { asset: { _ref: REF_CELULAR }, hotspot: { x: 0.5, y: 0.5 }, crop: { top: 0 } },
    tema: "claro",
    destino: "/associacao",
    expiraEm: "2026-12-31",
  },
  { _type: "banner", _id: "arte-sem-imagem", nome: "Sem imagem", tipo: "arte", ordem: 15 },
  {
    _type: "banner",
    _id: "composto",
    nome: "Composto",
    tipo: "composto",
    ordem: 20,
    foto: {
      asset: { _ref: REF_FOTO },
      alt: "Plenário cheio",
      hotspot: { x: 0.7, y: 0.4, width: 0.2, height: 0.2 },
    },
    rotulo: "Agenda",
    titulo: "Os médicos de Imperatriz",
    texto: "Encontre o profissional certo.",
    botao: "Saiba mais",
    destino: "/busca",
  },
  {
    _type: "banner",
    _id: "composto-sem-titulo",
    nome: "Sem título",
    tipo: "composto",
    ordem: 25,
    rotulo: "Agenda",
  },
  /* Sem tipo e sem imagem: só tem título. Não é arte, e não se declarou composto. */
  { _type: "banner", _id: "so-titulo", nome: "Só título", ordem: 30, titulo: "Solto" },
  /* Outro tipo de documento, com campos parecidos. */
  {
    _type: "noticia",
    _id: "noticia",
    nome: "Notícia",
    tipo: "arte",
    ordem: 5,
    imagem: { asset: { _ref: REF_ARTE } },
  },
];

type Linha = {
  id: string;
  nome: string;
  tipo: string | null;
  imagem: { asset: { _ref: string }; alt: string; hotspot: unknown } | null;
  imagemCelular: { asset: { _ref: string } } | null;
  tema: string | null;
  foto: { asset: { _ref: string }; alt: string; hotspot: unknown } | null;
  rotulo: string | null;
  titulo: string | null;
  texto: string | null;
  botao: string | null;
  destino: string | null;
  ordem: number;
  expiraEm: string | null;
};

async function consultar(): Promise<Linha[]> {
  const valor = await evaluate(parse(GROQ_BANNERS), { dataset: DOCUMENTOS });
  return (await valor.get()) as Linha[];
}

function porId(linhas: Linha[], id: string): Linha {
  const l = linhas.find((x) => x.id === id);
  if (!l) throw new Error(`a consulta não devolveu "${id}"`);
  return l;
}

describe("a consulta dos banners (GROQ_BANNERS)", () => {
  it("devolve arte (inclusive a sem tipo) e composto com título, na ordem do campo ordem", async () => {
    const linhas = await consultar();
    expect(linhas.map((l) => l.id)).toEqual(["arte", "composto", "antiga"]);
  });

  it("deixa de fora arte sem imagem, composto sem título, documento sem tipo só com título e outros tipos", async () => {
    const ids = (await consultar()).map((l) => l.id);
    for (const fora of ["arte-sem-imagem", "composto-sem-titulo", "so-titulo", "noticia"]) {
      expect(ids, fora).not.toContain(fora);
    }
  });

  it("na arte, projeta imagem com alt e ponto de interesse, a versão de celular, o tema, o destino e a validade", async () => {
    const a = porId(await consultar(), "arte");
    expect(a).toMatchObject({
      nome: "Arte",
      tipo: "arte",
      imagem: {
        asset: { _ref: REF_ARTE },
        alt: "Assembleia geral no dia 12 de março",
        hotspot: { x: 0.25, y: 0.6 },
      },
      imagemCelular: { asset: { _ref: REF_CELULAR } },
      tema: "claro",
      destino: "/associacao",
      ordem: 10,
      expiraEm: "2026-12-31",
    });
  });

  it("no composto, projeta foto com alt e ponto de interesse, rótulo, título, texto, botão e destino", async () => {
    const c = porId(await consultar(), "composto");
    expect(c).toMatchObject({
      nome: "Composto",
      tipo: "composto",
      foto: {
        asset: { _ref: REF_FOTO },
        alt: "Plenário cheio",
        hotspot: { x: 0.7, y: 0.4 },
      },
      rotulo: "Agenda",
      titulo: "Os médicos de Imperatriz",
      texto: "Encontre o profissional certo.",
      botao: "Saiba mais",
      destino: "/busca",
      ordem: 20,
    });
  });

  it("a arte antiga sai com tipo vazio, que paraBanner lê como arte", async () => {
    const antiga = porId(await consultar(), "antiga");
    expect(antiga.tipo).toBeNull();
    expect(antiga.imagem?.alt).toBe("Arte antiga");
  });

  it("da versão de celular projeta só o asset", async () => {
    const a = porId(await consultar(), "arte");
    expect(a.imagemCelular).toEqual({ asset: { _ref: REF_CELULAR } });
  });
});
