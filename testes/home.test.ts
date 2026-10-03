import { describe, expect, it } from "vitest";
import { arranjoDasNoticias, tamanhosDasCapas } from "@/lib/arranjo-das-noticias";
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
  esta página de verdade, troca só as cinco fontes de dados (especialidades,
  médicos, banners, notícias, empresas parceiras) e confere o HTML que sai. Lá a cobertura vale
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
  "<Parceiros",
];

/*
  O CSS da home: o espaço entre os blocos e a coluna. É regra de CSS, que só
  o navegador aplica, então se lê o arquivo; as distâncias na tela, a
  auditoria visual (scripts/auditoria-visual.js) mede e confere contra
  `--ritmo`. Espaço desigual entre blocos é a queixa
  central do cliente: estas asserções são as que ficam vermelhas se alguém
  trocar a régua de um deles.
*/
const CSS_HOME = semComentarios(fonte("../app/(site)/inicio.module.css"));
const CSS_GLOBAL = semComentarios(fonte("../app/globals.css"));

/** O corpo de `seletor { ... }` dentro de `css`. */
function regra(css: string, seletor: string): string {
  const ini = css.indexOf(`${seletor} {`);
  expect(ini, `falta a regra ${seletor}`).toBeGreaterThan(-1);
  return css.slice(ini, css.indexOf("}", ini));
}

/** O que vem depois de `@media (max-width: 700px) {`: o último bloco do arquivo. */
function noCelular(css: string): string {
  const ini = css.indexOf("@media (max-width: 700px) {");
  expect(ini, "falta o @media (max-width: 700px)").toBeGreaterThan(-1);
  return css.slice(ini);
}

describe("o CSS da home", () => {
  it("todo bloco fica a --ritmo do anterior", () => {
    expect(regra(CSS_HOME, ".home > [data-bloco]")).toMatch(/margin-top:\s*var\(--ritmo\);/);
  });

  it("o carrossel, primeiro bloco, fica a --gap do cabecalho", () => {
    expect(regra(CSS_HOME, '.home > h1 + [data-bloco="carrossel"]')).toMatch(
      /margin-top:\s*var\(--gap\);/,
    );
  });

  it("sem carrossel, o primeiro bloco fica a --ritmo: a --gap vale so para o carrossel", () => {
    /* Os números logo abaixo do cabeçalho, a 12px no celular, liam como
       caixa atrás de caixa. A única regra com `--gap` é a do carrossel; o
       primeiro bloco que não é carrossel cai na regra geral, `--ritmo`. */
    const seletores = [...CSS_HOME.matchAll(/([^{}]+)\{[^}]*margin-top:\s*var\(--gap\)/g)].map((m) =>
      m[1].trim(),
    );
    expect(seletores).toEqual(['.home > h1 + [data-bloco="carrossel"]']);
  });

  it("nao ha outro margin-top no arquivo: nenhuma excecao ao ritmo", () => {
    expect(CSS_HOME.match(/margin-top:[^;]*;/g)).toEqual([
      "margin-top: var(--ritmo);",
      "margin-top: var(--gap);",
    ]);
  });

  it("a coluna e a caixa de 1240px com 24px de folga (12px no celular)", () => {
    const coluna = regra(CSS_HOME, ".home > [data-bloco]:not([data-faixa])");
    expect(coluna).toMatch(/width:\s*min\(100% - 48px, 1192px\);/);
    expect(coluna).toMatch(/margin-inline:\s*auto;/);
    expect(regra(noCelular(CSS_HOME), ".home > [data-bloco]:not([data-faixa])")).toMatch(
      /width:\s*calc\(100% - 24px\);/,
    );
  });

  it("a coluna menos --m dos dois lados e a largura que o sizes das capas usa", () => {
    /* 1192px de coluna menos o `--m` do computador de cada lado das
       notícias: o W de lib/arranjo-das-noticias.ts. Se um mudar sem o outro,
       o navegador baixa a capa no tamanho errado. O `--m` é lido do primeiro
       `:root` de app/globals.css, o do computador (os de 980 e 700px vêm
       depois, dentro de @media). */
    const m = Number(/:root\s*\{[^}]*--m:\s*(\d+)px;/.exec(CSS_GLOBAL)?.[1]);
    expect(m, "falta o --m do :root em app/globals.css").toBeGreaterThan(0);
    const coluna = Number(/min\(100% - 48px, (\d+)px\)/.exec(CSS_HOME)?.[1]);
    const capas = tamanhosDasCapas(arranjoDasNoticias(1)!).destaque;
    const w = Number(/\(min-width: 1240px\) (\d+)px/.exec(capas)?.[1]);
    expect(w).toBe(1096);
    expect(coluna - 2 * m).toBe(w);
  });
});

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
    expect(HOME).toMatch(
      /<Parceiros\s+parceiras=\{molduras\.parceiras\}\s+provisorias=\{molduras\.parceirasProvisorias\}/,
    );
    expect(HOME).toMatch(/<NumerosDaAmi[^>]*\sparceiras=\{molduras\.numeroDeParceiras\}/);
  });
});
