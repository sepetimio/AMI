"use client";

import { useEffect, useState } from "react";
import { Icone } from "@/components/base/Icone";
import styles from "@/components/layout/BarraDoPe.module.css";
import { hrefTelefone } from "@/lib/ami";
import { acoesSairamPorCima } from "@/lib/barra-do-pe";
import { linkDoWhatsapp } from "@/lib/encontre";

/*
  A barra do pé do perfil, só no celular (a regra de largura é a da barra
  padrão, BarraDoPe.module.css): "Ligar" e "WhatsApp" do consultório
  principal. Aparece quando os botões do topo (`[data-acoes-do-medico]`)
  saem da tela por cima (`acoesSairamPorCima`, lib/barra-do-pe.ts).

  Quem a põe na página é o perfil, e só quando o consultório principal tem
  telefone; sem ele, fica a barra padrão. Com esta na página, a padrão não
  aparece (a regra com `:has`, em BarraDoPe.module.css).
*/
export function BarraDoMedico({
  nome,
  telefone,
  whatsapp,
}: {
  nome: string;
  telefone: string;
  whatsapp: string | null;
}) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const acoes = document.querySelector("[data-acoes-do-medico]");
    if (!acoes) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        const entrada = entradas[0];
        setVisivel(acoesSairamPorCima(entrada.isIntersecting, entrada.boundingClientRect.top));
      },
      { threshold: 0 },
    );
    observador.observe(acoes);
    return () => observador.disconnect();
  }, []);

  return (
    <nav
      aria-label={`Contato de ${nome}`}
      data-barra-do-medico=""
      className={`${styles.barra} ${styles.doMedico} ${visivel ? styles.visivel : ""}`}
    >
      <a href={hrefTelefone(telefone)} className={`botao ${styles.buscar}`} aria-label={`Ligar para ${nome}`}>
        <Icone nome="telefone" tamanho={18} /> Ligar
      </a>
      {whatsapp ? (
        <a href={linkDoWhatsapp(whatsapp)} className={styles.ligar} aria-label={`WhatsApp de ${nome}`}>
          <Icone nome="whatsapp" tamanho={18} /> WhatsApp
        </a>
      ) : null}
    </nav>
  );
}
