"use client";

import { useEffect, useRef, useState } from "react";
import { DURACAO_DO_CONTADOR, valorNoInstante } from "@/lib/contador";

/*
  Um número dos "números da AMI" que conta de 0 até o valor quando entra na
  tela, como no desenho aprovado.

  O HTML de servidor já traz o valor final: sem JavaScript, ou antes de
  hidratar, o número certo está lá, e quem lê a tela o encontra. A contagem
  só começa no cliente, quando o número aparece (`IntersectionObserver`), e
  roda uma vez só: depois de começar, o observador é desligado.

  Quem pede menos movimento no sistema vê o número parado, e zero não tem o
  que contar.

  O estado guarda só o quadro da contagem em curso; fora dela (antes, depois,
  ou com menos movimento) o que aparece é o próprio `valor`, e por isso um
  valor novo vindo do servidor nunca fica para trás.
*/
export function Contador({ valor }: { valor: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [quadroAtual, setQuadroAtual] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || valor <= 0) return;

    let quadro = 0;
    /* O limiar e a margem são os do desenho: começa quando 12% do número já
       passou 40px acima do pé da tela. */
    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        observador.disconnect();
        const inicio = performance.now();
        const passo = (agora: number) => {
          const decorrido = agora - inicio;
          if (decorrido >= DURACAO_DO_CONTADOR) {
            setQuadroAtual(null);
            return;
          }
          setQuadroAtual(valorNoInstante(valor, decorrido));
          quadro = requestAnimationFrame(passo);
        };
        setQuadroAtual(0);
        quadro = requestAnimationFrame(passo);
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observador.observe(el);

    return () => {
      observador.disconnect();
      cancelAnimationFrame(quadro);
      setQuadroAtual(null);
    };
  }, [valor]);

  return <span ref={ref}>{quadroAtual ?? valor}</span>;
}
