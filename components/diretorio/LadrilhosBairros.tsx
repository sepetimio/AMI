import Link from "next/link";
import styles from "@/components/diretorio/LadrilhosBairros.module.css";
import { contagem } from "@/lib/formato";

type Item = { nome: string; slug: string; total: number };

/*
  Bairros em ladrilho, com o desenho do `.bairro` aprovado
  (docs/desenho-aprovado/home-aprovada.html): o nome à esquerda e a contagem
  à direita, numa grade de quatro; abaixo de 1180px a contagem desce para
  baixo do nome, e abaixo de 980px a grade fica com duas colunas.

  Ladrilho, e não pílula: a contagem cai sempre no mesmo lugar, e a fileira
  inteira fica varrível de relance.

  Não é só da home. `/medicos` usa o padrão (cada ladrilho leva à busca
  filtrada pelo bairro) e `/medicos/[especialidade]` troca o destino por
  `href` e acrescenta `nota`, numa linha própria embaixo do nome e da
  contagem: ao lado da contagem ela espremia o nome do bairro.
*/
export function LadrilhosBairros({
  itens,
  /** Para onde cada ladrilho leva. A home manda para a busca filtrada. */
  href = (slug: string) => `/busca?bairro=${slug}`,
  /** Linha extra sob a contagem. Devolve null quando não há o que dizer. */
  nota,
}: {
  itens: Item[];
  href?: (slug: string) => string;
  nota?: (item: Item) => string | null;
}) {
  return (
    <ul className={styles.bairros}>
      {itens.map((b) => {
        const extra = nota?.(b) ?? null;
        return (
          <li key={b.slug} className={styles.casa}>
            <Link href={href(b.slug)} className={styles.bairro}>
              <span className={styles.nome}>{b.nome}</span>
              <span className={styles.contagem}>
                {contagem(b.total, "médico", "médicos")}
              </span>
              {extra ? <span className={styles.nota}>{extra}</span> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
