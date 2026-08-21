import { Archivo, Source_Sans_3, Source_Code_Pro } from "next/font/google";

/* Archivo é variável e tem eixo de largura (wdth). É por ele que os títulos
   são comprimidos, ecoando o letreiro condensado da marca. Não existe família
   "Archivo Condensed" — a compressão vem do eixo.

   O peso 800 entra para o nível de display: a compressão só lê como letreiro
   quando a haste é grossa o bastante para a contraforma fechar. A 700, num
   tamanho de 80px, o texto comprimido lê como texto esticado, não como placa. */
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

/*
  Source Code Pro para o dado cartorial: CRM, RQE, telefone, CNPJ.

  Não é decoração. Um diretório médico é um registro público, e o número de
  inscrição é o que torna o profissional verificável no portal do CFM. Em
  monoespaçada o número lê como assento de registro; em texto corrido lê como
  texto de marketing que por acaso tem dígitos. É a mesma razão pela qual
  processo, placa e CPF aparecem em monoespaçada em documento oficial.

  Escolhida por ser da mesma superfamília da Source Sans 3 — mesmo desenho de
  base, mesma altura-x, mesmo autor — em vez de uma monoespaçada qualquer que
  brigaria com o corpo. Um peso só: ela nunca compõe frase, só campo.
*/
export const fonteRegistro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
  variable: "--fonte-registro",
});
