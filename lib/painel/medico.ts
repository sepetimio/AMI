import { UFS } from "@/lib/importador/tipos";

/*
  Validação dos campos do médico, pura.

  Sem biblioteca de validação: o projeto não tem nenhuma, e aqui são cinco
  regras. Os erros vêm todos de uma vez, em vez de um por envio — corrigir
  três campos em três idas ao servidor é o tipo de coisa que faz quem preenche
  desistir no meio.

  `UFS` vem de `lib/importador/tipos.ts`. O nome do lugar destoa, e é o preço
  de não refatorar por uma constante; se um terceiro consumidor aparecer, ela
  muda de casa.
*/

export type CamposDoMedico = {
  nome: string;
  crm: string;
  crmUf: string;
  telemedicina: boolean;
  situacao: string;
  bio: string;
  verificadoEm: string;
};

/** As chaves saem com o nome que o banco usa, prontas para o update. */
export type MedicoValidado = {
  nome: string;
  crm: string;
  crm_uf: string;
  telemedicina: boolean;
  situacao: "ativo" | "inativo";
  bio: string | null;
  verificado_em: string | null;
};

export type Validacao =
  | { ok: true; valor: MedicoValidado }
  | { ok: false; erros: Partial<Record<keyof CamposDoMedico, string>> };

const SITUACOES = ["ativo", "inativo"] as const;

/** Data no formato que a coluna `date` do Postgres aceita. */
function ehDataISO(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function validarMedico(campos: CamposDoMedico): Validacao {
  const erros: Partial<Record<keyof CamposDoMedico, string>> = {};

  const nome = campos.nome.replace(/\s+/g, " ").trim();
  if (!nome) erros.nome = "O nome não pode ficar vazio.";

  const crm = campos.crm.replace(/\D/g, "");
  if (!crm) erros.crm = "O CRM precisa ter pelo menos um dígito.";

  const crmUf = campos.crmUf.trim().toUpperCase();
  if (!(UFS as readonly string[]).includes(crmUf)) {
    erros.crmUf = `A UF "${campos.crmUf}" não existe.`;
  }

  const situacao = campos.situacao.trim();
  if (!(SITUACOES as readonly string[]).includes(situacao)) {
    erros.situacao = "Situação precisa ser ativo ou inativo.";
  }

  const verificadoEm = campos.verificadoEm.trim();
  if (verificadoEm && !ehDataISO(verificadoEm)) {
    erros.verificadoEm = "A data precisa estar no formato 2026-08-22.";
  }

  if (Object.keys(erros).length) return { ok: false, erros };

  const bio = campos.bio.trim();

  return {
    ok: true,
    valor: {
      nome,
      crm,
      crm_uf: crmUf,
      telemedicina: campos.telemedicina,
      situacao: situacao as "ativo" | "inativo",
      /* Vazio vira nulo, não string vazia: no banco os dois significam coisas
         diferentes, e a tela do site testa `bio ? ... : null`. */
      bio: bio || null,
      verificado_em: verificadoEm || null,
    },
  };
}

/*
  O que impede este perfil de servir para alguém.

  A ordem é a do estrago: sem especialidade ele não aparece em faceta nenhuma;
  sem endereço não responde à pergunta que traz a pessoa ao site; sem
  biografia ele funciona, só fica mais pobre.
*/
export function oQueFalta(m: {
  temEspecialidade: boolean;
  temEndereco: boolean;
  temBio: boolean;
}): string[] {
  const falta: string[] = [];
  if (!m.temEspecialidade) falta.push("sem especialidade");
  if (!m.temEndereco) falta.push("sem endereço");
  if (!m.temBio) falta.push("sem biografia");
  return falta;
}
