import type { Retrato } from "@/lib/importador/tipos";

/*
  Quem pode ir ao ar.

  Perfil sem especialidade não aparece em faceta nenhuma e não serve para
  ninguém; publicá-lo só engorda o número. Perfil sem endereço não responde à
  pergunta que traz a pessoa ao site, que é onde o médico atende.

  Função pura, pelo mesmo motivo do plano: a conferência e a gravação usam a
  mesma seleção, então não há caminho em que divirjam.
*/

export type FiltrosDePublicacao = {
  comEspecialidade: boolean;
  comLocal: boolean;
};

export type Candidato = {
  id: number;
  nome: string;
  slug: string;
  crm: string;
  crmUf: string;
};

export type Selecao = {
  publicar: Candidato[];
  barrados: { candidato: Candidato; motivo: string }[];
};

export function selecionarParaPublicar(
  retrato: Retrato,
  filtros: FiltrosDePublicacao,
): Selecao {
  const comEspecialidade = new Set(
    retrato.vinculosEspecialidade.map((v) => v.profissionalId),
  );
  const comLocal = new Set(retrato.locais.map((l) => l.profissionalId));

  const publicar: Candidato[] = [];
  const barrados: { candidato: Candidato; motivo: string }[] = [];

  for (const p of retrato.profissionais) {
    /* Já está no ar: não é candidato nem barrado, simplesmente não é assunto. */
    if (p.publicado) continue;

    const candidato: Candidato = {
      id: p.id, nome: p.nome, slug: p.slug, crm: p.crm, crmUf: p.crmUf,
    };

    const faltas: string[] = [];
    if (filtros.comEspecialidade && !comEspecialidade.has(p.id)) {
      faltas.push("sem especialidade");
    }
    if (filtros.comLocal && !comLocal.has(p.id)) {
      faltas.push("sem endereço");
    }

    if (faltas.length) barrados.push({ candidato, motivo: faltas.join(" e ") });
    else publicar.push(candidato);
  }

  return { publicar, barrados };
}
