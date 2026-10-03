import type { Banner, EmpresaParceira } from "@/lib/sanity/tipos";

/*
  As molduras provisórias da home, e a trava que as segura.

  O cliente ainda não tem as artes e pediu, em 03/10/2026, para ver a home
  com a estrutura inteira, com moldura "a entrar" no lugar do que falta.
  Hoje falta: as artes do carrossel, as fotos de "Sua AMI" e de "Seja
  associado", o texto dos cartões de "Quem é a AMI?", as notícias e os
  parceiros. Isso reverte uma decisão da
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
  banner o carrossel some, sem notícia o bloco some, e sem empresa parceira
  cadastrada a faixa de parceiros some e o quarto número também. É o
  comportamento de antes, da spec. "Sua AMI" e "Seja associado" recebem a
  chave direto da home e decidem sozinhos (components/home/SuaAmi.tsx e
  SejaAssociado.tsx).

  Arte real e provisória nunca se misturam: havendo um banner real, os três
  provisórios saem todos; havendo uma notícia real, as provisórias também;
  havendo uma empresa parceira real, os seis espaços "Logotipo a entrar"
  também.

  Um banner real também pode trazer moldura: o slide de foto com texto
  ("composto") cadastrado sem foto, cuja área de foto o carrossel desenha
  como "a entrar". Na demonstração ele fica; fora dela, sai do carrossel.
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

/* Quantos espaços "Logotipo a entrar" a faixa de parceiros mostra quando
   ainda não há empresa cadastrada, e por isso o número de parceiras que a
   home mostra nesse caso: o número conta os espaços que estão na tela. */
export const ESPACOS_DE_PARCEIRAS = 6;

export type MoldurasDaHome = {
  /** O que o carrossel recebe: os reais, os três provisórios, ou nada. */
  banners: ItemDoCarrossel[];
  /** As quatro peças "Notícia a entrar" (destaque e lista) no lugar das últimas notícias. */
  noticiasProvisorias: boolean;
  /** As empresas parceiras cadastradas, que a faixa desenha nos dois modos. */
  parceiras: EmpresaParceira[];
  /** Os seis espaços "Logotipo a entrar": só sem nenhuma real, e só na demonstração. */
  parceirasProvisorias: boolean;
  /**
   * O quarto número da home: as cadastradas; sem nenhuma, os seis espaços na
   * demonstração; fora dela, `null`, e a home fica com três números.
   */
  numeroDeParceiras: number | null;
};

export function moldurasDaHome(
  demonstracao: boolean,
  real: { banners: Banner[]; temNoticia: boolean; parceiras: EmpresaParceira[] },
): MoldurasDaHome {
  /* Fora da demonstração, o composto sem foto sai: a área da foto dele seria
     moldura "a entrar". O carrossel usa o mesmo teste (`item.foto ?`). */
  const reais = demonstracao
    ? real.banners
    : real.banners.filter((b) => b.tipo !== "composto" || Boolean(b.foto));

  let banners: ItemDoCarrossel[] = [];
  if (reais.length > 0) banners = reais;
  else if (demonstracao) banners = BANNERS_PROVISORIOS;

  /* O número e a faixa andam juntos: o botão "Ver parceiras" do número leva
     a `/#parceiros`, e a faixa existe exatamente quando há número. */
  const temParceira = real.parceiras.length > 0;
  let numeroDeParceiras: number | null = null;
  if (temParceira) numeroDeParceiras = real.parceiras.length;
  else if (demonstracao) numeroDeParceiras = ESPACOS_DE_PARCEIRAS;

  return {
    banners,
    noticiasProvisorias: demonstracao && !real.temNoticia,
    parceiras: real.parceiras,
    parceirasProvisorias: demonstracao && !temParceira,
    numeroDeParceiras,
  };
}

/*
  A mesma trava, para as fotografias de lib/imagens.ts.

  Foto com material real sai sempre. Foto ainda provisória sai como moldura
  "Fotografia a entrar" só no modo demonstração; fora dele não sai nada, e
  quem a usa decide o que fazer com o vão (ver "Seja associado", em
  components/home/SejaAssociado.tsx). Antes de 03/10/2026 a moldura de foto saía em
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
  a home (app/(site)/page.tsx) passa os três como `null`. A mesma trava das
  outras molduras decide o que sai. Texto real sai sempre. O que falta sai como "Texto da AMI
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
