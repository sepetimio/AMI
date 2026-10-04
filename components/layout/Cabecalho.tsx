import Link from "next/link";
import { Marca } from "@/components/marca/Marca";
import { MenuPrincipal } from "@/components/layout/MenuPrincipal";
import styles from "@/components/layout/Cabecalho.module.css";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { menuDoSite } from "@/lib/menu";

/*
  Cabeçalho fino num bloco branco, preso no topo durante a rolagem.

  Ele é filho direto do corpo da página: `app/(site)/layout.tsx` o coloca logo
  antes de `<main>`, sem nada entre os dois. Não embrulhe `<Cabecalho />` em
  um elemento que termine antes do fim da página: um elemento preso só
  acompanha a rolagem dentro do bloco que o contém, e no desenho foi
  exatamente assim que o cabeçalho sumia no meio da página.

  Aqui vive o que é só marcação: a marca e o botão "Seja associado". O menu
  é folha cliente (precisa do caminho atual e do estado da gaveta) e recebe o
  botão como filho, para que ele fique entre o menu e o botão da gaveta sem
  deixar de ser renderizado no servidor. A lista de itens também sai daqui,
  já decidida pela chave de demonstração (`menuDoSite`, lib/menu.ts): o menu,
  sendo de cliente, não lê a chave.

  O desfoque ao rolar está em `Cabecalho.module.css`, feito só em CSS.
*/
export function Cabecalho() {
  return (
    <header className={styles.topo}>
      <div className={styles.caixa}>
        <div className={styles.cabeca}>
          <Link
            href="/"
            className={styles.logo}
            aria-label="Ir para a página inicial da AMI"
          >
            <Marca altura={40} />
          </Link>

          <MenuPrincipal itens={menuDoSite(DADOS_DEMONSTRACAO)}>
            <Link
              href="/associacao/seja-associado"
              className={`botao ${styles.seja}`}
            >
              Seja associado
            </Link>
          </MenuPrincipal>
        </div>
      </div>
    </header>
  );
}
