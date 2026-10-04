import type { NomeIcone } from "@/components/base/Icone";
import type { EspecialidadeComContagem } from "@/lib/dados/tipos";
import type { TextoDeEspecialidade } from "@/lib/sanity/tipos";

/*
  O que o índice de especialidades (/medicos) e a página de cada
  especialidade decidem, em funções puras. Ficam fora dos componentes para
  serem testadas sem navegador (testes/especialidades.test.ts):
  - o ícone;
  - a ordem;
  - os pontos de quebra do nome;
  - as frases geradas dos dados;
  - o mês da revisão;
  - a trava do "Sobre".

  Não confundir com lib/dados/especialidades.ts, que lê o banco.
*/

/** O ícone de especialidade sem ícone próprio, inclusive de uma nova que a AMI cadastrar. */
export const ICONE_PADRAO: NomeIcone = "estetoscopio";

/*
  O ícone de cada especialidade, pelo slug, como a spec escolheu (Phosphor,
  duotone). Clínica Médica usa o estetoscópio, que também é o padrão.
  É um `Map`, e não um objeto: num objeto, "constructor" e "toString"
  existiriam como chave e devolveriam uma função no lugar do ícone.
*/
const ICONES = new Map<string, NomeIcone>([
  ["cardiologia", "batimento"],
  ["clinica-medica", "estetoscopio"],
  ["dermatologia", "palma"],
  ["endocrinologia", "meiaGota"],
  ["gastroenterologia", "garfoEFaca"],
  ["ginecologia-e-obstetricia", "feminino"],
  ["neurologia", "cerebro"],
  ["oftalmologia", "olho"],
  ["ortopedia-e-traumatologia", "osso"],
  ["otorrinolaringologia", "orelha"],
  ["pediatria", "bebe"],
  ["psiquiatria", "conversa"],
  ["reumatologia", "mao"],
  ["urologia", "gota"],
]);

export function iconeDaEspecialidade(slug: string): NomeIcone {
  return ICONES.get(slug) ?? ICONE_PADRAO;
}

/**
 * As especialidades que têm médico, em ordem alfabética do português: o
 * índice de especialidades e a lista "Todas as especialidades" da busca.
 */
export function especialidadesComMedico(
  lista: EspecialidadeComContagem[],
): EspecialidadeComContagem[] {
  return lista
    .filter((e) => e.total > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/*
  Os nomes longos que o desenho quebra com hífen opcional (U+00AD), no
  ponto em que a palavra se divide bem. Sem ele, a 375px "Otorrinolaringologia"
  não cabe no cartão. Um nome que não está aqui quebra no espaço, e uma
  palavra que não caiba quebra onde der (`overflow-wrap` do `body`,
  app/globals.css).
*/
const QUEBRAS = new Map<string, string>([
  ["Dermatologia", "Dermato­logia"],
  ["Endocrinologia", "Endocrino­logia"],
  ["Gastroenterologia", "Gastro­enterologia"],
  ["Oftalmologia", "Oftalmo­logia"],
  ["Otorrinolaringologia", "Otorrino­laringologia"],
  ["Reumatologia", "Reumato­logia"],
]);

/** O nome da especialidade com o hífen opcional nas palavras longas. */
export function nomeComQuebras(nome: string): string {
  return nome
    .split(" ")
    .map((palavra) => QUEBRAS.get(palavra) ?? palavra)
    .join(" ");
}

/** A linha de apoio da faixa do índice, com o total de médicos. */
export function linhaDeApoioDoIndice(medicos: number): string {
  const quem =
    medicos === 1
      ? "1 médico associado, com o número de registro no CRM."
      : `${medicos} médicos associados, cada um com o número de registro no CRM.`;
  return `${quem} Escolha a área para ver quem atende.`;
}

/**
 * "Sobre a cardiologia": o nome em minúsculas, como no desenho. O artigo "a"
 * só serve a nome feminino, e as especialidades de hoje terminam todas em
 * "a"; um nome que termine em outra letra (uma nova que a AMI cadastre) fica
 * com "Sobre a especialidade", que não erra o gênero.
 */
export function tituloDoSobre(especialidade: string): string {
  const nome = especialidade.toLocaleLowerCase("pt-BR");
  return nome.endsWith("a") ? `Sobre a ${nome}` : "Sobre a especialidade";
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/**
 * "2026-09-15", a data do campo de data do Studio, vira "setembro de 2026".
 * Lê o texto, sem `Date`: data sem hora lida como instante muda de dia
 * conforme o fuso de quem roda, e aqui só interessam o mês e o ano. Fora do
 * formato do Studio, null.
 */
export function mesDeAno(data: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data ?? "");
  if (!m) return null;
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  return `${MESES[mes - 1]} de ${m[1]}`;
}

/** O que o bloco "Sobre a {especialidade}" desenha: o texto da AMI, ou o "a entrar". */
export type SobreNaTela =
  | { tipo: "texto"; texto: TextoDeEspecialidade }
  | { tipo: "a-entrar" };

/**
 * A trava do "Sobre", a mesma das outras molduras (lib/molduras.ts):
 * - com o texto completo, ele sai nos dois modos;
 * - sem texto, só na demonstração, e como "a entrar";
 * - fora dela, o bloco não existe (null).
 */
export function sobreDaEspecialidade(
  demonstracao: boolean,
  texto: TextoDeEspecialidade | null,
): SobreNaTela | null {
  if (texto) return { tipo: "texto", texto };
  return demonstracao ? { tipo: "a-entrar" } : null;
}
