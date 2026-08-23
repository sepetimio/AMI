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

/*
  A principal primeiro; o resto em ordem alfabética de português, que é como
  quem preenche procura.

  Separada de `especialidadesDoMedico` de propósito, seguindo o mesmo desenho
  de `paraLista` em `lib/painel/consultas.ts`: é a regra de negócio mais
  visível deste módulo, e ficar pura é o que permite testá-la sem fabricar um
  cliente Supabase.
*/
export function ordenarEspecialidades(
  linhas: EspecialidadeDoMedico[],
): EspecialidadeDoMedico[] {
  return [...linhas].sort((a, b) =>
    a.principal !== b.principal
      ? Number(b.principal) - Number(a.principal)
      : a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

/*
  Quem herda a principal quando a principal é removida.

  A tela garante NO MÁXIMO uma principal — é botão de escolha única. Nada
  garantia PELO MENOS uma: remover a linha marcada deixava o médico com
  especialidades e nenhuma delas principal, e o site inteiro decide por
  `find(e => e.principal) ?? especialidades[0]`, onde esse `[0]` vem de um
  array do PostgREST sem ordenação (`lib/dados/medicos.ts`). Cai nisso o
  título da página, a meta description, a especialidade sob o nome, o
  breadcrumb, "Outros profissionais de X", o `medicalSpecialty` e o RQE do
  JSON-LD, e a linha da busca — e o cache congela a escolha arbitrária por uma
  hora. O autor do importador já tinha visto o mesmo buraco de outro lado
  (`lib/importador/plano.ts`: "Forçar falso aqui o deixaria sem principal
  nenhuma, para sempre.").

  Herda a primeira em ordem alfabética de português entre as que sobram — a
  mesma ordem que `ordenarEspecialidades` acima usa, que é como quem preenche
  procura. Escolha arbitrária é inevitável aqui; o que não pode é ser
  IMPREVISÍVEL, que é o que a ordem do banco era.

  Devolve `null` quando ninguém herda: a removida não era a principal, ou era
  a última que ele tinha. Remover a última é permitido — o médico fica sem
  especialidade nenhuma, e a tela já avisa que assim ele não aparece em busca
  nenhuma do site.

  Pura e separada da ida ao banco, mesmo desenho de `ordenarEspecialidades`
  acima e de `paraLista` em `lib/painel/consultas.ts`.
*/
export function quemHerdaAPrincipal(
  especialidades: EspecialidadeDoMedico[],
  removidaId: number,
): EspecialidadeDoMedico | null {
  const removida = especialidades.find((e) => e.id === removidaId);
  if (!removida || !removida.principal) return null;

  const sobram = especialidades.filter((e) => e.id !== removidaId);
  if (!sobram.length) return null;

  return [...sobram].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))[0];
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
  const linhas = ((data ?? []) as any[]).map((l) => ({
    id: l.especialidade.id as number,
    nome: l.especialidade.nome as string,
    rqe: l.rqe as string | null,
    principal: l.principal as boolean,
  }));

  return ordenarEspecialidades(linhas);
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
