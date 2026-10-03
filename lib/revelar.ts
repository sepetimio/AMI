/*
  A entrada dos blocos ao rolar (`.revelar`): o que decide, na abertura de
  cada página, se um bloco fica como está ou espera para entrar.

  A decisão mora aqui, separada do componente (components/layout/Revelar.tsx),
  para poder ser testada sem navegador, como a da barra do pé
  (lib/barra-do-pe.ts): o componente só mede a tela e age sobre a resposta.

  A regra:
  - quem pediu menos movimento não espera nada: tudo fica como está;
  - um bloco cujo topo está dentro da janela, ou acima dela, na abertura
    fica como está. Ele já está à vista (ou já passou), e animá-lo seria
    mostrá-lo desbotado e borrado a quem acabou de chegar;
  - só o bloco que começa abaixo da janela espera, e entra quando a pessoa
    rola até ele.

  `topo` é o `top` de `getBoundingClientRect()`, e `alturaDaJanela` é o
  `innerHeight`, os dois em pixels da tela.
*/
export type Abertura = "fica" | "espera";

export function revelarNaAbertura(
  topo: number,
  alturaDaJanela: number,
  menosMovimento: boolean,
): Abertura {
  if (menosMovimento) return "fica";
  return topo < alturaDaJanela ? "fica" : "espera";
}

/* A margem do observador: o bloco entra quando passa 40px da borda de baixo
   da janela, como no desenho aprovado (`rootMargin: '0px 0px -40px 0px'`).
   O limiar é zero, e não o 0,12 do desenho: um bloco mais alto que oito
   janelas (a lista de `/medicos` no celular) nunca chegaria a 12% à vista e
   ficaria invisível para sempre. */
export const MARGEM_DO_OBSERVADOR = "0px 0px -40px 0px";
