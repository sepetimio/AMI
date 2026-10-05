import type { PortableTextBlock } from "@portabletext/react";
import type { ReactNode } from "react";
import { CorpoDoTexto } from "@/components/editorial/CorpoDoTexto";
import { IndiceNestaPagina, IndiceRecolhido } from "@/components/editorial/IndiceNestaPagina";
import styles from "@/components/editorial/PaginaDeTexto.module.css";
import { dataPorExtenso } from "@/lib/formato";
import { indiceNestaPagina } from "@/lib/nestaPagina";
import { ancorasDoCorpo } from "@/lib/paginaDeTexto";
import type { AvisoDoRascunho } from "@/lib/rascunhosLegais";

/*
  O corpo de uma página de texto (components/editorial/PaginaDeTexto.tsx),
  e o da notícia aberta: uma faixa branca de ponta a ponta, sem canto nem
  sombra, com a coluna de leitura de 680px (o CSS é
  PaginaDeTexto.module.css). Na coluna, de cima para baixo:
  - "Atualizado em", quando há data;
  - o índice recolhido, no celular;
  - o quadro de aviso, quando há (só o rascunho das páginas de texto tem);
  - o texto (components/editorial/CorpoDoTexto.tsx);
  - `children`: o "Fale com a AMI" de Seja associado, por exemplo.

  À direita, o índice "Nesta página", montado dos títulos de seção (h2) e
  preso à rolagem. Com menos de dois títulos, não aparece
  (lib/nestaPagina.ts).

  `rotulo` é o nome da faixa para o leitor de tela ("Texto da página",
  "Texto da notícia"). A faixa leva `data-faixa`: quando ela fecha a
  página, o rodapé emenda nela (components/layout/Rodape.module.css).
*/
export function FaixaDoTexto({
  rotulo,
  atualizadoEm,
  aviso = null,
  corpo,
  children,
}: {
  rotulo: string;
  atualizadoEm?: string;
  aviso?: AvisoDoRascunho | null;
  corpo: PortableTextBlock[];
  children?: ReactNode;
}) {
  const ancoras = ancorasDoCorpo(corpo);
  const indice = indiceNestaPagina(ancoras.map(({ id, titulo }) => ({ id, titulo })));
  const idDoBloco = Object.fromEntries(ancoras.map((a) => [a.chave, a.id]));
  const data = atualizadoEm ? dataPorExtenso(atualizadoEm) : "";

  return (
    <section data-bloco="texto" data-faixa="" aria-label={rotulo} className={styles.faixa}>
      <div className={styles.grade}>
        <article className={styles.coluna} data-coluna="">
          {data ? (
            <p className={styles.atualizado}>
              Atualizado em <time dateTime={atualizadoEm}>{data}</time>
            </p>
          ) : null}

          {indice.length > 0 ? <IndiceRecolhido itens={indice} /> : null}

          {aviso ? (
            <div className={styles.quadro} role="note">
              <p className={styles.quadroTitulo}>{aviso.titulo}</p>
              <p>{aviso.texto}</p>
            </div>
          ) : null}

          <CorpoDoTexto blocos={corpo} ancoras={idDoBloco} />

          {children}
        </article>

        {indice.length > 0 ? <IndiceNestaPagina itens={indice} /> : null}
      </div>
    </section>
  );
}
