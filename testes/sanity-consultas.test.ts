import { existsSync } from "node:fs";
import { join } from "node:path";
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
/* A rota de verdade, não uma cópia do cálculo escrita aqui: é o que faz o
   teste abaixo pegar uma regressão em que alguém volte a escrever `PAGINAS`
   à mão em `page.tsx`, em vez de só travar o valor atual de uma constante. */
import { PAGINAS } from "@/app/(site)/associacao/[pagina]/page";

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

/*
  Achado da rodada 1 de revisão: os três testes que existiam aqui antes só
  repetiam os valores literais já escritos em `CAMINHO_DAS_PAGINAS`. Eles só
  quebrariam se a mesma edição que muda a constante esquecesse de mudar o
  teste, o que normalmente não acontece na mesma edição, então não protegiam
  contra nada, inclusive não contra o defeito real que existia: o array
  `PAGINAS` de `app/(site)/associacao/[pagina]/page.tsx` era escrito à mão,
  independente deste mapeamento, e as duas listas podiam divergir em
  silêncio.

  Agora `PAGINAS` deriva de `CAMINHO_DAS_PAGINAS` (via
  `slugsDePaginasSobAssociacao`, ver o comentário lá), então o teste que
  protege de verdade é comparar a lista que a rota exporta de fato contra o
  mapeamento, não contra ela mesma.
*/
describe("PAGINAS (a rota) deriva de CAMINHO_DAS_PAGINAS, não de cópia à mão", () => {
  it("todo slug de CAMINHO_DAS_PAGINAS sob /associacao/* está em PAGINAS, e só esses", () => {
    const esperado = Object.entries(CAMINHO_DAS_PAGINAS)
      .filter(([, caminho]) => caminho.startsWith("/associacao/"))
      .map(([slug]) => slug)
      .sort();
    expect([...PAGINAS].sort()).toEqual(esperado);
  });

  it("cada slug de PAGINAS aponta de volta para o próprio /associacao/<slug>", () => {
    /* Trava a direção da correspondência: se `CAMINHO_DAS_PAGINAS` um dia
       guardar, por engano, o slug "estatuto" apontando para
       "/associacao/estatutos" (erro de digitação), a rota gerada por
       `generateStaticParams` responderia em /associacao/estatuto, mas o
       `canonical` da própria página apontaria para outro endereço. Esta
       asserção é o que pegaria isso. */
    for (const slug of PAGINAS) {
      expect(CAMINHO_DAS_PAGINAS[slug]).toBe(`/associacao/${slug}`);
    }
  });
});

describe("páginas legais de primeiro nível têm rota correspondente no repositório", () => {
  const slugsDePrimeiroNivel = Object.keys(CAMINHO_DAS_PAGINAS).filter(
    (slug) => !CAMINHO_DAS_PAGINAS[slug].startsWith("/associacao/"),
  );

  it("são exatamente três, nenhuma delas subpágina da associação", () => {
    expect(slugsDePrimeiroNivel).toHaveLength(3);
  });

  it.each(slugsDePrimeiroNivel)(
    "%s: o slug é o próprio endereço, e a rota existe no repositório",
    (slug) => {
      /* Verificação de arquivo, não de lógica pura, e é legítima aqui: a
         asserção é justamente sobre a rota existir. Sem ela, alguém poderia
         apagar `app/(site)/termos-de-uso/page.tsx` e `CAMINHO_DAS_PAGINAS`
         continuaria apontando para um endereço que não existe mais, sem que
         nenhum teste percebesse. */
      expect(CAMINHO_DAS_PAGINAS[slug]).toBe(`/${slug}`);
      const rota = join(process.cwd(), "app", "(site)", slug, "page.tsx");
      expect(existsSync(rota)).toBe(true);
    },
  );
});
