import { describe, expect, it } from "vitest";
import {
  MINIMO_PARA_INDEXAR,
  facetaEhIndexavel,
  paragrafoDeAbertura,
  type ResumoFaceta,
} from "@/lib/dados/facetas";

const base: ResumoFaceta = {
  especialidade: "Cardiologia",
  total: 7,
  bairrosComOferta: [
    { nome: "Centro", total: 4 },
    { nome: "Bacuri", total: 2 },
    { nome: "Juçara", total: 1 },
  ],
  atendemSabado: 2,
  comTelemedicina: 3,
  comAcessoCadeirante: 5,
};

describe("facetaEhIndexavel", () => {
  it("indexa a partir do mínimo", () => {
    expect(facetaEhIndexavel(MINIMO_PARA_INDEXAR)).toBe(true);
    expect(facetaEhIndexavel(10)).toBe(true);
  });

  it("não indexa abaixo do mínimo", () => {
    expect(facetaEhIndexavel(2)).toBe(false);
    expect(facetaEhIndexavel(0)).toBe(false);
  });

  it("o mínimo é 3", () => {
    expect(MINIMO_PARA_INDEXAR).toBe(3);
  });
});

describe("paragrafoDeAbertura", () => {
  it("traz os números reais, não redondos", () => {
    const p = paragrafoDeAbertura(base);
    expect(p).toContain("7 cardiologistas");
    expect(p).toContain("Centro");
    expect(p).toContain("2 atendem aos sábados");
  });

  it("muda de conteúdo quando os dados mudam — não é molde com palavra trocada", () => {
    const outro = paragrafoDeAbertura({
      ...base,
      especialidade: "Pediatria",
      total: 3,
      atendemSabado: 0,
      comTelemedicina: 0,
      bairrosComOferta: [{ nome: "Santa Rita", total: 3 }],
    });
    expect(outro).not.toBe(paragrafoDeAbertura(base));
    expect(outro).toContain("Santa Rita");
    expect(outro).not.toContain("sábados");
  });

  it("nomeia o bairro quando a faceta é de cruzamento", () => {
    const p = paragrafoDeAbertura({ ...base, bairro: "Centro", total: 4 });
    expect(p).toContain("no Centro");
  });

  it("concorda o singular", () => {
    const p = paragrafoDeAbertura({
      ...base,
      total: 1,
      bairrosComOferta: [{ nome: "Centro", total: 1 }],
      atendemSabado: 1,
      comTelemedicina: 1,
      comAcessoCadeirante: 1,
    });
    expect(p).toContain("1 cardiologista ");
    expect(p).not.toContain("1 cardiologistas");
  });

  it("fica dentro da faixa de 120 a 200 palavras exigida pela camada de SEO", () => {
    const palavras = paragrafoDeAbertura(base).split(/\s+/).length;
    expect(palavras).toBeGreaterThanOrEqual(120);
    expect(palavras).toBeLessThanOrEqual(200);
  });

  it("mantém a faixa no caso mais pobre de dados", () => {
    /* Faceta pequena, sem sábado e sem telemedicina: é aqui que o texto
       encurta. Se passar deste caso, passa de todos. */
    const palavras = paragrafoDeAbertura({
      especialidade: "Urologia",
      total: 1,
      bairrosComOferta: [{ nome: "Centro", total: 1 }],
      atendemSabado: 0,
      comTelemedicina: 0,
      comAcessoCadeirante: 0,
    })
      .split(/\s+/).length;
    expect(palavras).toBeGreaterThanOrEqual(120);
    expect(palavras).toBeLessThanOrEqual(200);
  });
});
