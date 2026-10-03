import type { Banner } from "@/lib/sanity/tipos";

/*
  As molduras provisórias da home, e a trava que as segura.

  O cliente ainda não tem as artes e pediu, em 03/10/2026, para ver a home
  com a estrutura inteira: carrossel, quatro serviços, notícias e parceiros,
  com moldura "a entrar" no lugar do que falta. Isso reverte uma decisão da
  spec (docs/superpowers/specs/2026-08-23-home-nova-decisoes.md: sem banner,
  a seção não existe) — mas SÓ em modo demonstração.

  Por isso a decisão inteira mora em `moldurasDaHome`, uma função pura que
  recebe o valor da chave como argumento em vez de ler `process.env`: o teste
  (testes/molduras.test.ts) chama com `false` e com `true`, sem servidor e
  sem mexer em ambiente. Quem passa a chave de verdade é app/(site)/page.tsx,
  com `DADOS_DEMONSTRACAO` de lib/demonstracao.ts — a mesma que marca os
  médicos como fictícios e fecha o site para o Google, e que vale
  "demonstração" quando a variável nem está configurada.

  Com a chave falsa, nenhuma moldura sai, haja ou não conteúdo real: sem
  banner o carrossel some, sem notícia o bloco some, e "Sua AMI" e a faixa de
  parceiros, que não têm conteúdo real nenhum, somem sempre. É o
  comportamento de antes, da spec.

  Arte real e provisória nunca se misturam: havendo um banner real, os três
  provisórios saem todos; havendo uma notícia real, as provisórias também.
*/

/* Um banner que ainda não tem arte. `tipo: "provisorio"` é o que o carrossel
   usa para saber que desenha moldura, e não `<img>`: um terceiro valor ao
   lado de "arte" e "composto" (lib/sanity/tipos.ts), que nunca é gravado no
   Sanity. */
export type BannerProvisorio = {
  tipo: "provisorio";
  id: string;
  /** O que a arte vai anunciar. Sai na tarja: "Arte a entrar: <rotulo>". */
  rotulo: string;
  destino: string;
};

export type ItemDoCarrossel = Banner | BannerProvisorio;

/* Os três que o cliente aprovou, nesta ordem e com estes destinos. */
export const BANNERS_PROVISORIOS: BannerProvisorio[] = [
  {
    tipo: "provisorio",
    id: "provisorio-seja-associado",
    rotulo: "Seja associado",
    destino: "/associacao/seja-associado",
  },
  {
    tipo: "provisorio",
    id: "provisorio-encontre-um-medico",
    rotulo: "Encontre um médico",
    destino: "/busca",
  },
  {
    tipo: "provisorio",
    id: "provisorio-sua-ami",
    rotulo: "Sua AMI",
    destino: "/contato",
  },
];

export type MoldurasDaHome = {
  /** O que o carrossel recebe: os reais, os três provisórios, ou nada. */
  banners: ItemDoCarrossel[];
  /** O quarto cartão de "Serviços da AMI". */
  suaAmi: boolean;
  /** Os três cartões "Notícia a entrar" no lugar das últimas notícias. */
  noticiasProvisorias: boolean;
  /** A faixa "Empresas parceiras da AMI". */
  parceiros: boolean;
};

export function moldurasDaHome(
  demonstracao: boolean,
  real: { banners: Banner[]; temNoticia: boolean },
): MoldurasDaHome {
  let banners: ItemDoCarrossel[] = [];
  if (real.banners.length > 0) banners = real.banners;
  else if (demonstracao) banners = BANNERS_PROVISORIOS;

  return {
    banners,
    suaAmi: demonstracao,
    noticiasProvisorias: demonstracao && !real.temNoticia,
    parceiros: demonstracao,
  };
}

/*
  A mesma trava, para as fotografias de lib/imagens.ts.

  Foto com material real sai sempre. Foto ainda provisória sai como moldura
  "Fotografia a entrar" só no modo demonstração; fora dele não sai nada, e
  quem a usa decide o que fazer com o vão (ver o bloco institucional em
  app/(site)/page.tsx). Antes de 03/10/2026 a moldura de foto saía em
  qualquer modo, e era a única "a entrar" que chegava ao público com a chave
  desligada.
*/
export type DesenhoDaFotografia = "foto" | "moldura" | "nada";

export function desenhoDaFotografia(
  provisoria: boolean,
  demonstracao: boolean,
): DesenhoDaFotografia {
  if (!provisoria) return "foto";
  return demonstracao ? "moldura" : "nada";
}

/*
  Missão, visão e valores, os cartões de "Quem é a AMI?" na home.

  A AMI ainda não entregou nenhum dos três textos, e não há onde guardá-los:
  a home vai passar os três como `null` quando montar o bloco (tarefa 10).
  A mesma trava das outras molduras
  decide o que sai. Texto real sai sempre. O que falta sai como "Texto da AMI
  a entrar." só no modo demonstração; fora dele o cartão não existe. A ordem
  é sempre missão, visão, valores, e texto em branco conta como nenhum.
*/
export type TextoInstitucional = {
  missao: string | null;
  visao: string | null;
  valores: string | null;
};

export type CartaoInstitucional = {
  titulo: "Missão" | "Visão" | "Valores";
  texto: string;
  /** Verdadeiro quando o texto é o "a entrar", e não o da AMI. */
  provisorio: boolean;
};

export const TEXTO_A_ENTRAR = "Texto da AMI a entrar.";

export function quemEhAmi(
  demonstracao: boolean,
  texto: TextoInstitucional,
): { cartoes: CartaoInstitucional[] } {
  const ordem: Array<[CartaoInstitucional["titulo"], string | null]> = [
    ["Missão", texto.missao],
    ["Visão", texto.visao],
    ["Valores", texto.valores],
  ];
  const cartoes: CartaoInstitucional[] = [];
  for (const [titulo, bruto] of ordem) {
    const real = bruto?.trim() ?? "";
    if (real) cartoes.push({ titulo, texto: real, provisorio: false });
    else if (demonstracao) cartoes.push({ titulo, texto: TEXTO_A_ENTRAR, provisorio: true });
  }
  return { cartoes };
}
