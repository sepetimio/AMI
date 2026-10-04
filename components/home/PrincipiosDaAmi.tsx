import type { CSSProperties } from "react";
import { LadrilhoIcone, type NomeIcone } from "@/components/base/IconeServidor";
import styles from "@/components/home/SejaAssociado.module.css";
import type { CartaoInstitucional } from "@/lib/molduras";

const ICONES: Record<CartaoInstitucional["titulo"], NomeIcone> = {
  Missão: "bandeira",
  Visão: "olho",
  Valores: "maoCoracao",
};

/*
  Missão, visão e valores: a introdução numa coluna mais larga e um cartão
  por texto, com o ordinal, o ícone, o título e o texto. Na home, debaixo
  de "Seja associado", com a introdução "Quem é a AMI?" e um parágrafo; em
  A Associação, debaixo da sede, com "Princípios" e sem parágrafo (a
  apresentação está logo acima).

  Os cartões vêm de `quemEhAmi` (lib/molduras.ts), e quem chama decide o
  que fazer sem nenhum: a home deixa a introdução sozinha, na largura toda
  (`soIntro`); A Associação nem monta este bloco.

  A grade tem uma coluna por cartão (`--cartoes`), e por isso dois cartões
  não deixam uma coluna vazia à direita. O desenho é o de "Quem é a AMI?"
  (SejaAssociado.module.css), inclusive o ordinal em `ink-400`.
*/
export function PrincipiosDaAmi({
  cartoes,
  rotulo,
  titulo,
  texto,
}: {
  cartoes: CartaoInstitucional[];
  rotulo: string;
  titulo: string;
  texto?: string;
}) {
  return (
    <div
      className={`${styles.quem}${cartoes.length === 0 ? ` ${styles.soIntro}` : ""}`}
      style={cartoes.length > 0 ? ({ "--cartoes": cartoes.length } as CSSProperties) : undefined}
    >
      <div className={styles.intro}>
        <span className="rotulo-secao">{rotulo}</span>
        <h3 className={styles.introTitulo}>{titulo}</h3>
        {texto ? <p className={styles.introTexto}>{texto}</p> : null}
      </div>

      {cartoes.map((c, i) => (
        <div key={c.titulo} className={styles.cartao}>
          <span className={styles.ordem} aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <LadrilhoIcone nome={ICONES[c.titulo]} pequeno />
          <h4 className={styles.cartaoTitulo}>{c.titulo}</h4>
          <p className={c.provisorio ? `${styles.cartaoTexto} ${styles.falta}` : styles.cartaoTexto}>
            {c.texto}
          </p>
        </div>
      ))}
    </div>
  );
}
