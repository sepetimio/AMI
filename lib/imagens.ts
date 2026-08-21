/*
  MANIFESTO DE IMAGENS

  Um diretório médico sem uma única fotografia não é um site sóbrio, é um site
  inacabado: o leitor não vê a cidade, não vê a entidade e não vê ninguém.
  Este arquivo é o único lugar do projeto que decide qual imagem entra em qual
  espaço.

  Enquanto a AMI não entrega o material, cada espaço renderiza uma MOLDURA FPO
  ("for position only"), que é o que um designer coloca numa apresentação:
  ocupa o lugar exato da foto, com a proporção exata, e diz por escrito qual
  foto vai ali.

  Foi uma decisão contra o caminho automático. O primeiro recorte usava
  fotografia de banco por semente fixa, e o resultado foi uma montanha nevada
  no bloco institucional de uma entidade do Maranhão. Banco de imagem por
  semente devolve uma foto real, mas de assunto sorteado: para um cliente de
  Imperatriz, uma rua de Nova York no lugar da sede ensina menos e incomoda
  mais do que uma moldura que diz "aqui entra a fachada da sede".

  PARA COLOCAR O MATERIAL REAL:
    1. salve o arquivo em `public/imagens/`
    2. troque `fonte` pelo caminho, por exemplo "/imagens/sede-ami.jpg"
    3. troque `provisoria` para `false`
  Nada mais no projeto precisa mudar.
*/

export type Espaco = {
  /** Caminho local, a partir de `public/`. Ignorado enquanto `provisoria`. */
  fonte: string;
  /** Alternativo. Descreve a cena, nunca "imagem" ou "foto". */
  alt: string;
  largura: number;
  altura: number;
  /** Rótulo curto impresso na moldura FPO. */
  rotulo: string;
  /** O que a AMI precisa fornecer. Vira a lista de pendências do projeto. */
  precisa: string;
  /** Verdadeiro enquanto não houver material da AMI. */
  provisoria: boolean;
};

export const ESPACOS = {
  sede: {
    fonte: "/imagens/sede-ami.jpg",
    alt: "Fachada da sede da Associação Médica de Imperatriz",
    largura: 1280,
    altura: 960,
    rotulo: "Fachada da sede da AMI",
    precisa:
      "Fachada da sede da AMI, ou uma reunião da diretoria. Horizontal, " +
      "no mínimo 1600px de largura, luz do dia, sem pessoas identificáveis " +
      "que não tenham autorizado o uso.",
    provisoria: true,
  },
  cidade: {
    fonte: "/imagens/imperatriz.jpg",
    alt: "Vista da cidade de Imperatriz, no Maranhão",
    largura: 1600,
    altura: 900,
    rotulo: "Vista de Imperatriz",
    precisa:
      "Vista de Imperatriz que o morador reconheça de imediato: a beira do " +
      "Tocantins, a Catedral de Santa Teresa d'Ávila ou a Avenida Getúlio " +
      "Vargas. Horizontal, no mínimo 2000px de largura.",
    provisoria: true,
  },
} satisfies Record<string, Espaco>;

export type NomeEspaco = keyof typeof ESPACOS;

/** Espaços ainda sem material da AMI. Alimenta a lista de pendências. */
export function espacosProvisorios(): Array<[NomeEspaco, Espaco]> {
  return (Object.entries(ESPACOS) as Array<[NomeEspaco, Espaco]>).filter(
    ([, e]) => e.provisoria,
  );
}
