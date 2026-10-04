import type { Metadata } from "next";
import paginas from "@/app/(site)/encontre.module.css";
import { FaixaDaDiretoria } from "@/components/associacao/FaixaDaDiretoria";
import { EstadoVazio } from "@/components/base/EstadoVazio";
import { GradeDeDiretores } from "@/components/diretorio/GradeDeDiretores";
import { listarDiretoria } from "@/lib/dados/diretoria";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: tituloDePagina("Diretoria da Associação Médica de Imperatriz"),
  description:
    "Quem responde pela Associação Médica de Imperatriz, com cargo, nome e " +
    "número de inscrição no CRM.",
  alternates: { canonical: "/associacao/diretoria" },
};

/* Os cartões da primeira fileira do computador: baixam a foto logo. */
const IMEDIATOS = 4;

/*
  A diretoria da AMI:
  - a faixa verde curta, com a volta para A Associação e, só no modo
    demonstração, a pílula do mandato;
  - os cartões de diretor na grade da busca, na ordem da AMI.

  Os nomes, cargos e CRMs vêm da tabela `diretoria` do banco
  (`listarDiretoria`, lib/dados/diretoria.ts). Sem diretor publicado, o
  aviso de vazio fica no lugar da grade.

  Sem `Cabeceira`, sem trilha e sem BreadcrumbList: dado estruturado sem o
  equivalente visível é marcação enganosa (lib/seo/jsonld.ts). Os blocos
  são filhos diretos de `.pagina` (app/(site)/encontre.module.css), a
  --ritmo um do outro; a grade fecha a página, a --ritmo do rodapé.
*/
export default async function PaginaDiretoria() {
  const diretoria = await listarDiretoria();

  return (
    <div className={paginas.pagina}>
      <FaixaDaDiretoria demonstracao={DADOS_DEMONSTRACAO} />

      <section data-bloco="diretoria" aria-labelledby="membros-titulo">
        <h2 id="membros-titulo" className="sr-only">
          Membros da diretoria
        </h2>
        {diretoria.length === 0 ? (
          <EstadoVazio
            titulo="Diretoria ainda não cadastrada"
            descricao="A composição da diretoria aparece aqui assim que a AMI a registrar."
          />
        ) : (
          <GradeDeDiretores diretores={diretoria} imediatos={IMEDIATOS} />
        )}
      </section>
    </div>
  );
}
