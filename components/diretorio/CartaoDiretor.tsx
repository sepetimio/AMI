import Link from "next/link";
import { Placa } from "@/components/diretorio/Placa";
import { identificacaoMedica } from "@/lib/formato";
import type { Diretor } from "@/lib/dados/diretoria";

/*
  Cartão de um membro da diretoria.

  O cargo vem antes do nome, em caixa alta pequena: numa página de diretoria a
  pergunta é "quem é o presidente", não "onde está a Mayara". É a única tela
  do site onde a função precede a pessoa.
*/
export function CartaoDiretor({ diretor }: { diretor: Diretor }) {
  const miolo = (
    <>
      <Placa nome={diretor.nome} foto={diretor.foto} tamanho={88} />
      <div className="min-w-0">
        <p className="font-titulo text-[13px] font-bold uppercase tracking-[0.1em] text-ami-green-600 [font-stretch:90%]">
          {diretor.cargo}
        </p>
        <p className="mt-1.5 font-titulo text-[21px] font-bold leading-tight [font-stretch:88%]">
          {diretor.nome}
        </p>
        {/* O banco exige CRM na própria linha de todo diretor médico
            publicado (constraint `diretor_medico_tem_inscricao`), então esta
            linha só falta para quem não é médico, um contador na tesouraria
            por exemplo. A guarda fica de pé mesmo assim: a Resolução CFM
            2.336/2023, Art. 4º, I não admite nome de médico sem inscrição, e
            um `null` que escape por qualquer caminho tem de sumir da tela em
            vez de virar "MÉDICO - CRM/null". */}
        {diretor.crm && diretor.crmUf ? (
          <p className="registro mt-1 text-[14px] text-ink-600">
            {identificacaoMedica(diretor.crm, diretor.crmUf)}
          </p>
        ) : null}
      </div>
    </>
  );

  const classe =
    "flex items-center gap-4 rounded-bloco border border-line bg-surface p-5 shadow-apoio";

  /* Sem perfil publicado, o cartão não é link: um link que leva a 404 é pior
     que texto. */
  return diretor.slugDoPerfil ? (
    <Link
      href={`/medico/${diretor.slugDoPerfil}`}
      className={`pressiona ${classe} hover:border-ami-green-600 hover:bg-ami-mint-100 hover:shadow-erguido`}
    >
      {miolo}
    </Link>
  ) : (
    <div className={classe}>{miolo}</div>
  );
}
