import Link from "next/link";
import { Chip } from "@/components/base/Chip";
import { Placa } from "@/components/diretorio/Placa";
import { formatarTelefone, identificacaoMedica } from "@/lib/formato";
import { ROTULO_ACESSIBILIDADE, type Medico } from "@/lib/dados/tipos";

/*
  Cartão, e a tela existe para comparar.

  Até a segunda passagem visual isto era uma linha dentro de uma caixa única,
  separada da seguinte por um fio de 1px, pelo argumento de que comparação se
  faz lendo na vertical. O argumento continua valendo e a forma mudou: cartão
  solto com respiro entre um e outro separa tão bem quanto o fio, e o olho
  para em cada resultado em vez de escorregar pela lista. Os campos seguem nas
  mesmas posições de cartão a cartão, então nome alinha com nome e CRM com
  CRM, que é o que a leitura vertical precisa.

  CRM e telefone saíram do texto corrido e entraram na monoespaçada de
  registro. Um diretório médico é um registro público, e a inscrição no CRM é
  o que torna o profissional verificável no portal do Conselho. Em corpo de
  texto o número lê como marketing que por acaso tem dígitos; em monoespaçada
  lê como assento. É a mesma razão pela qual processo e placa aparecem em
  monoespaçada em documento oficial.

  A linha inteira passou a responder ao ponteiro. Antes só o nome sublinhava,
  o que num alvo de 120px de altura obriga a mira fina para descobrir que a
  linha é clicável.
*/
export function LinhaMedico({ medico }: { medico: Medico }) {
  const principal =
    medico.especialidades.find((e) => e.principal) ?? medico.especialidades[0];
  /*
    Tudo nesta linha fala do MESMO consultório: o bairro, o telefone e a
    acessibilidade. Quem atende em mais de um lugar tem todos eles no perfil.
    A linha de resultado mostra um, inteiro e coerente.
  */
  const local = medico.locais[0];
  const acessibilidade = local?.acessibilidade ?? [];
  const outros = medico.locais.length - 1;

  return (
    /* `min-w-0`: item de grade nasce com `min-width: auto` e não encolhe
        abaixo da largura do conteúdo. Uma palavra longa sem espaço, um
        endereço colado ou um termo médico comprido, faria o navegador
        alargar a faixa em vez de quebrar a palavra, e o excesso viraria
        rolagem lateral da página inteira. Com zero, o `overflow-wrap` do
        body volta a agir. */
    <li className="pressiona eleva group min-w-0 rounded-bloco border border-line bg-surface shadow-apoio hover:border-line-strong">
      <div className="flex gap-4 p-5 md:gap-6 md:p-6">
        <Placa nome={medico.nome} foto={medico.foto} tamanho={76} />

        <div className="min-w-0 flex-1">
          <h3 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em]">
            <Link
              href={`/medico/${medico.slug}`}
              /* `after:absolute inset-0` não é usado aqui de propósito: a
                 linha tem um segundo link (o telefone) e um alvo esticado por
                 cima engoliria o toque nele. */
              className="text-ink-900 transition-colors duration-200 group-hover:text-ami-green-600"
            >
              {medico.nome}
            </Link>
          </h3>

          {/* Nome e CRM acompanhados da palavra MÉDICO: exigência da
              Resolução CFM 2.336/2023, Art. 4º, I. */}
          <p className="registro mt-1 text-[15px] font-semibold text-ink-600">
            {identificacaoMedica(medico.crm, medico.crmUf)}
          </p>

          {principal ? (
            <p className="mt-1.5 text-[16px] text-ink-600">
              {principal.nome}
              {/* RQE só aparece quando há especialidade registrada. Clínico
                  geral sem RQE é caso normal. */}
              {principal.rqe ? (
                <span className="registro text-[15px]"> RQE {principal.rqe}</span>
              ) : null}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Ordem fixa: filiação, depois fatos do consultório. O olho
                aprende a ordem em duas linhas e para de reler a fileira
                inteira em todas as outras. */}
            {medico.associadoAmi ? (
              <Chip tom="associado">Associado AMI</Chip>
            ) : null}
            {local ? <Chip>{local.bairro.nome}</Chip> : null}
            {medico.telemedicina ? <Chip>Telemedicina</Chip> : null}
            {acessibilidade.includes("acesso_cadeirante") ? (
              <Chip>{ROTULO_ACESSIBILIDADE.acesso_cadeirante}</Chip>
            ) : null}
          </div>

          {/* Saiu da fileira de pílulas: não é atributo do profissional, é
              nota de rodapé sobre o endereço que está sendo mostrado. Como
              pílula, competia em peso com "Associado AMI". */}
          {outros > 0 ? (
            <p className="mt-2 text-[14px] text-ink-400">
              Atende também em {outros === 1 ? "outro endereço" : `outros ${outros} endereços`}.
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/medico/${medico.slug}`}
              className="pressiona inline-flex min-h-12 items-center rounded-controle bg-ami-green-600 px-6 text-[15px] font-semibold text-white shadow-apoio hover:bg-ami-green-700 hover:shadow-erguido"
            >
              Ver perfil
            </Link>
            {local?.telefone ? (
              <a
                href={`tel:+55${local.telefone.replace(/\D/g, "")}`}
                className="pressiona inline-flex min-h-12 items-center rounded-controle border border-line bg-canvas px-6 text-[15px] font-semibold text-ami-green-600 hover:border-ami-green-600 hover:bg-ami-mint-100"
              >
                Ligar&nbsp;
                <span className="registro">
                  {formatarTelefone(local.telefone)}
                </span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
