import type { ReactNode } from "react";
import {
  defaultComponents,
  PortableText,
  type PortableTextComponents,
} from "@portabletext/react";
import styles from "@/components/especialidades/SobreAEspecialidade.module.css";
import { tituloDoSobre, type SobreNaTela } from "@/lib/especialidades";
import { TEXTO_A_ENTRAR } from "@/lib/molduras";

type ComFilhos = { children?: ReactNode };

/* Só o texto, sem marca em volta. */
const SoOTexto = ({ children }: ComFilhos) => <>{children}</>;

/*
  O texto do Studio só tem parágrafo e lista com marcadores, sem negrito,
  itálico nem link (sanity/schemas/textoDeEspecialidade.ts). Cada um sai como
  tag simples, e o CSS do bloco desenha.

  Um texto que chegue por fora do Studio pode trazer o que o schema não
  permite. Ele sai como o que o schema permite:
  - qualquer estilo de bloco (título, citação) sai como `p`;
  - qualquer lista (a numerada também) sai como `ul` e `li`;
  - qualquer marca, as que a biblioteca desenharia (`defaultComponents.marks`)
    e as desconhecidas, sai só como o texto;
  - um bloco que não é de texto (uma imagem) não sai.
*/
const COMPONENTES: PortableTextComponents = {
  block: ({ children }: ComFilhos) => <p>{children}</p>,
  list: ({ children }: ComFilhos) => <ul>{children}</ul>,
  listItem: ({ children }: ComFilhos) => <li>{children}</li>,
  marks: Object.fromEntries(Object.keys(defaultComponents.marks).map((marca) => [marca, SoOTexto])),
  unknownMark: SoOTexto,
  unknownType: () => null,
};

/*
  "Sobre a {especialidade}": a faixa branca de ponta a ponta que fecha a
  página da especialidade.
  - Duas colunas, "O que faz" e "Quando procurar".
  - Embaixo, quem revisou, o CRM e o mês da revisão, e o aviso de que o
    conteúdo é informativo.

  Conteúdo de saúde é do tipo que o Google chama de YMYL, em que as
  diretrizes de avaliação dele dão peso a quem responde pelo conteúdo.
  Mostrar quem revisou, e quando, vai nessa direção; não garante posição na
  busca.

  O que sai é decidido por `sobreDaEspecialidade` (lib/especialidades.ts):
  - com o texto da AMI no Sanity, ele sai;
  - na demonstração sem texto, sai "Texto da AMI a entrar." no lugar dos
    dois textos, e sem a linha do revisor, que não existe;
  - fora dela, a página nem monta este bloco.

  Leva `data-faixa`: o rodapé emenda nele quando ele fecha a página
  (components/layout/Rodape.module.css). Entra na tela com a `.revelar`.
*/
export function SobreAEspecialidade({ nome, sobre }: { nome: string; sobre: SobreNaTela }) {
  const texto = sobre.tipo === "texto" ? sobre.texto : null;

  return (
    <section
      data-bloco="sobre"
      data-faixa=""
      aria-labelledby="sobre-titulo"
      className={`revelar ${styles.faixa}`}
    >
      <h2 id="sobre-titulo" data-coluna="">
        {tituloDoSobre(nome)}
      </h2>

      <div className={styles.colunas}>
        <div>
          <h3>O que faz</h3>
          {texto ? (
            <PortableText value={texto.oQueFaz} components={COMPONENTES} onMissingComponent={false} />
          ) : (
            <p className={styles.falta}>{TEXTO_A_ENTRAR}</p>
          )}
        </div>
        <div>
          <h3>Quando procurar</h3>
          {texto ? (
            <PortableText value={texto.quandoProcurar} components={COMPONENTES} onMissingComponent={false} />
          ) : (
            <p className={styles.falta}>{TEXTO_A_ENTRAR}</p>
          )}
        </div>
      </div>

      <div className={styles.revisao}>
        {texto ? (
          <p>
            Revisado por <b>{texto.revisorNome}</b>
            {" · "}
            <span className={styles.crm}>{texto.revisorCrm}</span>
            {` · revisão em ${texto.mesDaRevisao}`}
          </p>
        ) : null}
        <p>Conteúdo informativo; não substitui a consulta médica.</p>
      </div>
    </section>
  );
}
