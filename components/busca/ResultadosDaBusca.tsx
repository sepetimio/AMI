import Link from "next/link";
import { GradeMedicos } from "@/components/diretorio/GradeMedicos";
import styles from "@/components/busca/ResultadosDaBusca.module.css";
import { textoDaContagem } from "@/lib/encontre";
import type { EspecialidadeComContagem, Medico } from "@/lib/dados/tipos";

/* Os cartões da primeira fileira do computador: baixam a foto logo. */
const IMEDIATOS = 4;

/*
  A contagem ("24 médicos", "3 médicos em Cardiologia"), a frase que diz a
  ordem, e a grade; sem resultado, "Nenhum médico encontrado" e o botão que
  limpa a busca.
*/
export function ResultadosDaBusca({
  medicos,
  escolhida,
}: {
  medicos: Medico[];
  escolhida: EspecialidadeComContagem | null;
}) {
  return (
    <section data-bloco="resultados" aria-labelledby="contagem">
      <div className={styles.cab}>
        {/* `aria-live`: a busca troca a contagem sem recarregar a página, e
            quem lê a tela ouve o resultado novo sem sair da lista. */}
        <h2 id="contagem" className={styles.contagem} data-coluna="" aria-live="polite">
          {textoDaContagem(medicos.length, escolhida?.nome ?? null)}
        </h2>
        <p className={styles.ordem}>Em ordem alfabética</p>
      </div>

      {medicos.length > 0 ? (
        <GradeMedicos medicos={medicos} imediatos={IMEDIATOS} />
      ) : (
        <div className={styles.vazio}>
          <h3>Nenhum médico encontrado</h3>
          <p>Confira a grafia do nome ou escolha outra especialidade.</p>
          <Link href="/busca" className="botao-linha">
            Limpar a busca
          </Link>
        </div>
      )}
    </section>
  );
}
