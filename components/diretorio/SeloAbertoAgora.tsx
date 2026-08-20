"use client";

import { useEffect, useState } from "react";
import { estaAbertoAgora, type Horario } from "@/lib/dados/horarios";

/*
  Roda no navegador de propósito.

  Calculado no servidor, o selo congelaria junto com a página em cache e
  mostraria "Aberto agora" de madrugada. Aqui ele nasce oculto e aparece
  depois da montagem, então o HTML servido é sempre honesto — e não há
  divergência entre o que o servidor gerou e o que o cliente renderiza.
*/
export function SeloAbertoAgora({ horarios }: { horarios: Horario[] }) {
  const [aberto, setAberto] = useState<boolean | null>(null);

  useEffect(() => {
    const avaliar = () => setAberto(estaAbertoAgora(horarios, new Date()));
    avaliar();
    /* Meia hora basta: o expediente muda em blocos, não a cada minuto. */
    const id = setInterval(avaliar, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [horarios]);

  if (aberto === null) return null;

  return (
    <span
      className={`inline-flex items-center rounded-chip border px-2.5 py-0.5 text-xs font-semibold ${
        aberto
          ? "border-ami-green-600/30 bg-ami-mint-100 text-ami-green-700"
          : "border-line bg-canvas text-ink-600"
      }`}
    >
      {aberto ? "Aberto agora" : "Fechado agora"}
    </span>
  );
}
