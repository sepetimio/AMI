/*
  Quando a gaveta do menu fecha.

  A decisão mora aqui, separada do componente, para poder ser testada sem
  navegador: o projeto não tem jsdom, e o componente só traduz o evento do
  navegador para um destes três formatos e age sobre a resposta.

  - tecla: só Esc fecha.
  - clique: clique fora fecha; clique no botão (que alterna sozinho) ou
    dentro da gaveta (um link que já fecha por conta própria) não.
  - largura: ao passar do ponto de quebra a gaveta deixa de existir, e o
    botão some junto; fechar evita que ele reapareça "aberto" ao estreitar.
*/
export type EventoDaGaveta =
  | { tipo: "tecla"; tecla: string }
  | { tipo: "clique"; noBotao: boolean; naGaveta: boolean }
  | { tipo: "largura"; estreita: boolean };

export function deveFechar(evento: EventoDaGaveta): boolean {
  switch (evento.tipo) {
    case "tecla":
      return evento.tecla === "Escape";
    case "clique":
      return !evento.noBotao && !evento.naGaveta;
    case "largura":
      return !evento.estreita;
  }
}
