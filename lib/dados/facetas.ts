import { comoProfissional } from "@/lib/dados/sinonimos";
import type { Medico } from "@/lib/dados/tipos";

export type ResumoFaceta = {
  especialidade: string;
  /** Profissionais distintos. */
  total: number;
  /** Endereços distintos, que é sempre >= total quando alguém tem dois. */
  totalLocais: number;
  /** Quantos atendem em mais de um endereço. */
  comMaisDeUmEndereco: number;
};

/**
 * Parágrafo de abertura da página de especialidade.
 *
 * Gerado a partir dos dados reais: quantos profissionais, em quantos
 * endereços, e quantos atendem em mais de um. Nunca um texto-modelo com a
 * palavra trocada — é exatamente isso que o Google classifica como conteúdo
 * raso.
 *
 * Bairro, telemedicina, acessibilidade e associados não entram: saíram do
 * site em 03/10/2026.
 *
 * Nenhuma frase começa com algarismo: em texto corrido em português isso não
 * se faz, e é um dos sinais mais visíveis de texto gerado.
 */
export function paragrafoDeAbertura(r: ResumoFaceta): string {
  const [sing, plur] = comoProfissional(r.especialidade);
  const nomeProf = r.total === 1 ? sing : plur;

  /* Com um profissional só, todo partitivo plural — "deles", "entre eles",
     "cada um" — passa a se referir a um grupo de uma pessoa, o que soa
     errado. Por isso o singular reescreve a frase inteira em vez de trocar
     a palavra. */
  const umSo = r.total === 1;

  const frases: string[] = [];

  frases.push(
    `A Associação Médica de Imperatriz reúne ${r.total} ${nomeProf} ` +
      `em Imperatriz, no Maranhão, ` +
      (r.totalLocais === 1
        ? `com um único endereço de atendimento.`
        : `somando ${r.totalLocais} endereços de atendimento.`),
  );

  if (r.comMaisDeUmEndereco > 0) {
    frases.push(
      umSo
        ? `O atendimento acontece em mais de um endereço, o que costuma ` +
            `ampliar as opções de local de atendimento.`
        : `Entre eles, ${r.comMaisDeUmEndereco} ` +
            `${r.comMaisDeUmEndereco === 1 ? "atende" : "atendem"} em mais de ` +
            `um endereço, o que costuma ampliar as opções de local de atendimento.`,
    );
  } else {
    frases.push(
      umSo
        ? `O atendimento acontece em um endereço só, sem alternativa de local.`
        : `Cada um atende em um endereço só, sem alternativa de local.`,
    );
  }

  /* Fecho comum a toda página de especialidade. Sem "abaixo": o cartão da
     grade mostra o CRM e o "Ligar", e o endereço e o telefone estão no
     perfil, a um toque. */
  frases.push(
    `Cada perfil traz endereço, telefone e o número de registro no ` +
      `Conselho Regional de Medicina, como exige a Resolução CFM 2.336/2023.`,
  );

  return frases.join(" ");
}

/** Monta o resumo a partir da lista da especialidade. */
export function resumirFaceta(medicos: Medico[], especialidade: string): ResumoFaceta {
  /* Conjunto, não contador: o mesmo endereço compartilhado por dois médicos
     conta como um endereço. */
  const locais = new Set<number>();
  for (const m of medicos) {
    for (const l of m.locais) locais.add(l.id);
  }

  return {
    especialidade,
    total: medicos.length,
    totalLocais: locais.size,
    comMaisDeUmEndereco: medicos.filter((m) => m.locais.length > 1).length,
  };
}
