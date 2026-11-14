import styles from "@/components/associacao/FaixaDaDiretoria.module.css";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { VOLTA_ASSOCIACAO } from "@/lib/paginaDeTexto";

/*
  A faixa verde da diretoria: a faixa curta (components/layout/FaixaCurta.tsx)
  com "← A ASSOCIAÇÃO", o título e a frase.

  Embaixo da frase, a pílula da gestão. Com o período, que vem do banco
  (`periodoDaGestao`), ela é real, nos dois modos. Sem o período e no modo
  demonstração, é moldura "a entrar" (`data-a-entrar`); fora dele, não
  existe.
*/
export function FaixaDaDiretoria({
  demonstracao,
  periodo,
}: {
  demonstracao: boolean;
  periodo: string | null;
}) {
  return (
    <FaixaCurta
      volta={VOLTA_ASSOCIACAO}
      titulo="Diretoria da AMI"
      texto="Quem responde pela associação. Cada nome traz o número de inscrição no CRM."
    >
      {periodo ? (
        <p className={styles.pilula}>{`Gestão ${periodo}`}</p>
      ) : demonstracao ? (
        <p className={styles.pilula} data-a-entrar="mandato">
          Gestão <em>(período a entrar)</em>
        </p>
      ) : null}
    </FaixaCurta>
  );
}
