/*
  A conta do contador dos números da home, fora do componente para poder ser
  testada sem navegador (ver testes/numeros-e-busca.test.ts).

  É a do desenho aprovado: de 0 até o valor final em 1,4s, com a curva
  `easeOutCubic` (rápida no começo, freando no fim), e o valor de cada quadro
  arredondado para inteiro.
*/

/** Quanto dura a contagem, em milissegundos. */
export const DURACAO_DO_CONTADOR = 1400;

/** A fração da curva no instante `k` (de 0 a 1): 1 − (1 − k)³. */
export function easeOutCubic(k: number): number {
  return 1 - Math.pow(1 - k, 3);
}

/**
 * O número que aparece `decorrido` milissegundos depois do início da
 * contagem: 0 no começo, o valor final do fim em diante, inteiro sempre.
 */
export function valorNoInstante(fim: number, decorrido: number): number {
  const k = Math.min(1, Math.max(0, decorrido / DURACAO_DO_CONTADOR));
  return Math.round(fim * easeOutCubic(k));
}

/**
 * O laço da contagem, com o relógio e o agendador de quadros recebidos de
 * fora: no navegador, `performance.now` e `requestAnimationFrame`; no teste,
 * um relógio falso.
 *
 * Mostra 0 de saída, depois um valor da curva por quadro, e no fim
 * `mostrar(null)`, que devolve a tela ao valor final. Devolve a função que
 * para tudo: cancela o quadro pendente, e nenhum `mostrar` vem depois dela.
 */
export function iniciarContagem({
  valor,
  agora,
  agendar,
  cancelar,
  mostrar,
}: {
  valor: number;
  agora: () => number;
  agendar: (passo: (instante: number) => void) => number;
  cancelar: (id: number) => void;
  mostrar: (quadro: number | null) => void;
}): () => void {
  const inicio = agora();
  let ativa = true;
  let pendente = 0;

  const passo = (instante: number) => {
    if (!ativa) return;
    const decorrido = instante - inicio;
    if (decorrido >= DURACAO_DO_CONTADOR) {
      ativa = false;
      mostrar(null);
      return;
    }
    mostrar(valorNoInstante(valor, decorrido));
    pendente = agendar(passo);
  };

  mostrar(0);
  pendente = agendar(passo);

  return () => {
    ativa = false;
    cancelar(pendente);
  };
}
