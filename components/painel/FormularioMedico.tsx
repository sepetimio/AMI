"use client";

import { useActionState } from "react";
import { salvarMedico, type EstadoDaEdicao } from "@/app/painel/medico/[id]/acoes";
import type { MedicoDoPainel } from "@/lib/painel/consultas";

const INICIAL: EstadoDaEdicao = { erros: {}, salvo: false };

const CAMPO =
  "w-full rounded-controle border border-line bg-surface px-4 py-3 text-[16px] " +
  "text-ink-900 outline-none focus-visible:border-ami-green-600";

/*
  Sempre montada, mesmo vazia.

  Região `aria-live` que entra no DOM junto com o conteúdo não é anunciada:
  o leitor de tela precisa já conhecê-la para notar a mudança. `min-h-5`
  reserva a altura para o texto não empurrar o formulário quando aparecer.
  Mesma forma de `FormularioEntrar`.

  `aria-live="polite"` e não `role="alert"`: alerta é região assertiva e
  interrompe quem usa leitor de tela. Erro de campo num formulário é feedback
  esperado, não emergência — mesmo raciocínio de
  `components/editorial/RascunhoLegalNaTela.tsx`.
*/
function Erro({ texto }: { texto?: string }) {
  return (
    <p aria-live="polite" className="mt-1 min-h-5 text-[14px] text-warn">
      {texto ?? ""}
    </p>
  );
}

export function FormularioMedico({ medico }: { medico: MedicoDoPainel }) {
  const [estado, acao, pendente] = useActionState(salvarMedico, INICIAL);

  return (
    <form action={acao} className="mt-8 max-w-[640px] space-y-5">
      <input type="hidden" name="id" value={medico.id} />

      <div>
        <label htmlFor="nome" className="block text-[14px] font-medium text-ink-600">
          Nome
        </label>
        <input id="nome" name="nome" defaultValue={medico.nome} required className={`mt-1 ${CAMPO}`} />
        <Erro texto={estado.erros.nome} />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="crm" className="block text-[14px] font-medium text-ink-600">
            CRM
          </label>
          <input id="crm" name="crm" defaultValue={medico.crm} required className={`mt-1 ${CAMPO}`} />
          <Erro texto={estado.erros.crm} />
        </div>
        <div className="w-28">
          <label htmlFor="crmUf" className="block text-[14px] font-medium text-ink-600">
            UF
          </label>
          <input id="crmUf" name="crmUf" defaultValue={medico.crmUf} required className={`mt-1 ${CAMPO}`} />
          <Erro texto={estado.erros.crmUf} />
        </div>
      </div>

      <div>
        <label htmlFor="situacao" className="block text-[14px] font-medium text-ink-600">
          Situação
        </label>
        <select id="situacao" name="situacao" defaultValue={medico.situacao} className={`mt-1 ${CAMPO}`}>
          <option value="ativo">ativo</option>
          <option value="inativo">inativo</option>
        </select>
        <Erro texto={estado.erros.situacao} />
      </div>

      <label className="flex items-center gap-3 text-[16px] text-ink-900">
        <input type="checkbox" name="telemedicina" defaultChecked={medico.telemedicina} />
        Atende por telemedicina
      </label>

      <div className="flex items-center gap-3">
        <input
          id="associadoAmi"
          name="associadoAmi"
          type="checkbox"
          defaultChecked={medico.associadoAmi}
          className="size-4 accent-ami-green-600"
        />
        <label htmlFor="associadoAmi" className="text-[15px] text-ink-900">
          É associado da AMI
        </label>
      </div>
      <p className="-mt-3 text-[14px] text-ink-400">
        Quem deixa a associação: desmarque aqui e tire do ar. O cadastro fica
        guardado, e voltar é um clique.
      </p>

      <div>
        <label htmlFor="bio" className="block text-[14px] font-medium text-ink-600">
          Biografia
        </label>
        <textarea id="bio" name="bio" rows={5} defaultValue={medico.bio ?? ""} className={`mt-1 ${CAMPO}`} />
        <p className="mt-1 text-[14px] text-ink-400">
          Sem linguagem de propaganda: a Resolução CFM 2.336/2023 proíbe médico de se
          anunciar como o melhor ou como referência.
        </p>
        <Erro texto={estado.erros.bio} />
      </div>

      <div>
        <label htmlFor="verificadoEm" className="block text-[14px] font-medium text-ink-600">
          Verificado em
        </label>
        <input
          id="verificadoEm"
          name="verificadoEm"
          placeholder="2026-08-22"
          defaultValue={medico.verificadoEm ?? ""}
          className={`mt-1 ${CAMPO}`}
        />
        <Erro texto={estado.erros.verificadoEm} />
      </div>

      <div>
        <label htmlFor="endereco-do-perfil" className="block text-[14px] font-medium text-ink-600">
          Endereço do perfil
        </label>
        <input
          id="endereco-do-perfil"
          readOnly
          value={`/medico/${medico.slug}`}
          className={`mt-1 ${CAMPO} bg-canvas text-ink-400`}
        />
        <p className="mt-1 text-[14px] text-ink-400">
          Não muda, nem quando o nome muda. É a URL que o Google indexou, e trocá-la
          apaga o perfil da busca.
        </p>
      </div>

      <Erro texto={estado.erros.geral} />

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pendente}
          className="pressiona inline-flex min-h-12 items-center rounded-controle bg-ami-green-600 px-6 text-[15px] font-semibold text-white shadow-apoio hover:bg-ami-green-700 disabled:opacity-60"
        >
          {pendente ? "Salvando…" : "Salvar"}
        </button>
        <p aria-live="polite" className="text-[15px] text-ink-600">
          {estado.salvo ? "Salvo." : ""}
        </p>
      </div>
    </form>
  );
}
