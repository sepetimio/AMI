import type { ReactNode } from "react";
import paginas from "@/app/(site)/encontre.module.css";
import type { NomeIcone } from "@/components/base/IconeServidor";
import { FaixaDoTexto } from "@/components/editorial/FaixaDoTexto";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import type { ConteudoDaPagina, VoltaDaPagina } from "@/lib/paginaDeTexto";

/*
  O modelo das páginas de texto: Seja associado, Estatuto, Política
  editorial, Benefícios e os três textos legais (privacidade, cookies e
  termos de uso).
  - A faixa verde curta (components/layout/FaixaCurta.tsx), com o link de
    volta (`volta`), o título, o resumo e o ícone da página.
  - O corpo numa faixa branca de ponta a ponta, em coluna de leitura de
    680px, com a data de atualização, o quadro de aviso, quando há, o texto
    e o índice "Nesta página" (components/editorial/FaixaDoTexto.tsx).
  - `children` entra no fim da coluna: o "Fale com a AMI" de Seja associado.

  O texto chega pronto (`ConteudoDaPagina`, lib/paginaDeTexto.ts), do
  documento do Studio ou do rascunho em código. O rascunho existe porque a
  alternativa era pior: sem ele, os três textos legais, linkados do rodapé
  de toda página, e o "Seja associado" da home davam 404 até a AMI publicar
  o texto dela; num site que lida com saúde, a falta de política de
  privacidade é falha mais visível do que um rascunho assinalado. O quadro
  de aviso, que a faixa branca desenha, diz isso a quem lê, antes do
  primeiro parágrafo. Ele é `role="note"`, e não `alert`: alerta interrompe
  quem usa leitor de tela, e isto é contexto para ler antes do texto, não
  emergência.

  A data de atualização sai visível, e não só no metadado: numa política de
  privacidade, saber de quando é a versão que se está lendo é a informação
  mais importante da página depois do próprio texto. O rascunho e o Studio
  sempre trazem a data (`atualizadoEm` é obrigatório nos dois).

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
  return (
    <div className={paginas.pagina}>
      <FaixaCurta volta={volta} titulo={conteudo.titulo} texto={conteudo.resumo} icone={icone} />
      <FaixaDoTexto
        rotulo="Texto da página"
        atualizadoEm={conteudo.atualizadoEm}
        aviso={conteudo.aviso}
        corpo={conteudo.corpo}
      >
        {children}
      </FaixaDoTexto>
    </div>
  );
}
