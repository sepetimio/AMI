import { evaluate, parse } from "groq-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SIZES_DO_LOGOTIPO } from "@/components/home/EmpresasParceiras";
import {
  ETIQUETA_PARCEIRAS,
  GROQ_EMPRESAS_PARCEIRAS,
  LARGURAS_DO_LOGOTIPO,
  paraEmpresasParceiras,
  siteSeguro,
  type EmpresaParceiraCrua,
} from "@/lib/sanity/consultas";

/*
  As empresas parceiras, do banco até a lista que a home desenha.

  A consulta é executada de verdade com `groq-js`, sobre documentos que o
  teste escreve, como em testes/banners-consulta.test.ts: mostra QUAIS
  documentos o filtro deixa passar e O QUE a projeção devolve. Depois,
  `paraEmpresasParceiras` (função pura) monta os endereços, limpa o site e
  põe na ordem. Não prova o Sanity de verdade (cache, permissões,
  rascunhos): só o GROQ e a montagem.

  Nomes de empresa de mentira, todos.
*/

const REF = (n: string) => `image-${n}0123456789abcdef-640x427-png`;

const DOCUMENTOS = [
  {
    _type: "empresaParceira",
    _id: "completa",
    nome: "Empresa Exemplo A",
    logotipo: { asset: { _ref: REF("a") }, hotspot: { x: 0.5, y: 0.5 }, crop: { top: 0 } },
    site: "https://exemplo.test/a",
    ordem: 20,
  },
  {
    _type: "empresaParceira",
    _id: "sem-site-sem-ordem",
    nome: "Empresa Exemplo B",
    logotipo: { asset: { _ref: REF("b") } },
  },
  /* Sem logotipo: não há o que desenhar. */
  { _type: "empresaParceira", _id: "sem-logotipo", nome: "Empresa Exemplo C", ordem: 10 },
  /* Imagem sem arquivo (upload interrompido). */
  { _type: "empresaParceira", _id: "logotipo-vazio", nome: "Empresa Exemplo D", logotipo: { hotspot: {} } },
  /* Sem nome. */
  { _type: "empresaParceira", _id: "sem-nome", logotipo: { asset: { _ref: REF("e") } } },
  /* Outro tipo de documento, com campos parecidos. */
  {
    _type: "banner",
    _id: "banner",
    nome: "Banner",
    logotipo: { asset: { _ref: REF("f") } },
    ordem: 1,
  },
];

async function consultar(): Promise<EmpresaParceiraCrua[]> {
  const valor = await evaluate(parse(GROQ_EMPRESAS_PARCEIRAS), { dataset: DOCUMENTOS });
  return (await valor.get()) as EmpresaParceiraCrua[];
}

describe("a consulta das parceiras (GROQ_EMPRESAS_PARCEIRAS)", () => {
  it("devolve só as empresas parceiras com nome e com o arquivo do logotipo", async () => {
    const ids = (await consultar()).map((p) => p.id).sort();
    expect(ids).toEqual(["completa", "sem-site-sem-ordem"]);
  });

  it("projeta id, nome, só o arquivo do logotipo, site e ordem", async () => {
    const completa = (await consultar()).find((p) => p.id === "completa");
    expect(completa).toEqual({
      id: "completa",
      nome: "Empresa Exemplo A",
      logotipo: { asset: { _ref: REF("a") } },
      site: "https://exemplo.test/a",
      ordem: 20,
    });
  });

  it("o que falta sai nulo, e não some do objeto", async () => {
    const b = (await consultar()).find((p) => p.id === "sem-site-sem-ordem");
    expect(b).toMatchObject({ site: null, ordem: null });
  });

  it("a etiqueta de cache é a que o webhook invalida", () => {
    expect(ETIQUETA_PARCEIRAS).toBe("parceiras");
  });
});

describe("paraEmpresasParceiras", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const crua = (o: Partial<EmpresaParceiraCrua> & { id: string }): EmpresaParceiraCrua => ({
    nome: `Empresa Exemplo ${o.id.toUpperCase()}`,
    logotipo: { asset: { _ref: REF(o.id) } },
    site: null,
    ordem: null,
    ...o,
  });

  it("a maior largura pedida cobre a maior caixa numa tela de densidade 2", () => {
    /* A largura de cada caixa sai do `sizes` (que se confere contra o CSS em
       testes/noticias-da-home.test.ts e foi medido no navegador): aqui ele é
       resolvido de 320 a 1920px de tela. */
    const faixas = SIZES_DO_LOGOTIPO.split(", ").map((f) => {
      const m = /^(?:\(max-width: (\d+)px\) )?(?:calc\(\(100vw - (\d+)px\) \/ (\d+) - (\d+)px\)|(\d+)px)$/.exec(f);
      if (!m) throw new Error(`faixa do sizes que o teste não lê: ${f}`);
      return { ate: m[1] ? Number(m[1]) : Infinity, menos: Number(m[2]), por: Number(m[3]), tira: Number(m[4]), fixo: Number(m[5]) };
    });
    let maior = 0;
    for (let tela = 320; tela <= 1920; tela++) {
      const f = faixas.find((x) => tela <= x.ate)!;
      maior = Math.max(maior, f.fixo || (tela - f.menos) / f.por - f.tira);
    }
    expect(Math.round(maior)).toBe(266);
    expect(LARGURAS_DO_LOGOTIPO.at(-1)).toBeGreaterThanOrEqual(2 * maior);
  });

  it("monta o logotipo pelo CDN, em todas as larguras, com a maior no src", () => {
    const [p] = paraEmpresasParceiras([crua({ id: "a" })]);
    const larguras = [...p.logotipoSrcset.matchAll(/ (\d+)w/g)].map((m) => Number(m[1]));
    expect(larguras).toEqual([...LARGURAS_DO_LOGOTIPO]);
    expect(p.logotipo).toMatch(/^https:\/\/cdn\.sanity\.io\/images\/abcd1234\//);
    expect(p.logotipo).toContain(`w=${LARGURAS_DO_LOGOTIPO.at(-1)}`);
  });

  it("com o logotipo cujo endereço o CDN não monta, a empresa sai da lista", () => {
    const lista = paraEmpresasParceiras([
      crua({ id: "a" }),
      crua({ id: "b", logotipo: { asset: { _ref: "quebrado" } } }),
    ]);
    expect(lista.map((p) => p.id)).toEqual(["a"]);
  });

  it("nome em branco tira a empresa; o nome sai aparado", () => {
    const lista = paraEmpresasParceiras([
      crua({ id: "a", nome: "   " }),
      crua({ id: "b", nome: "  Empresa Exemplo B \n" }),
    ]);
    expect(lista.map((p) => [p.id, p.nome])).toEqual([["b", "Empresa Exemplo B"]]);
  });

  it("primeiro as que têm ordem, da menor para a maior; depois as sem ordem, pelo nome", () => {
    const lista = paraEmpresasParceiras([
      crua({ id: "z", nome: "Zeta Exemplo" }),
      crua({ id: "o", nome: "Ótica Exemplo" }),
      crua({ id: "trinta", ordem: 30 }),
      crua({ id: "dez", ordem: 10 }),
      crua({ id: "a", nome: "Alfa Exemplo" }),
    ]);
    expect(lista.map((p) => p.id)).toEqual(["dez", "trinta", "a", "o", "z"]);
  });

  it("no empate de ordem, vale o nome, com acento no lugar do português", () => {
    const lista = paraEmpresasParceiras([
      crua({ id: "u", nome: "Única Exemplo", ordem: 10 }),
      crua({ id: "b", nome: "Beta Exemplo", ordem: 10 }),
      crua({ id: "v", nome: "Vida Exemplo", ordem: 10 }),
    ]);
    expect(lista.map((p) => p.id)).toEqual(["b", "u", "v"]);
  });

  it("o site só vira link se for http ou https", () => {
    const lista = paraEmpresasParceiras([
      crua({ id: "a", site: "https://exemplo.test/a" }),
      crua({ id: "b", site: "javascript:alert(1)" }),
      crua({ id: "c", site: null }),
    ]);
    expect(lista.map((p) => p.site)).toEqual(["https://exemplo.test/a", null, null]);
  });
});

describe("siteSeguro", () => {
  it("aceita http e https, e devolve o endereço normalizado", () => {
    expect(siteSeguro("https://exemplo.test")).toBe("https://exemplo.test/");
    expect(siteSeguro("http://exemplo.test/x?y=1")).toBe("http://exemplo.test/x?y=1");
  });

  it("recusa outro esquema, endereço relativo, lixo e vazio", () => {
    for (const ruim of ["javascript:alert(1)", "data:text/html,oi", "mailto:a@exemplo.test", "/relativo", "exemplo.test", "", null, undefined]) {
      expect(siteSeguro(ruim), String(ruim)).toBeNull();
    }
  });
});
