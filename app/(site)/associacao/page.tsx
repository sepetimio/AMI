import type { Metadata } from "next";
import Link from "next/link";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { TextoRico } from "@/components/editorial/TextoRico";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList } from "@/lib/seo/jsonld";
import { tituloDePagina } from "@/lib/seo/metadados";
import { paginaPorSlug } from "@/lib/sanity/consultas";
import { dataPorExtenso } from "@/lib/formato";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* Título de reserva. O documento "associacao" do Sanity tem campo `titulo`
   obrigatório, e é ele que manda quando existe: sem isso a secretaria
   preencheria um campo obrigatório e não veria efeito nenhum na tela. */
const TITULO = "A Associação Médica de Imperatriz";
const RESUMO_PADRAO = "Quem é a AMI, o que faz e como se associar.";

const TRILHA = [
  { nome: "Início", caminho: "/" },
  { nome: "A Associação", caminho: "/associacao" },
];

/*
  Os quatro caminhos que /associacao existe para apontar. Vêm do código, não
  do Sanity: são a navegação da seção institucional, e a seção institucional
  precisa existir mesmo no dia em que ninguém escreveu uma linha de prosa
  ainda. "Diretoria" está aqui mesmo sendo rota estática (tarefa 8, sem
  Sanity envolvido); as outras três são as subpáginas de prosa da tarefa 9.
*/
const CAMINHOS = [
  {
    titulo: "Diretoria",
    caminho: "/associacao/diretoria",
    nota: "Quem responde pela associação, com o CRM de cada diretor.",
  },
  {
    titulo: "Benefícios",
    caminho: "/associacao/beneficios",
    nota: "O que a AMI oferece a quem é associado.",
  },
  {
    titulo: "Estatuto",
    caminho: "/associacao/estatuto",
    nota: "As regras que organizam a associação.",
  },
  {
    titulo: "Política editorial",
    caminho: "/associacao/politica-editorial",
    nota: "Como o site escolhe, apura e revisa o que publica.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const conteudo = await paginaPorSlug("associacao");
  return {
    title: tituloDePagina(conteudo?.titulo ?? TITULO),
    description: conteudo?.resumo ?? RESUMO_PADRAO,
    alternates: { canonical: "/associacao" },
  };
}

/*
  /associacao é página ÍNDICE, não prosa. É a correção do defeito do brief
  original: ele mandava este componente chamar `notFound()` quando o Sanity
  não tivesse o documento "associacao", e como o dataset está vazio, o efeito
  seria trocar um 404 por outro. Todo link do menu, do rodapé e do botão da
  home aponta para cá; o trabalho desta página é navegação, e navegação não
  depende de conteúdo publicado.

  Por isso ela nunca chama `notFound()` e não usa `PaginaDeTexto` (que é o
  componente das páginas de prosa pura, ver o comentário lá). Os quatro
  caminhos de `CAMINHOS`, acima, renderizam sempre. Quando a AMI escrever a
  prosa institucional no Studio, ela entra como um bloco a mais, por cima dos
  caminhos, nunca no lugar deles.
*/
export default async function PaginaAssociacao() {
  const conteudo = await paginaPorSlug("associacao");

  return (
    <>
      <JsonLd dados={breadcrumbList(TRILHA, SITE)} />

      <Cabeceira trilha={TRILHA} titulo={conteudo?.titulo ?? TITULO}>
        {conteudo?.resumo ?? RESUMO_PADRAO}
      </Cabeceira>

      <div className="mx-auto max-w-[1200px] px-4 pb-20 md:px-6">
        {conteudo ? (
          <div className="pt-2">
            <p className="registro border-b border-line py-5 text-[15px] text-ink-400">
              Atualizado em {dataPorExtenso(conteudo.atualizadoEm)}
            </p>
            <div className="mt-2">
              <TextoRico blocos={conteudo.corpo} />
            </div>
          </div>
        ) : (
          /* Reserva de conteúdo enquanto o documento "associacao" não existe
             no Studio. Some sozinho assim que `paginaPorSlug` passar a
             devolver algo: o ramo acima entra no lugar deste. */
          <p className="coluna-leitura pt-8 text-ink-600">
            [PROVISÓRIO] A AMI reúne os médicos que atendem em Imperatriz e na
            região sul do Maranhão, e mantém este diretório para que a
            população encontre quem atende perto de casa. A apresentação
            oficial da entidade entra aqui assim que a diretoria publicar o
            texto no Studio.
          </p>
        )}

        <nav aria-labelledby="associacao-navegacao" className="mt-16">
          <h2
            id="associacao-navegacao"
            className="border-b border-line-strong pb-4"
          >
            Saiba mais
          </h2>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {CAMINHOS.map((c) => (
              <li key={c.caminho}>
                <Link
                  href={c.caminho}
                  className="pressiona flex min-h-[88px] flex-col justify-center rounded-bloco border border-line bg-surface px-5 py-4 hover:border-ami-green-600 hover:bg-ami-mint-100 hover:shadow-erguido"
                >
                  <span className="font-titulo text-[17px] font-semibold [font-stretch:90%]">
                    {c.titulo}
                  </span>
                  <span className="mt-1 text-[14px] text-ink-400">
                    {c.nota}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
