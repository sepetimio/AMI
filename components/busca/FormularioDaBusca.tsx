"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icone } from "@/components/base/Icone";
import campo from "@/components/home/EncontreUmMedico.module.css";
import styles from "@/components/busca/FaixaDaBusca.module.css";
import type { OpcaoDeEspecialidade } from "@/lib/encontre";
import {
  aoEnviar,
  enderecoDosValores,
  estadoInicial,
  valoresAposNavegar,
  type ValoresDaBusca,
} from "@/lib/formulario-da-busca";

/*
  O formulário da busca: o campo "Nome ou especialidade" e a lista "Todas
  as especialidades".

  É um formulário HTML de verdade, GET para `/busca`: sem JavaScript, o
  "Buscar" envia, e o "Aplicar" de dentro do <noscript> envia a lista. Com
  JavaScript, enviar e trocar a lista vão para o endereço montado por
  `enderecoDosValores` (lib/formulario-da-busca.ts), sem os campos vazios na
  URL, e sem rolar a página. Digitar no campo não busca nada: a busca é do
  servidor e fica no endereço.

  O formulário nunca é remontado: o campo e a lista continuam os mesmos
  elementos depois da busca, e quem usa teclado não perde o foco (no Windows
  a seta numa lista fechada já troca a escolha, e cada troca é uma busca).
  Por isso os dois são controlados, e acompanham a URL pelo padrão do React
  de guardar a prop anterior e ajustar o estado durante a renderização
  (react.dev, "Storing information from previous renders"): quando `termo`
  ou `especialidade` mudam, `valoresAposNavegar` decide o que mostrar. A URL
  de um envio anterior ao último, que chega depois da escolha nova, não
  volta a lista; o × do filtro e o voltar do navegador, sim.
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
  const [estado, setEstado] = useState(() => estadoInicial({ termo, especialidade }));
  if (estado.daUrl.termo !== termo || estado.daUrl.especialidade !== especialidade) {
    setEstado(valoresAposNavegar(estado, { termo, especialidade }));
  }
  const { valores } = estado;

  const ir = (novos: ValoresDaBusca) => {
    setEstado((atual) => aoEnviar(atual, novos));
    router.push(enderecoDosValores(novos), { scroll: false });
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
        ir(valores);
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
          onChange={(e) => {
            const texto = e.currentTarget.value;
            setEstado((atual) => ({ ...atual, valores: { ...atual.valores, termo: texto } }));
          }}
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
          onChange={(e) => ir({ ...valores, especialidade: e.currentTarget.value })}
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
