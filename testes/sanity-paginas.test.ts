import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CAMINHO_DAS_PAGINAS,
  PAGINAS_CONHECIDAS,
} from "@/lib/sanity/paginas";
import { enderecosValidos } from "@/sanity/schemas/paginaInstitucional";
/* A rota de verdade, não uma cópia do cálculo escrita aqui: é o que faz o
   teste abaixo pegar uma regressão em que alguém volte a escrever `PAGINAS`
   à mão em `page.tsx`, em vez de só travar o valor atual de uma constante. */
import { PAGINAS } from "@/app/(site)/associacao/[pagina]/page";

/*
  Este arquivo existe para uma classe de defeito só: uma correspondência
  slug -> endereço que precisa concordar em vários lugares do repositório,
  e que pode divergir em silêncio se algum deles for escrito à mão em vez de
  derivado do mesmo módulo (`lib/sanity/paginas.ts`).

  A rodada 1 de revisão da tarefa 11 achou duas listas divergentes
  (`CAMINHO_DAS_PAGINAS` e o `PAGINAS` da rota). A rodada 2 achou uma
  terceira, independente das outras duas: `enderecosValidos`, em
  `sanity/schemas/paginaInstitucional.ts`. As três agora derivam de
  `PAGINAS_CONHECIDAS`, então os testes abaixo comparam a leitura de cada
  consumidor contra o módulo, e entre si.
*/

describe("PAGINAS_CONHECIDAS deriva corretamente para CAMINHO_DAS_PAGINAS", () => {
  it("toda entrada de PAGINAS_CONHECIDAS está em CAMINHO_DAS_PAGINAS, exceto associacao", () => {
    const esperado = Object.keys(PAGINAS_CONHECIDAS).filter(
      (slug) => slug !== "associacao",
    );
    expect(Object.keys(CAMINHO_DAS_PAGINAS).sort()).toEqual(esperado.sort());
  });

  it("associacao não entra em CAMINHO_DAS_PAGINAS", () => {
    /* "associacao" é o único slug que não é rota dinâmica: alimenta o texto
       opcional do índice, que já é entrada fixa do sitemap por conta própria
       (app/sitemap.ts). Se ele vazasse para CAMINHO_DAS_PAGINAS, o sitemap
       listaria /associacao duas vezes com prioridades diferentes. */
    expect(CAMINHO_DAS_PAGINAS.associacao).toBeUndefined();
  });

  it("o endereço de cada entrada de CAMINHO_DAS_PAGINAS bate com o de PAGINAS_CONHECIDAS", () => {
    for (const [slug, caminho] of Object.entries(CAMINHO_DAS_PAGINAS)) {
      expect(PAGINAS_CONHECIDAS[slug].caminho).toBe(caminho);
    }
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

/*
  Achado da rodada 2 de revisão: `enderecosValidos`, em
  sanity/schemas/paginaInstitucional.ts, descrevia o mesmo conjunto de sete
  slugs por conta própria, sem nada que a ligasse a `PAGINAS_CONHECIDAS`. O
  cenário que isso permitia: alguém publica no Studio um documento com um
  slug que passa na validação do schema mas não está em
  `CAMINHO_DAS_PAGINAS`; o documento nunca entra no sitemap, `PAGINAS` nunca
  o inclui, `generateStaticParams` nunca gera a rota, e o endereço dá 404,
  em silêncio, para sempre.

  Hoje `enderecosValidos` é literalmente `Object.keys(PAGINAS_CONHECIDAS)`
  (ver o schema), então este teste fica quase tautológico: as duas expressões
  são, por construção, o mesmo array. Vale mantê-lo mesmo assim, porque ele
  não testa a expressão, testa a AMARRAÇÃO entre os dois arquivos. Se algum
  dia alguém "simplificar" o schema voltando a escrever a lista à mão ali
  (a mesma edição de descuido que causou o achado original), é este teste,
  e não o de PAGINAS_CONHECIDAS sozinho, que quebra.
*/
describe("enderecosValidos do schema bate com PAGINAS_CONHECIDAS", () => {
  it("os sete slugs são exatamente os mesmos, nos dois arquivos", () => {
    expect([...enderecosValidos].sort()).toEqual(
      Object.keys(PAGINAS_CONHECIDAS).sort(),
    );
  });

  it("são sete, nem a mais nem a menos", () => {
    expect(enderecosValidos).toHaveLength(7);
  });
});
