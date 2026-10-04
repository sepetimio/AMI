import { arranjoDaLista, type ArranjoDaLista } from "@/lib/arranjo-das-noticias";
import { identificacaoMedica } from "@/lib/formato";
import type { VoltaDaPagina } from "@/lib/paginaDeTexto";
import {
  dimensoesDoRef,
  urlDaImagem,
  urlRecortada,
  type ConfiguracaoDoSanity,
} from "@/lib/sanity/imagem";
import type { Autor, CapaSanity, ImagemSanity, ResumoNoticia } from "@/lib/sanity/tipos";

/*
  O que as páginas de notícias decidem, em funções puras
  (testes/noticias-funcoes.test.ts):
  - o que a lista mostra: o destaque e a grade, ou, sem notícia, as
    molduras (só na demonstração) ou a frase de lista vazia;
  - "Outras notícias", no fim da notícia aberta, e o arranjo delas;
  - a assinatura do autor, com o link do perfil quando há;
  - a capa da notícia aberta em 16:9, pelo ponto de interesse;
  - a imagem no meio do texto, na proporção do arquivo.
*/

/** No máximo 20 na lista, como antes. Sem paginação: "Mais antigas" é outra fatia. */
export const LIMITE_DA_LISTA = 20;

/** A notícia aberta volta à lista (o "← NOTÍCIAS" da faixa). */
export const VOLTA_NOTICIAS: VoltaDaPagina = { href: "/noticias", rotulo: "Notícias" };

export type ListaNaTela =
  | { tipo: "noticias"; destaque: ResumoNoticia; grade: ResumoNoticia[]; arranjo: ArranjoDaLista }
  | { tipo: "a-entrar" }
  | { tipo: "nenhuma" };

/**
 * A lista de /noticias. Com notícia, a mais recente em destaque e as outras
 * na grade, no arranjo da home (`arranjoDaLista`). Sem notícia, a mesma
 * trava das molduras da home (lib/molduras.ts): na demonstração, os cartões
 * "Notícia a entrar"; fora dela, a lista vazia.
 */
export function listaDeNoticias(demonstracao: boolean, noticias: ResumoNoticia[]): ListaNaTela {
  const reais = noticias.slice(0, LIMITE_DA_LISTA);
  const arranjo = arranjoDaLista(reais.length);
  if (!arranjo) return demonstracao ? { tipo: "a-entrar" } : { tipo: "nenhuma" };
  const [destaque, ...grade] = reais;
  return { tipo: "noticias", destaque, grade, arranjo };
}

/** Quantas "Outras notícias" a notícia aberta mostra. */
export const LIMITE_DE_OUTRAS = 3;

/** Três por linha: as molduras "Notícia a entrar" da lista. */
export const TRES_POR_LINHA: ArranjoDaLista = { colunas: 3, deitado: false };

/** As mais recentes que não são a notícia aberta, até três; com menos, as que houver. */
export function outrasNoticias(noticias: ResumoNoticia[], slugAtual: string): ResumoNoticia[] {
  return noticias.filter((n) => n.slug !== slugAtual).slice(0, LIMITE_DE_OUTRAS);
}

/**
 * O arranjo de "Outras notícias": tantas colunas quantas houver, até três,
 * para não sobrar coluna vazia (a mesma regra da home). É a grade embaixo
 * do destaque da lista com uma notícia a mais: três outras ficam três por
 * linha; duas, em duas colunas; uma só, deitada, com a foto da largura de
 * uma coluna de três. Sem nenhuma, null: o bloco nem sai.
 */
export function arranjoDasOutras(quantas: number): ArranjoDaLista | null {
  if (quantas <= 0) return null;
  return arranjoDaLista(Math.min(quantas, LIMITE_DE_OUTRAS) + 1);
}

export type Assinatura = {
  nome: string;
  /** O endereço do perfil no diretório, ou null sem perfil. */
  perfil: string | null;
  /** "MÉDICO · CRM/MA 10137": a Resolução CFM 2.336/2023 pede o CRM junto do nome. */
  registro: string;
};

/**
 * Quem assina a notícia. O laço com o diretório é o `slugDoPerfil` do
 * autor, opcional (sanity/schemas/autor.ts): em branco, o nome sai sem
 * link. O campo é texto livre do Studio, e só vira endereço quando tem a
 * forma de um slug do diretório (letras minúsculas sem acento, algarismos e
 * hífen, `SLUG_DO_PERFIL`); com qualquer outra coisa (barra, espaço, `?`,
 * `#`, maiúscula), o nome sai sem link, como em branco.
 */
const SLUG_DO_PERFIL = /^[a-z0-9-]+$/;

export function assinaturaDoAutor(autor: Autor): Assinatura {
  const slug = autor.slugDoPerfil?.trim() ?? "";
  return {
    nome: autor.nome,
    perfil: SLUG_DO_PERFIL.test(slug) ? `/medico/${slug}` : null,
    registro: identificacaoMedica(autor.crm, autor.crmUf),
  };
}

/** Uma imagem pronta para o `<img>`: o endereço, o `srcset`, o texto alternativo e o par de medidas. */
export type ImagemNaTela = { src: string; srcSet: string; alt: string; largura: number; altura: number };

/*
  A capa da notícia aberta, em 16:9, na largura dos painéis
  (components/editorial/CapaDaNoticia.tsx): 1192px a partir de 1240px de
  tela, 100vw − 48px até 701px, e no celular de 12 a 378 (100vw − 24px). A
  maior largura pedida cobre 1192px em densidade 2.
*/
export const LARGURAS_DA_CAPA = [640, 960, 1200, 1600, 2000, 2400] as const;
const LARGURA_DA_CAPA = 1600;
export const SIZES_DA_CAPA =
  "(min-width: 1240px) 1192px, (min-width: 701px) calc(100vw - 48px), calc(100vw - 24px)";

/** A altura de uma largura, em 16:9. */
export function alturaDaCapa(largura: number): number {
  return Math.round((largura * 9) / 16);
}

/**
 * A capa recortada em 16:9 pelo ponto de interesse que a AMI marcou no
 * Studio (`urlRecortada`). Sem capa, ou com a referência quebrada em
 * alguma largura, null: a notícia sai sem capa, e não com uma imagem
 * quebrada.
 */
export function capaDaNoticia(
  capa: CapaSanity | undefined,
  configuracao?: ConfiguracaoDoSanity,
): ImagemNaTela | null {
  if (!capa) return null;
  const urls = LARGURAS_DA_CAPA.map((l) => urlRecortada(capa, l, alturaDaCapa(l), configuracao));
  if (urls.some((u) => !u)) return null;
  return {
    src: urls[LARGURAS_DA_CAPA.indexOf(LARGURA_DA_CAPA)],
    srcSet: urls.map((u, i) => `${u} ${LARGURAS_DA_CAPA[i]}w`).join(", "),
    alt: capa.alt,
    largura: LARGURA_DA_CAPA,
    altura: alturaDaCapa(LARGURA_DA_CAPA),
  };
}

/*
  A imagem no meio do texto da notícia (components/editorial/CorpoDoTexto.tsx),
  na largura da coluna de leitura (components/editorial/PaginaDeTexto.module.css):
  - acima de 1180px, 680px;
  - de 981 a 1180px, a coluna é o que sobra do índice de 220px e do vão de
    48px, dentro da faixa com 72px de cada lado: 100vw − 412px;
  - de 701 a 980px, uma coluna, com 52px de cada lado;
  - no celular, 32px de cada lado.
  Sem recorte: a imagem sai na proporção do arquivo que a AMI enviou, e o
  par de medidas (largura 1360, altura proporcional) reserva o espaço antes
  de ela chegar.
*/
export const LARGURAS_DA_IMAGEM_DO_TEXTO = [480, 720, 960, 1360, 1600] as const;
const LARGURA_DA_IMAGEM_DO_TEXTO = 1360;
export const SIZES_DA_IMAGEM_DO_TEXTO =
  "(min-width: 1181px) 680px, (min-width: 981px) calc(100vw - 412px), " +
  "(min-width: 701px) calc(100vw - 104px), calc(100vw - 64px)";

/** A imagem do texto, ou null quando a referência não dá endereço nem medidas. */
export function imagemDoTexto(
  imagem: ImagemSanity,
  configuracao?: ConfiguracaoDoSanity,
): ImagemNaTela | null {
  const dimensoes = dimensoesDoRef(imagem.asset._ref);
  if (!dimensoes) return null;
  const urls = LARGURAS_DA_IMAGEM_DO_TEXTO.map((l) => urlDaImagem(imagem, l, configuracao));
  if (urls.some((u) => !u)) return null;
  return {
    src: urls[LARGURAS_DA_IMAGEM_DO_TEXTO.indexOf(960)],
    srcSet: urls.map((u, i) => `${u} ${LARGURAS_DA_IMAGEM_DO_TEXTO[i]}w`).join(", "),
    alt: imagem.alt,
    largura: LARGURA_DA_IMAGEM_DO_TEXTO,
    altura: Math.round((LARGURA_DA_IMAGEM_DO_TEXTO * dimensoes.altura) / dimensoes.largura),
  };
}
