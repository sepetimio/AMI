import { Fotografia } from "@/components/base/Fotografia";
import { Icone, LadrilhoIcone } from "@/components/base/IconeServidor";
import styles from "@/components/associacao/QuemSomos.module.css";
import { CorpoDoTexto } from "@/components/editorial/CorpoDoTexto";
import { PrincipiosDaAmi } from "@/components/home/PrincipiosDaAmi";
import associe from "@/components/home/SejaAssociado.module.css";
import { AMI, hrefTelefone, linkDoMapaDaAmi } from "@/lib/ami";
import type { ApresentacaoNaTela } from "@/lib/associacao";
import { ESPACOS } from "@/lib/imagens";
import { desenhoDaFotografia, quemEhAmi, TEXTO_A_ENTRAR, type TextoInstitucional } from "@/lib/molduras";

/*
  A largura desenhada da foto da sede, pelas réguas da faixa branca
  (`--borda-faixa`, app/globals.css) e da grade de "Seja associado"
  (SejaAssociado.module.css: duas colunas com --m de vão acima de 980px,
  uma abaixo):
  - acima de 1240px, a caixa de 1096px menos o vão de 48px, ao meio: 524px;
  - de 981 a 1240px, a faixa tem 72px de cada lado: (100vw − 192px) / 2;
  - de 701 a 980px, uma coluna, com 52px de cada lado;
  - no celular, uma coluna, com 32px de cada lado.
*/
export const SIZES_DA_SEDE =
  "(max-width: 700px) calc(100vw - 64px), (max-width: 980px) calc(100vw - 104px), " +
  "(max-width: 1240px) calc(50vw - 96px), 524px";

/*
  "Quem somos", a faixa branca de ponta a ponta logo abaixo da faixa verde
  de A Associação.
  - À esquerda: "QUEM SOMOS", o nome da associação, a apresentação oficial
    e o quadro da sede (o endereço de lib/ami.ts, "Como chegar" e o
    telefone fixo).
  - À direita, a foto da sede (`ESPACOS.sede`, lib/imagens.ts).
  - Depois do fio, "Princípios": Missão, visão e valores, os cartões da
    home (`PrincipiosDaAmi`).

  As molduras seguem a trava de sempre:
  - a apresentação (`apresentacaoDaAssociacao`, lib/associacao.ts): o texto
    da AMI nos dois modos; sem ele, "Texto da AMI a entrar." só na
    demonstração;
  - a foto (`desenhoDaFotografia`): sem material, a moldura só na
    demonstração; fora dela, o bloco vira duas colunas de texto;
  - os cartões (`quemEhAmi`): sem texto e fora da demonstração, nenhum, e
    então o bloco "Princípios" sai inteiro: sem texto verdadeiro, a
    introdução não tem o que dizer sozinha.

  `data-faixa`: o rodapé lê a marca. Entra na tela com a `.revelar`.
*/
export function QuemSomos({
  demonstracao,
  apresentacao,
  texto,
}: {
  demonstracao: boolean;
  apresentacao: ApresentacaoNaTela | null;
  texto: TextoInstitucional;
}) {
  const temFoto = desenhoDaFotografia(ESPACOS.sede.provisoria, demonstracao) !== "nada";
  const { cartoes } = quemEhAmi(demonstracao, texto);
  const [fixo] = AMI.telefones;
  const e = AMI.endereco;

  return (
    <section
      data-bloco="quem-somos"
      data-faixa=""
      aria-labelledby="quem-somos-titulo"
      className={`revelar ${associe.faixa}`}
    >
      <div className={`${associe.duplo}${temFoto ? ` ${associe.comFoto}` : ""}`}>
        <div className={`${associe.corpo} ${styles.corpo}${temFoto ? "" : ` ${styles.semFoto}`}`}>
          <span className="rotulo-secao" data-coluna="">
            Quem somos
          </span>
          <h2 id="quem-somos-titulo" className={associe.titulo}>
            {`A ${AMI.razaoSocial}`}
          </h2>

          {apresentacao?.tipo === "texto" ? (
            <div className={styles.apresentacao}>
              <CorpoDoTexto blocos={apresentacao.blocos} />
            </div>
          ) : apresentacao?.tipo === "a-entrar" ? (
            <p className={`${styles.apresentacao} ${styles.falta}`} data-a-entrar="apresentação">
              {TEXTO_A_ENTRAR}
            </p>
          ) : null}

          <div className={styles.sede}>
            <LadrilhoIcone nome="comoChegar" pequeno />
            <div>
              <h3 className={styles.sedeTitulo}>Sede da AMI</h3>
              <address className={styles.endereco}>
                {`${e.logradouro}, ${e.numero}`}
                <br />
                {`${e.bairro}, ${e.cidade} – ${e.uf}`}
                <br />
                {`CEP ${e.cep}`}
              </address>
            </div>
            <div className={styles.acoes}>
              <a className="botao" href={linkDoMapaDaAmi()} aria-label="Como chegar à sede da AMI (abre o mapa)">
                Como chegar <Icone nome="setaDiagonal" />
              </a>
              <a className="botao-contorno" href={hrefTelefone(fixo)} aria-label={`Ligar ${fixo} para a AMI`}>
                <Icone nome="telefone" /> {fixo}
              </a>
            </div>
          </div>
        </div>

        {temFoto ? (
          <div className={associe.foto}>
            <Fotografia
              espaco="sede"
              demonstracao={demonstracao}
              sizes={SIZES_DA_SEDE}
              className={associe.fotografia}
            />
          </div>
        ) : null}
      </div>

      {cartoes.length > 0 ? (
        <PrincipiosDaAmi cartoes={cartoes} rotulo="Princípios" titulo="Missão, visão e valores" />
      ) : null}
    </section>
  );
}
