/*
  Quando a barra de atalhos do pé do celular aparece.

  A decisão mora aqui, separada do componente, para poder ser testada sem
  navegador (o projeto não tem jsdom): o componente só mede a tela e age sobre
  a resposta.

  A barra aparece depois que a pessoa passou do topo da página e some enquanto
  o bloco de busca está na tela, porque ali o atalho "Encontrar médico" levaria
  a pessoa para onde ela já está.

  "Passou do topo" tem dois critérios, conforme haja carrossel na página:
  - com carrossel (a home): o fundo dele saiu da tela, isto é, passou acima do
    topo da janela (`fundoDoCarrossel < 0`);
  - sem carrossel (as outras páginas, e a home enquanto o bloco não existe): a
    rolagem passou de `ROLAGEM_SEM_CARROSSEL` pixels.
*/
export const ROLAGEM_SEM_CARROSSEL = 600;

/** `fundoDoCarrossel` é o `bottom` de `getBoundingClientRect()`, ou `null` se a página não tem carrossel. */
export function passouDoTopo(fundoDoCarrossel: number | null, rolagem: number): boolean {
  if (fundoDoCarrossel === null) return rolagem > ROLAGEM_SEM_CARROSSEL;
  return fundoDoCarrossel < 0;
}

export function deveMostrarBarra(passou: boolean, buscaNaTela: boolean): boolean {
  return passou && !buscaNaTela;
}

/** Para onde o botão "Encontrar médico" leva: ao bloco de busca, se a pessoa está na home; senão à página de busca. */
export function destinoDaBusca(caminho: string): "#encontre" | "/busca" {
  return caminho === "/" ? "#encontre" : "/busca";
}
