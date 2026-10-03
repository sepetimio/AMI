"use client";

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
  `enderecoDaBusca` (lib/dados/urlFiltros.ts), sem os campos vazios na URL.
  Digitar no campo não busca nada: a busca é do servidor e fica no endereço.

  Os valores iniciais vêm da URL atual. Quem usa troca a `key` quando a URL
  muda, para o formulário recomeçar com os valores novos.
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

  const ir = (formulario: HTMLFormElement) => {
    const valores = Object.fromEntries(new FormData(formulario)) as Record<string, string>;
    router.push(enderecoDaBusca(filtrosDaQuery(valores)));
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
          defaultValue={termo}
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
        <select name="especialidade" defaultValue={especialidade} onChange={(e) => ir(e.currentTarget.form!)}>
          <option value="">Todas as especialidades</option>
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <Icone nome="abaixo" className={styles.seta} />
      </label>

      <noscript>
        <button type="submit" className={`botao ${styles.aplicar}`}>
          Aplicar
        </button>
      </noscript>
    </form>
  );
}
