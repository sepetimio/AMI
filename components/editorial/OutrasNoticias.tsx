import Link from "next/link";
import { Icone } from "@/components/base/IconeServidor";
import { GradeDeNoticias } from "@/components/editorial/GradeDeNoticias";
import styles from "@/components/editorial/Noticias.module.css";
import home from "@/components/editorial/UltimasNoticias.module.css";
import { arranjoDasOutras } from "@/lib/noticias";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  "Outras notícias", depois da faixa branca da notícia aberta, sobre o
  fundo da página: o cabeçalho de seção das notícias da home ("NOTÍCIAS /
  Outras notícias" e "Ver todas as notícias", UltimasNoticias.module.css) e
  os cartões da lista (components/editorial/GradeDeNoticias.tsx).

  Tantas colunas quantas notícias, para não sobrar coluna vazia
  (`arranjoDasOutras`, lib/noticias.ts): três ficam três por linha; duas,
  em duas colunas; uma só, deitada, com a foto da largura de uma coluna de
  três. Quem escolhe as notícias é a página (`outrasNoticias`); sem
  nenhuma, o bloco não sai.

  Entra na tela ao rolar (`.revelar`): nunca está na primeira tela.
*/
export function OutrasNoticias({ noticias }: { noticias: ResumoNoticia[] }) {
  const arranjo = arranjoDasOutras(noticias.length);
  if (!arranjo) return null;

  return (
    <section data-bloco="outras" aria-labelledby="outras-titulo" className={`revelar ${styles.outras}`}>
      <div className={home.cabSecao}>
        <div>
          <span className="rotulo-secao" data-coluna="">
            Notícias
          </span>
          <h2 id="outras-titulo" className={home.titulo}>
            Outras notícias
          </h2>
        </div>
        <Link className="botao-linha" href="/noticias">
          Ver todas as notícias <Icone nome="setaDiagonal" tamanho={16} />
        </Link>
      </div>
      <GradeDeNoticias noticias={noticias} arranjo={arranjo} />
    </section>
  );
}
