"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icone } from "@/components/base/Icone";
import campo from "@/components/home/EncontreUmMedico.module.css";
import styles from "@/components/busca/FaixaDaBusca.module.css";
import { enderecoDaBusca, filtrosDaQuery } from "@/lib/dados/urlFiltros";
import type { OpcaoDeEspecialidade } from "@/lib/encontre";

/*
  O formulário da busca: o campo "Nome ou especialidade" e a lista "Todas
  as especialidades".

  É um formulário HTML de verdade, GET para `/busca`: sem JavaScript, o
  "Buscar" envia, e o "Aplicar" de dentro do <noscript> envia a lista. Com
  JavaScript, enviar e trocar a lista vão para o endereço montado por
  `enderecoDaBusca` (lib/dados/urlFiltros.ts), sem os campos vazios na URL,
  e sem rolar a página. Digitar no campo não busca nada: a busca é do
  servidor e fica no endereço.

  O formulário nunca é remontado: o campo e a lista continuam os mesmos
  elementos depois da busca, e quem usa teclado não perde o foco (no Windows
  a seta numa lista fechada já troca a escolha, e cada troca é uma busca).
  Por isso os dois são controlados, e acompanham a URL pelo padrão do React
  de guardar a prop anterior e ajustar o estado durante a renderização
  (react.dev, "Storing information from previous renders"): quando `termo`
  ou `especialidade` mudam (o × do filtro, o voltar do navegador), os
  valores mostrados passam a ser os da URL.
*/
export function FormularioDaBusca({
  termo,
  especialidade,
  opcoes,
}: {
  termo: string;
  especialidade: string;
  opcoes: OpcaoDeEspecialidade[];
}) {
  const router = useRouter();
  const [valores, setValores] = useState({ termo, especialidade });
  const [daUrl, setDaUrl] = useState({ termo, especialidade });
  if (daUrl.termo !== termo || daUrl.especialidade !== especialidade) {
    setDaUrl({ termo, especialidade });
    setValores({ termo, especialidade });
  }

  const ir = (formulario: HTMLFormElement) => {
    const campos = Object.fromEntries(new FormData(formulario)) as Record<string, string>;
    router.push(enderecoDaBusca(filtrosDaQuery(campos)), { scroll: false });
  };

  return (
    <form
      action="/busca"
      method="get"
      role="search"
      aria-label="Buscar médicos"
      className={styles.filtros}
      onSubmit={(e) => {
        e.preventDefault();
        ir(e.currentTarget);
      }}
    >
      <div className={`${campo.campo} ${styles.campo}`}>
        <Icone nome="lupa" className={campo.lupa} />
        <label htmlFor="busca-termo" className="sr-only">
          Nome do médico ou especialidade
        </label>
        <input
          id="busca-termo"
          name="termo"
          type="search"
          value={valores.termo}
          onChange={(e) => setValores({ ...valores, termo: e.currentTarget.value })}
          placeholder="Nome ou especialidade"
          enterKeyHint="search"
          autoComplete="off"
        />
        <button type="submit" className={`botao ${campo.buscar}`}>
          Buscar <Icone nome="seta" />
        </button>
      </div>

      <label className={styles.listaEsp}>
        <span className="sr-only">Especialidade</span>
        <select
          name="especialidade"
          value={valores.especialidade}
          onChange={(e) => {
            setValores({ ...valores, especialidade: e.currentTarget.value });
            ir(e.currentTarget.form!);
          }}
        >
          <option value="">Todas as especialidades</option>
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <Icone nome="abaixo" className={styles.seta} />
      </label>

      {/* Só existe sem JavaScript. O item da grade é o próprio <noscript>, numa
          linha de baixo; o botão fica à esquerda dele, sem regra própria. */}
      <noscript>
        <button type="submit" className="botao">
          Aplicar
        </button>
      </noscript>
    </form>
  );
}
