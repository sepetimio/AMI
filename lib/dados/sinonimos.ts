/*
  Fonte única do vocabulário médico: para cada especialidade, como o
  paciente chama o profissional no dia a dia, e outros termos de busca.

  Sem isto, a busca só casava com o nome formal da especialidade
  ("Cardiologia") — ninguém digita isso. O paciente digita "cardiologista",
  "pediatra", "uro". `especialidadeCasaTermo` é o que resolve essa busca;
  `comoProfissional` é reaproveitado por `lib/dados/facetas.ts` e
  `lib/seo/metadados.ts` para gerar texto, para que os dois nunca divirjam
  desta tabela.
*/

export type SinonimoEspecialidade = {
  /** Nome formal, como está cadastrado no CRM/banco. */
  especialidade: string;
  singular: string;
  plural: string;
  /** Abreviações e variações que não são nem o singular nem o plural. */
  tokensExtras?: string[];
};

export const SINONIMOS: SinonimoEspecialidade[] = [
  {
    especialidade: "Clínica Médica",
    singular: "clínico geral",
    plural: "clínicos gerais",
    tokensExtras: ["clinica medica", "medicina interna", "internista", "generalista"],
  },
  {
    especialidade: "Cardiologia",
    singular: "cardiologista",
    plural: "cardiologistas",
    tokensExtras: ["cardio"],
  },
  {
    especialidade: "Dermatologia",
    singular: "dermatologista",
    plural: "dermatologistas",
    tokensExtras: ["dermato", "derma"],
  },
  {
    especialidade: "Ginecologia e Obstetrícia",
    singular: "ginecologista",
    plural: "ginecologistas",
    tokensExtras: ["gineco", "obstetra", "obstetras", "obstetricia", "ginecologia"],
  },
  {
    especialidade: "Ortopedia e Traumatologia",
    singular: "ortopedista",
    plural: "ortopedistas",
    tokensExtras: [
      "ortopedia",
      "traumatologista",
      "traumatologistas",
      "traumatologia",
      "traumato",
    ],
  },
  {
    especialidade: "Pediatria",
    singular: "pediatra",
    plural: "pediatras",
  },
  {
    especialidade: "Oftalmologia",
    singular: "oftalmologista",
    plural: "oftalmologistas",
    tokensExtras: ["oftalmo"],
  },
  {
    especialidade: "Psiquiatria",
    singular: "psiquiatra",
    plural: "psiquiatras",
  },
  {
    especialidade: "Endocrinologia",
    singular: "endocrinologista",
    plural: "endocrinologistas",
    tokensExtras: ["endocrino"],
  },
  {
    especialidade: "Gastroenterologia",
    singular: "gastroenterologista",
    plural: "gastroenterologistas",
    tokensExtras: ["gastro"],
  },
  {
    especialidade: "Neurologia",
    singular: "neurologista",
    plural: "neurologistas",
    tokensExtras: ["neuro"],
  },
  {
    especialidade: "Otorrinolaringologia",
    singular: "otorrinolaringologista",
    plural: "otorrinolaringologistas",
    tokensExtras: ["otorrino"],
  },
  {
    especialidade: "Urologia",
    singular: "urologista",
    plural: "urologistas",
    tokensExtras: ["uro"],
  },
  {
    especialidade: "Reumatologia",
    singular: "reumatologista",
    plural: "reumatologistas",
    tokensExtras: ["reumato"],
  },
];

const porEspecialidade = new Map(SINONIMOS.map((s) => [s.especialidade, s]));

/** "José" e "jose" precisam se encontrar: sem isto a busca falha em português. */
export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/* "Cardiologia" vira "cardiologista". Cobre os casos da tabela; o que não
   casar cai no rótulo neutro, que continua correto em português. */
export function comoProfissional(especialidade: string): [string, string] {
  const s = porEspecialidade.get(especialidade);
  if (s) return [s.singular, s.plural];
  return [`médico de ${especialidade}`, `médicos de ${especialidade}`];
}

/**
 * Termos de busca de uma especialidade: nome formal, singular e plural da
 * profissão, e as abreviações da tabela. Uma especialidade fora da tabela
 * ainda gera um token — o próprio nome formal — para continuar achável.
 */
export function tokensDeEspecialidade(especialidade: string): string[] {
  const s = porEspecialidade.get(especialidade);
  const brutos = [especialidade, s?.singular, s?.plural, ...(s?.tokensExtras ?? [])];
  return brutos.filter((t): t is string => Boolean(t)).map(normalizar);
}

/** Abaixo disto, uma busca por especialidade não casa com nada — evita que
    uma letra solta ("a", "de") devolva a lista inteira. */
export const TAMANHO_MINIMO_BUSCA_ESPECIALIDADE = 3;

/**
 * Casamento por PREFIXO de token, não por substring: "uro" tem que achar
 * Urologia sem achar Neurologia, mesmo "uro" estando contido dentro de
 * "neurologista" como sequência de letras. Nomes de médico continuam usando
 * substring (ver `lib/dados/filtros.ts`) — lá o padrão de busca é sobrenome
 * no meio do nome, não começo de palavra.
 */
export function especialidadeCasaTermo(
  especialidade: string,
  termoBusca: string,
): boolean {
  const termo = normalizar(termoBusca);
  if (termo.length < TAMANHO_MINIMO_BUSCA_ESPECIALIDADE) return false;
  return tokensDeEspecialidade(especialidade).some((t) => t.startsWith(termo));
}
