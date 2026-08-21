"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { filtrosDaQuery, queryDosFiltros } from "@/lib/dados/urlFiltros";
import {
  ROTULO_ACESSIBILIDADE,
  type Filtros,
  type RecursoAcessibilidade,
} from "@/lib/dados/tipos";

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

  /*
    O contador cobre os controles deste painel, e nada mais.

    `termo` fica de fora de propósito: quem digitou "cardiologia" na home vê
    isso no H1 da página, e não veio deste painel. `ordem` também: ordenar
    não encurta a lista, então não explica por que ela está curta.

    Como consequência, "Limpar" preserva os dois — apagar o que não se conta
    seria remover a busca do usuário sem aviso.
  */
  const ativos = [
    sp.get("bairro"),
    sp.get("telemedicina"),
    sp.get("sabado"),
    sp.get("associados"),
    ...sp.getAll("acessibilidade"),
  ].filter(Boolean).length;

  function limpar() {
    const { termo, ordem } = filtrosAtuais();
    router.push(`${caminho}${queryDosFiltros({ termo, ordem })}`, {
      scroll: false,
    });
  }

  /* Lê a URL de volta para o formato do domínio, para que toda alteração
     saia serializada por queryDosFiltros — a função que garante ordem
     estável e é a que os testes cobrem. */
  function filtrosAtuais(): Filtros {
    const q: Record<string, string | string[]> = {};
    for (const chave of new Set(sp.keys())) {
      const valores = sp.getAll(chave);
      q[chave] = valores.length > 1 ? valores : valores[0];
    }
    return filtrosDaQuery(q);
  }

  function aplicar(mudanca: Partial<Filtros>) {
    const q = queryDosFiltros({ ...filtrosAtuais(), ...mudanca });
    router.push(`${caminho}${q}`, { scroll: false });
  }

  function alternarRecurso(recurso: RecursoAcessibilidade, marcado: boolean) {
    const atuais = filtrosAtuais().acessibilidade ?? [];
    const lista = marcado
      ? [...atuais.filter((r) => r !== recurso), recurso]
      : atuais.filter((r) => r !== recurso);
    aplicar({ acessibilidade: lista.length ? lista : undefined });
  }

  return (
    <aside aria-labelledby="titulo-filtros">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="campos-filtros"
        className="pressiona flex min-h-12 w-full items-center justify-between rounded-controle border border-line-strong bg-surface px-4 font-semibold text-ami-green-600 shadow-apoio md:hidden"
      >
        Filtros
        {ativos > 0 ? (
          <span className="registro rounded-chip bg-ami-green-600 px-2 py-0.5 text-xs text-white">
            {ativos}
          </span>
        ) : null}
      </button>

      <div
        id="campos-filtros"
        /* `sticky` a partir de md: numa especialidade com quarenta médicos
           o painel sumia depois da terceira rolagem, e voltar a ele exigia
           subir a lista inteira. `top-24` é a altura do cabeçalho fixo mais
           um respiro. */
        className={`${aberto ? "block" : "hidden"} mt-3 space-y-5 rounded-bloco border border-line bg-surface p-5 shadow-apoio md:mt-0 md:block md:sticky md:top-24`}
      >
        <h2
          id="titulo-filtros"
          className="border-b border-line-strong pb-3 font-titulo text-[20px] font-bold [font-stretch:88%]"
        >
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
            onChange={(e) => aplicar({ bairro: e.target.value || undefined })}
            className="pressiona mt-1.5 min-h-11 w-full rounded-controle border border-line-strong bg-canvas px-3 text-[15px] focus:border-ami-green-600 focus:bg-surface"
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
          <legend className="font-titulo text-[16px] font-bold [font-stretch:92%]">Atendimento</legend>
          <label className="mt-2 -mx-2 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-controle px-2 text-[15px] transition-colors duration-150 hover:bg-ami-mint-100">
            <input
              type="checkbox"
              checked={sp.get("telemedicina") === "1"}
              onChange={(e) => aplicar({ telemedicina: e.target.checked })}
              className="size-5 accent-ami-green-600"
            />
            Atende por telemedicina
          </label>
          <label className="-mx-2 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-controle px-2 text-[15px] transition-colors duration-150 hover:bg-ami-mint-100">
            <input
              type="checkbox"
              checked={sp.get("sabado") === "1"}
              onChange={(e) => aplicar({ atendeSabado: e.target.checked })}
              className="size-5 accent-ami-green-600"
            />
            Atende aos sábados
          </label>
        </fieldset>

        <fieldset>
          <legend className="font-titulo text-[16px] font-bold [font-stretch:92%]">Acessibilidade</legend>
          {(Object.keys(ROTULO_ACESSIBILIDADE) as RecursoAcessibilidade[]).map(
            (r) => (
              <label
                key={r}
                className="-mx-2 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-controle px-2 text-[15px] transition-colors duration-150 hover:bg-ami-mint-100"
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

        <label className="-mx-2 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-controle px-2 text-[15px] font-semibold transition-colors duration-150 hover:bg-ami-mint-100">
          <input
            type="checkbox"
            checked={sp.get("associados") === "1"}
            onChange={(e) => aplicar({ somenteAssociados: e.target.checked })}
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
            onChange={(e) => aplicar({ ordem: e.target.value as Filtros["ordem"] })}
            className="pressiona mt-1.5 min-h-11 w-full rounded-controle border border-line-strong bg-canvas px-3 text-[15px] focus:border-ami-green-600 focus:bg-surface"
          >
            <option value="relevancia">Relevância</option>
            <option value="nome">Nome (A-Z)</option>
          </select>
        </div>

        {ativos > 0 ? (
          <button
            type="button"
            onClick={limpar}
            className="pressiona min-h-11 text-[15px] font-semibold text-ami-green-600 underline underline-offset-2 hover:text-ami-green-700"
          >
            Limpar todos os filtros
          </button>
        ) : null}

        <p className="registro border-t border-line pt-4 text-[15px] text-ink-600">
          {total === 1 ? "1 resultado" : `${total} resultados`}
        </p>
      </div>
    </aside>
  );
}
