"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { MARGEM_DO_OBSERVADOR, revelarNaAbertura } from "@/lib/revelar";

/*
  A entrada dos blocos `.revelar` ao rolar, uma vez só, por
  IntersectionObserver. Não desenha nada: mora no layout do site
  (app/(site)/layout.tsx) e, a cada troca de caminho, faz isto:

  1. quem pediu menos movimento: nada (a decisão está em lib/revelar.ts);
  2. o bloco que já está na tela, ou acima dela, fica como está;
  3. o que está abaixo recebe `data-revelar="espera"` (o CSS, em
     app/globals.css, o deixa transparente, 28px abaixo e borrado) e passa a
     ser observado;
  4. quando ele entra na tela, o atributo vira `"entrou"`, a transição o traz
     para o lugar, e ele deixa de ser observado.

  O HTML do servidor não traz `data-revelar`: sem JavaScript, ou antes de
  ele rodar, nada fica escondido. O bloco só some depois que este componente
  sabe que ele está fora da tela.

  Ao sair da página, a limpeza tira `data-revelar="espera"` dos blocos que
  sobraram e desconecta o observador. Sem ela, um bloco em espera de uma
  página que o React reaproveite ficaria invisível para sempre, sem ninguém
  observando.

  A versão anterior era uma animação presa à rolagem (`animation-timeline:
  view()`), sem JavaScript: um bloco que já abria na primeira tela ficava
  parado no meio dela, desbotado e borrado, até a pessoa rolar.
*/
export function Revelar() {
  const caminho = usePathname();

  useEffect(() => {
    const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alturaDaJanela = window.innerHeight;
    const emEspera = [...document.querySelectorAll<HTMLElement>(".revelar")].filter(
      (bloco) =>
        revelarNaAbertura(bloco.getBoundingClientRect().top, alturaDaJanela, menosMovimento) ===
        "espera",
    );
    if (emEspera.length === 0) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.setAttribute("data-revelar", "entrou");
          observador.unobserve(entrada.target);
        }
      },
      { rootMargin: MARGEM_DO_OBSERVADOR },
    );

    for (const bloco of emEspera) {
      bloco.setAttribute("data-revelar", "espera");
      observador.observe(bloco);
    }

    return () => {
      observador.disconnect();
      for (const bloco of emEspera) {
        if (bloco.getAttribute("data-revelar") === "espera") bloco.removeAttribute("data-revelar");
      }
    };
  }, [caminho]);

  return null;
}
