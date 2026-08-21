import { Geist, Geist_Mono } from "next/font/google";

/*
  Uma família só, em toda a interface, com peso variável de 100 a 900.

  Antes eram duas: Archivo condensada nos títulos e Source Sans 3 no corpo. A
  Archivo entrou por um argumento que parecia bom, ecoar o letreiro comprimido
  da marca, e envelheceu mal na tela: título condensado é a assinatura visual
  de jornal e de folheto, e puxava o site inteiro para um registro impresso e
  datado. O eco da marca passa a vir do símbolo, que é onde ele de fato mora.

  Geist é grotesca de desenho contemporâneo, com contraforma aberta e números
  bem resolvidos, e aguenta o salto de peso que o nível de display precisa sem
  precisar de uma segunda família. Menos fonte carregada, mais unidade.
*/
export const fonteCorpo = Geist({
  subsets: ["latin-ext"],
  display: "swap",
  variable: "--fonte-corpo",
});

/*
  Mesma família, para o dado cartorial: CRM, RQE, telefone, CNPJ, horário.

  A razão de existir uma monoespaçada aqui está inalterada e continua valendo:
  um diretório médico é um registro público, e o número de inscrição é o que
  torna o profissional verificável no portal do CFM. Em monoespaçada o número
  lê como assento de registro e as colunas alinham entre linhas; em texto
  corrido lê como texto de marketing que por acaso tem dígitos.

  O que mudou foi a escolha da família: Geist Mono é a irmã da Geist, mesma
  altura de x e mesmo desenho de base, então o número deixa de destoar do
  texto ao redor como destoava a Source Code Pro ao lado da Source Sans.
*/
export const fonteRegistro = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--fonte-registro",
});

/*
  `fonteTitulo` continua existindo e aponta para a mesma Geist. Manter o nome
  evita reescrever toda classe `font-titulo` espalhada pelos componentes, e o
  ponto de extensão fica pronto para o dia em que uma display de verdade for
  contratada.
*/
export const fonteTitulo = fonteCorpo;
