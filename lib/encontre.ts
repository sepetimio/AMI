import { porNome } from "@/lib/dados/filtros";
import { contagem } from "@/lib/formato";
import type {
  EspecialidadeComContagem,
  EspecialidadeDoMedico,
  LocalAtendimento,
  Medico,
} from "@/lib/dados/tipos";

/*
  O que a busca e o perfil decidem sobre um médico, em funções puras: entra
  o dado, sai o texto ou o endereço. Ficam fora dos componentes para serem
  testadas sem navegador (testes/encontre.test.ts).
*/

/** Quantos "outros médicos" o perfil mostra, no máximo. */
export const LIMITE_DE_OUTROS = 4;

/**
 * As iniciais do espaço da foto, enquanto o médico não manda retrato: a
 * primeira letra do primeiro nome e a do último. Nome de uma palavra só dá
 * as duas primeiras letras dela; "JJ" seria a mesma letra duas vezes.
 */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** A especialidade marcada como principal; sem marca, a primeira; sem nenhuma, null. */
export function especialidadePrincipal(
  m: Pick<Medico, "especialidades">,
): EspecialidadeDoMedico | null {
  return m.especialidades.find((e) => e.principal) ?? m.especialidades[0] ?? null;
}

/**
 * O consultório principal: o primeiro da lista. `locais` chega ordenado pelo
 * id do local (lib/dados/medicos.ts), então é sempre o mesmo.
 */
export function consultorioPrincipal(m: Pick<Medico, "locais">): LocalAtendimento | null {
  return m.locais[0] ?? null;
}

/**
 * O telefone do "Ligar" do cartão: o do primeiro consultório que tem
 * telefone. Sem telefone em nenhum, null, e o cartão fica sem o botão.
 */
export function telefoneDoCartao(m: Pick<Medico, "locais">): string | null {
  return m.locais.find((l) => l.telefone)?.telefone ?? null;
}

/** O endereço em duas linhas, como o cartão do consultório mostra. */
export function enderecoDoLocal(
  l: Pick<LocalAtendimento, "logradouro" | "numero" | "bairro">,
): [string, string] {
  return [
    [l.logradouro, l.numero].filter(Boolean).join(", "),
    `${l.bairro.nome}, Imperatriz – MA`,
  ];
}

/** "Como chegar": a busca do Google Maps pelo endereço, sem chave nem serviço novo. */
export function linkDoMapa(l: Pick<LocalAtendimento, "logradouro" | "numero" | "bairro">): string {
  const endereco = enderecoDoLocal(l).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

/**
 * O link do WhatsApp: `wa.me/55` mais o número só com dígitos. Número que
 * já chega com o 55 (mais de 11 dígitos) fica com os 11 últimos, a mesma
 * regra de `formatarTelefone` (lib/formato.ts).
 */
export function linkDoWhatsapp(numero: string): string {
  const digitos = numero.replace(/\D/g, "");
  const nacional = digitos.length > 11 ? digitos.slice(-11) : digitos;
  return `https://wa.me/55${nacional}`;
}

/**
 * "Outros médicos de {especialidade}", no perfil: até `limite` médicos cuja
 * especialidade principal é a mesma deste, sem ele, em ordem alfabética.
 * Médico sem especialidade não tem outros.
 */
export function outrosMedicos(m: Medico, todos: Medico[], limite = LIMITE_DE_OUTROS): Medico[] {
  const principal = especialidadePrincipal(m);
  if (!principal) return [];
  return todos
    .filter((o) => o.slug !== m.slug && especialidadePrincipal(o)?.slug === principal.slug)
    .sort(porNome)
    .slice(0, limite);
}

export type OpcaoDeEspecialidade = { valor: string; rotulo: string };

/** A lista "Todas as especialidades" da busca: alfabética, com a contagem, sem as vazias. */
export function opcoesDeEspecialidade(lista: EspecialidadeComContagem[]): OpcaoDeEspecialidade[] {
  return lista
    .filter((e) => e.total > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((e) => ({ valor: e.slug, rotulo: `${e.nome} (${e.total})` }));
}

/** A contagem acima da grade: "24 médicos", "1 médico", "3 médicos em Cardiologia". */
export function textoDaContagem(total: number, especialidade: string | null): string {
  const texto = contagem(total, "médico", "médicos");
  return especialidade ? `${texto} em ${especialidade}` : texto;
}

/** A biografia em parágrafos: uma linha em branco separa um do outro. */
export function paragrafosDaBio(bio: string): string[] {
  return bio
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
