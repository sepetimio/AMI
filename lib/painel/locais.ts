import type { SupabaseClient } from "@supabase/supabase-js";
import { ROTULO_ACESSIBILIDADE, type RecursoAcessibilidade } from "@/lib/dados/tipos";
import { chave } from "@/lib/importador/texto";

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
  acessibilidade: string[];
};

/*
  Derivada de `ROTULO_ACESSIBILIDADE`, em `lib/dados/tipos.ts` — a mesma lista
  que o site público já usa para mostrar os recursos no cartão do médico.
  Não repetida à mão: um sexto recurso digitado só aqui deixaria o painel
  marcar algo que o site nunca mostra; um sexto digitado só lá deixaria o
  site mostrar algo que o painel não deixa editar. Uma fonte só, e a ordem
  dela é a mesma que aparece na tela (mesmo padrão de `lib/painel/medico.ts`,
  que importa `UFS` de `lib/importador/tipos` em vez de repetir a lista).

  Os cinco valores continuam sendo exatamente os que a restrição de
  `local_acessibilidade` aceita em `0001_diretorio.sql` — conferido ali, e
  testado abaixo contra a própria constante.
*/
export const RECURSOS_DE_ACESSIBILIDADE: { valor: RecursoAcessibilidade; rotulo: string }[] = (
  Object.keys(ROTULO_ACESSIBILIDADE) as RecursoAcessibilidade[]
).map((valor) => ({ valor, rotulo: ROTULO_ACESSIBILIDADE[valor] }));

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

/*
  A ponte entre o formulário e a validação, irmã de `lerCamposDoMedico` em
  `lib/painel/medico.ts` — e extraída pelo mesmo motivo: dentro da ação ela
  não tinha teste nenhum, e trocar a leitura da caixa de estacionamento por
  `true` passava a suíte inteira.

  Campo ausente vira string vazia, não a palavra "null" que `String(null)`
  devolve. Caixa desmarcada vira `false`, não `undefined`: o navegador não
  manda a caixa desmarcada, e `undefined` gravaria nulo numa coluna booleana.
*/
export function lerCamposDoLocal(dados: FormData): CamposDoLocal {
  const texto = (campo: string): string => {
    const valor = dados.get(campo);
    return valor === null ? "" : String(valor);
  };

  return {
    logradouro: texto("logradouro"),
    numero: texto("numero"),
    complemento: texto("complemento"),
    bairroId: texto("bairroId"),
    cep: texto("cep"),
    telefone: texto("telefone"),
    whatsapp: texto("whatsapp"),
    estacionamento: dados.get("estacionamento") === "on",
  };
}

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

/*
  Chave de comparação de endereço: logradouro normalizado, número e bairro.

  `local` não tem unicidade nenhuma, e endereço nunca é removível por decisão
  de projeto — cada duplicata que entra é lixo permanente. Pior que o lixo: ela
  parte o `quantosMedicos` em dois e DESLIGA CALADO o aviso de endereço
  compartilhado, que é a razão de o campo existir. Dois médicos na mesma
  clínica, cadastrada duas vezes, contam um cada, e quem corrigir o telefone
  acha que mexeu no de todo mundo.

  Mesma ideia do `chaveDeEndereco` do importador (`lib/importador/plano.ts`) e
  a mesma normalização (`chave`, de `lib/importador/texto.ts`: sem acento,
  minúsculas, espaço colapsado). Uma diferença: o importador junta pelo NOME
  do bairro, porque é o que a planilha tem; aqui entra o `bairro_id`, que vem
  de lista fechada e é chave mais forte — dois bairros de nome parecido não se
  confundem, e o mesmo bairro escrito de dois jeitos não existe.

  O que ela NÃO pega: "1200" e "1.200" são números diferentes para ela, e
  "Rua Simplício Moreira" e "R. Simplício Moreira" são ruas diferentes.
  Abreviação é problema de outra ordem — o importador também não a resolve — e
  o preço de errar para o lado de criar um endereço a mais é menor que o de
  ligar um médico ao consultório errado.
*/
export function chaveDeEndereco(
  logradouro: string,
  numero: string | null,
  bairroId: number,
): string {
  return [chave(logradouro), chave(numero ?? ""), String(bairroId)].join("|");
}

export type EnderecoExistente = {
  id: number;
  logradouro: string;
  numero: string | null;
  bairro_id: number;
};

/** O id do endereço equivalente que já existe, ou `null` se nenhum existe. */
export function acharEnderecoIgual(
  novo: { logradouro: string; numero: string | null; bairro_id: number },
  existentes: EnderecoExistente[],
): number | null {
  const alvo = chaveDeEndereco(novo.logradouro, novo.numero, novo.bairro_id);
  const achado = existentes.find(
    (e) => chaveDeEndereco(e.logradouro, e.numero, e.bairro_id) === alvo,
  );

  return achado ? achado.id : null;
}

const SELECAO_DE_LOCAL = `
  id, logradouro, numero, complemento, cep, telefone, whatsapp, estacionamento,
  bairro ( id, nome ),
  atendimento ( profissional_id ),
  local_acessibilidade ( recurso )
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
    acessibilidade: (l.local_acessibilidade ?? []).map((a: any) => a.recurso),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/*
  A tela manda o conjunto inteiro de recursos marcados; esta função decide o
  que muda. Separada e testada em isolado porque é aqui que mora a diferença
  entre reconciliar e apagar tudo e recriar: apagar tudo e recriar deixaria o
  consultório sem nenhum recurso de acessibilidade se a chamada de inserir
  falhasse depois da de remover — o PostgREST não abre transação entre
  requisições. `salvarAcessibilidade`, em `acoes-local.ts`, usa o resultado
  daqui para decidir exatamente o que remover e o que inserir, nunca o
  conjunto inteiro de um dos dois lados.
*/
export function reconciliarAcessibilidade(
  tinha: string[],
  marcados: string[],
): { remover: string[]; inserir: string[] } {
  return {
    remover: tinha.filter((r) => !marcados.includes(r)),
    inserir: marcados.filter((r) => !tinha.includes(r)),
  };
}

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
  O que o `<select>` de "ligar a consultório existente" precisa saber, e nada
  além. Três campos e o id, porque é o que o rótulo mostra: rua, número e
  bairro.

  A lista inteira vai para o navegador — é um Client Component que a recebe
  como propriedade. Mandar `LocalDoMedico` daqui mandava o cadastro inteiro de
  endereços junto: telefone, WhatsApp, CEP, acessibilidade e a contagem de
  médicos de CADA consultório do sistema, para desenhar um menu que mostra
  rua, número e bairro.
*/
export type LocalNaLista = {
  id: number;
  logradouro: string;
  numero: string | null;
  bairro: string;
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function paraLocalNaLista(l: any): LocalNaLista {
  return {
    id: l.id,
    logradouro: l.logradouro,
    numero: l.numero,
    bairro: l.bairro.nome,
  };
}

/*
  Todos os consultórios cadastrados, para o "ligar a existente" — o médico
  escolhe entre os endereços que já existem, em vez de criar um endereço igual
  ao de outro médico. São 24 endereços hoje, e o `<select>` mostra todos de uma
  vez: não há o que paginar nem o que buscar.
*/
export async function todosOsLocais(cliente: SupabaseClient): Promise<LocalNaLista[]> {
  const { data, error } = await cliente
    .from("local")
    .select("id, logradouro, numero, bairro ( nome )")
    .order("logradouro", { ascending: true });

  if (error) throw new Error(`Falha ao ler os consultórios: ${error.message}`);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[]).map(paraLocalNaLista);
}
