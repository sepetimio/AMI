import type { SupabaseClient } from "@supabase/supabase-js";
import { termoSeguro } from "@/lib/painel/consultas";

/*
  Consultórios: leitura e validação.

  Telefone e WhatsApp não são detalhe do endereço — são o objetivo dele. O site
  da AMI existe para encaminhar uma pessoa até um especialista, e o que fecha o
  encaminhamento é o contato.

  Um consultório serve vários médicos: `atendimento` é tabela de ligação. Por
  isso `quantosMedicos` viaja junto na leitura — a tela precisa avisar antes de
  alguém corrigir um telefone achando que mexe só no seu médico.
*/

export type Bairro = { id: number; nome: string };

export type LocalDoMedico = {
  id: number;
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: Bairro;
  cep: string | null;
  telefone: string | null;
  whatsapp: string | null;
  estacionamento: boolean;
  quantosMedicos: number;
};

export type CamposDoLocal = {
  logradouro: string;
  numero: string;
  complemento: string;
  bairroId: string;
  cep: string;
  telefone: string;
  whatsapp: string;
  estacionamento: boolean;
};

/** As chaves saem com o nome que o banco usa, prontas para insert ou update. */
export type LocalValidado = {
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro_id: number;
  cep: string | null;
  telefone: string | null;
  whatsapp: string | null;
  estacionamento: boolean;
};

export type ValidacaoDeLocal =
  | { ok: true; valor: LocalValidado }
  | { ok: false; erros: Partial<Record<keyof CamposDoLocal, string>> };

/** Vazio vira nulo. No banco, nulo e string vazia significam coisas diferentes. */
function ouNulo(s: string): string | null {
  const limpo = s.trim();
  return limpo || null;
}

/*
  Telefone guarda só dígitos, como o importador faz. Formatar é trabalho da
  tela; o banco guarda o número. Texto que se propõe a ser telefone e não tem
  dígito nenhum é erro de digitação, não ausência.
*/
function validarNumeroDeContato(
  s: string,
): { ok: true; valor: string | null } | { ok: false } {
  const limpo = s.trim();
  if (!limpo) return { ok: true, valor: null };

  const digitos = limpo.replace(/\D/g, "");
  if (!digitos) return { ok: false };

  return { ok: true, valor: digitos };
}

export function validarLocal(
  campos: CamposDoLocal,
  bairrosValidos: number[],
): ValidacaoDeLocal {
  const erros: Partial<Record<keyof CamposDoLocal, string>> = {};

  const logradouro = campos.logradouro.replace(/\s+/g, " ").trim();
  if (!logradouro) erros.logradouro = "A rua não pode ficar vazia.";

  const bairroId = Number(campos.bairroId);
  if (!Number.isInteger(bairroId) || !bairrosValidos.includes(bairroId)) {
    erros.bairroId = "Escolha um bairro da lista.";
  }

  const telefone = validarNumeroDeContato(campos.telefone);
  if (!telefone.ok) erros.telefone = "O telefone é um número. Deixe vazio se não houver.";

  const whatsapp = validarNumeroDeContato(campos.whatsapp);
  if (!whatsapp.ok) erros.whatsapp = "O WhatsApp é um número. Deixe vazio se não houver.";

  if (Object.keys(erros).length) return { ok: false, erros };

  return {
    ok: true,
    valor: {
      logradouro,
      numero: ouNulo(campos.numero),
      complemento: ouNulo(campos.complemento),
      bairro_id: bairroId,
      cep: ouNulo(campos.cep),
      telefone: telefone.ok ? telefone.valor : null,
      whatsapp: whatsapp.ok ? whatsapp.valor : null,
      estacionamento: campos.estacionamento,
    },
  };
}

const SELECAO_DE_LOCAL = `
  id, logradouro, numero, complemento, cep, telefone, whatsapp, estacionamento,
  bairro ( id, nome ),
  atendimento ( profissional_id )
`;

/*
  Exportada e testada, mesmo padrão de `paraLista` em
  `lib/painel/consultas.ts` e `ordenarEspecialidades` em
  `lib/painel/especialidades.ts`: é aqui que `quantosMedicos` é calculado, a
  regra que a leitura em duas consultas (acima) existe para proteger.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
export function paraLocal(l: any): LocalDoMedico {
  return {
    id: l.id,
    logradouro: l.logradouro,
    numero: l.numero,
    complemento: l.complemento,
    bairro: { id: l.bairro.id, nome: l.bairro.nome },
    cep: l.cep,
    telefone: l.telefone,
    whatsapp: l.whatsapp,
    estacionamento: l.estacionamento,
    quantosMedicos: (l.atendimento ?? []).length,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/*
  Duas consultas, não uma.

  Filtrar `atendimento.profissional_id` na MESMA consulta que traz
  `atendimento` aninhado restringiria as linhas aninhadas a uma só — e
  `quantosMedicos` daria sempre 1, matando o aviso de endereço compartilhado,
  que é o motivo de o campo existir. Este projeto também não tem precedente de
  filtro em tabela aninhada; o padrão daqui é trazer aninhado e filtrar em
  JavaScript (ver `paraLista` em `lib/painel/consultas.ts`).

  Por isso: primeiro acha os `local_id` do médico em `atendimento` (filtrado);
  depois lê `local` por esses ids, trazendo `atendimento` aninhado SEM filtro,
  para que a contagem valha para todo mundo que usa o endereço.
*/
export async function locaisDoMedico(
  cliente: SupabaseClient,
  medicoId: number,
): Promise<LocalDoMedico[]> {
  const { data: vinculos, error: erroVinculos } = await cliente
    .from("atendimento")
    .select("local_id")
    .eq("profissional_id", medicoId);

  if (erroVinculos) {
    throw new Error(`Falha ao ler os consultórios do médico ${medicoId}: ${erroVinculos.message}`);
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const ids = [...new Set(((vinculos ?? []) as any[]).map((v) => v.local_id as number))];
  if (!ids.length) return [];

  const { data, error } = await cliente
    .from("local")
    .select(SELECAO_DE_LOCAL)
    .in("id", ids);

  if (error) {
    throw new Error(`Falha ao ler os consultórios do médico ${medicoId}: ${error.message}`);
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[]).map(paraLocal);
}

export async function bairros(cliente: SupabaseClient): Promise<Bairro[]> {
  const { data, error } = await cliente
    .from("bairro")
    .select("id, nome")
    .order("nome", { ascending: true });

  if (error) throw new Error(`Falha ao ler os bairros: ${error.message}`);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[]).map((l) => ({ id: l.id, nome: l.nome }));
}

/*
  Todos os consultórios cadastrados, para o "ligar a existente" — o médico
  escolhe entre os endereços que já existem, em vez de criar um endereço
  igual ao de outro médico. São poucas dezenas de linhas hoje, então um
  `select` sem paginação basta; não é a mesma pergunta que `buscarLocais`
  responde, que filtra por termo digitado e existe para uma lista maior.
*/
export async function todosOsLocais(cliente: SupabaseClient): Promise<LocalDoMedico[]> {
  const { data, error } = await cliente
    .from("local")
    .select(SELECAO_DE_LOCAL)
    .order("logradouro", { ascending: true });

  if (error) throw new Error(`Falha ao ler os consultórios: ${error.message}`);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[]).map(paraLocal);
}

/*
  `termoSeguro` de `lib/painel/consultas.ts` escapa o que quebraria o filtro do
  PostgREST — um parêntese digitado na busca derrubava a página inteira antes de
  a fatia 1 corrigir isso. Sem ciclo entre os dois módulos, o import é estático.
*/
export async function buscarLocais(
  cliente: SupabaseClient,
  termo: string,
): Promise<LocalDoMedico[]> {
  const limpo = termoSeguro(termo).trim();
  if (!limpo) return [];

  const { data, error } = await cliente
    .from("local")
    .select(SELECAO_DE_LOCAL)
    .ilike("logradouro", `%${limpo}%`)
    .limit(20);

  if (error) throw new Error(`Falha ao buscar consultórios: ${error.message}`);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[]).map(paraLocal);
}
