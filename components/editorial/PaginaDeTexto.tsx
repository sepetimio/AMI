import type { ReactNode } from "react";
import paginas from "@/app/(site)/encontre.module.css";
import { Icone, type NomeIcone } from "@/components/base/IconeServidor";
import { CorpoDoTexto } from "@/components/editorial/CorpoDoTexto";
import { IndiceNestaPagina, IndiceRecolhido } from "@/components/editorial/IndiceNestaPagina";
import styles from "@/components/editorial/PaginaDeTexto.module.css";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { dataPorExtenso } from "@/lib/formato";
import { indiceNestaPagina } from "@/lib/nestaPagina";
import { ancorasDoCorpo, type ConteudoDaPagina, type VoltaDaPagina } from "@/lib/paginaDeTexto";

/*
  O modelo das páginas de texto: Seja associado, Estatuto, Política
  editorial, Benefícios e os três textos legais (privacidade, cookies e
  termos de uso).
  - A faixa verde curta (components/layout/FaixaCurta.tsx), com o link de
    volta (`volta`), o título, o resumo e o ícone da página.
  - O corpo numa faixa branca de ponta a ponta, em coluna de leitura de
    680px: a data de atualização, o quadro de aviso, quando há, e o texto.
  - O índice "Nesta página", montado dos títulos de seção (h2): à direita e
    preso à rolagem no computador, recolhido no alto da coluna no celular.
    Com menos de dois títulos, não aparece (lib/nestaPagina.ts).
  - `children` entra no fim da coluna: o "Fale com a AMI" de Seja associado.

  O texto chega pronto (`ConteudoDaPagina`, lib/paginaDeTexto.ts), do
  documento do Studio ou do rascunho em código. O rascunho existe porque a
  alternativa era pior: sem ele, os três textos legais, linkados do rodapé
  de toda página, e o "Seja associado" da home davam 404 até a AMI publicar
  o texto dela; num site que lida com saúde, a falta de política de
  privacidade é falha mais visível do que um rascunho assinalado. O quadro
  de aviso diz isso a quem lê, antes do primeiro parágrafo. Ele é
  `role="note"`, e não `alert`: alerta interrompe quem usa leitor de tela,
  e isto é contexto para ler antes do texto, não emergência.

  A data de atualização sai visível, e não só no metadado: numa política de
  privacidade, saber de quando é a versão que se está lendo é a informação
  mais importante da página depois do próprio texto.

  Sem `Cabeceira`, sem trilha e sem BreadcrumbList: dado estruturado sem o
  equivalente visível é marcação enganosa (lib/seo/jsonld.ts). Os dois
  blocos são filhos diretos de `.pagina` (app/(site)/encontre.module.css);
  o corpo é faixa (`data-faixa`), e o rodapé emenda nele
  (components/layout/Rodape.module.css).
*/
export function PaginaDeTexto({
  conteudo,
  volta,
  icone,
  children,
}: {
  conteudo: ConteudoDaPagina;
  volta: VoltaDaPagina;
  icone: NomeIcone;
  children?: ReactNode;
}) {
  const ancoras = ancorasDoCorpo(conteudo.corpo);
  const indice = indiceNestaPagina(ancoras.map(({ id, titulo }) => ({ id, titulo })));
  const idDoBloco = Object.fromEntries(ancoras.map((a) => [a.chave, a.id]));
  const data = dataPorExtenso(conteudo.atualizadoEm);

  return (
    <div className={paginas.pagina}>
      <FaixaCurta volta={volta} titulo={conteudo.titulo} texto={conteudo.resumo} icone={icone} />

      <section data-bloco="texto" data-faixa="" aria-label="Texto da página" className={styles.faixa}>
        <div className={styles.grade}>
          <article className={styles.coluna} data-coluna="">
            {data ? (
              <p className={styles.atualizado}>
                <Icone nome="relogio" />
                Atualizado em <time dateTime={conteudo.atualizadoEm}>{data}</time>
              </p>
            ) : null}

            {indice.length > 0 ? <IndiceRecolhido itens={indice} /> : null}

            {conteudo.aviso ? (
              <div className={styles.quadro} role="note">
                <Icone nome="informacao" duotone />
                <div>
                  <p className={styles.quadroTitulo}>{conteudo.aviso.titulo}</p>
                  <p>{conteudo.aviso.texto}</p>
                </div>
              </div>
            ) : null}

            <CorpoDoTexto blocos={conteudo.corpo} ancoras={idDoBloco} />

            {children}
          </article>

          {indice.length > 0 ? <IndiceNestaPagina itens={indice} /> : null}
        </div>
      </section>
    </div>
  );
}
