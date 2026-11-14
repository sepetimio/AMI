/*
  A conta do recorte da foto: 4:5 pelo centro, no máximo 800x1000, sem
  ampliar. Pura, para testar sem navegador.

  `pequena`: o recorte tem menos de 400x500. A foto é aceita, mas borra.
*/
export type Recorte = {
  sx: number;
  sy: number;
  sLargura: number;
  sAltura: number;
  largura: number;
  altura: number;
  pequena: boolean;
};

const MAXIMA_LARGURA = 800;
const MAXIMA_ALTURA = 1000;
const MINIMA_LARGURA = 400;
const MINIMA_ALTURA = 500;

export function recorteRetrato(largura: number, altura: number): Recorte {
  let sLargura: number;
  let sAltura: number;

  if (largura * 5 > altura * 4) {
    // Mais larga que 4:5: usa a altura toda e corta dos lados.
    sAltura = altura;
    sLargura = Math.floor((altura * 4) / 5);
  } else {
    // Mais estreita (ou igual): usa a largura toda e corta em cima e embaixo.
    sLargura = largura;
    sAltura = Math.floor((largura * 5) / 4);
  }

  const sx = Math.floor((largura - sLargura) / 2);
  const sy = Math.floor((altura - sAltura) / 2);

  const reduz = sLargura > MAXIMA_LARGURA;
  return {
    sx,
    sy,
    sLargura,
    sAltura,
    largura: reduz ? MAXIMA_LARGURA : sLargura,
    altura: reduz ? MAXIMA_ALTURA : sAltura,
    pequena: sLargura < MINIMA_LARGURA || sAltura < MINIMA_ALTURA,
  };
}
