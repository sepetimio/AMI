import Link from "next/link";
import { Chip } from "@/components/base/Chip";
import { SeloAbertoAgora } from "@/components/diretorio/SeloAbertoAgora";
import { formatarTelefone, identificacaoMedica } from "@/lib/formato";
import { ROTULO_ACESSIBILIDADE, type Medico } from "@/lib/dados/tipos";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return (partes[0][0] + (partes.at(-1)?.[0] ?? "")).toUpperCase();
}

/*
  Linha, não cartão: a tela existe para comparar, e comparação se faz lendo
  na vertical. Sem sombra em repouso — o separador é um fio de 1px.
*/
export function LinhaMedico({ medico }: { medico: Medico }) {
  const principal =
    medico.especialidades.find((e) => e.principal) ?? medico.especialidades[0];
  /*
    Tudo nesta linha fala do MESMO consultório: o bairro, o telefone, a
    acessibilidade e o selo de aberto. Agregar o horário de todos os
    endereços faria a linha dizer "Aberto agora" por causa de um consultório
    que não é o do telefone exibido — quem liga cai na secretária eletrônica.

    Quem atende em mais de um lugar tem todos eles no perfil, com o horário
    de cada um. A linha de resultado mostra um, inteiro e coerente.
  */
  const local = medico.locais[0];
  const horarios = local?.horarios ?? [];
  const acessibilidade = local?.acessibilidade ?? [];
  const temOutrosLocais = medico.locais.length > 1;

  return (
    <li className="border-b border-line py-5 last:border-b-0">
      <div className="flex gap-4">
        {/* Sem foto real, iniciais em bloco verde. Nunca avatar ilustrado. */}
        {medico.foto ? (
          <img
            src={medico.foto}
            alt={`Retrato de ${medico.nome}`}
            width={72}
            height={72}
            className="size-[72px] shrink-0 rounded-bloco object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-[72px] shrink-0 items-center justify-center rounded-bloco bg-ami-green-800 font-titulo text-2xl font-bold text-ami-mint-400"
          >
            {iniciais(medico.nome)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-[21px] font-semibold leading-tight">
            <Link
              href={`/medico/${medico.slug}`}
              className="text-ink-900 hover:text-ami-green-600 hover:underline"
            >
              {medico.nome}
            </Link>
          </h3>

          {/* Nome e CRM acompanhados da palavra MÉDICO: exigência da
              Resolução CFM 2.336/2023, Art. 4º, I. */}
          <p className="numero-tabular mt-0.5 text-[15px] font-semibold text-ink-600">
            {identificacaoMedica(medico.crm, medico.crmUf)}
          </p>

          {principal ? (
            <p className="mt-1 text-[15px] text-ink-600">
              {principal.nome}
              {/* RQE só aparece quando há especialidade registrada.
                  Clínico geral sem RQE é caso normal. */}
              {principal.rqe ? (
                <span className="numero-tabular"> · RQE {principal.rqe}</span>
              ) : null}
            </p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {medico.associadoAmi ? (
              <Chip tom="associado">Associado AMI</Chip>
            ) : null}
            {local ? <Chip>{local.bairro.nome}</Chip> : null}
            {medico.telemedicina ? <Chip>Telemedicina</Chip> : null}
            {acessibilidade.includes("acesso_cadeirante") ? (
              <Chip>{ROTULO_ACESSIBILIDADE.acesso_cadeirante}</Chip>
            ) : null}
            {/* Avisa que há mais, para o bairro exibido não parecer o único. */}
            {temOutrosLocais ? (
              <Chip>
                {medico.locais.length === 2
                  ? "e mais 1 endereço"
                  : `e mais ${medico.locais.length - 1} endereços`}
              </Chip>
            ) : null}
            <SeloAbertoAgora horarios={horarios} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/medico/${medico.slug}`}
              className="inline-flex min-h-11 items-center rounded-controle bg-ami-green-600 px-4 text-[15px] font-semibold text-white hover:bg-ami-green-700"
            >
              Ver perfil
            </Link>
            {local?.telefone ? (
              <a
                href={`tel:+55${local.telefone.replace(/\D/g, "")}`}
                className="numero-tabular inline-flex min-h-11 items-center rounded-controle border border-line px-4 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
              >
                Ligar {formatarTelefone(local.telefone)}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
