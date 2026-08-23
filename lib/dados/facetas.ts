import { comoProfissional } from "@/lib/dados/sinonimos";
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
  /** Profissionais distintos. */
  total: number;
  /**
   * Profissionais distintos por bairro — não registros de local. Um médico
   * com dois consultórios no mesmo bairro conta uma vez; um com consultórios
   * em bairros diferentes conta em cada um, que é o que o leitor espera ao
   * perguntar "quantos atendem no Centro".
   */
  bairrosComOferta: { nome: string; total: number }[];
  /** Endereços distintos, que é sempre >= total quando alguém tem dois. */
  totalLocais: number;
  comTelemedicina: number;
  /** Conta LOCAIS, não profissionais — o nome diz isso para não derivar. */
  locaisComAcessoCadeirante: number;
  /** Quantos são associados da AMI. */
  associados: number;
  /** Quantos atendem em mais de um endereço. */
  comMaisDeUmEndereco: number;
};

function lista(nomes: string[]): string {
  if (nomes.length === 1) return nomes[0];
  return nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];
}

/**
 * Parágrafo de abertura da página de faceta.
 *
 * Gerado a partir dos dados reais: quantos profissionais, em quantos
 * endereços, onde se concentram, quantos fazem telemedicina, quantos locais
 * têm acesso para cadeirante. Nunca um
 * texto-modelo com a palavra trocada — é exatamente isso que o Google
 * classifica como conteúdo raso.
 *
 * Nenhuma frase começa com algarismo: em texto corrido em português isso não
 * se faz, e é um dos sinais mais visíveis de texto gerado.
 */
export function paragrafoDeAbertura(r: ResumoFaceta): string {
  const [sing, plur] = comoProfissional(r.especialidade);
  const nomeProf = r.total === 1 ? sing : plur;
  /* "no bairro X", não "no X": o artigo concorda com "bairro", que é sempre
     masculino, e não com o nome do bairro — que pode ser feminino ("no
     Nova Imperatriz" soaria errado; "no bairro Nova Imperatriz" está certo
     para qualquer nome, sem precisar de uma coluna de gênero). */
  const onde = r.bairro ? `no bairro ${r.bairro}` : "em Imperatriz";

  /* Com um profissional só, todo partitivo plural — "desses", "deles",
     "entre eles" — passa a se referir a um grupo de uma pessoa, o que soa
     errado. E "ele" resolveria o número acertando o gênero só na metade dos
     casos. Por isso o singular reescreve a frase inteira em vez de trocar a
     palavra. */
  const umSo = r.total === 1;
  const umEnderecoSo = r.totalLocais === 1;

  const frases: string[] = [];

  frases.push(
    `A Associação Médica de Imperatriz reúne ${r.total} ${nomeProf} ` +
      `${onde}, no Maranhão, ` +
      (r.totalLocais === 1
        ? `com um único endereço de atendimento.`
        : `somando ${r.totalLocais} endereços de atendimento.`),
  );

  if (!r.bairro && r.bairrosComOferta.length) {
    const principais = r.bairrosComOferta.slice(0, 3);
    if (principais.length === 1) {
      frases.push(
        `Todo o atendimento se concentra no bairro ${principais[0].nome}.`,
      );
    } else {
      frases.push(
        `A oferta se distribui pelos bairros ` +
          `${lista(principais.map((b) => b.nome))}, sendo ` +
          `${principais[0].total} ${principais[0].total === 1 ? sing : plur} ` +
          `no ${principais[0].nome}.`,
      );
    }
  }

  /* O site existe para levar a pessoa até o especialista certo e permitir o
     contato — não para marcar consulta. Esta frase fica no lugar onde antes
     ficava a de sábado: informativa, sem promessa e sem adjetivo de venda. */
  frases.push(
    umEnderecoSo
      ? `O único endereço traz o telefone do consultório, o contato que ` +
          `fecha o encaminhamento até o especialista.`
      : `Cada endereço traz o telefone do consultório, o contato que fecha ` +
          `o encaminhamento até o especialista.`,
  );

  if (r.comTelemedicina > 0) {
    frases.push(
      umSo
        ? `Há atendimento por telemedicina, alternativa para quem vem de ` +
            `outras cidades da região sul do Maranhão e do sudeste do Pará.`
        : `A telemedicina é oferecida por ${r.comTelemedicina} deles, ` +
            `alternativa para quem vem de outras cidades da região sul do ` +
            `Maranhão e do sudeste do Pará.`,
    );
  } else {
    frases.push(
      `Não há registro de atendimento por telemedicina, então a consulta ` +
        `é presencial.`,
    );
  }

  if (r.locaisComAcessoCadeirante === 0) {
    frases.push(
      umEnderecoSo
        ? `O único endereço não informa acesso para cadeirante no cadastro ` +
            `da associação, o que vale confirmar por telefone antes de ir.`
        : `Nenhum dos endereços informa acesso para cadeirante no cadastro ` +
            `da associação, o que vale confirmar por telefone antes de ir.`,
    );
  } else {
    frases.push(
      umEnderecoSo
        ? `O único endereço informa acesso para cadeirante no cadastro da ` +
            `associação.`
        : `Entre os endereços, ${r.locaisComAcessoCadeirante} ` +
            `${r.locaisComAcessoCadeirante === 1 ? "informa" : "informam"} ` +
            `acesso para cadeirante no cadastro da associação.`,
    );
  }

  /* O singular não usa pronome: "ele" erraria o gênero em metade dos
     casos, e "todos" para uma pessoa só soa errado em português. */
  if (r.associados === 0) {
    frases.push(
      r.total === 1
        ? `O profissional listado não consta como associado da AMI no ` +
            `cadastro atual.`
        : `Nenhum deles consta como associado da AMI no cadastro atual.`,
    );
  } else if (r.associados === r.total) {
    frases.push(
      r.total === 1
        ? `O único profissional listado é associado da Associação Médica de ` +
            `Imperatriz, com cadastro conferido e mantido pela entidade.`
        : `Todos são associados da Associação Médica de Imperatriz, o que ` +
            `significa cadastro conferido e mantido pela entidade.`,
    );
  } else {
    frases.push(
      `Do total, ${r.associados} ` +
        `${r.associados === 1 ? "é associado" : "são associados"} da ` +
        `Associação Médica de Imperatriz, com cadastro conferido pela entidade.`,
    );
  }

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
      r.total === 1
        ? `O atendimento acontece em um endereço só, sem alternativa de local.`
        : `Cada um atende em um endereço só, sem alternativa de local.`,
    );
  }

  /* Fecho comum a toda página de faceta. É curto de propósito: informação
     que não varia com os dados é a que faz duas facetas parecerem a mesma
     página, e é o que o Google trata como conteúdo raso. */
  frases.push(
    `Cada perfil abaixo traz endereço, telefone e o número de registro no ` +
      `Conselho Regional de Medicina, como exige a Resolução CFM 2.336/2023.`,
  );

  return frases.join(" ");
}

/** Monta o resumo a partir da lista já filtrada. */
export function resumirFaceta(
  medicos: Medico[],
  especialidade: string,
  bairro?: string,
): ResumoFaceta {
  /* Conjuntos, não contadores: o mesmo profissional aparece uma vez por
     bairro mesmo com dois consultórios lá, e o mesmo endereço compartilhado
     por dois médicos conta como um endereço. */
  const profissionaisPorBairro = new Map<string, { nome: string; ids: Set<number> }>();
  const locais = new Set<number>();
  const locaisComAcesso = new Set<number>();

  for (const m of medicos) {
    for (const l of m.locais) {
      /* Chaveado pelo slug: dois bairros de nome igual se fundiriam. */
      const chave = l.bairro.slug;
      if (!profissionaisPorBairro.has(chave)) {
        profissionaisPorBairro.set(chave, { nome: l.bairro.nome, ids: new Set() });
      }
      profissionaisPorBairro.get(chave)!.ids.add(m.id);
      locais.add(l.id);
      if (l.acessibilidade.includes("acesso_cadeirante")) {
        locaisComAcesso.add(l.id);
      }
    }
  }

  return {
    especialidade,
    bairro,
    total: medicos.length,
    bairrosComOferta: [...profissionaisPorBairro.values()]
      .map(({ nome, ids }) => ({ nome, total: ids.size }))
      .sort(
        (a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"),
      ),
    totalLocais: locais.size,
    comTelemedicina: medicos.filter((m) => m.telemedicina).length,
    locaisComAcessoCadeirante: locaisComAcesso.size,
    associados: medicos.filter((m) => m.associadoAmi).length,
    comMaisDeUmEndereco: medicos.filter((m) => m.locais.length > 1).length,
  };
}
