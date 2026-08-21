"use client";

import { useEffect, useState } from "react";
import { Chip } from "@/components/base/Chip";
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
    <Chip tom="estado" vivo={aberto}>
      {aberto ? "Aberto agora" : "Fechado agora"}
    </Chip>
  );
}
