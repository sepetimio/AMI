/*
  Como as notícias da home se arrumam, conforme quantas saem.

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

/*
  O `sizes` das capas, conforme o arranjo.

  O navegador escolhe o arquivo do `srcset` pela largura que o `sizes` diz
  que a imagem vai ter. Se o `sizes` diz menos do que a imagem tem, ele
  baixa um arquivo pequeno e estica: a foto sai borrada. Por isso a conta
  segue o CSS de components/editorial/UltimasNoticias.module.css e as
  réguas de app/globals.css:

    largura da coluna de notícias (W) = coluna (`--coluna`, até 1192px,
    com `--folga-da-coluna` de 24px de cada lado; 12px no celular) menos
    `--m` de cada lado (48px; 28px até 980px; 20px até 700px). O `sizes`
    não lê variável de CSS, por isso os números vão escritos:
      a partir de 1240px   1096px
      981 a 1239px         100vw - 144px
      701 a 980px          100vw - 104px
      até 700px            100vw - 64px

  - "ao-lado", acima de 1180px: destaque = (W - 48) × 1,25 / 2,25 (as
    colunas 1,25fr e 1fr com o vão `--m` de 48px) e item = 128px; de 701 a
    1180px, destaque = W e item = (W - 2 × 24) / 3.
  - "so-destaque" e "embaixo": destaque = W em todas as larguras.
  - item de pé ("embaixo", 2 colunas): (W - 24) / 2. Usa as larguras de
    arquivo do destaque (`itemDePe`), porque passa de 500px.
  - item deitado: 128px de 701px para cima.
  - no celular, o item é sempre a miniatura de 88px.

  `100vw` inclui a barra de rolagem, e a coluna não: o `sizes` sai uns 15px
  maior que a imagem, o que só pode fazer o navegador escolher o arquivo
  de cima, nunca o de baixo.
*/
export type TamanhosDasCapas = {
  destaque: string;
  item: string;
  /** O item é grande o bastante para pedir as larguras de arquivo do destaque. */
  itemDePe: boolean;
};

const W: Array<[string, string]> = [
  ["(min-width: 1240px)", "1096px"],
  ["(min-width: 981px)", "100vw - 144px"],
  ["(min-width: 701px)", "100vw - 104px"],
];
const W_CELULAR = "100vw - 64px";

/* "1096px" vira 1096; uma expressão com vw fica como texto. */
function px(expr: string): number | null {
  const m = /^(\d+(?:\.\d+)?)px$/.exec(expr);
  return m ? Number(m[1]) : null;
}

/* Uma coluna entre `colunas`, com `vao` px entre elas, da largura `expr`. */
function coluna(expr: string, colunas: number, vao: number): string {
  const n = px(expr);
  if (n !== null) return `${Math.round((n - vao * (colunas - 1)) / colunas)}px`;
  if (colunas === 1) return `calc(${expr})`;
  return `calc((${expr} - ${vao * (colunas - 1)}px) / ${colunas})`;
}

function sizes(pares: Array<[string, string]>, ultimo: string): string {
  return [...pares.map(([c, v]) => `${c} ${v}`), ultimo].join(", ");
}

export function tamanhosDasCapas(a: Arranjo): TamanhosDasCapas {
  const larguraToda = sizes(
    W.map(([c, v]) => [c, coluna(v, 1, 0)]),
    `calc(${W_CELULAR})`,
  );

  if (a.arranjo === "ao-lado") {
    return {
      destaque: sizes(
        [
          [W[0][0], `${Math.round(((1096 - 48) * 1.25) / 2.25)}px`],
          ["(min-width: 1181px)", "calc((100vw - 192px) * 5 / 9)"],
          ...W.slice(1).map(([c, v]): [string, string] => [c, coluna(v, 1, 0)]),
        ],
        `calc(${W_CELULAR})`,
      ),
      item: sizes(
        [
          ["(min-width: 1181px)", "128px"],
          ...W.slice(1).map(([c, v]): [string, string] => [c, coluna(v, 3, 24)]),
        ],
        "88px",
      ),
      itemDePe: false,
    };
  }

  if (a.deitado || a.colunas < 1) {
    return { destaque: larguraToda, item: sizes([["(min-width: 701px)", "128px"]], "88px"), itemDePe: false };
  }

  return {
    destaque: larguraToda,
    item: sizes(
      W.map(([c, v]) => [c, coluna(v, a.colunas, 24)]),
      "88px",
    ),
    itemDePe: true,
  };
}

/*
  A lista de /noticias (components/editorial/ListaDeNoticias.tsx): a mais
  recente em destaque, na largura dos painéis, e as outras em cartões
  embaixo. Com poucas, vale a regra da home (`arranjoDasNoticias`, acima),
  para não sobrar coluna vazia:
  - 1: só o destaque;
  - 2: um cartão deitado embaixo, com a foto da largura de uma coluna de
    três;
  - 3: duas colunas;
  - 4 ou mais: três por linha; a última fileira pode ficar incompleta,
    alinhada à esquerda, como numa grade comum.
*/
export type ArranjoDaLista = {
  /** Colunas da grade embaixo do destaque (0 quando não há cartão). */
  colunas: number;
  /** Um cartão só embaixo do destaque: deitado. */
  deitado: boolean;
};

export function arranjoDaLista(quantas: number): ArranjoDaLista | null {
  const a = arranjoDasNoticias(quantas);
  return a ? { colunas: a.colunas, deitado: a.deitado } : null;
}

/*
  O `sizes` da lista, pelo CSS de components/editorial/Noticias.module.css
  e pelas réguas de app/globals.css. A lista é um bloco da caixa da página
  (app/(site)/encontre.module.css): 1192px (`--coluna`) a partir de 1240px
  de tela; 100vw − 48px (`--folga-da-coluna` de cada lado) de 701 a
  1239px; no celular, 100vw − 24px, menos `--m` (20px) de cada lado,
  porque a lista fica na coluna do texto.
  - O destaque ocupa o bloco inteiro.
  - Os cartões, com o vão `--gap` (24px; 16px até 980px): três por linha
    acima de 980px, ou tantas colunas quantas o arranjo pedir; duas no
    tablet; no celular, a miniatura de 88px. O cartão deitado é uma
    coluna de três em todas as larguras acima de 700px.
  `100vw` inclui a barra de rolagem e o bloco não: o `sizes` sai uns 15px
  maior que a imagem, o que só pode fazer o navegador escolher o arquivo de
  cima.
*/
const PAINEL: Array<[string, string]> = [
  ["(min-width: 1240px)", "1192px"],
  ["(min-width: 981px)", "100vw - 48px"],
  ["(min-width: 701px)", "100vw - 48px"],
];

export const SIZES_DO_DESTAQUE_DA_LISTA = sizes(
  [
    ["(min-width: 1240px)", "1192px"],
    ["(min-width: 701px)", "calc(100vw - 48px)"],
  ],
  "calc(100vw - 64px)",
);

/** O `sizes` da foto do cartão. Só para arranjo com cartão (`colunas` > 0). */
export function tamanhoDosCartoes(a: ArranjoDaLista): string {
  const porLinha = a.deitado ? 3 : a.colunas;
  return sizes(
    [
      [PAINEL[0][0], coluna(PAINEL[0][1], porLinha, 24)],
      [PAINEL[1][0], coluna(PAINEL[1][1], porLinha, 24)],
      [PAINEL[2][0], coluna(PAINEL[2][1], a.deitado ? 3 : 2, 16)],
    ],
    "88px",
  );
}

/* As larguras pedidas ao CDN para o `srcset`: o destaque chega a 1192px
   (2384 em densidade 2); o cartão de duas colunas, a 584px (1168); a
   miniatura do celular tem 88px (176). */
export const LARGURAS_DO_DESTAQUE_DA_LISTA = [480, 640, 960, 1280, 1600, 2400] as const;
export const LARGURAS_DO_CARTAO = [160, 320, 480, 640, 960, 1200] as const;
