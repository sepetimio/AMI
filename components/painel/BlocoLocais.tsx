"use client";

import { useActionState } from "react";
import {
  criarLocal,
  desligarLocal,
  salvarLocal,
  type EstadoDoLocal,
} from "@/app/painel/medico/[id]/acoes-local";
import type { Bairro, LocalDoMedico } from "@/lib/painel/locais";

const INICIAL: EstadoDoLocal = { erros: {}, salvo: false };

const CAMPO =
  "w-full rounded-controle border border-line bg-surface px-4 py-3 text-[16px] " +
  "text-ink-900 outline-none focus-visible:border-ami-green-600";

/*
  Telefone e WhatsApp primeiro entre os opcionais, com rótulo maior: não são
  detalhe do endereço, são o objetivo dele. O site leva até o especialista,
  quem fecha o encaminhamento é o contato.
*/
function CamposDeLocal({
  idPrefix,
  listaDeBairros,
  erros,
  valores,
}: {
  idPrefix: string;
  listaDeBairros: Bairro[];
  erros: Record<string, string>;
  valores?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairroId?: number;
    cep?: string;
    telefone?: string;
    whatsapp?: string;
    estacionamento?: boolean;
  };
}) {
  return (
    <>
      <div>
        <label htmlFor={`logradouro-${idPrefix}`} className="block text-[14px] font-medium text-ink-600">
          Rua
        </label>
        <input
          id={`logradouro-${idPrefix}`}
          name="logradouro"
          defaultValue={valores?.logradouro ?? ""}
          required
          className={`mt-1 ${CAMPO}`}
        />
        <p aria-live="polite" className="min-h-5 text-[14px] text-warn">
          {erros.logradouro ?? ""}
        </p>
      </div>

      <div>
        <label htmlFor={`telefone-${idPrefix}`} className="block text-[16px] font-semibold text-ink-900">
          Telefone
        </label>
        <input
          id={`telefone-${idPrefix}`}
          name="telefone"
          defaultValue={valores?.telefone ?? ""}
          className={`mt-1 ${CAMPO}`}
        />
        <p aria-live="polite" className="min-h-5 text-[14px] text-warn">
          {erros.telefone ?? ""}
        </p>
      </div>

      <div>
        <label htmlFor={`whatsapp-${idPrefix}`} className="block text-[16px] font-semibold text-ink-900">
          WhatsApp
        </label>
        <input
          id={`whatsapp-${idPrefix}`}
          name="whatsapp"
          defaultValue={valores?.whatsapp ?? ""}
          className={`mt-1 ${CAMPO}`}
        />
        <p aria-live="polite" className="min-h-5 text-[14px] text-warn">
          {erros.whatsapp ?? ""}
        </p>
      </div>

      <div>
        <label htmlFor={`bairroId-${idPrefix}`} className="block text-[14px] font-medium text-ink-600">
          Bairro
        </label>
        <select
          id={`bairroId-${idPrefix}`}
          name="bairroId"
          defaultValue={valores?.bairroId ?? ""}
          className={`mt-1 ${CAMPO}`}
        >
          <option value="" disabled>
            Escolha um bairro
          </option>
          {listaDeBairros.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
        </select>
        <p aria-live="polite" className="min-h-5 text-[14px] text-warn">
          {erros.bairroId ?? ""}
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor={`numero-${idPrefix}`} className="block text-[14px] font-medium text-ink-600">
            Número
          </label>
          <input
            id={`numero-${idPrefix}`}
            name="numero"
            defaultValue={valores?.numero ?? ""}
            className={`mt-1 ${CAMPO}`}
          />
        </div>
        <div className="flex-1">
          <label htmlFor={`complemento-${idPrefix}`} className="block text-[14px] font-medium text-ink-600">
            Complemento
          </label>
          <input
            id={`complemento-${idPrefix}`}
            name="complemento"
            defaultValue={valores?.complemento ?? ""}
            className={`mt-1 ${CAMPO}`}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`cep-${idPrefix}`} className="block text-[14px] font-medium text-ink-600">
          CEP
        </label>
        <input id={`cep-${idPrefix}`} name="cep" defaultValue={valores?.cep ?? ""} className={`mt-1 ${CAMPO}`} />
      </div>

      <label className="flex items-center gap-2 text-[15px] text-ink-900">
        <input
          type="checkbox"
          name="estacionamento"
          defaultChecked={valores?.estacionamento ?? false}
          className="size-4 accent-ami-green-600"
        />
        Estacionamento
      </label>
    </>
  );
}

function CartaoDeLocal({
  local,
  medicoId,
  listaDeBairros,
}: {
  local: LocalDoMedico;
  medicoId: number;
  listaDeBairros: Bairro[];
}) {
  const [estado, acao, pendente] = useActionState(salvarLocal, INICIAL);

  return (
    <div className="mt-6 rounded-bloco border border-line p-6">
      {local.quantosMedicos > 1 ? (
        <p className="mb-4 rounded-bloco border border-line bg-surface px-4 py-3 text-[15px] text-ink-600">
          Este endereço é usado por {local.quantosMedicos} médicos. Corrigir aqui
          corrige para todos eles.
        </p>
      ) : null}

      <form action={acao} className="space-y-4">
        <input type="hidden" name="localId" value={local.id} />

        <CamposDeLocal
          idPrefix={String(local.id)}
          listaDeBairros={listaDeBairros}
          erros={estado.erros}
          valores={{
            logradouro: local.logradouro,
            numero: local.numero ?? "",
            complemento: local.complemento ?? "",
            bairroId: local.bairro.id,
            cep: local.cep ?? "",
            telefone: local.telefone ?? "",
            whatsapp: local.whatsapp ?? "",
            estacionamento: local.estacionamento,
          }}
        />

        <p aria-live="polite" className="min-h-5 text-[14px] text-warn">
          {estado.erros.geral ?? ""}
        </p>

        <button
          type="submit"
          disabled={pendente}
          className="pressiona rounded-controle bg-ami-green-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-ami-green-700"
        >
          {pendente ? "Salvando…" : "Salvar"}
        </button>

        <p aria-live="polite" className="min-h-5 text-[14px] text-ink-600">
          {estado.salvo ? "Salvo." : ""}
        </p>
      </form>

      <form action={desligarLocal} className="mt-6 border-t border-line pt-4">
        <input type="hidden" name="medicoId" value={medicoId} />
        <input type="hidden" name="localId" value={local.id} />
        <button type="submit" className="text-[14px] text-ink-400 underline hover:text-ink-900">
          Tirar deste consultório
        </button>
        <p className="mt-1 text-[13px] text-ink-400">
          Tira o médico daqui. O consultório continua existindo.
        </p>
      </form>
    </div>
  );
}

export function BlocoLocais({
  medicoId,
  locais,
  listaDeBairros,
}: {
  medicoId: number;
  locais: LocalDoMedico[];
  listaDeBairros: Bairro[];
}) {
  const [estadoNovo, acaoNovo, pendenteNovo] = useActionState(criarLocal, INICIAL);

  return (
    <section className="mt-12 max-w-[640px]">
      <h2 className="text-[20px] font-semibold text-ink-900">Consultórios</h2>
      <p className="mt-1 text-[15px] text-ink-600">
        Telefone e WhatsApp são o que fecha o encaminhamento: o site leva até o
        especialista, mas quem agenda é a própria pessoa, por contato direto.
      </p>

      {locais.length === 0 ? (
        <p className="mt-6 text-[16px] text-ink-600">
          Nenhum consultório ainda. Sem pelo menos um, este médico não aparece
          com endereço em nenhuma busca do site.
        </p>
      ) : (
        locais.map((local) => (
          <CartaoDeLocal
            key={local.id}
            local={local}
            medicoId={medicoId}
            listaDeBairros={listaDeBairros}
          />
        ))
      )}

      <div className="mt-8 rounded-bloco border border-line p-6">
        <h3 className="text-[16px] font-semibold text-ink-900">Novo consultório</h3>

        <form action={acaoNovo} className="mt-4 space-y-4">
          <input type="hidden" name="medicoId" value={medicoId} />

          <CamposDeLocal
            idPrefix="novo"
            listaDeBairros={listaDeBairros}
            erros={estadoNovo.erros}
          />

          <p aria-live="polite" className="min-h-5 text-[14px] text-warn">
            {estadoNovo.erros.geral ?? ""}
          </p>

          <button
            type="submit"
            disabled={pendenteNovo}
            className="pressiona rounded-controle bg-ami-green-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-ami-green-700"
          >
            {pendenteNovo ? "Criando…" : "Criar consultório"}
          </button>

          <p aria-live="polite" className="min-h-5 text-[14px] text-ink-600">
            {estadoNovo.salvo ? "Salvo." : ""}
          </p>
        </form>
      </div>
    </section>
  );
}
