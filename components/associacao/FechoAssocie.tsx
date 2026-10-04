import Link from "next/link";
import { Icone } from "@/components/base/IconeServidor";
import styles from "@/components/associacao/SecoesDaAssociacao.module.css";
import associe from "@/components/home/SejaAssociado.module.css";
import { CONVITE_PARA_ASSOCIAR } from "@/lib/associacao";

/*
  O fecho de A Associação: uma faixa branca de ponta a ponta, curta, em
  duas colunas, com o texto aprovado da faixa "Seja associado" da home
  (`CONVITE_PARA_ASSOCIAR`, lib/associacao.ts) e o botão "Quero me
  associar".

  Não é o componente `SejaAssociado` inteiro: ele traz junto "Quem é a
  AMI?" e os cartões de Missão, visão e valores, que esta página já mostra
  em "Quem somos".

  É o último bloco da página e é faixa (`data-faixa`): o rodapé emenda nele
  (components/layout/Rodape.module.css). Entra na tela com a `.revelar`.
*/
export function FechoAssocie() {
  return (
    <section
      data-bloco="associe"
      data-faixa=""
      aria-labelledby="associe-titulo"
      className={`revelar ${associe.faixa}`}
    >
      <div className={styles.fecho}>
        <div>
          <span className="rotulo-secao" data-coluna="">
            Seja associado
          </span>
          <h2 id="associe-titulo" className={styles.fechoTitulo}>
            {CONVITE_PARA_ASSOCIAR.titulo}
          </h2>
        </div>
        <div>
          <p className={styles.fechoTexto}>{CONVITE_PARA_ASSOCIAR.texto}</p>
          <Link className={`botao ${styles.fechoAcao}`} href="/associacao/seja-associado">
            Quero me associar <Icone nome="seta" />
          </Link>
        </div>
      </div>
    </section>
  );
}
