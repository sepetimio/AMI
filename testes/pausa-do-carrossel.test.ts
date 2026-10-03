import { describe, expect, it } from "vitest";
import {
  SEM_PAUSA,
  aplicarEvento,
  parado,
  rotuloDoBotao,
  type EventoDePausa,
  type Pausa,
} from "@/lib/pausaDoCarrossel";

/*
  As duas sequências que a revisão final reproduziu no navegador, quando o
  botão e o mouse/foco escreviam na mesma variável (WCAG 2.2.2: quem pede
  para parar precisa que pare). Cada passo guarda o rótulo do botão e se a
  rotação está parada, para o teste dizer em que passo a regra quebrou.
*/
function percorrer(eventos: EventoDePausa[]) {
  let estado: Pausa = SEM_PAUSA;
  return eventos.map((evento) => {
    estado = aplicarEvento(estado, evento);
    return { evento, rotulo: rotuloDoBotao(estado), parado: parado(estado) };
  });
}

describe("pausa do carrossel", () => {
  it("pelo teclado: chegar ao botão não vira o rótulo, e apertar pausa de verdade", () => {
    expect(percorrer(["focoEntrou", "botao", "focoSaiu"])).toEqual([
      /* O foco chegou: a rotação para por cortesia, mas o botão ainda diz o
         que faz — pausar. Antes, aqui ele já dizia "Retomar". */
      { evento: "focoEntrou", rotulo: "Pausar", parado: true },
      /* Apertou: antes isto LIGAVA a rotação. */
      { evento: "botao", rotulo: "Retomar", parado: true },
      /* O foco saiu: a pausa pedida continua. */
      { evento: "focoSaiu", rotulo: "Retomar", parado: true },
    ]);
  });

  it("pelo mouse: a pausa do clique sobrevive ao mouse sair", () => {
    expect(percorrer(["mouseEntrou", "botao", "mouseSaiu"])).toEqual([
      { evento: "mouseEntrou", rotulo: "Pausar", parado: true },
      { evento: "botao", rotulo: "Retomar", parado: true },
      /* Antes, `onMouseLeave` zerava a pausa aqui. */
      { evento: "mouseSaiu", rotulo: "Retomar", parado: true },
    ]);
  });

  it("retomar pelo botão volta a girar quando a pessoa sai", () => {
    const passos = percorrer([
      "mouseEntrou",
      "botao",
      "botao",
      "mouseSaiu",
    ]);
    expect(passos.at(-2)).toEqual({
      evento: "botao",
      rotulo: "Pausar",
      /* Ainda com o mouse em cima: parado por cortesia. */
      parado: true,
    });
    expect(passos.at(-1)).toEqual({
      evento: "mouseSaiu",
      rotulo: "Pausar",
      parado: false,
    });
  });

  it("sem botão, mouse e foco só param enquanto estão lá", () => {
    expect(percorrer(["mouseEntrou", "mouseSaiu"]).at(-1)).toEqual({
      evento: "mouseSaiu",
      rotulo: "Pausar",
      parado: false,
    });
    expect(percorrer(["focoEntrou", "focoSaiu"]).at(-1)).toEqual({
      evento: "focoSaiu",
      rotulo: "Pausar",
      parado: false,
    });
  });

  it("começa girando, com o botão oferecendo pausar", () => {
    expect(parado(SEM_PAUSA)).toBe(false);
    expect(rotuloDoBotao(SEM_PAUSA)).toBe("Pausar");
  });
});
