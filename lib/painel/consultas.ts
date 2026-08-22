import type { SupabaseClient } from "@supabase/supabase-js";

/*
  As consultas do painel.

  A tradução de linha para domínio (`paraLista`) fica separada da ida ao banco
  de propósito: é ela que tem as regras — qual especialidade mostrar, bairro
  repetido, laço ausente — e é o que dá para testar sem banco.

  Este módulo NÃO cria o cliente. Ele recebe um pronto, para que quem chama
  decida de onde vem a sessão.
*/

export const POR_PAGINA = 50;

export type MedicoNaLista = {
  id: number;
  slug: string;
  nome: string;
  crm: string;
  crmUf: string;
  publicado: boolean;
  especialidade: string | null;
  bairros: string[];
};

/** `range` do PostgREST é inclusivo nas duas pontas. */
export function faixaDaPagina(pagina: number): { de: number; ate: number } {
  const n = Number.isFinite(pagina) && pagina > 1 ? Math.floor(pagina) : 1;
  const de = (n - 1) * POR_PAGINA;
  return { de, ate: de + POR_PAGINA - 1 };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function paraLista(linha: unknown): MedicoNaLista {
  const l = linha as any;

  const vinculos = (l.profissional_especialidade ?? []) as any[];
  /* Mesma regra que o site usa: a marcada como principal, ou a primeira. */
  const principal = vinculos.find((v) => v.principal) ?? vinculos[0];

  const bairros = [
    ...new Set(
      ((l.atendimento ?? []) as any[])
        .map((a) => a.local?.bairro?.nome)
        .filter((n): n is string => Boolean(n)),
    ),
  ];

  return {
    id: l.id,
    slug: l.slug,
    nome: l.nome,
    crm: l.crm,
    crmUf: l.crm_uf,
    publicado: l.publicado,
    especialidade: principal?.especialidade?.nome ?? null,
    bairros,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const SELECAO = `
  id, slug, nome, crm, crm_uf, publicado,
  profissional_especialidade ( principal, especialidade ( nome ) ),
  atendimento ( local ( bairro ( nome ) ) )
`;

export async function listarMedicos(
  cliente: SupabaseClient,
  opcoes: { termo?: string; pagina?: number },
): Promise<{ medicos: MedicoNaLista[]; total: number }> {
  const { de, ate } = faixaDaPagina(opcoes.pagina ?? 1);
  const termo = (opcoes.termo ?? "").trim();

  let consulta = cliente
    .from("profissional")
    .select(SELECAO, { count: "exact" })
    .order("nome", { ascending: true })
    .range(de, ate);

  if (termo) {
    /* Nome OU CRM. `%` nas duas pontas para achar sobrenome também. */
    const escapado = termo.replace(/[%,]/g, " ");
    consulta = consulta.or(`nome.ilike.%${escapado}%,crm.ilike.%${escapado}%`);
  }

  const { data, error, count } = await consulta;
  if (error) throw new Error(`Falha ao listar médicos: ${error.message}`);

  return { medicos: (data ?? []).map(paraLista), total: count ?? 0 };
}
