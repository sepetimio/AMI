import { describe, expect, it } from "vitest";
import { urlDaImagem } from "@/lib/sanity/imagem";

const IMAGEM = {
  asset: { _ref: "image-abc123def456-1600x900-jpg" },
  alt: "Fachada da sede",
};

describe("urlDaImagem", () => {
  it("aponta para o CDN do Sanity", () => {
    expect(urlDaImagem(IMAGEM, 800)).toContain("cdn.sanity.io");
  });

  it("pede a largura solicitada", () => {
    expect(urlDaImagem(IMAGEM, 800)).toContain("w=800");
  });

  it("deixa o formato a cargo do navegador", () => {
    /* `auto=format` faz o CDN servir WebP ou AVIF a quem aceita, e JPEG a
       quem não aceita. É o ganho de peso mais barato do projeto: sem uma
       linha de código a mais, a mesma foto sai pela metade do tamanho. */
    expect(urlDaImagem(IMAGEM, 800)).toContain("auto=format");
  });

  it("recorta pelo ponto de interesse marcado no Studio", () => {
    /* Sem `fit=crop`, uma foto larga entra deformada num espaço quadrado. */
    expect(urlDaImagem(IMAGEM, 800)).toContain("fit=crop");
  });
});
