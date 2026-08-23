import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";

const HOME = semComentarios(fonte("../app/(site)/page.tsx"));

describe("a home", () => {
  it("monta as tres secoes novas", () => {
    for (const c of ["FaixaDaAmi", "Carrossel", "ServicosDaAmi"]) {
      expect(HOME, `falta <${c}> na home`).toContain(`<${c}`);
    }
  });

  it("mantem as quatro secoes que ja existiam", () => {
    for (const c of ["IndiceEspecialidades", "UltimasNoticias", "LadrilhosBairros"]) {
      expect(HOME, `a home perdeu <${c}>`).toContain(`<${c}`);
    }
  });

  it("o titulo da pagina nao fala mais de buscar medico", () => {
    /*
      O <h1> era "Encontre um médico em Imperatriz" e ocupava a tela inteira.
      Ele desceu para o cartao de servico. Se voltar ao topo, o site voltou a
      ser a busca em vez da porta da associacao.
    */
    expect(HOME).not.toMatch(/<h1[^>]*>\s*Encontre um médico/);
  });

  it("a faixa vem antes do carrossel, e o carrossel antes dos servicos", () => {
    const faixa = HOME.indexOf("<FaixaDaAmi");
    const carrossel = HOME.indexOf("<Carrossel");
    const servicos = HOME.indexOf("<ServicosDaAmi");
    expect(faixa).toBeLessThan(carrossel);
    expect(carrossel).toBeLessThan(servicos);
  });
});
