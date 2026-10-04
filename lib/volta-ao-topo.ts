/*
  Quando a troca de página leva a pessoa ao topo da página nova.

  A decisão mora aqui, separada do componente
  (components/layout/VoltaAoTopo.tsx), para poder ser testada sem navegador,
  como a da entrada dos blocos (lib/revelar.ts): o componente só lê o
  navegador e age sobre a resposta.

  Por que o site precisa disto: o Next 16 só leva ao topo quando o começo da
  página nova está fora da tela (`layout-router.js`). Numa página curta,
  aberta vindo do meio de uma longa, o navegador prende a rolagem antiga no
  máximo da nova, o começo dela fica à vista, e ela abre rolada (medido em
  04/10/2026: `/noticias` sem notícia, a 1920 × 1080, abria 105px abaixo do
  topo).

  A regra:
  - troca vinda do voltar ou do avançar (`doHistorico`): não rola, porque
    quem devolve a posição de antes é o navegador;
  - endereço com `#` (`ancora`): não rola, porque o Next leva ao trecho
    marcado;
  - qualquer outra troca de página: vai ao topo.
*/
export function deveIrAoTopo({
  doHistorico,
  ancora,
}: {
  doHistorico: boolean;
  ancora: boolean;
}): boolean {
  return !doHistorico && !ancora;
}
