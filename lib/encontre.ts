import { numeroPreenchido } from "@/lib/contato";
import { porNome } from "@/lib/dados/filtros";
import { contagem } from "@/lib/formato";
import { especialidadesComMedico } from "@/lib/especialidades";
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

  O link do WhatsApp e o número preenchido moram em lib/contato.ts, sem
  dependência nenhuma, porque a barra do pé do perfil os leva ao navegador;
  daqui saem reexportados, para a busca e o perfil importarem de um lugar só.
*/
export { linkDoWhatsapp, numeroPreenchido } from "@/lib/contato";

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
 * A especialidade que o cartão do médico mostra. Na página de uma
 * especialidade (`slug`), é a dela, com o RQE dela, quando o médico a tem;
 * fora dela, ou se ele não a tem, é a principal.
 */
export function especialidadeDoCartao(
  m: Pick<Medico, "especialidades">,
  slug: string | null = null,
): EspecialidadeDoMedico | null {
  const daPagina = slug ? m.especialidades.find((e) => e.slug === slug) : undefined;
  return daPagina ?? especialidadePrincipal(m);
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
 * telefone preenchido (`numeroPreenchido`: em branco não conta). Sem
 * telefone em nenhum, null, e o cartão fica sem o botão.
 */
export function telefoneDoCartao(m: Pick<Medico, "locais">): string | null {
  for (const l of m.locais) {
    const telefone = numeroPreenchido(l.telefone);
    if (telefone) return telefone;
  }
  return null;
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
  return especialidadesComMedico(lista).map((e) => ({
    valor: e.slug,
    rotulo: `${e.nome} (${e.total})`,
  }));
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
