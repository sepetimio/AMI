import styles from "@/components/editorial/UltimasNoticias.module.css";
import { urlDaImagem } from "@/lib/sanity/imagem";
import type { CapaSanity } from "@/lib/sanity/tipos";

/*
  A foto de uma notícia no destaque ou no cartão da lista (e de "Outras
  notícias"), e no destaque e nos itens das notícias da home, ou o verde da
  marca com o símbolo, quando a notícia não tem capa (a capa é opcional no
  Studio). Os dois desenhos são os da home (UltimasNoticias.module.css:
  `.imagem` e `.semCapa`).

  - `urlDaImagem` devolve "" quando o `_ref` está malformado; um
    `<img src="">` faria o navegador pedir a página de novo. Sem endereço,
    sai o mesmo desenho de quem não tem capa.
  - `alt=""`: a foto está dentro do link, e o nome do link é o título. A
    descrição da foto entraria no nome do link antes do título.
  - `prioridade`: a foto do destaque da lista de notícias é a primeira
    imagem grande da página e baixa logo (`fetchPriority="high"`); as dos
    cartões e as da home, abaixo do carrossel, só ao rolar.
  - O CDN só redimensiona pela largura: o recorte na caixa é o
    `object-fit: cover` do CSS, pelo meio da foto, como na home.
*/
export function FotoDaNoticia({
  capa,
  larguras,
  sizes,
  prioridade = false,
}: {
  capa?: CapaSanity;
  larguras: readonly number[];
  sizes: string;
  prioridade?: boolean;
}) {
  const src = capa ? urlDaImagem(capa, larguras[1]) : "";
  if (!capa || !src) return <div className={styles.semCapa} aria-hidden="true" />;
  return (
    /* eslint-disable-next-line @next/next/no-img-element --
       o CDN do Sanity já redimensiona; ver lib/sanity/imagem.ts. */
    <img
      src={src}
      srcSet={larguras.map((l) => `${urlDaImagem(capa, l)} ${l}w`).join(", ")}
      sizes={sizes}
      alt=""
      {...(prioridade ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
      decoding="async"
      className={styles.imagem}
    />
  );
}
