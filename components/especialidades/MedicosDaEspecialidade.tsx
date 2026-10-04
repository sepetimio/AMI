import resultados from "@/components/busca/ResultadosDaBusca.module.css";
import { GradeMedicos } from "@/components/diretorio/GradeMedicos";
import { textoDaContagem } from "@/lib/encontre";
import type { Medico } from "@/lib/dados/tipos";

/* Os cartões da primeira fileira do computador: baixam a foto logo. */
const IMEDIATOS = 4;

/*
  A contagem ("3 médicos"), a frase da ordem e a grade de cartões da busca,
  na página de uma especialidade.
  - Cada cartão mostra a especialidade da página, com o RQE dela, e não a
    principal do médico (`especialidade`, o slug).
  - A lista chega em ordem alfabética (`buscarMedicos`, lib/dados/medicos.ts).
*/
export function MedicosDaEspecialidade({
  medicos,
  especialidade,
}: {
  medicos: Medico[];
  especialidade: string;
}) {
  return (
    <section data-bloco="medicos" aria-labelledby="contagem">
      <div className={resultados.cab}>
        <h2 id="contagem" className={resultados.contagem} data-coluna="">
          {textoDaContagem(medicos.length, null)}
        </h2>
        <p className={resultados.ordem}>Em ordem alfabética</p>
      </div>
      <GradeMedicos medicos={medicos} imediatos={IMEDIATOS} especialidade={especialidade} />
    </section>
  );
}
