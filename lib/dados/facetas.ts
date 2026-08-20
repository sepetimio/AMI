import type { Medico } from "@/lib/dados/tipos";

/**
 * Corte de indexação.
 *
 * Uma página com um ou dois profissionais existe, funciona e é navegável,
 * mas sai como `noindex, follow` com canonical para a especialidade. Conforme
 * a AMI cadastra mais gente, ela entra no índice sozinha — a contagem vem do
 * banco, não de uma lista escrita à mão.
 */
export const MINIMO_PARA_INDEXAR = 3;

export function facetaEhIndexavel(total: number): boolean {
  return total >= MINIMO_PARA_INDEXAR;
}

export type ResumoFaceta = {
  especialidade: string;
  /** Nome do bairro, quando a faceta é de cruzamento. */
  bairro?: string;
  total: number;
  bairrosComOferta: { nome: string; total: number }[];
  atendemSabado: number;
  comTelemedicina: number;
  comAcessoCadeirante: number;
};

/* "Cardiologia" vira "cardiologista". Cobre os casos do catálogo; o que não
   casar cai no rótulo neutro, que continua correto em português. */
function comoProfissional(especialidade: string): [string, string] {
  const mapa: Record<string, [string, string]> = {
    Cardiologia: ["cardiologista", "cardiologistas"],
    Dermatologia: ["dermatologista", "dermatologistas"],
    Pediatria: ["pediatra", "pediatras"],
    Oftalmologia: ["oftalmologista", "oftalmologistas"],
    Psiquiatria: ["psiquiatra", "psiquiatras"],
    Endocrinologia: ["endocrinologista", "endocrinologistas"],
    Gastroenterologia: ["gastroenterologista", "gastroenterologistas"],
    Neurologia: ["neurologista", "neurologistas"],
    Otorrinolaringologia: ["otorrinolaringologista", "otorrinolaringologistas"],
    Urologia: ["urologista", "urologistas"],
    Reumatologia: ["reumatologista", "reumatologistas"],
    "Clínica Médica": ["clínico geral", "clínicos gerais"],
    "Ginecologia e Obstetrícia": ["ginecologista", "ginecologistas"],
    "Ortopedia e Traumatologia": ["ortopedista", "ortopedistas"],
  };
  return (
    mapa[especialidade] ?? [
      `médico de ${especialidade}`,
      `médicos de ${especialidade}`,
    ]
  );
}

function lista(nomes: string[]): string {
  if (nomes.length === 1) return nomes[0];
  return nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];
}

/**
 * Parágrafo de abertura da página de faceta.
 *
 * Gerado a partir dos dados reais: quantos profissionais, onde se concentram,
 * quantos atendem aos sábados, quantos fazem telemedicina, quantos locais têm
 * acesso para cadeirante. Nunca um texto-modelo com a palavra trocada — é
 * exatamente isso que o Google classifica como conteúdo raso.
 */
export function paragrafoDeAbertura(r: ResumoFaceta): string {
  const [sing, plur] = comoProfissional(r.especialidade);
  const nomeProf = r.total === 1 ? sing : plur;
  const onde = r.bairro ? `no ${r.bairro}, em Imperatriz` : "em Imperatriz";

  const frases: string[] = [];

  frases.push(
    `A Associação Médica de Imperatriz reúne ${r.total} ${nomeProf} ` +
      `com atendimento ${onde}, no Maranhão.`,
  );

  if (!r.bairro && r.bairrosComOferta.length) {
    const principais = r.bairrosComOferta.slice(0, 3);
    if (principais.length === 1) {
      frases.push(
        `O atendimento se concentra no bairro ${principais[0].nome}.`,
      );
    } else {
      frases.push(
        `A oferta se distribui pelos bairros ${lista(principais.map((b) => b.nome))}, ` +
          `sendo ${principais[0].total} ${principais[0].total === 1 ? sing : plur} ` +
          `no ${principais[0].nome}.`,
      );
    }
  }

  if (r.atendemSabado > 0) {
    frases.push(
      `Desses, ${r.atendemSabado} ${r.atendemSabado === 1 ? "atende" : "atendem"} ` +
        `aos sábados, o que costuma resolver a consulta de quem trabalha ` +
        `em horário comercial durante a semana.`,
    );
  } else {
    frases.push(
      `Por enquanto, os atendimentos acontecem apenas em dias úteis, de ` +
        `segunda a sexta-feira.`,
    );
  }

  /* Nenhuma frase começa com algarismo: em texto corrido em português isso
     não se faz, e é um dos sinais mais visíveis de texto gerado. */
  if (r.comTelemedicina > 0) {
    frases.push(
      `A telemedicina é oferecida por ${r.comTelemedicina} ` +
        `deles, alternativa para quem ` +
        `vem de outras cidades da região sul do Maranhão e do sudeste do Pará.`,
    );
  }

  /* O caso zero merece frase própria. "0 locais de atendimento têm acesso"
     é a redação que denuncia geração automática — e a informação de que
     nenhum local tem acesso é útil demais para ser omitida. */
  if (r.comAcessoCadeirante === 0) {
    frases.push(
      `Nenhum dos locais de atendimento informa acesso para cadeirante no ` +
        `cadastro da associação, o que vale confirmar por telefone antes de ir.`,
    );
  } else {
    frases.push(
      `Entre os locais de atendimento, ${r.comAcessoCadeirante} ` +
        `${r.comAcessoCadeirante === 1 ? "informa" : "informam"} acesso para ` +
        `cadeirante no cadastro da associação.`,
    );
  }

  frases.push(
    `Cada perfil abaixo traz o endereço completo, o telefone de contato e os ` +
      `horários de atendimento por dia da semana, além do número de registro ` +
      `no Conselho Regional de Medicina, conforme exige a Resolução CFM ` +
      `2.336/2023. Os dados são mantidos pela Associação Médica de Imperatriz ` +
      `e revisados a cada atualização enviada pelo profissional. Se quem você ` +
      `procura não estiver aqui, vale olhar as especialidades relacionadas no ` +
      `fim da página: a divisão entre algumas áreas varia conforme a formação ` +
      `de cada médico.`,
  );

  return frases.join(" ");
}

/** Monta o resumo a partir da lista já filtrada. */
export function resumirFaceta(
  medicos: Medico[],
  especialidade: string,
  bairro?: string,
): ResumoFaceta {
  const porBairro = new Map<string, number>();
  let comAcessoCadeirante = 0;

  for (const m of medicos) {
    for (const l of m.locais) {
      porBairro.set(l.bairro.nome, (porBairro.get(l.bairro.nome) ?? 0) + 1);
      if (l.acessibilidade.includes("acesso_cadeirante")) comAcessoCadeirante++;
    }
  }

  return {
    especialidade,
    bairro,
    total: medicos.length,
    bairrosComOferta: [...porBairro.entries()]
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR")),
    atendemSabado: medicos.filter((m) =>
      m.locais.some((l) => l.horarios.some((h) => h.diaSemana === 6)),
    ).length,
    comTelemedicina: medicos.filter((m) => m.telemedicina).length,
    comAcessoCadeirante,
  };
}
