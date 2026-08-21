import { describe, expect, it } from "vitest";
import {
  CAMINHO_DAS_PAGINAS,
  ETIQUETA_NOTICIAS,
  etiquetaDeNoticia,
  etiquetaDePagina,
  groqListaNoticias,
  GROQ_NOTICIA,
  GROQ_PAGINA,
  GROQ_SLUGS_PAGINAS,
} from "@/lib/sanity/consultas";

describe("etiquetas de cache", () => {
  it("etiqueta de notícia é derivada do slug", () => {
    expect(etiquetaDeNoticia("congresso-2026")).toBe("noticia:congresso-2026");
  });

  it("etiqueta de página é derivada do slug", () => {
    expect(etiquetaDePagina("estatuto")).toBe("pagina:estatuto");
  });

  it("a etiqueta coletiva de notícias é estável", () => {
    /* O webhook da tarefa 4 invalida esta string. Renomeá-la sem atualizar o
       webhook faria o índice de notícias congelar para sempre, sem erro
       nenhum: a página continuaria servindo, só que velha. */
    expect(ETIQUETA_NOTICIAS).toBe("noticias");
  });

  it("etiqueta não estoura o limite de 256 caracteres do Next", () => {
    const slugLongo = "a".repeat(300);
    expect(etiquetaDeNoticia(slugLongo).length).toBeLessThanOrEqual(256);
  });
});

describe("consultas GROQ", () => {
  it("a lista projeta exatamente o que o índice desenha", () => {
    /* Projeção a mais é banda desperdiçada em toda visita ao índice; a menos
       é campo undefined na tela. Ambos silenciosos. */
    for (const campo of ["titulo", "resumo", "publicadoEm", "capa", "autor"]) {
      expect(groqListaNoticias(20)).toContain(campo);
    }
    /* O corpo NÃO entra na lista: são vários blocos por matéria, e o índice
       não desenha um só deles. */
    expect(groqListaNoticias(20)).not.toContain("corpo");
  });

  it("a lista ordena da mais recente para a mais antiga", () => {
    expect(groqListaNoticias(20)).toContain("order(publicadoEm desc)");
  });

  it("o limite vira literal na fatia, porque GROQ não aceita parâmetro ali", () => {
    /* `[0...$limite]` é recusado pelo analisador do GROQ com "slicing must
       use constant numbers". Este teste trava o formato correto. */
    expect(groqListaNoticias(3)).toContain("[0...3]");
    expect(groqListaNoticias(20)).toContain("[0...20]");
    expect(groqListaNoticias(20)).not.toContain("$limite");
  });

  it("recusa limite fora da faixa em vez de interpolar lixo", () => {
    /* A interpolação é o que torna a validação obrigatória: sem ela, um valor
       vindo da URL entraria no texto da consulta. */
    expect(() => groqListaNoticias(0)).toThrow(/1 a 100/);
    expect(() => groqListaNoticias(101)).toThrow(/1 a 100/);
    expect(() => groqListaNoticias(Number.NaN)).toThrow();
  });

  it("corta a parte fracionária em vez de deixá-la chegar à consulta", () => {
    expect(groqListaNoticias(20.9)).toContain("[0...20]");
  });

  it("a notícia traz o autor resolvido, não a referência crua", () => {
    /* Sem o `->`, `autor` volta como `{_ref, _type}` e a assinatura sai
       vazia. É o erro mais comum de GROQ e não produz exceção nenhuma. */
    expect(GROQ_NOTICIA).toMatch(/autor\s*->/);
    expect(GROQ_NOTICIA).toContain("crm");
  });

  it("a página institucional é buscada por slug", () => {
    expect(GROQ_PAGINA).toContain("slug.current == $slug");
  });

  it("a lista de páginas publicadas filtra pelos slugs conhecidos", () => {
    /* Sem o `in $slugs` na própria consulta, um rascunho de página futura
       (fora das seis previstas hoje) chegaria do banco e só seria
       descartado depois, em memória, sem que o mapeamento de endereço
       soubesse o que fazer com ele. */
    expect(GROQ_SLUGS_PAGINAS).toContain("slug.current in $slugs");
  });
});

describe("endereço das seis páginas de prosa", () => {
  it("as três subpáginas da associação levam o prefixo /associacao", () => {
    expect(CAMINHO_DAS_PAGINAS.beneficios).toBe("/associacao/beneficios");
    expect(CAMINHO_DAS_PAGINAS.estatuto).toBe("/associacao/estatuto");
    expect(CAMINHO_DAS_PAGINAS["politica-editorial"]).toBe(
      "/associacao/politica-editorial",
    );
  });

  it("as três páginas legais são rotas de primeiro nível, o slug já é o endereço", () => {
    expect(CAMINHO_DAS_PAGINAS["politica-de-privacidade"]).toBe(
      "/politica-de-privacidade",
    );
    expect(CAMINHO_DAS_PAGINAS["termos-de-uso"]).toBe("/termos-de-uso");
    expect(CAMINHO_DAS_PAGINAS["politica-de-cookies"]).toBe(
      "/politica-de-cookies",
    );
  });

  it("são exatamente seis páginas, nem a mais nem a menos", () => {
    expect(Object.keys(CAMINHO_DAS_PAGINAS)).toHaveLength(6);
  });
});
