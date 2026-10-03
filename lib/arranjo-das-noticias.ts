/*
  Como as notícias da home se arrumam, conforme quantas saem (Ruling 30).

  - 4 (ou as quatro provisórias): "ao-lado". O destaque à esquerda e a lista
    das outras três à direita, da mesma altura da foto (abaixo de 1180px, o
    CSS põe o destaque em cima e as três lado a lado, como no desenho).
  - 2 ou 3: "embaixo", em todas as larguras. O destaque na largura toda, em
    cima, e as outras embaixo, lado a lado, com uma coluna para cada uma
    (`colunas`): nenhuma coluna vazia. Ao lado do destaque, a lista de uma
    ou duas deixava espaço vazio, de que o cliente já reclamou duas vezes.
  - 1: "so-destaque". O destaque na largura toda, sem lista.

  Com uma notícia só embaixo do destaque (`deitado`), ela fica deitada,
  miniatura à esquerda e texto à direita, como na lista do computador: de
  pé, numa coluna da largura toda, a foto dela teria o tamanho da foto do
  destaque.

  No celular o CSS ignora tudo isto: é sempre o destaque e a lista de cima
  para baixo, com a miniatura quadrada de 88px.
*/
export type Arranjo = {
  arranjo: "ao-lado" | "embaixo" | "so-destaque";
  /** Colunas da fileira embaixo do destaque (0 quando não há lista). */
  colunas: number;
  /** Uma notícia só embaixo do destaque: miniatura à esquerda. */
  deitado: boolean;
};

export function arranjoDasNoticias(quantas: number): Arranjo | null {
  if (quantas <= 0) return null;
  if (quantas === 1) return { arranjo: "so-destaque", colunas: 0, deitado: false };
  if (quantas < 4) return { arranjo: "embaixo", colunas: quantas - 1, deitado: quantas === 2 };
  return { arranjo: "ao-lado", colunas: 3, deitado: false };
}
