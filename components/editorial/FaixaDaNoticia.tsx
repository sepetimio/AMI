import Link from "next/link";
import styles from "@/components/editorial/NoticiaAberta.module.css";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { dataPorExtenso } from "@/lib/formato";
import { VOLTA_NOTICIAS, assinaturaDoAutor } from "@/lib/noticias";
import type { Noticia } from "@/lib/sanity/tipos";

/*
  A faixa verde que abre a notícia: a faixa curta
  (components/layout/FaixaCurta.tsx), com "← NOTÍCIAS", o título e o
  resumo, com o título menor (NoticiaAberta.module.css, `.materia`).

  Embaixo de um fio, a assinatura: "Por {autor}", com o link do perfil
  quando o autor tem um no diretório, e "MÉDICO · CRM/UF n" com a data de
  publicação. O CRM vai junto do nome porque a Resolução CFM 2.336/2023
  pede (`identificacaoMedica`, lib/formato.ts); a assinatura vem logo no
  alto porque, num site de saúde, quem escreveu é a primeira coisa que o
  leitor precisa poder conferir.
*/
export function FaixaDaNoticia({ noticia }: { noticia: Noticia }) {
  const assinatura = assinaturaDoAutor(noticia.autor);

  return (
    <FaixaCurta volta={VOLTA_NOTICIAS} titulo={noticia.titulo} texto={noticia.resumo} className={styles.materia}>
      <div className={styles.assinatura}>
        <div>
          <p className={styles.nome}>
            {assinatura.perfil ? (
              <>
                Por <Link href={assinatura.perfil}>{assinatura.nome}</Link>
              </>
            ) : (
              `Por ${assinatura.nome}`
            )}
          </p>
          <p className={styles.meta}>
            {assinatura.registro}
            <span className={styles.ponto}> · </span>
            <time dateTime={noticia.publicadoEm}>{dataPorExtenso(noticia.publicadoEm)}</time>
          </p>
        </div>
      </div>
    </FaixaCurta>
  );
}
