"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ROTULO_ACESSIBILIDADE, type RecursoAcessibilidade } from "@/lib/dados/tipos";

type Bairro = { nome: string; slug: string };

/*
  Filtros como formulário de verdade: cada campo tem label visível, não só
  placeholder. No mobile o painel vira gaveta, com a contagem de filtros
  ativos no botão — sem isso o usuário não sabe por que a lista está curta.
*/
export function PainelFiltros({
  bairros,
  total,
}: {
  bairros: Bairro[];
  total: number;
}) {
  const router = useRouter();
  const caminho = usePathname();
  const sp = useSearchParams();
  const [aberto, setAberto] = useState(false);

  const ativos = [
    sp.get("bairro"),
    sp.get("telemedicina"),
    sp.get("sabado"),
    sp.get("associados"),
    ...sp.getAll("acessibilidade"),
  ].filter(Boolean).length;

  function alterar(chave: string, valor: string | null) {
    const proximo = new URLSearchParams(sp.toString());
    if (valor === null) proximo.delete(chave);
    else proximo.set(chave, valor);
    const q = proximo.toString();
    router.push(q ? `${caminho}?${q}` : caminho, { scroll: false });
  }

  function alternarRecurso(recurso: RecursoAcessibilidade, marcado: boolean) {
    const proximo = new URLSearchParams(sp.toString());
    const atuais = proximo.getAll("acessibilidade").filter((r) => r !== recurso);
    proximo.delete("acessibilidade");
    for (const r of atuais) proximo.append("acessibilidade", r);
    if (marcado) proximo.append("acessibilidade", recurso);
    const q = proximo.toString();
    router.push(q ? `${caminho}?${q}` : caminho, { scroll: false });
  }

  return (
    <aside aria-labelledby="titulo-filtros">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="campos-filtros"
        className="flex min-h-11 w-full items-center justify-between rounded-controle border border-line bg-surface px-4 font-semibold text-ami-green-600 md:hidden"
      >
        Filtros
        {ativos > 0 ? (
          <span className="numero-tabular rounded-chip bg-ami-green-600 px-2 py-0.5 text-xs text-white">
            {ativos}
          </span>
        ) : null}
      </button>

      <div
        id="campos-filtros"
        className={`${aberto ? "block" : "hidden"} mt-3 space-y-6 rounded-bloco border border-line bg-surface p-5 md:mt-0 md:block`}
      >
        <h2 id="titulo-filtros" className="text-[21px] font-semibold">
          Filtrar
        </h2>

        <div>
          <label
            htmlFor="filtro-bairro"
            className="block text-[15px] font-semibold"
          >
            Bairro
          </label>
          <select
            id="filtro-bairro"
            value={sp.get("bairro") ?? ""}
            onChange={(e) => alterar("bairro", e.target.value || null)}
            className="mt-1.5 min-h-11 w-full rounded-controle border border-line bg-surface px-3 text-[15px]"
          >
            <option value="">Todos os bairros</option>
            {bairros.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="text-[15px] font-semibold">Atendimento</legend>
          <label className="mt-2 flex min-h-11 items-center gap-2.5 text-[15px]">
            <input
              type="checkbox"
              checked={sp.get("telemedicina") === "1"}
              onChange={(e) => alterar("telemedicina", e.target.checked ? "1" : null)}
              className="size-5 accent-ami-green-600"
            />
            Atende por telemedicina
          </label>
          <label className="flex min-h-11 items-center gap-2.5 text-[15px]">
            <input
              type="checkbox"
              checked={sp.get("sabado") === "1"}
              onChange={(e) => alterar("sabado", e.target.checked ? "1" : null)}
              className="size-5 accent-ami-green-600"
            />
            Atende aos sábados
          </label>
        </fieldset>

        <fieldset>
          <legend className="text-[15px] font-semibold">Acessibilidade</legend>
          {(Object.keys(ROTULO_ACESSIBILIDADE) as RecursoAcessibilidade[]).map(
            (r) => (
              <label
                key={r}
                className="flex min-h-11 items-center gap-2.5 text-[15px]"
              >
                <input
                  type="checkbox"
                  checked={sp.getAll("acessibilidade").includes(r)}
                  onChange={(e) => alternarRecurso(r, e.target.checked)}
                  className="size-5 accent-ami-green-600"
                />
                {ROTULO_ACESSIBILIDADE[r]}
              </label>
            ),
          )}
        </fieldset>

        <label className="flex min-h-11 items-center gap-2.5 text-[15px] font-semibold">
          <input
            type="checkbox"
            checked={sp.get("associados") === "1"}
            onChange={(e) => alterar("associados", e.target.checked ? "1" : null)}
            className="size-5 accent-ami-green-600"
          />
          Somente associados AMI
        </label>

        <div>
          <label
            htmlFor="filtro-ordem"
            className="block text-[15px] font-semibold"
          >
            Ordenar por
          </label>
          <select
            id="filtro-ordem"
            value={sp.get("ordem") ?? "relevancia"}
            onChange={(e) => alterar("ordem", e.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-controle border border-line bg-surface px-3 text-[15px]"
          >
            <option value="relevancia">Relevância</option>
            <option value="nome">Nome (A–Z)</option>
          </select>
        </div>

        {ativos > 0 ? (
          <button
            type="button"
            onClick={() => router.push(caminho, { scroll: false })}
            className="min-h-11 text-[15px] font-semibold text-ami-green-600 underline"
          >
            Limpar todos os filtros
          </button>
        ) : null}

        <p className="numero-tabular border-t border-line pt-4 text-[15px] text-ink-600">
          {total === 1 ? "1 resultado" : `${total} resultados`}
        </p>
      </div>
    </aside>
  );
}
