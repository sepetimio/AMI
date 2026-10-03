/*
  A regra de pausa do carrossel, fora do componente para poder ser testada
  sem navegador (ver testes/pausa-do-carrossel.test.ts).

  São dois motivos de parar, e eles NÃO podem dividir a mesma variável:

  - `pausaDoBotao`: só o botão "Pausar"/"Retomar" muda. É a pausa que a
    pessoa pediu, e ela fica até a pessoa pedir para retomar (WCAG 2.2.2).
  - `emUso`: mouse em cima ou foco de teclado dentro do carrossel. É uma
    pausa de cortesia, que acaba sozinha quando a pessoa sai.

  Quando os dois moravam numa variável só, chegar ao botão pelo teclado já
  pausava e virava o rótulo para "Retomar"; apertar "despausava" e LIGAVA a
  rotação. E pelo mouse, a pausa do clique morria no `mouseleave`.

  O rótulo do botão segue só `pausaDoBotao`: ele diz o que o botão faz, não
  se o mouse está em cima.
*/
export type Pausa = {
  pausaDoBotao: boolean;
  emUso: boolean;
};

export type EventoDePausa =
  | "botao"
  | "mouseEntrou"
  | "mouseSaiu"
  | "focoEntrou"
  | "focoSaiu";

export const SEM_PAUSA: Pausa = { pausaDoBotao: false, emUso: false };

export function aplicarEvento(estado: Pausa, evento: EventoDePausa): Pausa {
  switch (evento) {
    case "botao":
      return { ...estado, pausaDoBotao: !estado.pausaDoBotao };
    case "mouseEntrou":
    case "focoEntrou":
      return { ...estado, emUso: true };
    case "mouseSaiu":
    case "focoSaiu":
      return { ...estado, emUso: false };
  }
}

export function parado(estado: Pausa): boolean {
  return estado.pausaDoBotao || estado.emUso;
}

export function rotuloDoBotao(estado: Pausa): "Pausar" | "Retomar" {
  return estado.pausaDoBotao ? "Retomar" : "Pausar";
}
