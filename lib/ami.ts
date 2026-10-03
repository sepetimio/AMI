/*
  DADOS INSTITUCIONAIS DA AMI

  Fonte única. O rodapé de toda página e o dado estruturado enviado ao Google
  leem daqui, e é assim de propósito.

  O critério de negócio local do Google exige que o nome, o endereço e o
  telefone sejam **idênticos** em todo lugar onde apareçam, e iguais ao que
  está no perfil da empresa no Google. Endereço escrito de um jeito no rodapé e
  de outro no JSON-LD não dá erro em lugar nenhum: só enfraquece o sinal, em
  silêncio, e ninguém descobre. Com uma fonte só, a divergência deixa de ser
  possível.

  Recebido do cliente em 21/08/2026. O CNPJ foi conferido pelos dígitos
  verificadores antes de entrar aqui.
*/

export const AMI = {
  razaoSocial: "Associação Médica de Imperatriz",
  sigla: "AMI",
  cnpj: "06.651.376/0001-42",
  naturezaJuridica: "Associação privada",

  /* Em atividade desde 1975. Ano, e não data: é o que o cliente forneceu, e
     inventar mês e dia para preencher um campo seria fabricar registro. */
  fundadaEm: "1975",

  endereco: {
    logradouro: "Rua Coriolano Milhomem",
    numero: "39",
    bairro: "Centro",
    cidade: "Imperatriz",
    uf: "MA",
    cep: "65900-330",
  },

  /*
    Dois números. O primeiro é o fixo da sede e é o que sai como telefone
    principal; o segundo é celular.

    Nenhum dos dois está marcado como WhatsApp, e não vou supor: um botão de
    WhatsApp apontando para uma linha que não atende por lá é pior do que não
    ter botão. Se a AMI confirmar, vira campo próprio.
  */
  telefones: ["(99) 3524-3716", "(99) 98802-0205"],

  redes: {
    instagram: "https://www.instagram.com/associacaomedicadeimperatriz/",
  },
} as const;

/** Endereço em uma linha, para uso corrido. */
export function enderecoEmLinha(): string {
  const e = AMI.endereco;
  return `${e.logradouro}, ${e.numero}, ${e.bairro}, ${e.cidade} - ${e.uf}`;
}

/**
 * Telefone no formato que o link `tel:` exige: só dígitos, com o código do
 * país. O que o usuário vê continua sendo o número formatado.
 *
 * Fica de fora dos exports de propósito: o rodapé já usou isto direto num
 * `href`, sem o `tel:`, e o link quebrou em todo o site. Quem precisa de
 * link usa `hrefTelefone`.
 */
function telefoneParaLigar(numero: string): string {
  return `+55${numero.replace(/\D/g, "")}`;
}

/**
 * O `href` completo de um link de telefone: `tel:` mais o número de
 * `telefoneParaLigar`. É o único lugar que escreve `tel:`; quem monta o
 * prefixo à mão pode esquecê-lo, e `+5599...` sem ele vira endereço de página.
 */
export function hrefTelefone(numero: string): string {
  return `tel:${telefoneParaLigar(numero)}`;
}
