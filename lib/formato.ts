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
