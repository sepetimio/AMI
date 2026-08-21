/*
  Fonte única dos sete slugs de `paginaInstitucional` que têm rota
  correspondente no site, com o endereço e o rótulo de cada um.

  Achado da rodada 2 de revisão da tarefa 11: antes deste arquivo existir,
  a mesma correspondência estava escrita à mão em TRÊS lugares
  independentes, e nada os mantinha alinhados: `CAMINHO_DAS_PAGINAS` (que
  morava em `lib/sanity/consultas.ts`), o array `PAGINAS` de
  `app/(site)/associacao/[pagina]/page.tsx`, e `enderecosValidos` em
  `sanity/schemas/paginaInstitucional.ts`. A rodada 1 desta revisão só viu
  os dois primeiros e unificou os dois; o revisor simulou o cenário completo
  e achou o terceiro. Um documento publicado no Studio com um slug que
  estivesse em `enderecosValidos` mas não nos outros dois nunca apareceria
  no sitemap, nunca seria pré-renderizado, e daria 404, em silêncio, para
  sempre: exatamente o defeito que a correção do sitemap já existia para
  eliminar, só que uma camada mais funda.

  ESTE ARQUIVO NÃO IMPORTA NADA, de propósito. É a regra que o mantém seguro
  de se importar de qualquer lugar que precise da correspondência:
  `lib/sanity/consultas.ts` importa `obterCliente`, que importa
  `sanity/env.ts`, que valida variável de ambiente na própria importação
  (decisão deliberada de falha rápida, ver o comentário lá). O Studio
  carrega `sanity/schemas/paginaInstitucional.ts` no navegador da
  secretaria da AMI, sem `.env.local` nenhum por perto, e
  `testes/sanity-schemas.test.ts` testa aquele schema sem `.env.local`
  também. Se este mapeamento morasse em `consultas.ts`, ou importasse de
  lá, o schema arrastaria a cadeia inteira do cliente Sanity para dentro do
  Studio e dos testes de schema, reabrindo por um terceiro caminho o mesmo
  acoplamento que já foi achado Crítico na tarefa 3.

  O rótulo mora aqui, ao lado do endereço, e não separado num quarto lugar:
  rótulo e endereço mudam juntos (quem acrescenta uma página decide os dois
  na mesma hora), e a AMI vai ler o rótulo no formulário do Studio, então
  ele precisa estar disponível para `sanity/schemas/paginaInstitucional.ts`
  sem esse módulo ter de calcular nada sozinho.
*/

export type PaginaConhecida = {
  /** Endereço completo da rota no site, com barra inicial. */
  caminho: string;
  /** Rótulo legível, para o campo "Endereço" do Studio. */
  rotulo: string;
};

export const PAGINAS_CONHECIDAS: Readonly<Record<string, PaginaConhecida>> = {
  /*
    A única entrada que não é prosa pura: alimenta o texto opcional de
    app/(site)/associacao/page.tsx, o índice, que nunca chama notFound().
    Fica em PAGINAS_CONHECIDAS (o Studio precisa aceitar o slug) mas fora de
    CAMINHO_DAS_PAGINAS logo abaixo (o sitemap já lista /associacao como
    entrada fixa, e a rota dinâmica [pagina] não gera essa página).
  */
  associacao: {
    caminho: "/associacao",
    rotulo: "A Associação (texto do índice)",
  },
  beneficios: { caminho: "/associacao/beneficios", rotulo: "Benefícios" },
  estatuto: { caminho: "/associacao/estatuto", rotulo: "Estatuto" },
  "politica-editorial": {
    caminho: "/associacao/politica-editorial",
    rotulo: "Política editorial",
  },
  "politica-de-privacidade": {
    caminho: "/politica-de-privacidade",
    rotulo: "Política de privacidade",
  },
  "termos-de-uso": {
    caminho: "/termos-de-uso",
    rotulo: "Termos de uso",
  },
  "politica-de-cookies": {
    caminho: "/politica-de-cookies",
    rotulo: "Política de cookies",
  },
};

/*
  As seis páginas de PROSA que o sitemap e a rota `/associacao/[pagina]`
  conhecem: todo slug de `PAGINAS_CONHECIDAS`, exceto "associacao" (ver o
  comentário na entrada dela, acima). Derivada, não reescrita: um oitavo
  slug acrescentado só em `PAGINAS_CONHECIDAS` aparece aqui e em
  `slugsDePaginasSobAssociacao` sem precisar tocar em mais nada.
*/
export const CAMINHO_DAS_PAGINAS: Readonly<Record<string, string>> =
  Object.fromEntries(
    Object.entries(PAGINAS_CONHECIDAS)
      .filter(([slug]) => slug !== "associacao")
      .map(([slug, { caminho }]) => [slug, caminho]),
  );

/*
  Os slugs de `CAMINHO_DAS_PAGINAS` que vivem sob `/associacao/*`, na ordem
  em que aparecem no mapeamento. É o que alimenta o array `PAGINAS` de
  `app/(site)/associacao/[pagina]/page.tsx`.
*/
export function slugsDePaginasSobAssociacao(): string[] {
  return Object.entries(CAMINHO_DAS_PAGINAS)
    .filter(([, caminho]) => caminho.startsWith("/associacao/"))
    .map(([slug]) => slug);
}
