import { Bricolage_Grotesque, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

/*
  Texto corrido, Plus Jakarta Sans. Escolhida pelo cliente em 03/10/2026,
  junto da Bricolage nos títulos: "as fontes do site estão muito simples".

  Era a Geist, em uma família só para tudo. A reforma separou os papéis: uma
  fonte de texto de desenho amigável e uma de título com personalidade.
*/
export const fonteCorpo = Plus_Jakarta_Sans({
  subsets: ["latin-ext"],
  display: "swap",
  variable: "--fonte-corpo",
});

/*
  Títulos, Bricolage Grotesque. Opção C de três mostradas lado a lado no
  desenho. O peso e o espaçamento entre letras ficam em `app/globals.css`
  (h1 a h3: peso 500, -0,035em).

  `axes: ["opsz"]` carrega o eixo de tamanho óptico, o mesmo que o desenho
  aprovado pedia ao Google (`opsz,wght@12..96`): com ele a letra se desenha
  mais fina e apertada em título grande e mais aberta em corpo pequeno, e
  `font-optical-sizing: auto`, padrão do navegador, o aciona sozinho. Sem o
  eixo o título sairia com o desenho de corpo pequeno em qualquer tamanho.
*/
export const fonteTitulo = Bricolage_Grotesque({
  subsets: ["latin-ext"],
  axes: ["opsz"],
  display: "swap",
  variable: "--fonte-titulo",
});

/*
  Monoespaçada para o número de registro do médico: CRM e RQE.

  A razão de existir uma monoespaçada aqui está inalterada e continua valendo:
  um diretório médico é um registro público, e o número de inscrição é o que
  torna o profissional verificável no portal do CFM. Em monoespaçada o número
  lê como assento de registro e as colunas alinham entre linhas; em texto
  corrido lê como texto de marketing que por acaso tem dígitos.

  Geist Mono não tem mais irmã de texto: a Plus Jakarta Sans não é da mesma
  família. A spec da reforma (seção 4) a deixa só no número de registro, onde
  o contraste com o texto ao redor é justamente o que faz o CRM ler como
  assento de registro. O rodapé já segue isso: CNPJ e telefones estão na fonte
  do texto, com algarismos tabulares. As páginas internas que a reforma ainda
  não alcançou continuam usando a classe `registro` (app/globals.css) também
  em telefones, datas, contagens e no CNPJ de /associacao e /contato.

  `preload: false`: a home e o rodapé de toda página não a usam mais, e com o
  pré-carregamento toda página baixaria a fonte antes de precisar dela. Ela
  baixa quando uma página a usa (`display: swap` mostra o número na fonte
  reserva até ela chegar).
*/
export const fonteRegistro = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
  variable: "--fonte-registro",
});
