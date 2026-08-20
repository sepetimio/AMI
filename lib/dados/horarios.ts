/* Horário é tabela relacional, nunca texto livre e jamais dentro de imagem —
   foi exatamente isso que inviabilizou filtro e SEO no portal anterior.
   Estas funções são puras e recebem o instante por argumento, para que o
   resultado não dependa do relógio da máquina que roda o teste. */

export type Horario = {
  /** 0 = domingo, 6 = sábado. Mesma convenção de Date.getDay(). */
  diaSemana: number;
  /** "HH:MM" */
  abre: string;
  /** "HH:MM" */
  fecha: string;
};

const NOMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

/** "08:30" vira 510 minutos. Comparar número é mais simples que comparar texto. */
function emMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Aberto no instante dado.
 *
 * A abertura é inclusiva e o fechamento é exclusivo: às 18:00 de um
 * expediente que fecha às 18:00, o consultório já fechou.
 */
export function estaAbertoAgora(horarios: Horario[], instante: Date): boolean {
  const dia = instante.getDay();
  const agora = instante.getHours() * 60 + instante.getMinutes();

  return horarios.some(
    (h) =>
      h.diaSemana === dia &&
      agora >= emMinutos(h.abre) &&
      agora < emMinutos(h.fecha),
  );
}

/** Alimenta o filtro "atende no sábado" e afins. */
export function atendeNoDia(horarios: Horario[], diaSemana: number): boolean {
  return horarios.some((h) => h.diaSemana === diaSemana);
}

/**
 * Sempre sete posições, de domingo a sábado, mesmo nos dias sem atendimento —
 * a tabela do perfil precisa das linhas vazias para não mentir sobre a semana.
 */
export function agruparPorDia(
  horarios: Horario[],
): { dia: number; nome: string; faixas: string[] }[] {
  return NOMES.map((nome, dia) => ({
    dia,
    nome,
    faixas: horarios
      .filter((h) => h.diaSemana === dia)
      .sort((a, b) => emMinutos(a.abre) - emMinutos(b.abre))
      .map((h) => `${h.abre} às ${h.fecha}`),
  }));
}
