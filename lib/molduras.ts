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

/* Um banner que ainda não tem arte. `provisorio` é o que o carrossel usa para
   saber que desenha moldura, e não `<img>`. */
export type BannerProvisorio = {
  provisorio: true;
  id: string;
  /** O que a arte vai anunciar. Sai na tarja: "Arte a entrar: <rotulo>". */
  rotulo: string;
  destino: string;
};

export type ItemDoCarrossel = Banner | BannerProvisorio;

/* Os três que o cliente aprovou, nesta ordem e com estes destinos. */
export const BANNERS_PROVISORIOS: BannerProvisorio[] = [
  {
    provisorio: true,
    id: "provisorio-seja-associado",
    rotulo: "Seja associado",
    destino: "/associacao/seja-associado",
  },
  {
    provisorio: true,
    id: "provisorio-encontre-um-medico",
    rotulo: "Encontre um médico",
    destino: "/busca",
  },
  {
    provisorio: true,
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
