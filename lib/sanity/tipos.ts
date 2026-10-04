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

/*
  Banner da home, em dois tipos (spec, seção 7).

  - "arte": uma imagem pronta que cobre o slide, com versão própria de celular.
  - "composto": foto com texto montado no site (rótulo, título, texto, botão).

  Em ambos, as imagens já vêm como endereço pronto (não `ImagemSanity`),
  junto do `srcset` com as larguras que o CDN entrega
  (lib/sanity/banners.ts): quem lê estes tipos é o carrossel da home, que só
  desenha um `<img>` e diz ao navegador, pelo `sizes`, em que largura cada
  imagem aparece (lib/carrossel.ts).
*/
/* O ponto de interesse que a AMI marca na imagem (o "hotspot" do Sanity):
   o centro da área que não pode ser cortada. */
export type Foco = { x: number; y: number };

export type BannerArte = {
  tipo: "arte";
  id: string;
  nome: string;
  /** Arte larga, 3000 × 1288 (proporção 2,33:1 do carrossel no computador). */
  imagem: string;
  /** A arte larga em 800, 1200, 1800, 2400 e 3000px, no formato do `srcset`. */
  imagemSrcset: string;
  /** Arte de celular, 1080 × 1350 (4:5). Null: o site recorta a larga. */
  imagemCelular: string | null;
  /** A arte de celular em 540 e 1080px, no formato do `srcset`. Null junto com `imagemCelular`. */
  imagemCelularSrcset: string | null;
  /** Ponto de interesse da arte larga, de 0 a 1 (esquerda→direita, cima→baixo). Null: sem marcação. */
  foco: Foco | null;
  alt: string;
  /** "escuro" (padrão) ou "claro": decide a cor dos controles sobre a arte. */
  tema: "escuro" | "claro";
  destino: string | null;
  ordem: number;
};

export type BannerComposto = {
  tipo: "composto";
  id: string;
  nome: string;
  /** Null: a área da foto vira moldura no modo demonstração (ver lib/molduras.ts). */
  foto: string | null;
  /** A foto em 600, 1000 e 1600px, no formato do `srcset`. Null junto com `foto`. */
  fotoSrcset: string | null;
  /** Ponto de interesse da foto, de 0 a 1. Null: sem marcação. */
  foco: Foco | null;
  fotoAlt: string;
  rotulo: string | null;
  titulo: string;
  texto: string | null;
  botao: string | null;
  destino: string | null;
  ordem: number;
};

export type Banner = BannerArte | BannerComposto;

/*
  Uma empresa parceira da AMI, como a faixa "Quem caminha com a AMI" a
  desenha (components/home/EmpresasParceiras.tsx). O logotipo já vem como
  endereço pronto, com o `srcset`, como nos banners.
*/
export type EmpresaParceira = {
  id: string;
  /** O nome da empresa: o texto alternativo do logotipo. */
  nome: string;
  /** O logotipo na maior largura pedida ao CDN. */
  logotipo: string;
  /** O logotipo em todas as larguras de `LARGURAS_DO_LOGOTIPO`, no formato do `srcset`. */
  logotipoSrcset: string;
  /** Endereço de fora, só http ou https. Null: o logotipo não é link. */
  site: string | null;
};

/*
  O texto "Sobre a {especialidade}" da página de cada especialidade, como o
  site o desenha: o que o especialista faz e quando procurar, em texto rico
  (parágrafos e lista), quem revisou, o CRM dele e o mês da revisão, já por
  extenso.
*/
export type TextoDeEspecialidade = {
  oQueFaz: PortableTextBlock[];
  quandoProcurar: PortableTextBlock[];
  /** Como a AMI escreveu no Studio: "Dra. Maria da Silva". */
  revisorNome: string;
  /** "CRM/MA 10822". */
  revisorCrm: string;
  /** O mês da revisão por extenso: "setembro de 2026". */
  mesDaRevisao: string;
};
