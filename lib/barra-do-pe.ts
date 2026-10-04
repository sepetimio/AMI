/*
  Quando a barra de atalhos do pé do celular aparece.

  A decisão mora aqui, separada do componente, para poder ser testada sem
  navegador (o projeto não tem jsdom): o componente só mede a tela e age sobre
  a resposta.

  A barra aparece depois que a pessoa passou do topo da página e some enquanto
  o bloco de busca está na tela, porque ali o atalho "Encontrar médico" levaria
  a pessoa para onde ela já está.

  "Passou do topo" tem dois critérios, conforme a página tenha um bloco de
  abertura (o carrossel da home, ou a faixa verde do topo, `data-abertura`):
  - com ele: o fundo dele saiu da tela, isto é, passou acima do topo da
    janela (`fundoDaAbertura < 0`);
  - sem ele (as outras páginas): a rolagem passou de `ROLAGEM_SEM_CARROSSEL`
    pixels.
*/
export const ROLAGEM_SEM_CARROSSEL = 600;

/** `fundoDaAbertura` é o `bottom` de `getBoundingClientRect()` do bloco de abertura, ou `null` se a página não tem um. */
export function passouDoTopo(fundoDaAbertura: number | null, rolagem: number): boolean {
  if (fundoDaAbertura === null) return rolagem > ROLAGEM_SEM_CARROSSEL;
  return fundoDaAbertura < 0;
}

export function deveMostrarBarra(passou: boolean, buscaNaTela: boolean): boolean {
  return passou && !buscaNaTela;
}

/* As páginas que têm o campo de busca (`#encontre`) na própria faixa. */
const COM_CAMPO_DE_BUSCA = new Set(["/", "/busca", "/medicos"]);

/**
 * Para onde "Encontrar médico" leva: ao campo de busca da própria página,
 * na home, em /busca e no índice de especialidades; senão, à página de
 * busca.
 */
export function destinoDaBusca(caminho: string): "#encontre" | "/busca" {
  return COM_CAMPO_DE_BUSCA.has(caminho) ? "#encontre" : "/busca";
}

/**
 * A barra do perfil aparece quando os botões do topo saíram da tela por
 * cima: fora dela (`intersecta` falso) e acima (`topo` < 0). Botões ainda
 * abaixo da tela não contam.
 */
export function acoesSairamPorCima(intersecta: boolean, topo: number): boolean {
  return !intersecta && topo < 0;
}
