/* Apresentação de dados em português. Funções puras: entram valores,
   saem strings, sem tocar em banco nem em data do sistema. */

/** Formata telefone brasileiro. Devolve a entrada intacta se não reconhecer. */
export function formatarTelefone(bruto: string): string {
  const digitos = bruto.replace(/\D/g, "");
  const nacional = digitos.length > 11 ? digitos.slice(-11) : digitos;

  if (nacional.length === 11) {
    return `(${nacional.slice(0, 2)}) ${nacional.slice(2, 7)}-${nacional.slice(7)}`;
  }
  if (nacional.length === 10) {
    return `(${nacional.slice(0, 2)}) ${nacional.slice(2, 6)}-${nacional.slice(6)}`;
  }
  return bruto;
}

/**
 * Identificação do profissional.
 *
 * A palavra MÉDICO ao lado do CRM é exigência da Resolução CFM 2.336/2023,
 * Art. 4º, I, e precisa aparecer em todo perfil e em toda linha de resultado.
 * Mora aqui para que nenhuma tela consiga esquecer dela.
 */
export function identificacaoMedica(crm: string, uf: string): string {
  return `MÉDICO · CRM/${uf.toUpperCase()} ${crm}`;
}

/** Concorda o substantivo com o número. Zero vai para o plural, em português. */
export function contagem(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/*
  Data em português, por extenso.

  `timeZone` fixo em America/Fortaleza, que é o horário de Imperatriz e não
  tem horário de verão. Sem ele, a formatação segue o fuso de onde o processo
  roda: a Vercel roda em UTC, o computador de quem desenvolve roda em UTC-3, e
  a mesma notícia mostraria dias diferentes conforme o ambiente. Fixar o fuso
  da cidade é o que torna a data na tela igual à data que a AMI escolheu no
  Studio, em qualquer servidor.
*/
export function dataPorExtenso(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Fortaleza",
  }).format(d);
}
