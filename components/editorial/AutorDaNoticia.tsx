import Link from "next/link";
import { Icone, LadrilhoIcone } from "@/components/base/IconeServidor";
import styles from "@/components/editorial/PaginaDeTexto.module.css";
import { assinaturaDoAutor } from "@/lib/noticias";
import type { Autor } from "@/lib/sanity/tipos";

/*
  O fim da notícia, no fim da coluna de leitura: quem assina (o
  estetoscópio, "Por {autor}" e "MÉDICO · CRM/UF n") com o botão "Ver
  perfil" quando o autor tem perfil no diretório, e o aviso de saúde que o
  site já publicava.

  O CSS mora na folha da página de texto (PaginaDeTexto.module.css,
  `.autorFim`), porque o bloco vive dentro da coluna e as regras dele
  precisam valer sobre as da coluna.
*/
export function AutorDaNoticia({ autor }: { autor: Autor }) {
  const assinatura = assinaturaDoAutor(autor);

  return (
    <>
      <div className={styles.autorFim}>
        <LadrilhoIcone nome="estetoscopio" pequeno />
        <div>
          <p className={styles.autorNome}>{`Por ${assinatura.nome}`}</p>
          <p className={styles.autorCrm}>{assinatura.registro}</p>
        </div>
        {assinatura.perfil ? (
          <div className={styles.autorAcoes}>
            <Link className="botao-contorno" href={assinatura.perfil}>
              Ver perfil <Icone nome="seta" />
            </Link>
          </div>
        ) : null}
      </div>
      <p className={styles.avisoSaude}>
        Conteúdo informativo publicado pela Associação Médica de Imperatriz. Não substitui a consulta médica.
      </p>
    </>
  );
}
