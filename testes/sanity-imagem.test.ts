import { afterEach, describe, expect, it, vi } from "vitest";
import { dimensoesDoRef, urlDaImagem } from "@/lib/sanity/imagem";

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

  it("envia fit=crop, pronto para um chamador que também passe altura", () => {
    /* Sozinho, sem `.height()`, `fit=crop` não recorta nada (ver o
       comentário em lib/sanity/imagem.ts). O parâmetro fica na URL para o
       dia em que um chamador (uma capa de matéria, por exemplo) também pedir
       altura, e ganhar o recorte pelo ponto de interesse de graça. */
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
