import type { CSSProperties } from "react";
import { CartaoNoticia } from "@/components/editorial/CartaoNoticia";
import styles from "@/components/editorial/Noticias.module.css";
import { tamanhoDosCartoes, type ArranjoDaLista } from "@/lib/arranjo-das-noticias";
import { TRES_POR_LINHA } from "@/lib/noticias";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  A grade dos cartões de notícia, no arranjo que a lista pede
  (`arranjoDaLista`, lib/arranjo-das-noticias.ts): uma coluna por cartão
  até três (`--colunas`), e o cartão deitado quando sobra um só
  (`data-deitado`). A última fileira incompleta fica alinhada à esquerda,
  como numa grade comum. O `sizes` da foto segue o arranjo
  (`tamanhoDosCartoes`).

  `role="list"`: sem o marcador (`list-style: none`), o Safari deixa de
  anunciar a lista ao leitor de tela.
*/
export function GradeDeNoticias({ noticias, arranjo }: { noticias: ResumoNoticia[]; arranjo: ArranjoDaLista }) {
  const sizes = tamanhoDosCartoes(arranjo);
  return (
    <ul
      className={styles.grade}
      style={{ "--colunas": arranjo.colunas } as CSSProperties}
      data-deitado={arranjo.deitado ? "" : undefined}
      role="list"
    >
      {noticias.map((n) => (
        <CartaoNoticia key={n.slug} noticia={n} sizes={sizes} />
      ))}
    </ul>
  );
}

/* Os três cartões "Notícia a entrar" da demonstração sem notícia, como na home. */
export function GradeAEntrar() {
  const sizes = tamanhoDosCartoes(TRES_POR_LINHA);
  return (
    <ul className={styles.grade} style={{ "--colunas": TRES_POR_LINHA.colunas } as CSSProperties} role="list">
      {Array.from({ length: TRES_POR_LINHA.colunas }, (_, i) => (
        <CartaoNoticia key={i} sizes={sizes} />
      ))}
    </ul>
  );
}
