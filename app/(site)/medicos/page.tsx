import type { Metadata } from "next";
import paginas from "@/app/(site)/encontre.module.css";
import { FaixaDoIndice } from "@/components/especialidades/FaixaDoIndice";
import { GradeDeEspecialidades } from "@/components/especialidades/GradeDeEspecialidades";
import { especialidadesComContagem } from "@/lib/dados/especialidades";
import { buscarMedicos } from "@/lib/dados/medicos";

/* Revalidação a cada hora: o cadastro muda algumas vezes por semana, e servir
   HTML pronto é o que segura o LCP abaixo de 2,5s em 4G. */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  /* Contagem de profissionais, não soma por especialidade: quem tem duas
     especialidades entraria duas vezes na soma. `buscarMedicos` é memoizada
     por requisição, então isto não é uma segunda ida ao banco. */
  const [especialidades, total] = await Promise.all([
    especialidadesComContagem(),
    buscarMedicos().then((m) => m.length),
  ]);

  return {
    title: `Médicos em Imperatriz - MA | ${total} profissionais | AMI`,
    description:
      `${total} médicos em ${especialidades.length} especialidades em ` +
      `Imperatriz - MA. Veja endereço, telefone e especialidade de cada médico.`,
    alternates: { canonical: "/medicos" },
  };
}

/*
  O índice de especialidades (item "Especialidades" do menu):
  - a faixa verde com o campo de busca;
  - a contagem e um cartão por especialidade com médico, em ordem
    alfabética.

  Sem a `Cabeceira` das páginas internas antigas e sem trilha. Sem o
  BreadcrumbList também: dado estruturado sem o equivalente visível é
  marcação enganosa (lib/seo/jsonld.ts).

  Os blocos são filhos diretos de `.pagina` (app/(site)/encontre.module.css),
  a --ritmo um do outro.
*/
export default async function PaginaMedicos() {
  /* Mesmo raciocínio do `generateMetadata`: total = profissionais
     publicados, não a soma das contagens por especialidade. */
  const [especialidades, total] = await Promise.all([
    especialidadesComContagem(),
    buscarMedicos().then((m) => m.length),
  ]);

  return (
    <div className={paginas.pagina}>
      <FaixaDoIndice medicos={total} />
      <GradeDeEspecialidades especialidades={especialidades} />
    </div>
  );
}
