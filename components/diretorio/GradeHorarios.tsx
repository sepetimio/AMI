"use client";

import { useEffect, useState } from "react";
import { agruparPorDia, type Horario } from "@/lib/dados/horarios";

/*
  Tabela real, não <div> soltas: leitor de tela anuncia linha e coluna, e o
  Google entende a estrutura.

  O destaque de "hoje" roda no navegador pelo mesmo motivo do selo Aberto
  agora — no servidor ele congelaria junto com a página em cache e apontaria
  o dia errado.
*/
export function GradeHorarios({ horarios }: { horarios: Horario[] }) {
  const [hoje, setHoje] = useState<number | null>(null);
  useEffect(() => {
    const definir = () => setHoje(new Date().getDay());
    definir();
  }, []);

  const dias = agruparPorDia(horarios);

  return (
    <table className="w-full max-w-md border-collapse overflow-hidden rounded-bloco border border-line bg-surface">
      <caption className="sr-only">Horários de atendimento por dia</caption>
      <tbody>
        {dias.map((d) => (
          <tr
            key={d.dia}
            className={`border-b border-line last:border-b-0 ${
              hoje === d.dia ? "bg-ami-mint-100" : ""
            }`}
          >
            <th
              scope="row"
              className="px-4 py-2.5 text-left text-[15px] font-semibold"
            >
              {d.nome}
              {hoje === d.dia ? (
                <span className="ml-2 text-xs font-bold uppercase tracking-[0.08em] text-ami-green-700">
                  Hoje
                </span>
              ) : null}
            </th>
            <td className="numero-tabular px-4 py-2.5 text-right text-[15px] text-ink-600">
              {d.faixas.length ? d.faixas.join(" · ") : "Não atende"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
