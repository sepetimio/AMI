import { CartaoMedico } from "@/components/diretorio/CartaoMedico";
import styles from "@/components/diretorio/GradeMedicos.module.css";
import type { Medico } from "@/lib/dados/tipos";

/*
  A grade de cartões.
  - `imediatos`: quantos dos primeiros cartões baixam a foto logo, sem
    `loading="lazy"`, porque ficam na primeira tela; os outros esperam a
    rolagem.
  - `especialidade`: o slug da especialidade da página, que cada cartão
    mostra no lugar da principal (components/diretorio/CartaoMedico.tsx).
*/
export function GradeMedicos({
  medicos,
  imediatos = 0,
  especialidade = null,
}: {
  medicos: Medico[];
  imediatos?: number;
  especialidade?: string | null;
}) {
  return (
    <ul className={styles.grade}>
      {medicos.map((m, i) => (
        <CartaoMedico key={m.id} medico={m} imediata={i < imediatos} especialidade={especialidade} />
      ))}
    </ul>
  );
}
