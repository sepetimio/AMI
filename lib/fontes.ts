import { Archivo, Source_Sans_3 } from "next/font/google";

/* Archivo é variável e tem eixo de largura (wdth). É por ele que os títulos
   são comprimidos entre 80% e 87,5%, ecoando o letreiro condensado da marca.
   Não existe família "Archivo Condensed" — a compressão vem do eixo. */
export const fonteTitulo = Archivo({
  subsets: ["latin-ext"],
  axes: ["wdth"],
  display: "swap",
  variable: "--fonte-titulo",
});

/* Source Sans 3: escolhida pela legibilidade em corpo pequeno e pela
   cobertura de acentuação portuguesa. latin-ext cobre ã, ç, é, ô. */
export const fonteCorpo = Source_Sans_3({
  subsets: ["latin-ext"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--fonte-corpo",
});
