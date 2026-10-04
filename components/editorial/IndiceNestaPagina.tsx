"use client";

import { useEffect, useRef, useState } from "react";
import { Icone } from "@/components/base/Icone";
import styles from "@/components/editorial/IndiceNestaPagina.module.css";
import { LINHA_DE_LEITURA, secaoAtual, type ItemDoIndice } from "@/lib/nestaPagina";

/*
  O índice "Nesta página" das páginas de texto, montado dos títulos de
  seção (h2) pela página (components/editorial/PaginaDeTexto.tsx).

  `IndiceNestaPagina` fica à direita, preso à rolagem, e marca a seção que
  está sendo lida (`aria-current="location"` e a classe `atual`). A cada
  rolagem, ele mede o topo de cada título e pergunta à função pura qual é
  a seção (`secaoAtual`, lib/nestaPagina.ts), com a linha de leitura do
  desenho. É a mesma regra do desenho aprovado, que marca pela rolagem, e
  não por IntersectionObserver: a seção lida é a do último título que
  passou da linha, e no fim da página é a última.

  Sem JavaScript, ou antes de ele rodar, nenhum item se diz o atual: o HTML
  do servidor não sabe onde a pessoa está.

  `IndiceRecolhido` é o do celular, num `<details>` no alto da coluna; ao
  tocar num item, ele se fecha.

  Componente de cliente: o ícone vem do mapa do cliente
  (components/base/Icone.tsx), nunca de IconeServidor.tsx.
*/
export function IndiceNestaPagina({ itens }: { itens: ItemDoIndice[] }) {
  const [atual, setAtual] = useState(-1);

  useEffect(() => {
    const titulos = itens.map((item) => document.getElementById(item.id));

    function marcar() {
      const noFim =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const topos = titulos.map((t) => (t ? t.getBoundingClientRect().top : Infinity));
      setAtual(secaoAtual(topos, LINHA_DE_LEITURA, noFim));
    }

    marcar();
    window.addEventListener("scroll", marcar, { passive: true });
    window.addEventListener("resize", marcar);
    return () => {
      window.removeEventListener("scroll", marcar);
      window.removeEventListener("resize", marcar);
    };
  }, [itens]);

  return (
    <aside className={styles.lateral} aria-labelledby="nesta-pagina-titulo" data-nesta-pagina="">
      <p id="nesta-pagina-titulo" className={styles.titulo}>
        Nesta página
      </p>
      <ol className={styles.lista}>
        {itens.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={i === atual ? styles.atual : undefined}
              aria-current={i === atual ? "location" : undefined}
            >
              {item.titulo}
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}

export function IndiceRecolhido({ itens }: { itens: ItemDoIndice[] }) {
  const detalhes = useRef<HTMLDetailsElement>(null);

  return (
    <details ref={detalhes} className={styles.recolhido}>
      <summary>
        Nesta página <Icone nome="abaixo" />
      </summary>
      <ol>
        {itens.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={() => {
                if (detalhes.current) detalhes.current.open = false;
              }}
            >
              {item.titulo}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
