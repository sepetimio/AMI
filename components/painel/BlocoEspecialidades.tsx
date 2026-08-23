"use client";

import { useActionState } from "react";
import {
  acrescentarEspecialidade,
  removerEspecialidade,
  salvarEspecialidades,
  type EstadoDaEspecialidade,
} from "@/app/painel/medico/[id]/acoes-especialidade";
import { avisoDeRqeFaltando } from "@/lib/painel/especialidades";
import type {
  EspecialidadeDisponivel,
  EspecialidadeDoMedico,
} from "@/lib/painel/especialidades";

const INICIAL: EstadoDaEspecialidade = { erros: {}, salvo: false };

const CAMPO =
  "w-full rounded-controle border border-line bg-surface px-4 py-3 text-[16px] " +
  "text-ink-900 outline-none focus-visible:border-ami-green-600";

/*
  Uma linha, um estado.

  `useActionState` não pode ser chamado dentro do `.map()` do componente pai
  — violaria a regra dos hooks a cada especialidade a mais ou a menos. Por
  isso "Remover" é um componente próprio: cada instância tem seu hook, e a
  mensagem de erro de remover uma linha não se mistura com a de outra.
*/
function LinhaDeRemocao({
  medicoId,
  especialidade,
}: {
  medicoId: number;
  especialidade: EspecialidadeDoMedico;
}) {
  const [estado, acao, pendente] = useActionState(removerEspecialidade, INICIAL);

  return (
    <form action={acao} className="mt-2">
      <input type="hidden" name="medicoId" value={medicoId} />
      <input type="hidden" name="especialidadeId" value={especialidade.id} />
      <button
        type="submit"
        disabled={pendente}
        className="text-[14px] text-ink-400 underline hover:text-ink-900"
      >
        {pendente ? "Removendo…" : `Remover ${especialidade.nome}`}
      </button>
      <p aria-live="polite" className="min-h-5 text-[14px] text-warn">
        {estado.erros.geral ?? ""}
      </p>
    </form>
  );
}

export function BlocoEspecialidades({
  medicoId,
  especialidades,
  catalogo,
}: {
  medicoId: number;
  especialidades: EspecialidadeDoMedico[];
  catalogo: EspecialidadeDisponivel[];
}) {
  const [estado, acao, pendente] = useActionState(salvarEspecialidades, INICIAL);
  const [estadoNovo, acaoNovo, pendenteNovo] = useActionState(acrescentarEspecialidade, INICIAL);

  const jaTem = new Set(especialidades.map((e) => e.id));
  const disponiveis = catalogo.filter((c) => !jaTem.has(c.id));
  const principal = especialidades.find((e) => e.principal) ?? especialidades[0];
  const aviso = avisoDeRqeFaltando(especialidades.filter((e) => !e.rqe).map((e) => e.nome));

  return (
    <section className="mt-12 max-w-[640px]">
      <h2 className="text-[20px] font-semibold text-ink-900">Especialidades</h2>
      <p className="mt-1 text-[15px] text-ink-600">
        A principal é a que aparece embaixo do nome no site, e define em qual
        página de especialidade ele é listado.
      </p>

      {especialidades.length === 0 ? (
        <p className="mt-6 text-[16px] text-ink-600">
          Nenhuma especialidade ainda. Sem pelo menos uma, este médico não aparece
          em nenhuma busca do site.
        </p>
      ) : (
        <form action={acao} className="mt-6 space-y-4">
          <input type="hidden" name="medicoId" value={medicoId} />

          {especialidades.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-3 border-b border-line py-3">
              <label className="flex items-center gap-2 text-[15px] text-ink-900">
                <input
                  type="radio"
                  name="principal"
                  value={e.id}
                  defaultChecked={principal?.id === e.id}
                  className="size-4 accent-ami-green-600"
                />
                <span className="min-w-[180px]">{e.nome}</span>
              </label>

              <input
                name={`rqe-${e.id}`}
                defaultValue={e.rqe ?? ""}
                placeholder="RQE"
                aria-label={`RQE de ${e.nome}`}
                className={`w-32 ${CAMPO}`}
              />
              <p aria-live="polite" className="min-h-5 basis-full text-[14px] text-warn">
                {estado.erros[`rqe-${e.id}`] ?? ""}
              </p>
            </div>
          ))}

          <p aria-live="polite" className="min-h-5 text-[14px] text-warn">
            {estado.erros.geral ?? ""}
          </p>

          <button
            type="submit"
            disabled={pendente}
            className="pressiona rounded-controle bg-ami-green-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-ami-green-700"
          >
            {pendente ? "Salvando…" : "Salvar especialidades"}
          </button>

          <p aria-live="polite" className="min-h-5 text-[14px] text-ink-600">
            {estado.salvo ? "Salvo." : ""}
          </p>
        </form>
      )}

      {aviso ? (
        <p className="mt-4 rounded-bloco border border-line bg-surface px-4 py-3 text-[15px] text-ink-600">
          {aviso}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <form action={acaoNovo} className="flex items-end gap-3">
          <input type="hidden" name="medicoId" value={medicoId} />
          <input
            type="hidden"
            name="ehAPrimeira"
            value={String(especialidades.length === 0)}
          />
          <div>
            <label
              htmlFor="especialidadeId"
              className="block text-[14px] font-medium text-ink-600"
            >
              Acrescentar especialidade
            </label>
            <select id="especialidadeId" name="especialidadeId" className={`mt-1 ${CAMPO}`}>
              {disponiveis.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={disponiveis.length === 0 || pendenteNovo}
            className="pressiona rounded-controle border border-line px-4 py-3 text-[15px] font-medium text-ink-600 hover:text-ink-900"
          >
            {pendenteNovo ? "Acrescentando…" : "Acrescentar"}
          </button>
        </form>
      </div>

      <p aria-live="polite" className="min-h-5 text-[14px] text-warn">
        {estadoNovo.erros.geral ?? ""}
      </p>

      {especialidades.map((e) => (
        <LinhaDeRemocao key={`remover-${e.id}`} medicoId={medicoId} especialidade={e} />
      ))}
    </section>
  );
}
