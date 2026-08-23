import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";

/*
  O que este arquivo pega, e o que ele NÃO pega.

  Ele lê o TEXTO-FONTE de `app/(site)/page.tsx` e procura substrings. Nada
  aqui renderiza a home, monta árvore de React ou olha para HTML. Então:

  PEGA — o componente foi removido do arquivo, teve o nome trocado, ou a
  ordem em que os três aparecem no código mudou.

  NÃO PEGA — que o componente RENDERIZE alguma coisa. `{false && <FaixaDaAmi
  … />}` passa em todas as asserções abaixo: a substring "<FaixaDaAmi" está
  lá. Isso não é suposição, foi provado por mutação na tarefa que escreveu
  este arquivo. `{null}` devolvido de dentro do próprio componente também
  passa, e `UltimasNoticias` faz exatamente isso quando não há notícia — de
  propósito, e sem que nada aqui saiba.

  NÃO PEGA, também — ordem VISUAL. `indexOf` mede posição no arquivo, não na
  tela: um `order-*` do Tailwind, um `flex-col-reverse` ou um wrapper que
  reposicione qualquer uma das seções deixaria estas asserções verdes com a
  página de cabeça para baixo.

  Nada disto é motivo para apagar o arquivo — o modo de falhar que ele cobre
  (alguém apaga uma seção ao mexer na home, como já aconteceu neste ramo com
  a busca) é real e barato de pegar. É motivo para não confundir "os testes
  da home passam" com "a home aparece". A segunda coisa só se prova abrindo
  a página num servidor.
*/
const HOME = semComentarios(fonte("../app/(site)/page.tsx"));

describe("a home", () => {
  it("monta as tres secoes novas", () => {
    for (const c of ["FaixaDaAmi", "Carrossel", "ServicosDaAmi"]) {
      expect(HOME, `falta <${c}> na home`).toContain(`<${c}`);
    }
  });

  it("mantem as quatro secoes que ja existiam", () => {
    for (const c of ["IndiceEspecialidades", "UltimasNoticias", "LadrilhosBairros"]) {
      expect(HOME, `a home perdeu <${c}>`).toContain(`<${c}`);
    }
  });

  it("o titulo da pagina nao fala mais de buscar medico", () => {
    /*
      O <h1> era "Encontre um médico em Imperatriz" e ocupava a tela inteira.
      Ele desceu para o cartao de servico. Se voltar ao topo, o site voltou a
      ser a busca em vez da porta da associacao.
    */
    expect(HOME).not.toMatch(/<h1[^>]*>\s*Encontre um médico/);
  });

  it("a faixa vem antes do carrossel, e o carrossel antes dos servicos", () => {
    const faixa = HOME.indexOf("<FaixaDaAmi");
    const carrossel = HOME.indexOf("<Carrossel");
    const servicos = HOME.indexOf("<ServicosDaAmi");
    expect(faixa).toBeLessThan(carrossel);
    expect(carrossel).toBeLessThan(servicos);
  });
});
