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

  `timeZone` fixo em America/Fortaleza, o fuso de Imperatriz, que não observa
  hora de verão. Sem ele, a formatação segue o fuso de onde o processo
  roda: a Vercel roda em UTC, o computador de quem desenvolve roda em UTC-3, e
  a mesma notícia mostraria dias diferentes conforme o ambiente. Fixar o fuso
  da cidade é o que torna a data na tela igual à data que a AMI escolheu no
  Studio, em qualquer servidor.
*/
export function dataPorExtenso(iso: string): string {
  if (!iso) return "";

  /*
    Data sem hora ("2026-08-21", formato de coluna `date` pura do Postgres,
    caso de `mandato_inicio`/`mandato_fim` em `diretoria`, tarefa 8) não pode
    ir direto para `new Date`: o construtor lê data-só como meia-noite UTC, e
    formatar esse instante em America/Fortaleza (UTC-3) joga a data para as
    21h do dia anterior, um dia inteiro errado. `atualizadoEm`/`publicadoEm`
    do Sanity não caem aqui porque o campo `datetime` do Studio sempre grava
    timestamp completo, mas esta função não é exclusiva deles.

    Ancorar em meio-dia do próprio fuso de Imperatriz (offset -03:00
    explícito, e não `Z`) evita a virada de dia nos dois sentidos sem
    depender de lógica de fuso própria: seis horas de folga para qualquer
    lado do meio-dia local absorvem o deslocamento inteiro, e o
    `Intl.DateTimeFormat` abaixo continua sendo a única fonte de verdade
    sobre o fuso.
  */
  const semHora = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00-03:00` : iso;

  const d = new Date(semHora);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Fortaleza",
  }).format(d);
}
