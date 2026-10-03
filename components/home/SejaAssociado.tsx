import type { CSSProperties } from "react";
import Link from "next/link";
import { Fotografia } from "@/components/base/Fotografia";
import { Icone, LadrilhoIcone, type NomeIcone } from "@/components/base/Icone";
import styles from "@/components/home/SejaAssociado.module.css";
import { AMI } from "@/lib/ami";
import { ESPACOS } from "@/lib/imagens";
import {
  desenhoDaFotografia,
  quemEhAmi,
  type CartaoInstitucional,
  type TextoInstitucional,
} from "@/lib/molduras";

const ICONES: Record<CartaoInstitucional["titulo"], NomeIcone> = {
  Missão: "bandeira",
  Visão: "olho",
  Valores: "maoCoracao",
};

/*
  "Seja associado" e "Quem é a AMI?": a faixa branca de ponta a ponta da
  home, logo depois de "Sua AMI" (app/(site)/page.tsx).

  A faixa fica fora da caixa centralizada, como a busca verde, e leva
  `data-faixa`, a marca das faixas de ponta a ponta (o rodapé a lê); o texto
  fica na mesma linha vertical do resto porque a margem lateral é
  `--borda-faixa` (app/globals.css). Entra na tela com a `.revelar` global.

  A foto dos associados obedece a trava de `desenhoDaFotografia`: sem foto
  real e fora da demonstração não sai nada, e então a grade não ganha a
  segunda coluna e o texto ocupa a largura toda. A pergunta é feita aqui,
  antes da casca, porque `Fotografia` devolvendo `null` deixaria a casca
  vazia.

  Os cartões de missão, visão e valores vêm de `quemEhAmi` (lib/molduras.ts).
  Sem cartão nenhum (fora da demonstração e sem texto da AMI), a introdução
  "Quem é a AMI?" fica sozinha, na largura toda: o texto dela é verdadeiro.
  A grade tem uma coluna por cartão (`--cartoes`), e por isso dois cartões
  não deixam uma coluna vazia à direita.

  O ano da frase de apresentação vem de `AMI.fundadaEm`, o mesmo de que
  `anosDeAmi` calcula o número da home.
*/
export function SejaAssociado({
  demonstracao,
  texto,
}: {
  demonstracao: boolean;
  texto: TextoInstitucional;
}) {
  const temFoto = desenhoDaFotografia(ESPACOS.associados.provisoria, demonstracao) !== "nada";
  const { cartoes } = quemEhAmi(demonstracao, texto);

  return (
    <section
      data-bloco="associe"
      data-faixa=""
      aria-labelledby="associe-titulo"
      className={`revelar ${styles.faixa}`}
    >
      <div className={`${styles.duplo}${temFoto ? ` ${styles.comFoto}` : ""}`}>
        <div className={styles.corpo}>
          <span className="rotulo-secao" data-coluna="">
            Seja associado
          </span>
          <h2 id="associe-titulo" className={styles.titulo}>
            Associe-se à AMI e fortaleça a medicina em Imperatriz
          </h2>
          <p className={styles.texto}>
            Médico com inscrição no CRM pode se associar. Fale com a AMI para
            saber como.
          </p>
          <Link className={`botao ${styles.acao}`} href="/associacao/seja-associado">
            Quero me associar <Icone nome="seta" />
          </Link>
        </div>

        {temFoto ? (
          <div className={styles.foto}>
            <Fotografia
              espaco="associados"
              demonstracao={demonstracao}
              sizes="(min-width: 981px) 50vw, 100vw"
              className={styles.fotografia}
            />
          </div>
        ) : null}
      </div>

      <div
        className={`${styles.quem}${cartoes.length === 0 ? ` ${styles.soIntro}` : ""}`}
        style={cartoes.length > 0 ? ({ "--cartoes": cartoes.length } as CSSProperties) : undefined}
      >
        <div className={styles.intro}>
          <span className="rotulo-secao">Quem somos</span>
          <h3 className={styles.introTitulo}>Quem é a AMI?</h3>
          <p className={styles.introTexto}>
            {`A Associação Médica de Imperatriz reúne os profissionais que atendem em Imperatriz e na região sul do Maranhão, em atividade desde ${AMI.fundadaEm}.`}
          </p>
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
    </section>
  );
}
