import Link from "next/link";
import { MolduraProvisoria } from "@/components/base/MolduraProvisoria";
import { FotoDaNoticia } from "@/components/editorial/FotoDaNoticia";
import styles from "@/components/editorial/Noticias.module.css";
import { LARGURAS_DO_CARTAO } from "@/lib/arranjo-das-noticias";
import { dataPorExtenso } from "@/lib/formato";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  O cartão de uma notícia, na lista de /noticias e em "Outras notícias":
  a foto 16:10, a data, o título e o resumo cortado em duas linhas. O
  cartão inteiro leva à notícia, pelo link do título, esticado em CSS
  (Noticias.module.css).

  Sem `noticia`, é a moldura "a entrar" da home ("Notícia a entrar"), que
  só a demonstração mostra, e que não é link: não há página para ela.

  Marcas para a auditoria visual (scripts/auditoria-visual.js, conferência
  17), que confere se os cartões de uma fileira ficam alinhados:
  `data-cartao-noticia`, `data-foto`, `data-data` e `data-titulo`.
*/
export function CartaoNoticia({ noticia, sizes }: { noticia?: ResumoNoticia; sizes: string }) {
  return (
    <li className={styles.cartao} data-cartao-noticia="" data-a-entrar={noticia ? undefined : "notícias"}>
      <div className={styles.foto} data-foto="">
        {noticia ? (
          <FotoDaNoticia capa={noticia.capa} larguras={LARGURAS_DO_CARTAO} sizes={sizes} />
        ) : (
          <MolduraProvisoria
            largura={16}
            altura={10}
            rotulo="Espaço reservado para a capa de uma notícia"
            className="h-full"
          />
        )}
      </div>
      <div className={styles.corpo}>
        {noticia ? (
          <time className={styles.data} dateTime={noticia.publicadoEm} data-data="">
            {dataPorExtenso(noticia.publicadoEm)}
          </time>
        ) : null}
        <h3 className={styles.titulo} data-titulo="">
          {noticia ? <Link href={`/noticias/${noticia.slug}`}>{noticia.titulo}</Link> : "Notícia a entrar"}
        </h3>
        <p className={styles.resumo}>{noticia ? noticia.resumo : "Espaço reservado para uma publicação da AMI."}</p>
      </div>
    </li>
  );
}
