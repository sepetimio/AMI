import { comoProfissional as comoProfissionalBase } from "@/lib/dados/sinonimos";

/*
  Moldes de title e description. O número vem sempre da contagem do banco,
  nunca escrito à mão — se o dataset tem 7 cardiologistas, a frase diz 7.
*/

export const LIMITE_TITULO = 60;
export const LIMITE_DESCRICAO = 155;

const CIDADE = "Imperatriz - MA";
const MARCA = "AMI";

const plural = (n: number, s: string, p: string) => (n === 1 ? s : p);

/**
 * Monta o título e o encurta quando não cabe, nesta ordem:
 * primeiro descarta as partes da direita, que são as menos importantes;
 * depois troca a cabeça por uma versão mais curta.
 *
 * `cabecas` vem da mais longa para a mais curta. Cortar no meio de uma
 * palavra é o último recurso e mesmo aí o corte respeita o espaço: um título
 * terminando em "Imperatriz - M" no resultado de busca é pior que um curto.
 */
function montar(cabecas: string[], resto: string[], limite: number): string {
  for (const cabeca of cabecas) {
    for (let corte = resto.length; corte >= 0; corte--) {
      const texto = [cabeca, ...resto.slice(0, corte)].join(" | ");
      if (texto.length <= limite) return texto;
    }
  }
  const fatia = cabecas[cabecas.length - 1].slice(0, limite);
  const espaco = fatia.lastIndexOf(" ");
  return (espaco > 0 ? fatia.slice(0, espaco) : fatia).replace(
    /[\s,;:–-]+$/,
    "",
  );
}

/**
 * Título das páginas cujo assunto já vem escrito: as institucionais, as
 * legais e as notícias, onde o texto da cabeça vem do Sanity ou de uma
 * constante e não de uma contagem do banco.
 *
 * Existe para que o sufixo seja um só no site inteiro. A spec, seção 7, fixa
 * o molde com "| AMI", e o ramo chegou à revisão final com três convenções
 * concorrentes: duas páginas escreviam o nome da associação por extenso,
 * cinco escreviam "AMI" e uma não tinha sufixo nenhum.
 *
 * E não é só cosmético: concatenado à mão, um título de matéria longo passa
 * dos 60 caracteres e o Google corta onde quiser, às vezes no meio do "|
 * AMI". Aqui o `montar` descarta o sufixo antes de deixar isso acontecer.
 */
export function tituloDePagina(cabeca: string): string {
  return montar([cabeca], [MARCA], LIMITE_TITULO);
}

export function tituloEspecialidade(nome: string, total: number): string {
  return montar(
    [`${nome} em ${CIDADE}`, `${nome} em Imperatriz`, nome],
    [`${total} ${plural(total, "médico", "médicos")}`, MARCA],
    LIMITE_TITULO,
  );
}

export function tituloFaceta(
  especialidade: string,
  bairro: string,
  total: number,
): string {
  /* "no bairro X" concorda em português qualquer que seja o gênero do nome
     do bairro — "no bairro Centro", "no bairro Nova Imperatriz" — sem
     precisar de uma coluna de gênero. "Bairro" é masculino, e é ele quem
     licencia o artigo, não o nome que segue. */
  return montar(
    [
      `${especialidade} no bairro ${bairro}, ${CIDADE}`,
      `${especialidade} no bairro ${bairro}`,
    ],
    [`${total} ${plural(total, "médico", "médicos")}`, MARCA],
    LIMITE_TITULO,
  );
}

/**
 * Sem especialidade registrada, o título omite o papel em vez de escrever
 * "Médico" ou "Médica": qualquer um dos dois erra o gênero em metade dos
 * casos, e o nome com a cidade já identifica a página.
 */
export function tituloMedico(
  nome: string,
  especialidade: string | null,
): string {
  const cabecas = especialidade
    ? [
        `${nome} - ${especialidade} em ${CIDADE}`,
        `${nome} - ${especialidade}`,
        nome,
      ]
    : [`${nome} em ${CIDADE}`, nome];
  return montar(cabecas, [MARCA], LIMITE_TITULO);
}

/* Mesma fonte de nomes de profissional usada nas facetas
   (lib/dados/sinonimos.ts), aplicada aqui só ao número que a descrição
   precisa mostrar. */
function comoProfissional(especialidade: string, total: number): string {
  const [singular, plural_] = comoProfissionalBase(especialidade);
  return plural(total, singular, plural_);
}

function cortarNaPalavra(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  const fatia = texto.slice(0, limite - 1);
  return fatia.slice(0, fatia.lastIndexOf(" ")).replace(/[.,;]$/, "") + ".";
}

/* "no bairro X" / "nos bairros X e Y": o artigo concorda com "bairro", que é
   sempre masculino, não com o nome do bairro que vem depois — "no bairro
   Nova Imperatriz" e "nos bairros Centro e Vila Lobão" soam certos os dois,
   sem precisar de uma coluna de gênero para cada nome. */
function noBairro(bairros: string[]): string {
  const nomes = bairros.slice(0, 2).join(" e ");
  if (!nomes) return "";
  return bairros.length > 1 ? `nos bairros ${nomes}` : `no bairro ${nomes}`;
}

export function descricaoEspecialidade(
  nome: string,
  total: number,
  bairros: string[],
): string {
  const onde = noBairro(bairros);
  const texto =
    `${total} ${comoProfissional(nome, total)} em Imperatriz` +
    (onde ? `, com atendimento ${onde}` : "") +
    `. Endereço, telefone e CRM. Associação Médica de Imperatriz.`;
  return cortarNaPalavra(texto, LIMITE_DESCRICAO);
}

/**
 * Descrição da página de cruzamento (especialidade + bairro).
 *
 * Não reaproveita `descricaoEspecialidade`: com todos os profissionais da
 * especialidade concentrados num bairro só e total >= 3, as duas funções
 * receberiam os mesmos argumentos e produziriam a mesma frase — mas a página
 * de especialidade e a de cruzamento são indexáveis com canonicals
 * diferentes, então não podem emitir a mesma description. Esta nomeia o
 * bairro no corpo da frase, o que a distingue sempre.
 */
export function descricaoFaceta(
  especialidade: string,
  bairro: string,
  total: number,
): string {
  const texto =
    `${total} ${comoProfissional(especialidade, total)} no bairro ${bairro}, ` +
    `Imperatriz - MA. Endereço, telefone e CRM. ` +
    `Associação Médica de Imperatriz.`;
  return cortarNaPalavra(texto, LIMITE_DESCRICAO);
}

export function descricaoMedico(
  nome: string,
  especialidade: string | null,
  bairros: string[],
): string {
  const papel = especialidade ? `, ${especialidade}` : "";
  const onde = noBairro(bairros);
  const texto =
    `${nome}${papel}, em Imperatriz - MA` +
    (onde ? `. Atende ${onde}` : "") +
    `. Veja CRM, endereço e telefone.`;
  return cortarNaPalavra(texto, LIMITE_DESCRICAO);
}
