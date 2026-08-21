import type { PortableTextBlock } from "@portabletext/react";

/*
  Formas de domínio do conteúdo editorial, em português, espelhando o que
  `lib/dados/tipos.ts` faz para o diretório. As páginas conhecem estes tipos e
  não a forma crua do Sanity, para que uma mudança de schema fique contida em
  `lib/sanity/`.
*/

export type ImagemSanity = {
  /* Referência do ativo. `lib/sanity/imagem.ts` a transforma em endereço. */
  asset: { _ref: string };
  alt: string;
  legenda?: string;
};

export type Autor = {
  nome: string;
  crm: string;
  crmUf: string;
  /* Vazio quando o autor não tem perfil publicado no diretório. */
  slugDoPerfil?: string;
};

export type ResumoNoticia = {
  titulo: string;
  slug: string;
  resumo: string;
  capa?: ImagemSanity;
  autor: Autor;
  publicadoEm: string;
};

export type Noticia = ResumoNoticia & {
  atualizadoEm?: string;
  corpo: PortableTextBlock[];
};

export type PaginaInstitucional = {
  titulo: string;
  slug: string;
  resumo: string;
  atualizadoEm: string;
  corpo: PortableTextBlock[];
};
