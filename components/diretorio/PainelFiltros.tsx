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

    `termo` fica de fora de propósito, e o motivo mudou quando o campo de
    texto entrou neste painel: não é mais "veio de outro lugar" — é que o
    contador existe para explicar uma lista curta cuja causa está ESCONDIDA,
    e a do termo não está. Ela aparece duas vezes na tela: no H1
    ("Resultados para …") e no próprio campo, preenchido. `ordem` também:
    ordenar não encurta a lista, então não explica por que ela está curta.

    Como consequência, "Limpar" preserva os dois — apagar o que não se conta
    seria remover a busca do usuário sem aviso.
  */
  const ativos = [
    sp.get("bairro"),
    sp.get("telemedicina"),
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
        className="pressiona flex min-h-13 w-full items-center justify-between rounded-controle border border-line bg-surface px-5 font-medium text-ink-900 shadow-apoio md:hidden"
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
        className={`${aberto ? "block" : "hidden"} mt-3 space-y-6 rounded-painel border border-line bg-surface p-6 shadow-erguido md:mt-0 md:block md:sticky md:top-28`}
      >
        <h2
          id="titulo-filtros"
          className="text-[20px] font-semibold tracking-[-0.02em]"
        >
          Filtrar
        </h2>

        {/*
          O campo de texto, e por que ele mora aqui.

          `/busca` é alcançável por link de bairro já filtrado — do rodapé e
          dos ladrilhos da home — e quem chega assim precisa poder digitar um
          nome sem voltar à home para achar o único campo do site. Este é o
          segundo, e o que sustenta a página sozinha.

          `<form>` de verdade em volta de um campo só, para que Enter envie:
          o resto do painel aplica no `onChange`, mas um texto aplicado a
          cada tecla dispararia uma navegação por letra digitada. O
          `onSubmit` chama o mesmo `aplicar()` dos outros controles — a URL
          continua saindo por `queryDosFiltros`, e não por concatenação
          escrita aqui.

          Sem estado: o valor vem da URL por `defaultValue`, e o `key` amarra
          o campo ao termo da URL, de modo que voltar pelo botão do navegador
          (ou qualquer navegação que troque o termo) remonte o campo com o
          valor certo em vez de deixar na tela o que o usuário digitou antes.
        */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const valor = String(
              new FormData(e.currentTarget).get("termo") ?? "",
            ).trim();
            aplicar({ termo: valor || undefined });
          }}
        >
          <label
            htmlFor="filtro-termo"
            className="block text-[15px] font-medium text-ink-600"
          >
            Nome ou especialidade
          </label>
          <div className="mt-2 flex gap-2">
            <input
              key={sp.get("termo") ?? ""}
              id="filtro-termo"
              name="termo"
              type="search"
              defaultValue={sp.get("termo") ?? ""}
              placeholder="Nome do médico ou especialidade"
              className="pressiona min-h-12 w-full min-w-0 flex-1 rounded-controle border border-line bg-canvas px-3.5 text-[16px] placeholder:text-ink-300 focus:border-ami-green-600 focus:bg-surface"
            />
            <button
              type="submit"
              className="pressiona min-h-12 shrink-0 rounded-controle bg-ami-green-600 px-4 font-semibold text-white shadow-apoio hover:bg-ami-green-700 hover:shadow-erguido"
            >
              Buscar
            </button>
          </div>
        </form>

        <div>
          <label
            htmlFor="filtro-bairro"
            className="block text-[15px] font-medium text-ink-600"
          >
            Bairro
          </label>
          <select
            id="filtro-bairro"
            value={sp.get("bairro") ?? ""}
            onChange={(e) => aplicar({ bairro: e.target.value || undefined })}
            className="pressiona mt-2 min-h-12 w-full rounded-controle border border-line bg-canvas px-3.5 text-[15px] focus:border-ami-green-600 focus:bg-surface"
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
          <legend className="text-[15px] font-medium text-ink-600">Atendimento</legend>
          <label className="mt-2 -mx-2 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-controle px-2 text-[15px] transition-colors duration-150 hover:bg-ami-lima-100">
            <input
              type="checkbox"
              checked={sp.get("telemedicina") === "1"}
              onChange={(e) => aplicar({ telemedicina: e.target.checked })}
              className="size-5 accent-ami-green-600"
            />
            Atende por telemedicina
          </label>
        </fieldset>

        <fieldset>
          <legend className="text-[15px] font-medium text-ink-600">Acessibilidade</legend>
          {(Object.keys(ROTULO_ACESSIBILIDADE) as RecursoAcessibilidade[]).map(
            (r) => (
              <label
                key={r}
                className="-mx-2 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-controle px-2 text-[15px] transition-colors duration-150 hover:bg-ami-lima-100"
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

        <label className="-mx-2 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-controle px-2 text-[15px] font-semibold transition-colors duration-150 hover:bg-ami-lima-100">
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
            className="block text-[15px] font-medium text-ink-600"
          >
            Ordenar por
          </label>
          <select
            id="filtro-ordem"
            value={sp.get("ordem") ?? "relevancia"}
            onChange={(e) => aplicar({ ordem: e.target.value as Filtros["ordem"] })}
            className="pressiona mt-2 min-h-12 w-full rounded-controle border border-line bg-canvas px-3.5 text-[15px] focus:border-ami-green-600 focus:bg-surface"
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
