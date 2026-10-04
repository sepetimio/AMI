import Link from "next/link";
import { Icone } from "@/components/base/IconeServidor";
import { MolduraProvisoria } from "@/components/base/MolduraProvisoria";
import { FotoDaNoticia } from "@/components/editorial/FotoDaNoticia";
import { GradeAEntrar, GradeDeNoticias } from "@/components/editorial/GradeDeNoticias";
import styles from "@/components/editorial/Noticias.module.css";
import { LARGURAS_DO_DESTAQUE_DA_LISTA, SIZES_DO_DESTAQUE_DA_LISTA } from "@/lib/arranjo-das-noticias";
import { dataPorExtenso } from "@/lib/formato";
import type { ListaNaTela } from "@/lib/noticias";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  A lista de /noticias, embaixo da faixa verde. Quem decide o que ela
  mostra é a página (`listaDeNoticias`, lib/noticias.ts):
  - com notícia: a mais recente em destaque, na largura dos painéis, e as
    outras na grade;
  - sem notícia, na demonstração: o destaque e três cartões "Notícia a
    entrar", como na home;
  - sem notícia, fora dela: "Nenhuma notícia publicada ainda." e o botão
    para o início. A frase fica na coluna do texto (`data-coluna`).

  O destaque e a grade são um bloco só (`data-bloco="noticias"`), a --gap
  um do outro. O h2 só para leitor de tela marca a região nos três casos.
*/
export function ListaDeNoticias({ lista }: { lista: ListaNaTela }) {
  return (
    <section data-bloco="noticias" aria-labelledby="publicacoes-titulo" className={styles.lista}>
      <h2 id="publicacoes-titulo" className="sr-only">
        Publicações
      </h2>

      {lista.tipo === "noticias" ? (
        <>
          <Destaque noticia={lista.destaque} />
          {lista.grade.length > 0 ? <GradeDeNoticias noticias={lista.grade} arranjo={lista.arranjo} /> : null}
        </>
      ) : lista.tipo === "a-entrar" ? (
        <>
          <Destaque />
          <GradeAEntrar />
        </>
      ) : (
        <div className={styles.nenhuma}>
          <p data-coluna="">Nenhuma notícia publicada ainda.</p>
          <div className={styles.acao}>
            <Link className="botao-contorno" href="/">
              <Icone nome="voltar" /> Voltar para o início
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

/*
  A notícia em destaque: a foto em 2:1 (4:3 no celular) e, sobre ela, a
  data, o título e o resumo, num degradê escuro que garante o contraste do
  texto branco mesmo sobre uma foto branca. O destaque inteiro é o link.
  Sem `noticia`, é a moldura da home, sem link.
*/
function Destaque({ noticia }: { noticia?: ResumoNoticia }) {
  const conteudo = (
    <>
      <div className={styles.fotoDoDestaque}>
        {noticia ? (
          <FotoDaNoticia
            capa={noticia.capa}
            larguras={LARGURAS_DO_DESTAQUE_DA_LISTA}
            sizes={SIZES_DO_DESTAQUE_DA_LISTA}
            prioridade
          />
        ) : (
          <MolduraProvisoria
            largura={2}
            altura={1}
            rotulo="Espaço reservado para a capa de uma notícia"
            className="h-full"
          />
        )}
      </div>
      <div className={styles.sobreFoto}>
        {noticia ? (
          <time className={styles.data} dateTime={noticia.publicadoEm}>
            {dataPorExtenso(noticia.publicadoEm)}
          </time>
        ) : null}
        <h3 className={styles.destaqueTitulo}>{noticia ? noticia.titulo : "Notícia a entrar"}</h3>
        <p className={styles.destaqueResumo}>
          {noticia ? noticia.resumo : "Espaço reservado para uma publicação da AMI."}
        </p>
      </div>
    </>
  );

  return (
    <article className={styles.destaque} data-a-entrar={noticia ? undefined : "notícias"}>
      {noticia ? (
        <Link href={`/noticias/${noticia.slug}`} className={styles.casca}>
          {conteudo}
        </Link>
      ) : (
        <div className={styles.casca}>{conteudo}</div>
      )}
    </article>
  );
}
