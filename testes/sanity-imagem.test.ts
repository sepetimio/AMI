import { afterEach, describe, expect, it, vi } from "vitest";
import { dimensoesDoRef, urlDaImagem, urlRecortada } from "@/lib/sanity/imagem";

const IMAGEM = {
  asset: { _ref: "image-abc123def456-1600x900-jpg" },
  alt: "Fachada da sede",
};

/* Projeto fixo, para que a suíte não dependa de `.env.local`. É a razão de
   `urlDaImagem` aceitar a configuração por parâmetro. */
const CONFIG = { projectId: "abcd1234", dataset: "production" };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("urlDaImagem", () => {
  it("aponta para o CDN do Sanity", () => {
    expect(urlDaImagem(IMAGEM, 800, CONFIG)).toContain("cdn.sanity.io");
  });

  it("pede a largura solicitada", () => {
    expect(urlDaImagem(IMAGEM, 800, CONFIG)).toContain("w=800");
  });

  it("deixa o formato a cargo do navegador", () => {
    /* `auto=format` faz o CDN servir WebP ou AVIF a quem aceita, e JPEG a
       quem não aceita. É o ganho de peso mais barato do projeto: sem uma
       linha de código a mais, a mesma foto sai pela metade do tamanho. */
    expect(urlDaImagem(IMAGEM, 800, CONFIG)).toContain("auto=format");
  });

  it("envia fit=crop, que sem altura não recorta nada", () => {
    /* Sozinho, sem `.height()`, `fit=crop` não recorta nada (ver o
       comentário em lib/sanity/imagem.ts): a foto sai inteira. Quem quer o
       recorte pelo ponto de interesse usa `urlRecortada`, testada logo
       abaixo. */
    expect(urlDaImagem(IMAGEM, 800, CONFIG)).toContain("fit=crop");
  });

  it("degrada uma referência corrompida em vez de derrubar a página", () => {
    /* Upload em andamento ou referência corrompida no corpo de uma matéria
       não pode derrubar a renderização inteira: só a foto se perde. */
    expect(urlDaImagem({ asset: { _ref: "" }, alt: "" }, 800, CONFIG)).toBe("");
  });

  it("degrada um _ref que não segue o formato esperado", () => {
    expect(
      urlDaImagem(
        { asset: { _ref: "nao-e-um-ref-valido" }, alt: "" },
        800,
        CONFIG,
      ),
    ).toBe("");
  });
});

describe("urlRecortada", () => {
  const CAPA = { asset: { _ref: "image-abc123def456-2000x1333-jpg" }, alt: "Plateia" };
  const BASE = "https://cdn.sanity.io/images/abcd1234/production/abc123def456-2000x1333.jpg";

  it("pede largura e altura; sem ponto de interesse, o CDN recorta pelo meio", () => {
    const esperado = `${BASE}?rect=0,105,2000,1125&w=1600&h=900&fit=crop&auto=format`;
    expect(urlRecortada(CAPA, 1600, 900, CONFIG)).toBe(esperado);
    /* O GROQ devolve null quando a AMI não marcou nada. */
    expect(urlRecortada({ ...CAPA, hotspot: null, crop: null }, 1600, 900, CONFIG)).toBe(esperado);
  });

  it("o ponto de interesse move o recorte", () => {
    expect(urlRecortada({ ...CAPA, hotspot: { x: 0.5, y: 0.9, width: 0.2, height: 0.2 } }, 1600, 900, CONFIG)).toBe(
      `${BASE}?rect=0,208,2000,1125&w=1600&h=900&fit=crop&auto=format`,
    );
  });

  it("o recorte marcado no Studio também", () => {
    expect(
      urlRecortada(
        {
          ...CAPA,
          hotspot: { x: 0.5, y: 0.1, width: 0.2, height: 0.2 },
          crop: { top: 0, bottom: 0, left: 0.25, right: 0 },
        },
        1600,
        900,
        CONFIG,
      ),
    ).toBe(`${BASE}?rect=500,0,1500,844&w=1600&h=900&fit=crop&auto=format`);
  });

  it("o recorte sem ponto de interesse: o centro é o da imagem inteira, dentro do recorte", () => {
    /* Medido com o construtor do Sanity em 04/10/2026. Com só a esquerda
       cortada, a faixa de 1500px é toda a largura que sobra, e na altura o
       16:9 fica no meio: 245 = (1333 − 844) / 2. */
    const soEsquerda = { top: 0, bottom: 0, left: 0.25, right: 0 };
    const esperado = `${BASE}?rect=500,245,1500,844&w=1600&h=900&fit=crop&auto=format`;
    expect(urlRecortada({ ...CAPA, crop: soEsquerda }, 1600, 900, CONFIG)).toBe(esperado);
    expect(urlRecortada({ ...CAPA, crop: soEsquerda, hotspot: null }, 1600, 900, CONFIG)).toBe(esperado);
    /* Cortado em cima, embaixo e à direita: o 16:9 de 1000 × 563 não fica
       no meio do recorte (que daria y 318), e sim no meio da imagem
       inteira: 386 + 563 / 2 ≈ 667 ≈ 1333 / 2. Ali ele ainda cabe dentro
       do recorte (de 133 a 1066). */
    expect(urlRecortada({ ...CAPA, crop: { top: 0.1, bottom: 0.2, left: 0, right: 0.5 } }, 1600, 900, CONFIG)).toBe(
      `${BASE}?rect=0,386,1000,563&w=1600&h=900&fit=crop&auto=format`,
    );
  });

  it("degrada a referência quebrada em vez de derrubar a página", () => {
    expect(urlRecortada({ asset: { _ref: "nao-e-um-ref-valido" }, alt: "" }, 1600, 900, CONFIG)).toBe("");
  });
});

describe("configuração padrão de urlDaImagem", () => {
  it("lê o projeto do ambiente quando ninguém passa configuração", () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "ul4xtwn2");
    expect(urlDaImagem(IMAGEM, 800)).toContain("ul4xtwn2");
  });

  it("falha alto sem projeto configurado, em vez de montar URL quebrada", () => {
    /* Alinhado com lib/sanity/cliente.ts: configuração ausente é erro de
       instalação e tem de dizer o nome da variável. O `?? ""` que havia aqui
       antes montava uma URL sem projeto, que só falha no navegador do
       visitante, longe de quem poderia consertar. */
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "");
    expect(() => urlDaImagem(IMAGEM, 800)).toThrowError(
      /NEXT_PUBLIC_SANITY_PROJECT_ID/,
    );
  });
});

describe("dimensoesDoRef", () => {
  it("extrai largura e altura originais do _ref", () => {
    expect(dimensoesDoRef("image-abc123def456-1600x900-jpg")).toEqual({
      largura: 1600,
      altura: 900,
    });
  });

  it("devolve undefined quando o _ref não tem o trecho de dimensões", () => {
    expect(dimensoesDoRef("nao-e-um-ref-valido")).toBeUndefined();
  });

  it("devolve undefined para uma referência vazia", () => {
    expect(dimensoesDoRef("")).toBeUndefined();
  });
});
