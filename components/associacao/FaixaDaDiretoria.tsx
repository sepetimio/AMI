import styles from "@/components/associacao/FaixaDaDiretoria.module.css";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { VOLTA_ASSOCIACAO } from "@/lib/paginaDeTexto";

/*
  A faixa verde da diretoria: a faixa curta (components/layout/FaixaCurta.tsx)
  com "← A ASSOCIAÇÃO", o título e a frase.

  Embaixo da frase, a pílula do mandato. O período da gestão não está em
  lugar nenhum que o site leia, então ela é moldura "a entrar"
  (`data-a-entrar`): sai só no modo demonstração, e fora dele não existe.
*/
export function FaixaDaDiretoria({ demonstracao }: { demonstracao: boolean }) {
  return (
    <FaixaCurta
      volta={VOLTA_ASSOCIACAO}
      titulo="Diretoria da AMI"
      texto="Quem responde pela associação. Cada nome traz o número de inscrição no CRM."
    >
      {demonstracao ? (
        <p className={styles.pilula} data-a-entrar="mandato">
          Gestão <em>(período a entrar)</em>
        </p>
      ) : null}
    </FaixaCurta>
  );
}
