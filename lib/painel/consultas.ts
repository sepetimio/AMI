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

/** O que uma busca digitada pode conter sem mudar o sentido do filtro. */
export function termoSeguro(termo: string): string {
  return termo.replace(/[%,()"*]/g, " ");
}

const SELECAO = `
  id, slug, nome, crm, crm_uf, publicado,
  profissional_especialidade ( principal, especialidade ( nome ) ),
  atendimento ( local ( bairro ( nome ) ) )
`;

export type MedicoDoPainel = MedicoNaLista & {
  bio: string | null;
  telemedicina: boolean;
  situacao: string;
  verificadoEm: string | null;
};

const SELECAO_COMPLETA = `
  id, slug, nome, crm, crm_uf, publicado, bio, telemedicina, situacao, verificado_em,
  profissional_especialidade ( principal, especialidade ( nome ) ),
  atendimento ( local ( bairro ( nome ) ) )
`;

export async function medicoPorId(
  cliente: SupabaseClient,
  id: number,
): Promise<MedicoDoPainel | null> {
  const { data, error } = await cliente
    .from("profissional")
    .select(SELECAO_COMPLETA)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao ler o médico ${id}: ${error.message}`);
  if (!data) return null;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const l = data as any;

  return {
    ...paraLista(data),
    bio: l.bio,
    telemedicina: l.telemedicina,
    situacao: l.situacao,
    verificadoEm: l.verificado_em,
  };
}

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
    /*
      Nome OU CRM, com `%` nas duas pontas para achar sobrenome também.

      O que é escapado, e por quê: `.or()` embrulha o filtro em parênteses, e
      um `)` no termo fecharia o grupo antes da hora — a requisição é recusada
      e a tela cai no erro genérico. `%` e `*` são curingas de `ilike` no
      PostgREST e mudariam o alcance da busca em silêncio. `,` separa os
      filtros, e `"` delimita valor.

      Vira espaço em vez de sumir: quem digitou "Silva )" continua achando
      Silva.
    */
    const escapado = termoSeguro(termo);
    consulta = consulta.or(`nome.ilike.%${escapado}%,crm.ilike.%${escapado}%`);
  }

  const { data, error, count } = await consulta;
  if (error) throw new Error(`Falha ao listar médicos: ${error.message}`);

  return { medicos: (data ?? []).map(paraLista), total: count ?? 0 };
}
