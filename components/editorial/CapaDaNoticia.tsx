import styles from "@/components/editorial/NoticiaAberta.module.css";
import { SIZES_DA_CAPA, type ImagemNaTela } from "@/lib/noticias";

/*
  A capa da notícia aberta, entre a faixa verde e o texto: em 16:9, na
  largura dos painéis, recortada pelo CDN no ponto de interesse que a AMI
  marcou no Studio (`capaDaNoticia`, lib/noticias.ts). Sem a moldura de
  8px com borda de antes: o desenho novo não põe caixa em volta de foto.

  É a primeira imagem grande da página: baixa logo (`fetchPriority`). O
  par de medidas é o de 16:9, o mesmo da caixa, e por isso nada se move
  quando o arquivo chega. É um bloco da página (`data-bloco="capa"`), a
  --ritmo da faixa e do texto.
*/
export function CapaDaNoticia({ capa }: { capa: ImagemNaTela }) {
  return (
    <figure data-bloco="capa" className={styles.capa}>
      {/* eslint-disable-next-line @next/next/no-img-element --
          o CDN do Sanity já redimensiona e recorta; ver lib/sanity/imagem.ts. */}
      <img
        src={capa.src}
        srcSet={capa.srcSet}
        sizes={SIZES_DA_CAPA}
        alt={capa.alt}
        width={capa.largura}
        height={capa.altura}
        fetchPriority="high"
        decoding="async"
      />
    </figure>
  );
}
