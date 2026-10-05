import styles from "@/components/associacao/FaixaDaAssociacao.module.css";
import busca from "@/components/busca/FaixaDaBusca.module.css";
import { AMI } from "@/lib/ami";
import { numerosDaAssociacao } from "@/lib/associacao";

/*
  A faixa verde de ponta a ponta que abre A Associação (/associacao):
  - o rótulo, o título com o ano de fundação (`AMI.fundadaEm`) e o
    parágrafo de apresentação;
  - à direita, os três números da home, cada um com o número e o rótulo:
    anos, médicos e especialidades (`numerosDaAssociacao`,
    lib/associacao.ts), sem a contagem animada da home, que lá serve para
    chamar o olho logo abaixo do carrossel.

  Sem `Cabeceira` e sem trilha.

  - `data-abertura`: a barra do pé do celular aparece quando esta faixa sai
    da tela (components/layout/BarraDoPe.tsx).
  - `data-faixa`: a faixa fica fora da coluna da página
    (app/(site)/encontre.module.css).
*/
export function FaixaDaAssociacao({
  anos,
  medicos,
  especialidades,
}: {
  anos: number;
  medicos: number;
  especialidades: number;
}) {
  return (
    <section
      data-bloco="topo"
      data-faixa=""
      data-abertura=""
      aria-labelledby="associacao-titulo"
      className={`textura-verde ${busca.faixa} ${styles.inst}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        <span className={`rotulo-secao ${busca.sobre}`} data-coluna="">
          A Associação
        </span>
        <h1 id="associacao-titulo" className={busca.titulo}>
          {`Desde ${AMI.fundadaEm} com os médicos de Imperatriz`}
        </h1>
        <p className={busca.texto}>
          {`A ${AMI.razaoSocial} está em atividade desde ${AMI.fundadaEm} e representa a classe médica na região sul do Maranhão. Mantém este diretório para que a população encontre quem atende perto de casa, com informação correta e verificada.`}
        </p>
      </div>

      <ul className={styles.numeros} aria-label="A AMI em números">
        {numerosDaAssociacao({ anos, medicos, especialidades }).map((n) => (
          <li key={n.rotulo}>
            <span className={styles.grande}>{n.valor}</span>
            <span className={styles.rotulo}>{n.rotulo}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
