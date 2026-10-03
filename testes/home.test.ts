import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";

/*
  O que este arquivo pega, e o que ele NÃO pega.

  Ele lê o TEXTO-FONTE de `app/(site)/page.tsx` e procura substrings. Nada
  aqui renderiza a home, monta árvore de React ou olha para HTML. Então:

  PEGA — o componente foi removido do arquivo, teve o nome trocado, ou a
  ordem em que os três aparecem no código mudou.

  NÃO PEGA — que o componente RENDERIZE alguma coisa. Envolver a faixa em
  `{false && (<FaixaDaAmi … />)}` deixa os quatro testes abaixo VERDES: a
  substring "<FaixaDaAmi" continua no arquivo. Isso não é raciocínio, é
  medido — a mutação foi aplicada e a suíte rodou assim. `null` devolvido de
  dentro do próprio componente passa pelo mesmo motivo, e
  `UltimasNoticias` faz exatamente isso quando não há notícia
  (components/editorial/UltimasNoticias.tsx: `if (noticias.length === 0)
  return null;`) — de propósito, e sem que nada aqui saiba.

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

describe("a home, depois das molduras provisórias", () => {
  it("monta a faixa de empresas parceiras", () => {
    expect(HOME, "falta <EmpresasParceiras> na home").toContain("<EmpresasParceiras");
  });

  it("tem as oito secoes na ordem aprovada, com os parceiros por ultimo", () => {
    /* Mesma limitação do resto do arquivo: posição no texto-fonte, não na
       tela. As seções sem componente próprio entram pelo `id` do título. */
    const ordem = [
      "<FaixaDaAmi",
      "<Carrossel",
      "<ServicosDaAmi",
      'id="especialidades"',
      'id="institucional"',
      "<UltimasNoticias",
      'id="bairros"',
      "<EmpresasParceiras",
    ];
    const posicoes = ordem.map((marca) => HOME.indexOf(marca));
    for (const [i, marca] of ordem.entries()) {
      expect(posicoes[i], `falta ${marca} na home`).toBeGreaterThanOrEqual(0);
      if (i > 0) {
        expect(posicoes[i], `${marca} veio antes de ${ordem[i - 1]}`).toBeGreaterThan(
          posicoes[i - 1],
        );
      }
    }
  });

  it("a trava recebe a chave de verdade, e cada moldura sai da decisão dela", () => {
    /*
      O teste de testes/molduras.test.ts prova a decisão e os componentes,
      mas não vê esta página. Aqui se confere, por texto, que a página passa
      `DADOS_DEMONSTRACAO` — e não um `true` escrito à mão — e que cada uma
      das quatro molduras sai da saída de `moldurasDaHome`.
    */
    expect(HOME).toMatch(/moldurasDaHome\(\s*DADOS_DEMONSTRACAO\s*,/);
    expect(HOME).toContain("<Carrossel banners={molduras.banners}");
    expect(HOME).toMatch(/suaAmi=\{molduras\.suaAmi\}/);
    expect(HOME).toContain("<UltimasNoticias provisorias={molduras.noticiasProvisorias}");
    expect(HOME).toContain("{molduras.parceiros ? <EmpresasParceiras");
  });
});
