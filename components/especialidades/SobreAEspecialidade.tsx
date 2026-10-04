import { PortableText, type PortableTextComponents } from "@portabletext/react";
import styles from "@/components/especialidades/SobreAEspecialidade.module.css";
import { tituloDoSobre, type SobreNaTela } from "@/lib/especialidades";
import { TEXTO_A_ENTRAR } from "@/lib/molduras";

/* O texto do Studio só tem parágrafo e lista com marcadores
   (sanity/schemas/textoDeEspecialidade.ts). Cada um sai como tag simples, e
   o CSS do bloco desenha. */
const COMPONENTES: PortableTextComponents = {
  block: { normal: ({ children }) => <p>{children}</p> },
  list: { bullet: ({ children }) => <ul>{children}</ul> },
  listItem: { bullet: ({ children }) => <li>{children}</li> },
};

/*
  "Sobre a {especialidade}": a faixa branca de ponta a ponta que fecha a
  página da especialidade.
  - Duas colunas, "O que faz" e "Quando procurar".
  - Embaixo, quem revisou, o CRM e o mês da revisão, e o aviso de que o
    conteúdo é informativo.

  Conteúdo de saúde é avaliado sob o critério YMYL do Google: sem autoria
  creditada e data de revisão, não ranqueia.

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
