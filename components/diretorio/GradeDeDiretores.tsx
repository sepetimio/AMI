import { CartaoDiretor } from "@/components/diretorio/CartaoDiretor";
import styles from "@/components/diretorio/GradeMedicos.module.css";
import type { Diretor } from "@/lib/dados/diretoria";

/*
  A grade dos cartões de diretor: a mesma da busca (GradeMedicos.module.css),
  4 por linha no computador e o cartão deitado no celular, na ordem da AMI
  (presidência primeiro, sem cartão maior).
  - `imediatos`: quantos dos primeiros cartões baixam a foto logo, sem
    `loading="lazy"`, porque ficam na primeira tela.
*/
export function GradeDeDiretores({ diretores, imediatos = 0 }: { diretores: Diretor[]; imediatos?: number }) {
  return (
    <ul className={styles.grade}>
      {diretores.map((d, i) => (
        <CartaoDiretor key={d.id} diretor={d} imediata={i < imediatos} />
      ))}
    </ul>
  );
}
