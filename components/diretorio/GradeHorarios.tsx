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
    <table className="w-full border-collapse overflow-hidden rounded-bloco border border-line bg-canvas">
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
              className="whitespace-nowrap px-4 py-2.5 text-left text-[15px] font-semibold"
            >
              {d.nome}
              {hoje === d.dia ? (
                <span className="ml-2 text-xs font-bold uppercase tracking-[0.08em] text-ami-green-700">
                  Hoje
                </span>
              ) : null}
            </th>
            {/*
              Um turno por linha, e não os dois juntos separados por ponto.

              A versão anterior escrevia "08:00 às 12:00 · 14:00 às 18:00" numa
              linha só, com nowrap para as horas não quebrarem no meio. Isso
              dava 440px de largura mínima numa coluna de 352px, e a página
              inteira ganhava 6px de rolagem horizontal — o tipo de defeito que
              no celular vira a página inteira balançando de lado.

              Empilhar também lê melhor: manhã e tarde são dois fatos, não uma
              frase. O dia que atende nos dois turnos fica mais alto que os
              outros, o que é honesto, porque ele tem mesmo mais informação.
            */}
            <td className="registro px-4 py-2.5 text-right text-[14px] text-ink-600">
              {d.faixas.length ? (
                d.faixas.map((f) => (
                  <span key={f} className="block whitespace-nowrap">
                    {f}
                  </span>
                ))
              ) : (
                <span className="text-ink-400">Não atende</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
