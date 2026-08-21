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
        <p className="text-[13px] font-medium uppercase tracking-[0.09em] text-ami-green-600">
          {diretor.cargo}
        </p>
        <p className="mt-2 text-[21px] font-semibold leading-tight tracking-[-0.02em]">
          {diretor.nome}
        </p>
        {/* `diretor.crm`/`crmUf` já vêm resolvidos por `lib/dados/diretoria`
            entre as duas origens possíveis, com as colunas próprias da linha
            na frente e o perfil ligado como reserva: o cartão não precisa
            saber qual das duas venceu, só exibir quando há inscrição.
            Com a constraint `diretor_medico_tem_inscricao` no banco, isto só
            falta para quem não é médico, um contador na tesouraria por
            exemplo. A guarda fica de pé mesmo assim: a Resolução CFM
            2.336/2023, Art. 4º, I não admite nome de médico sem inscrição, e
            um `null` que escape por qualquer caminho tem de sumir da tela em
            vez de virar "MÉDICO · CRM/null". */}
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
      className={`pressiona eleva ${classe} hover:border-line-strong`}
    >
      {miolo}
    </Link>
  ) : (
    <div className={classe}>{miolo}</div>
  );
}
