import Link from "next/link";
import { Fotografia } from "@/components/base/Fotografia";
import { Icone } from "@/components/base/IconeServidor";
import { PrincipiosDaAmi } from "@/components/home/PrincipiosDaAmi";
import styles from "@/components/home/SejaAssociado.module.css";
import { AMI } from "@/lib/ami";
import { CONVITE_PARA_ASSOCIAR } from "@/lib/associacao";
import { ESPACOS } from "@/lib/imagens";
import { desenhoDaFotografia, quemEhAmi, type TextoInstitucional } from "@/lib/molduras";

/*
  "Seja associado" e "Quem é a AMI?": a faixa branca de ponta a ponta da
  home, logo depois de "Sua AMI" (app/(site)/page.tsx).

  A faixa fica fora da caixa centralizada, como a busca verde, e leva
  `data-faixa`, a marca das faixas de ponta a ponta (o rodapé a lê); o texto
  fica na mesma linha vertical do resto porque a margem lateral é
  `--borda-faixa` (app/globals.css).

  Entra na tela com a `.revelar` global, como no desenho. Sem carrossel,
  numa tela alta, esta faixa pode abrir na primeira tela, e aí fica parada:
  só o bloco que abre abaixo da tela anima (components/layout/Revelar.tsx).

  A foto dos associados obedece a trava de `desenhoDaFotografia`: sem foto
  real e fora da demonstração não sai nada, e então a grade não ganha a
  segunda coluna e o texto ocupa a largura toda. A pergunta é feita aqui,
  antes da casca, porque `Fotografia` devolvendo `null` deixaria a casca
  vazia.

  O título e o texto do convite são os de `CONVITE_PARA_ASSOCIAR`
  (lib/associacao.ts), que o fecho de A Associação repete.

  Os cartões de missão, visão e valores vêm de `quemEhAmi` (lib/molduras.ts)
  e são desenhados por `PrincipiosDaAmi`. Sem cartão nenhum (fora da
  demonstração e sem texto da AMI), a introdução "Quem é a AMI?" fica
  sozinha, na largura toda: o texto dela é verdadeiro.

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
            {CONVITE_PARA_ASSOCIAR.titulo}
          </h2>
          <p className={styles.texto}>{CONVITE_PARA_ASSOCIAR.texto}</p>
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

      <PrincipiosDaAmi
        cartoes={cartoes}
        rotulo="Quem somos"
        titulo="Quem é a AMI?"
        texto={`A Associação Médica de Imperatriz reúne os profissionais que atendem em Imperatriz e na região sul do Maranhão, em atividade desde ${AMI.fundadaEm}.`}
      />
    </section>
  );
}
