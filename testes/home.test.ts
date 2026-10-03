import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";

/*
  O que este arquivo pega, e o que ele NÃO pega.

  Ele lê o TEXTO-FONTE de `app/(site)/page.tsx` e procura substrings. Nada
  aqui renderiza a home, monta árvore de React ou olha para HTML. Então:

  PEGA — o componente foi removido do arquivo, teve o nome trocado, ou a
  ordem em que as seções aparecem no código mudou.

  NÃO PEGA, AQUI — que o componente RENDERIZE alguma coisa. Envolver a busca
  em `{false && <EncontreUmMedico … />}` deixa os testes deste arquivo
  VERDES: a substring "<EncontreUmMedico" continua no arquivo. `null`
  devolvido de dentro do próprio componente passa pelo mesmo motivo.

  ESSE BURACO ESTÁ COBERTO em testes/home-renderizada.test.ts, que importa
  esta página de verdade, troca só as quatro fontes de dados (especialidades,
  médicos, banners, notícias) e confere o HTML que sai. Lá a cobertura vale
  para o que aquele arquivo procura: o <h1>, a marca `data-bloco` de cada
  seção, os `id` e as molduras — com dados de mentira, não com o banco.

  NÃO PEGA, em nenhum dos dois — ordem VISUAL. `indexOf` mede posição no
  texto (aqui, no arquivo; lá, no HTML), não na tela: um `order-*` do
  Tailwind, um `flex-col-reverse` ou um wrapper que reposicione uma seção
  deixaria as asserções verdes com a página de cabeça para baixo.

  Este arquivo continua porque é o mais barato de ler quando falha: diz qual
  nome sumiu do texto-fonte, sem renderizar nada.
*/
const HOME = semComentarios(fonte("../app/(site)/page.tsx"));

/* A ordem da spec da reforma visual, seção 6. */
const ORDEM = [
  "<Carrossel",
  "<NumerosDaAmi",
  "<EncontreUmMedico",
  "<SuaAmi",
  "<SejaAssociado",
  "<UltimasNoticias",
  "<BairrosEParceiros",
];

describe("a home", () => {
  it("monta as sete secoes da spec, nesta ordem", () => {
    const posicoes = ORDEM.map((marca) => HOME.indexOf(marca));
    for (const [i, marca] of ORDEM.entries()) {
      expect(posicoes[i], `falta ${marca} na home`).toBeGreaterThanOrEqual(0);
      if (i > 0) {
        expect(posicoes[i], `${marca} veio antes de ${ORDEM[i - 1]}`).toBeGreaterThan(
          posicoes[i - 1],
        );
      }
    }
  });

  it("nao monta mais as pecas que sairam", () => {
    /* A faixa do topo, os quatro cartoes de servico, o indice em grade e o
       bloco institucional com a foto da sede (spec, secao 6: "Sai da home
       atual"). */
    for (const c of ["FaixaDaAmi", "ServicosDaAmi", "IndiceEspecialidades", "Fotografia"]) {
      expect(HOME, `a home ainda cita ${c}`).not.toContain(c);
    }
    expect(HOME).not.toContain('id="institucional"');
  });

  it("o titulo da pagina nao fala de buscar medico", () => {
    /*
      O <h1> foi "Encontre um médico em Imperatriz" e ocupava a tela inteira.
      Se voltar, o site volta a ser a busca em vez da porta da associacao.
    */
    expect(HOME).not.toMatch(/<h1[^>]*>\s*Encontre um médico/);
  });

  it("a trava recebe a chave de verdade, e cada moldura sai da decisão dela", () => {
    /*
      O teste de testes/molduras.test.ts prova a decisão e os componentes,
      mas não vê esta página. Aqui se confere, por texto, que a página passa
      `DADOS_DEMONSTRACAO` — e não um `true` escrito à mão — à trava e aos
      blocos que decidem sozinhos.
    */
    expect(HOME).toMatch(/moldurasDaHome\(\s*DADOS_DEMONSTRACAO\s*,/);
    expect(HOME).toContain("<Carrossel itens={molduras.banners}");
    expect(HOME).toContain("<SuaAmi demonstracao={DADOS_DEMONSTRACAO}");
    expect(HOME).toMatch(/<SejaAssociado\s+demonstracao=\{DADOS_DEMONSTRACAO\}/);
    expect(HOME).toContain("<UltimasNoticias provisorias={molduras.noticiasProvisorias}");
    expect(HOME).toContain("<BairrosEParceiros bairros={bairros} parceiros={molduras.parceiros}");
  });
});
