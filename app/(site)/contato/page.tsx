import type { Metadata } from "next";
import paginas from "@/app/(site)/encontre.module.css";
import { CanaisDeContato } from "@/components/contato/CanaisDeContato";
import { SedeDaAmi } from "@/components/contato/SedeDaAmi";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { AMI } from "@/lib/ami";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { canaisDeContato } from "@/lib/paginaDeContato";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: tituloDePagina("Fale com a AMI"),
    description:
      "Endereço, telefone e Instagram da Associação Médica de Imperatriz.",
    alternates: { canonical: "/contato" },
  };
}

/*
  O contato (item "Contato" do menu), como no desenho aprovado
  (docs/desenho-aprovado/noticias-contato/contato.html):
  - a faixa verde curta, com "CONTATO", "Fale com a AMI" e a frase;
  - os três canais: o telefone da sede, o celular e o Instagram;
  - a sede, numa faixa branca, com o endereço, o CNPJ, "Como chegar", a
    foto da sede e o horário (os dois como moldura, só na demonstração), e
    o fecho para quem quer se associar.

  Sem Sanity e sem rascunho: todo dado vem de lib/ami.ts, a mesma fonte do
  rodapé e do dado estruturado da home, para nome, endereço e telefone
  ficarem idênticos em todo lugar (o critério de negócio local do Google
  exige; ver o comentário de lib/ami.ts). Sem e-mail, sem WhatsApp e sem
  formulário: a AMI não tem os dois primeiros confirmados, e o terceiro
  pediria um serviço novo.

  Sem trilha e sem BreadcrumbList: dado estruturado sem o equivalente
  visível é marcação enganosa (lib/seo/jsonld.ts). Os blocos são filhos
  diretos de `.pagina` (app/(site)/encontre.module.css), a --ritmo um do
  outro; a sede é faixa, e o rodapé emenda nela.
*/
export default function PaginaContato() {
  const e = AMI.endereco;

  return (
    <div className={paginas.pagina}>
      <FaixaCurta
        rotulo="Contato"
        titulo="Fale com a AMI"
        texto={`Pelo telefone, pelo Instagram ou na sede, no ${e.bairro} de ${e.cidade}.`}
      />
      <CanaisDeContato canais={canaisDeContato()} />
      <SedeDaAmi demonstracao={DADOS_DEMONSTRACAO} />
    </div>
  );
}
