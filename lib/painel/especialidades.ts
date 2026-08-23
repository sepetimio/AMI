import type { SupabaseClient } from "@supabase/supabase-js";

/*
  Especialidades de um médico: leitura e validação.

  A especialidade é o campo mais importante do site: é ela que responde à
  pergunta que traz a pessoa. Por isso a validação daqui é mais rígida que a
  dos outros blocos.

  A validação é pura e fica separada da ida ao banco, como em
  `lib/painel/medico.ts` — é o que permite testar as regras sem banco nenhum.
*/

export type EspecialidadeDoMedico = {
  id: number;
  nome: string;
  rqe: string | null;
  principal: boolean;
};

export type EspecialidadeDisponivel = { id: number; nome: string };

export type ValidacaoDeRqe =
  | { ok: true; valor: string | null }
  | { ok: false; erro: string };

/*
  RQE vazio é caso normal, não erro: clínico geral não tem registro de
  especialidade, e a coluna aceita nulo desde `0001_diretorio.sql`. O que a
  função recusa é texto que se propõe a ser um RQE e não tem número nenhum.
*/
export function validarRqe(rqe: string): ValidacaoDeRqe {
  const limpo = rqe.trim();
  if (!limpo) return { ok: true, valor: null };

  const digitos = limpo.replace(/\D/g, "");
  if (!digitos) {
    return { ok: false, erro: "O RQE é um número. Deixe vazio se não houver." };
  }

  return { ok: true, valor: digitos };
}

/*
  A Resolução CFM 2.336/2023, Art. 4º, II exige o RQE de quem tem especialidade
  registrada. O painel avisa, não impede: quem preenche pode não ter o número em
  mãos na hora, e travar o cadastro por isso deixaria o médico fora do site.
*/
export function avisoDeRqeFaltando(nomes: string[]): string | null {
  if (!nomes.length) return null;

  return (
    `Sem RQE: ${nomes.join(", ")}. ` +
    "A Resolução CFM 2.336/2023 pede o RQE de quem tem especialidade registrada. " +
    "Clínico geral sem RQE é caso normal."
  );
}

export async function especialidadesDoMedico(
  cliente: SupabaseClient,
  medicoId: number,
): Promise<EspecialidadeDoMedico[]> {
  const { data, error } = await cliente
    .from("profissional_especialidade")
    .select("rqe, principal, especialidade ( id, nome )")
    .eq("profissional_id", medicoId);

  if (error) {
    throw new Error(`Falha ao ler as especialidades do médico ${medicoId}: ${error.message}`);
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[])
    .map((l) => ({
      id: l.especialidade.id as number,
      nome: l.especialidade.nome as string,
      rqe: l.rqe as string | null,
      principal: l.principal as boolean,
    }))
    /* A principal primeiro; o resto em ordem alfabética, que é como quem
       preenche procura. */
    .sort((a, b) =>
      a.principal !== b.principal
        ? Number(b.principal) - Number(a.principal)
        : a.nome.localeCompare(b.nome, "pt-BR"),
    );
}

export async function catalogoDeEspecialidades(
  cliente: SupabaseClient,
): Promise<EspecialidadeDisponivel[]> {
  const { data, error } = await cliente
    .from("especialidade")
    .select("id, nome")
    .order("nome", { ascending: true });

  if (error) throw new Error(`Falha ao ler o catálogo: ${error.message}`);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[]).map((l) => ({ id: l.id, nome: l.nome }));
}
