"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { deveIrAoTopo } from "@/lib/volta-ao-topo";

/*
  Leva ao topo da página nova a cada troca de caminho. Não desenha nada:
  mora no layout do site (app/(site)/layout.tsx). A decisão (topo ou não)
  está em lib/volta-ao-topo.ts; aqui fica só a ligação com o navegador:

  1. o voltar e o avançar disparam `popstate` antes de o React desenhar a
     página de destino. O ouvinte guarda o caminho de destino em
     `caminhoDoHistorico`;
  2. quando o caminho muda, antes da pintura (`useLayoutEffect`), a marca é
     lida e apagada, sempre: uma marca que sobrasse de um voltar que só
     trocou a busca (o caminho não muda, e este efeito não roda) não pode
     valer para a próxima troca por link, e por isso a marca só vale se for
     o caminho que está no endereço;
  3. a primeira passada, na abertura do site, não rola: ali quem decide a
     posição é o navegador (o recarregar devolve a de antes; o `#` leva ao
     trecho). A segunda passada do modo estrito do React, com o mesmo
     caminho, também não;
  4. nas outras, sem marca e sem `#`, vai ao topo na hora (`instant`), sem a
     rolagem suave do `<html>`.

  A troca só da busca (`/busca?…`) não muda o caminho, e a página fica onde
  está. O site não usa `history.scrollRestoration = "manual"`: a posição do
  voltar continua com o navegador.
*/
let caminhoDoHistorico: string | null = null;

function marcarHistorico() {
  caminhoDoHistorico = window.location.pathname;
}

export function VoltaAoTopo() {
  const caminho = usePathname();
  const caminhoAnterior = useRef<string | null>(null);

  useEffect(() => {
    window.addEventListener("popstate", marcarHistorico);
    return () => window.removeEventListener("popstate", marcarHistorico);
  }, []);

  useLayoutEffect(() => {
    const doHistorico = caminhoDoHistorico === window.location.pathname;
    caminhoDoHistorico = null;

    const anterior = caminhoAnterior.current;
    caminhoAnterior.current = caminho;
    if (anterior === null || anterior === caminho) return;

    if (deveIrAoTopo({ doHistorico, ancora: window.location.hash !== "" })) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [caminho]);

  return null;
}
