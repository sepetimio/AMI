/*
  Os tipos que atravessam o importador inteiro.

  Ficam num arquivo só, sem nenhuma implementação, porque as tarefas 2 a 11
  se referem a eles e um tipo declarado dentro do módulo que o usa primeiro
  cria dependência de ida e volta.
*/

/** O que `read-excel-file` devolve numa célula. Medido, não suposto. */
export type Celula = string | number | boolean | Date | null;

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
  "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
  "SE", "SP", "TO",
] as const;

export type Uf = (typeof UFS)[number];

export const NOMES_DE_COLUNA = [
  "nome", "crm", "uf_do_crm", "especialidade", "rqe", "telemedicina",
  "logradouro", "numero", "complemento", "bairro", "cep", "telefone",
  "whatsapp",
] as const;

export type NomeDeColuna = (typeof NOMES_DE_COLUNA)[number];

export type Cabecalho = {
  /** Coluna reconhecida → índice dela na linha. */
  indices: Partial<Record<NomeDeColuna, number>>;
  /** Títulos presentes no arquivo que o importador não usa. */
  ignoradas: string[];
};

/** Problema que NÃO impede o médico de entrar. */
export type Aviso =
  | { tipo: "campo-descartado"; linha: number; campo: NomeDeColuna; motivo: string }
  | { tipo: "especialidade-desconhecida"; linha: number; texto: string }
  | { tipo: "especialidade-fora-do-catalogo"; linha: number; texto: string }
  | { tipo: "rqe-perdido"; linha: number; rqe: string }
  | { tipo: "endereco-sem-bairro"; linha: number }
  | { tipo: "nome-mudou"; linha: number; de: string; para: string; slug: string };

/** Problema que descarta a linha inteira. */
export type ErroDeLinha = { linha: number; motivo: string };

export type EnderecoLido = {
  linha: number;
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: string;
  cep: string | null;
  telefone: string | null;
  whatsapp: string | null;
};

export type LinhaLida = {
  /** Número da linha na planilha como a AMI a enxerga. O cabeçalho é 1. */
  linha: number;
  nome: string;
  crm: string;
  crmUf: Uf;
  especialidade: string | null;
  rqe: string | null;
  /** Nulo quando a célula está vazia: "não sei", e não "falso". */
  telemedicina: boolean | null;
  endereco: EnderecoLido | null;
  avisos: Aviso[];
};

export type EspecialidadeDaPlanilha = {
  texto: string;
  rqe: string | null;
  linha: number;
};

export type MedicoDaPlanilha = {
  crm: string;
  crmUf: Uf;
  nome: string;
  telemedicina: boolean | null;
  especialidades: EspecialidadeDaPlanilha[];
  enderecos: EnderecoLido[];
  linhas: number[];
};

/* --- O retrato do banco, montado por scripts/retrato.ts --- */

export type Retrato = {
  profissionais: {
    id: number;
    slug: string;
    nome: string;
    crm: string;
    crmUf: string;
    telemedicina: boolean;
    associadoAmi: boolean;
    publicado: boolean;
  }[];
  especialidades: { id: number; nome: string; slug: string }[];
  bairros: { id: number; nome: string; slug: string }[];
  locais: {
    id: number;
    profissionalId: number;
    logradouro: string;
    numero: string | null;
    complemento: string | null;
    bairroId: number;
    cep: string | null;
    telefone: string | null;
    whatsapp: string | null;
  }[];
  vinculosEspecialidade: {
    profissionalId: number;
    especialidadeId: number;
    rqe: string | null;
  }[];
};

/* --- O plano --- */

export type Mudanca = { campo: string; de: string; para: string };

export type BairroPlanejado =
  | { tipo: "existente"; id: number }
  | { tipo: "novo"; slug: string };

export type EnderecoPlanejado = {
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: BairroPlanejado;
  cep: string | null;
  telefone: string | null;
  whatsapp: string | null;
};

export type VinculoPlanejado = {
  especialidadeId: number;
  rqe: string | null;
  principal: boolean;
};

export type MedicoNovo = {
  crm: string;
  crmUf: string;
  nome: string;
  slug: string;
  telemedicina: boolean;
  especialidades: VinculoPlanejado[];
  enderecos: EnderecoPlanejado[];
  linhas: number[];
};

export type MedicoAtualizado = {
  id: number;
  crm: string;
  crmUf: string;
  nome: string;
  mudancas: Mudanca[];
  especialidadesNovas: VinculoPlanejado[];
  enderecosNovos: EnderecoPlanejado[];
  enderecosAtualizados: { id: number; mudancas: Mudanca[] }[];
  /** Quantos endereços o banco tem para este médico e a planilha não trouxe. */
  enderecosSoNoBanco: number;
  linhas: number[];
};

export type BairroNovo = {
  nome: string;
  slug: string;
  medicos: number;
  /** Nome de bairro existente ou novo com que este se parece demais. */
  parecidoCom: string | null;
};

export type Plano = {
  arquivo: string;
  linhasLidas: number;
  medicosDistintos: number;
  colunasIgnoradas: string[];
  bairrosNovos: BairroNovo[];
  criar: MedicoNovo[];
  atualizar: MedicoAtualizado[];
  erros: ErroDeLinha[];
  avisos: Aviso[];
  ausentes: { crm: string; crmUf: string; nome: string }[];
};
