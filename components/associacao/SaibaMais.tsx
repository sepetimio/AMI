import Link from "next/link";
import { Icone } from "@/components/base/IconeServidor";
import styles from "@/components/associacao/SecoesDaAssociacao.module.css";
import grade from "@/components/especialidades/GradeDeEspecialidades.module.css";
import type { Atalho } from "@/lib/associacao";

/*
  "Saiba mais": atalhos para as páginas de texto da associação, no desenho
  do cartão do índice de especialidades (título, uma frase e a seta no
  pé). Quem decide quais aparecem é a página (`atalhosDoSaibaMais`,
  lib/associacao.ts).

  O atalho de uma página que existe leva a ela pelo cartão inteiro (o link
  do título, esticado em CSS), e a seta no pé é a do link. O de uma página
  que ainda não existe, que só sai na demonstração, não é link e não tem a
  seta: leva a etiqueta "texto a entrar" (`data-a-entrar`), com um espaço
  antes dela: sem ele, o leitor de tela lê "Estatutotexto a entrar".

  Marcas para a auditoria visual: `data-atalho`, `data-nome` e `data-seta`.
*/
export function SaibaMais({ atalhos }: { atalhos: Atalho[] }) {
  return (
    <section data-bloco="saiba-mais" aria-labelledby="saiba-mais-titulo">
      <div className={styles.cabSecao}>
        <div>
          <span className="rotulo-secao" data-coluna="">
            A Associação
          </span>
          <h2 id="saiba-mais-titulo" className={styles.titulo}>
            Saiba mais
          </h2>
        </div>
      </div>

      <ul className={`${grade.grade} ${styles.atalhos}`} data-atalhos="">
        {atalhos.map((a) => (
          <li
            key={a.caminho}
            className={`${grade.cartao} ${styles.atalho}`}
            data-atalho=""
            data-a-entrar={a.aEntrar ? "" : undefined}
          >
            <h3 className={`${grade.nome} ${styles.nome}`} data-nome="">
              {a.aEntrar ? a.titulo : <Link href={a.caminho}>{a.titulo}</Link>}
              {a.aEntrar ? (
                <>
                  {" "}
                  <span className={styles.etiqueta}>texto a entrar</span>
                </>
              ) : null}
            </h3>
            <p className={`${grade.pe} ${styles.pe}`}>
              <span className={`${grade.conta} ${styles.frase}`}>{a.frase}</span>
              {a.aEntrar ? null : (
                <span className={`${grade.seta} ${styles.seta}`} aria-hidden="true" data-seta="">
                  <Icone nome="seta" />
                </span>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
