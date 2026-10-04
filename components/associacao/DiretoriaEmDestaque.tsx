import Link from "next/link";
import { Icone } from "@/components/base/IconeServidor";
import styles from "@/components/associacao/SecoesDaAssociacao.module.css";
import { GradeDeDiretores } from "@/components/diretorio/GradeDeDiretores";
import type { Diretor } from "@/lib/dados/diretoria";

/*
  A diretoria em destaque, aberta sobre o fundo da página de A Associação:
  o cabeçalho de seção da home ("DIRETORIA", "Quem responde pela AMI", a
  frase e o botão-linha "Ver a diretoria") e os cartões de diretor, os
  mesmos da página da diretoria. Quem escolhe os diretores é a página
  (`diretoriaEmDestaque`, lib/associacao.ts).
*/
export function DiretoriaEmDestaque({ diretores }: { diretores: Diretor[] }) {
  return (
    <section data-bloco="diretoria" aria-labelledby="diretoria-titulo">
      <div className={styles.cabSecao}>
        <div>
          <span className="rotulo-secao" data-coluna="">
            Diretoria
          </span>
          <h2 id="diretoria-titulo" className={styles.titulo}>
            Quem responde pela AMI
          </h2>
          <p className={styles.texto}>Cada nome traz o número de inscrição no CRM.</p>
        </div>
        <Link className="botao-linha" href="/associacao/diretoria">
          Ver a diretoria <Icone nome="seta" />
        </Link>
      </div>
      <GradeDeDiretores diretores={diretores} />
    </section>
  );
}
