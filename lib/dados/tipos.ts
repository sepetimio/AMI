/* A forma do domínio, em português e independente do formato de tabela.
   O que muda de nome aqui — `crmUf` em vez de `crm_uf` — é de propósito:
   as telas falam a língua do domínio, não a do banco. */

export type RecursoAcessibilidade =
  | "acesso_cadeirante"
  | "banheiro_adaptado"
  | "elevador"
  | "piso_tatil"
  | "interprete_libras";

export const ROTULO_ACESSIBILIDADE: Record<RecursoAcessibilidade, string> = {
  acesso_cadeirante: "Acesso para cadeirante",
  banheiro_adaptado: "Banheiro adaptado",
  elevador: "Elevador",
  piso_tatil: "Piso tátil",
  interprete_libras: "Intérprete de Libras",
};

export type Bairro = { id: number; nome: string; slug: string };

export type EspecialidadeDoMedico = {
  nome: string;
  slug: string;
  /** Nulo quando o profissional não tem especialidade registrada no CRM. */
  rqe: string | null;
  principal: boolean;
};

export type LocalAtendimento = {
  id: number;
  logradouro: string;
  numero: string | null;
  bairro: Bairro;
  telefone: string | null;
  whatsapp: string | null;
  estacionamento: boolean;
  acessibilidade: RecursoAcessibilidade[];
};

export type Medico = {
  id: number;
  slug: string;
  nome: string;
  crm: string;
  crmUf: string;
  foto: string | null;
  bio: string | null;
  telemedicina: boolean;
  associadoAmi: boolean;
  especialidades: EspecialidadeDoMedico[];
  locais: LocalAtendimento[];
};

export type EspecialidadeComContagem = {
  nome: string;
  slug: string;
  total: number;
};

/** Relevância e nome. Nenhuma ordenação por reputação existe neste site. */
export type Ordem = "relevancia" | "nome";

export type Filtros = {
  termo?: string;
  /** slug da especialidade */
  especialidade?: string;
  /** slug do bairro */
  bairro?: string;
  telemedicina?: boolean;
  acessibilidade?: RecursoAcessibilidade[];
  somenteAssociados?: boolean;
  ordem?: Ordem;
};
