/*
  Moldes de title e description. O número vem sempre da contagem do banco,
  nunca escrito à mão — se o dataset tem 7 cardiologistas, a frase diz 7.
*/

export const LIMITE_TITULO = 60;
export const LIMITE_DESCRICAO = 155;

const CIDADE = "Imperatriz - MA";
const MARCA = "AMI";

const plural = (n: number, s: string, p: string) => (n === 1 ? s : p);

/* Monta juntando as partes e, se estourar, descarta as menos importantes da
   direita para a esquerda. Cortar no meio da palavra produziria reticências
   no resultado de busca; descartar o sufixo da marca não perde informação. */
function montar(partes: string[], limite: number): string {
  for (let corte = partes.length; corte > 0; corte--) {
    const texto = partes.slice(0, corte).join(" | ");
    if (texto.length <= limite) return texto;
  }
  return partes[0].slice(0, limite);
}

export function tituloEspecialidade(nome: string, total: number): string {
  return montar(
    [
      `${nome} em ${CIDADE}`,
      `${total} ${plural(total, "médico", "médicos")}`,
      MARCA,
    ],
    LIMITE_TITULO,
  );
}

export function tituloFaceta(
  especialidade: string,
  bairro: string,
  total: number,
): string {
  return montar(
    [
      `${especialidade} no ${bairro}, ${CIDADE}`,
      `${total} ${plural(total, "médico", "médicos")}`,
      MARCA,
    ],
    LIMITE_TITULO,
  );
}

export function tituloMedico(
  nome: string,
  especialidade: string | null,
): string {
  const papel = especialidade ?? "Médica";
  return montar([`${nome} - ${papel} em ${CIDADE}`, MARCA], LIMITE_TITULO);
}

/* Mesmo dicionário de nomes de profissional usado nas facetas, em versão
   reduzida: a descrição só precisa do plural. */
function comoProfissional(especialidade: string, total: number): string {
  const mapa: Record<string, [string, string]> = {
    Cardiologia: ["cardiologista", "cardiologistas"],
    Dermatologia: ["dermatologista", "dermatologistas"],
    Pediatria: ["pediatra", "pediatras"],
    Oftalmologia: ["oftalmologista", "oftalmologistas"],
    Psiquiatria: ["psiquiatra", "psiquiatras"],
    Endocrinologia: ["endocrinologista", "endocrinologistas"],
    Gastroenterologia: ["gastroenterologista", "gastroenterologistas"],
    Neurologia: ["neurologista", "neurologistas"],
    Otorrinolaringologia: ["otorrinolaringologista", "otorrinolaringologistas"],
    Urologia: ["urologista", "urologistas"],
    Reumatologia: ["reumatologista", "reumatologistas"],
    "Clínica Médica": ["clínico geral", "clínicos gerais"],
    "Ginecologia e Obstetrícia": ["ginecologista", "ginecologistas"],
    "Ortopedia e Traumatologia": ["ortopedista", "ortopedistas"],
  };
  const par = mapa[especialidade];
  if (!par) return `${plural(total, "médico", "médicos")} de ${especialidade}`;
  return plural(total, par[0], par[1]);
}

function cortarNaPalavra(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  const fatia = texto.slice(0, limite - 1);
  return fatia.slice(0, fatia.lastIndexOf(" ")).replace(/[.,;]$/, "") + ".";
}

export function descricaoEspecialidade(
  nome: string,
  total: number,
  bairros: string[],
): string {
  const onde = bairros.slice(0, 2).join(" e ");
  const texto =
    `${total} ${comoProfissional(nome, total)} em Imperatriz` +
    (onde ? `, com atendimento em ${onde}` : "") +
    `. Endereço, telefone e horários. Associação Médica de Imperatriz.`;
  return cortarNaPalavra(texto, LIMITE_DESCRICAO);
}

export function descricaoMedico(
  nome: string,
  especialidade: string | null,
  bairros: string[],
): string {
  const papel = especialidade ? `, ${especialidade}` : "";
  const onde = bairros.slice(0, 2).join(" e ");
  const texto =
    `${nome}${papel}, em Imperatriz - MA` +
    (onde ? `. Atende em ${onde}` : "") +
    `. Veja CRM, endereço, telefone e horários de atendimento.`;
  return cortarNaPalavra(texto, LIMITE_DESCRICAO);
}
