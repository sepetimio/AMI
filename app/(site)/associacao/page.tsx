import type { Metadata } from "next";
import paginas from "@/app/(site)/encontre.module.css";
import { DiretoriaEmDestaque } from "@/components/associacao/DiretoriaEmDestaque";
import { FaixaDaAssociacao } from "@/components/associacao/FaixaDaAssociacao";
import { FechoAssocie } from "@/components/associacao/FechoAssocie";
import { QuemSomos } from "@/components/associacao/QuemSomos";
import { SaibaMais } from "@/components/associacao/SaibaMais";
import { anosDeAmi } from "@/lib/ami";
import { apresentacaoDaAssociacao, atalhosDoSaibaMais, diretoriaEmDestaque } from "@/lib/associacao";
import { listarDiretoria } from "@/lib/dados/diretoria";
import { especialidadesComContagem } from "@/lib/dados/especialidades";
import { buscarMedicos } from "@/lib/dados/medicos";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { TEXTO_INSTITUCIONAL } from "@/lib/molduras";
import { RASCUNHOS_DE_ASSOCIACAO } from "@/lib/rascunhosLegais";
import { caminhosDePaginasPublicadas, paginaPorSlug } from "@/lib/sanity/consultas";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

/* Título e resumo de reserva. O documento "associacao" do Studio tem
   `titulo` e `resumo` obrigatórios, e eles mandam quando existem: sem isso
   a AMI preencheria dois campos obrigatórios e não veria efeito nenhum. */
const TITULO = "A Associação Médica de Imperatriz";
const RESUMO_PADRAO = "Quem é a AMI, o que faz e como se associar.";

/* As páginas da associação que têm rascunho em código: existem mesmo sem
   documento no Studio (hoje, Seja associado). */
const COM_RASCUNHO = Object.keys(RASCUNHOS_DE_ASSOCIACAO).map((slug) => `/associacao/${slug}`);

export async function generateMetadata(): Promise<Metadata> {
  const conteudo = await paginaPorSlug("associacao");
  return {
    title: tituloDePagina(conteudo?.titulo ?? TITULO),
    description: conteudo?.resumo ?? RESUMO_PADRAO,
    alternates: { canonical: "/associacao" },
  };
}

/*
  A página institucional (item "A Associação" do menu), na ordem do desenho
  aprovado:
  - a faixa verde, com o título, a apresentação curta e os três números;
  - "Quem somos": a apresentação oficial, a sede e Missão, visão e valores;
  - a diretoria em destaque, com o link para a diretoria inteira;
  - "Saiba mais": atalhos para Seja associado, Estatuto e Política
    editorial;
  - o fecho, com o convite para se associar.

  Ela nunca dá 404: a navegação da seção existe mesmo no dia em que a AMI
  não publicou texto nenhum. O que falta segue a trava da demonstração
  (lib/associacao.ts e lib/molduras.ts): na demonstração, sai como moldura
  "a entrar"; fora dela, some, e os blocos que ficam sem conteúdo saem
  inteiros.

  A apresentação oficial é o texto do documento "associacao" do Studio
  (tipo "Página institucional"); o título e o resumo dele vão para os
  metadados. Uma página existe, para "Saiba mais", quando está publicada no
  Studio ou tem rascunho em código.

  Sem `Cabeceira`, sem trilha e sem BreadcrumbList: dado estruturado sem o
  equivalente visível é marcação enganosa (lib/seo/jsonld.ts). Os blocos
  são filhos diretos de `.pagina` (app/(site)/encontre.module.css), a
  --ritmo um do outro; o fecho é faixa, e o rodapé emenda nele.
*/
export default async function PaginaAssociacao() {
  /* O total de médicos vem da contagem de profissionais, e não da soma por
     especialidade, que conta duas vezes quem tem duas, como na home. */
  const [conteudo, publicadas, diretoria, especialidades, medicos] = await Promise.all([
    paginaPorSlug("associacao"),
    caminhosDePaginasPublicadas(),
    listarDiretoria(),
    especialidadesComContagem(),
    buscarMedicos().then((m) => m.length),
  ]);

  const destaque = diretoriaEmDestaque(diretoria);
  const atalhos = atalhosDoSaibaMais(DADOS_DEMONSTRACAO, [...publicadas, ...COM_RASCUNHO]);

  return (
    <div className={paginas.pagina}>
      <FaixaDaAssociacao
        anos={anosDeAmi(new Date())}
        medicos={medicos}
        especialidades={especialidades.length}
      />
      <QuemSomos
        demonstracao={DADOS_DEMONSTRACAO}
        apresentacao={apresentacaoDaAssociacao(DADOS_DEMONSTRACAO, conteudo?.corpo)}
        texto={TEXTO_INSTITUCIONAL}
      />
      {destaque.length > 0 ? <DiretoriaEmDestaque diretores={destaque} /> : null}
      {atalhos.length > 0 ? <SaibaMais atalhos={atalhos} /> : null}
      <FechoAssocie />
    </div>
  );
}
