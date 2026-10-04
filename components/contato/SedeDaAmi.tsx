import Link from "next/link";
import { SIZES_DA_SEDE } from "@/components/associacao/QuemSomos";
import quem from "@/components/associacao/QuemSomos.module.css";
import { Fotografia } from "@/components/base/Fotografia";
import { Icone, LadrilhoIcone } from "@/components/base/IconeServidor";
import styles from "@/components/contato/Contato.module.css";
import associe from "@/components/home/SejaAssociado.module.css";
import { AMI, linkDoMapaDaAmi } from "@/lib/ami";
import { ESPACOS } from "@/lib/imagens";
import { desenhoDaFotografia } from "@/lib/molduras";

/*
  A sede, numa faixa branca de ponta a ponta, que fecha o contato: o bloco
  "Quem somos" de A Associação (components/associacao/QuemSomos.tsx), com
  as folhas dele.
  - À esquerda: "SEDE", "Onde fica a AMI", a frase, o quadro do endereço
    (o nome, o endereço em três linhas, o CNPJ e "Como chegar") e, só no
    modo demonstração, o quadro do horário de atendimento, como moldura "a
    entrar" (`data-a-entrar`): a AMI ainda não informou o horário, e não há
    onde guardá-lo.
  - À direita, a foto da sede (`ESPACOS.sede`, lib/imagens.ts), com a trava
    de sempre (`desenhoDaFotografia`): sem material, a moldura só na
    demonstração. Sem ela, o bloco vira duas colunas de texto, com o título
    preso no alto (`data-sem-foto`).
  - Depois de um fio, o fecho: "Médico interessado em se associar?", com o
    botão para Seja associado.

  "Como chegar" abre o Google Maps na mesma aba, como em "Quem somos" e no
  perfil (components/perfil/OndeAtende.tsx), e o nome do botão para o
  leitor de tela começa pelo que está escrito nele. Sem mapa embutido:
  nada de terceiros na página.

  `data-faixa`: a sede fecha a página, e o rodapé emenda nela
  (components/layout/Rodape.module.css). Entra na tela com a `.revelar`.
*/
export function SedeDaAmi({ demonstracao }: { demonstracao: boolean }) {
  const temFoto = desenhoDaFotografia(ESPACOS.sede.provisoria, demonstracao) !== "nada";
  const e = AMI.endereco;

  return (
    <section
      data-bloco="sede"
      data-faixa=""
      aria-labelledby="sede-titulo"
      className={`revelar ${associe.faixa} ${styles.sedeDoContato}`}
    >
      <div className={`${associe.duplo}${temFoto ? ` ${associe.comFoto}` : ""}`}>
        <div
          className={`${associe.corpo} ${quem.corpo}${temFoto ? "" : ` ${quem.semFoto}`} ${styles.corpo}`}
          data-sem-foto={temFoto ? undefined : ""}
        >
          <span className="rotulo-secao" data-coluna="">
            Sede
          </span>
          <h2 id="sede-titulo" className={associe.titulo}>
            Onde fica a AMI
          </h2>
          <p className={styles.texto}>{`No ${e.bairro} de ${e.cidade}, na ${e.logradouro}.`}</p>

          <div className={quem.sede}>
            <LadrilhoIcone nome="comoChegar" pequeno />
            <div>
              <h3 className={quem.sedeTitulo}>{AMI.razaoSocial}</h3>
              <address className={quem.endereco}>
                {`${e.logradouro}, ${e.numero}`}
                <br />
                {`${e.bairro}, ${e.cidade} – ${e.uf}`}
                <br />
                {`CEP ${e.cep}`}
              </address>
              <p className={styles.cnpj}>{`CNPJ ${AMI.cnpj}`}</p>
            </div>
            <div className={`${quem.acoes} ${styles.acoes}`}>
              <a className="botao" href={linkDoMapaDaAmi()} aria-label="Como chegar à sede da AMI (abre o mapa)">
                Como chegar <Icone nome="setaDiagonal" />
              </a>
            </div>
          </div>

          {demonstracao ? (
            <div className={`${quem.sede} ${styles.horario}`} data-a-entrar="horário de atendimento">
              <LadrilhoIcone nome="horario" pequeno />
              <div>
                <h3 className={quem.sedeTitulo}>Horário de atendimento</h3>
                <p className={styles.falta}>Horário de atendimento da sede a entrar.</p>
              </div>
            </div>
          ) : null}
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

      <div className={styles.separa} aria-hidden="true"></div>

      <div className={styles.fecho} data-coluna="">
        <LadrilhoIcone nome="parceria" pequeno />
        <p>
          <strong>Médico interessado em se associar?</strong> A página Seja associado diz quem pode se
          associar e como fazer isso.
        </p>
        <Link className="botao-contorno" href="/associacao/seja-associado">
          Seja associado <Icone nome="seta" />
        </Link>
      </div>
    </section>
  );
}
