import type { Banner } from "@/lib/sanity/tipos";

/*
  As molduras provisórias da home.

  O cliente ainda não tem as artes e pediu, em 03/10/2026, para ver a home
  com a estrutura inteira, com moldura "a entrar" no lugar do que falta.
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
