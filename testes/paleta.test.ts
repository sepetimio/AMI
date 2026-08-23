import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fonte } from "@/testes/apoio";

/*
  As razões de contraste da paleta, calculadas — não lidas de comentário.

  `app/globals.css` diz "Quem alterar qualquer tom aqui mede de novo". Isso é
  um comentário, e comentário não mede nada: ele foi ignorado uma vez, e o
  próprio arquivo registra o resultado — `ink-400` foi para 3,48:1 e reprovava
  em AA no uso dele, que é texto de corpo.

  Este arquivo lê os tokens do CSS e faz a conta. Não confere o que está
  escrito ao lado do valor; confere o valor.
*/

/** Todos os `--color-x: #hex` de um CSS, por nome. */
export function tokensDeCor(css: string): Record<string, string> {
  const mapa: Record<string, string> = {};
  for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)) {
    mapa[m[1]] = m[2].toUpperCase();
  }
  return mapa;
}

/** Luminância relativa, fórmula da WCAG 2.1. */
export function luminancia(hex: string): number {
  const canais = [0, 2, 4]
    .map((i) => parseInt(hex.replace("#", "").slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

export function razaoDeContraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

const CSS = fonte("../app/globals.css");
const T = tokensDeCor(CSS);

/** Mínimo da WCAG AA para texto de corpo. */
const MINIMO = 4.5;

/** Todo arquivo .tsx sob app/ e components/, recursivo. */
function telas(relativo: string): string[] {
  const base = fileURLToPath(new URL(relativo, import.meta.url));
  const achados: string[] = [];
  for (const entrada of readdirSync(base, { withFileTypes: true })) {
    const caminho = `${base}/${entrada.name}`;
    if (entrada.isDirectory()) achados.push(...telas(`${relativo}/${entrada.name}`));
    else if (entrada.name.endsWith(".tsx")) achados.push(caminho);
  }
  return achados;
}

const FONTES = [...telas("../app"), ...telas("../components")]
  .map((c) => readFileSync(c, "utf8"))
  .join("\n");

/*
  Os tokens que o código realmente usa, achados no código.

  A versão anterior deste arquivo trazia duas listas escritas à mão. A de
  texto foi esquecida quatro vezes; a de fundos nunca foi auditada, e quando
  foi, tinha dois buracos — um deles o par mais apertado do sistema inteiro.

  Lista escrita à mão é uma foto do que alguém lembrou. Esta varre o código.

  Sem grupo de modificador antes do prefixo: `\b` já casa a fronteira de
  palavra em `text-`/`bg-`/`border-` não importa o que vem antes — dois
  pontos, hífen ou início de string dão todos a mesma transição de
  não-palavra para palavra. `hover:text-x`, `group-hover:text-x`,
  `focus-visible:border-x` e `placeholder:text-x` já são achados assim; um
  grupo `(?:hover:)?` explícito não muda o conjunto casado, só sugere,
  errado, que apenas `hover:` é tratado.
*/
function tokensEm(prefixo: string): string[] {
  const achados = new Set<string>();
  for (const m of FONTES.matchAll(new RegExp(`\\b${prefixo}-([a-z0-9-]+)\\b`, "g"))) {
    achados.add(m[1]);
  }
  return [...achados].filter((n) => T[n]).sort();
}

describe("as listas saem do código, não da memória", () => {
  it("acha token de texto e de fundo em uso", () => {
    /*
      Se a varredura devolver vazio, ela quebrou — e um teste que não mede
      nada passa em silêncio. Estes pisos existem para isso, e são folgados
      de propósito: o número exato muda a cada fatia.
    */
    expect(tokensEm("text").length).toBeGreaterThanOrEqual(5);
    expect(tokensEm("bg").length).toBeGreaterThanOrEqual(4);
  });

  it("todo token usado em text- ou bg- está declarado no @theme", () => {
    /*
      Esta é a rede contra classe morta. Um token que sai do @theme e sobra
      num componente não gera CSS, não dá erro, e o elemento fica sem cor —
      um revisor provou mutando, e o repositório já teve uma vítima.

      Sem grupo de modificador antes do prefixo, pelo mesmo motivo de
      `tokensEm()`: `\b` já casa `text-`/`bg-`/`border-` depois de `hover:`,
      `group-hover:`, `focus-visible:`, `placeholder:` ou qualquer outro
      prefixo do Tailwind, então um `(?:hover:)?` explícito não mudaria o que
      é achado — só faria parecer que outros modificadores escapam.
    */
    const orfaos: string[] = [];
    for (const prefixo of ["text", "bg", "border"]) {
      for (const m of FONTES.matchAll(
        new RegExp(`\\b${prefixo}-(ami-[a-z0-9-]+|ink-[0-9]+|canvas|surface[a-z-]*|line[a-z-]*|warn|danger)\\b`, "g"),
      )) {
        if (!T[m[1]]) orfaos.push(`${prefixo}-${m[1]}`);
      }
    }
    expect([...new Set(orfaos)], "classe que aponta para token que não existe").toEqual([]);
  });
});

describe("a conta", () => {
  it("bate com valores conhecidos", () => {
    /*
      Preto sobre branco é 21:1 exato. Sem esta âncora, um erro na fórmula
      passaria despercebido e todas as asserções abaixo mediriam a coisa errada
      com confiança.
    */
    expect(razaoDeContraste("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(razaoDeContraste("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 2);
  });
});

describe("os tokens existem", () => {
  const EXIGIDOS = [
    "canvas",
    "surface",
    "surface-fundo",
    "ami-lima-100",
    "ink-900",
    "ink-600",
    "ink-400",
    "ink-300",
    "line",
    "line-strong",
  ];

  it("todos os papéis do sistema estão declarados", () => {
    for (const nome of EXIGIDOS) {
      expect(T[nome], `falta --color-${nome} em app/globals.css`).toBeTruthy();
    }
  });
});

/*
  Por que estas duas listas ficam escritas à mão, e as de baixo não.

  Um par de contraste é (texto, fundo), e só algumas combinações existem de
  verdade no código: `ink-400` nunca aparece sobre `ami-green-600`, que é
  fundo de botão com texto branco. Derivar os pares a partir de
  `tokensEm("text")` × `tokensEm("bg")` inventaria dezenas de pares que não
  existem — foi o que a autorrevisão desta tarefa mostrou: cruzar
  TEXTO_DE_CORPO inteiro contra `tokensEm("bg")` sem filtro dava 31 falhas,
  nenhuma delas um defeito real, e ainda por cima perdia `surface-fundo`
  (nunca usado como classe `bg-`, só via `.moldura` no CSS — exatamente o
  buraco que a lista de fundos já tinha levado uma rodada para fechar).

  Por isso as listas de pares continuam curadas. O que a varredura faz é
  outra coisa: conferir que nenhum token usado em `text-` ou `bg-` ficou de
  fora das duas listas — a curada, ou a de exceções com motivo escrito. Isso
  é o describe logo abaixo desta.
*/
const TEXTO_FORA_DO_TESTE: Record<string, string> = {
  "ami-lima-400":
    "só é texto sobre fundo escuro (marca sobre o verde) — medido no describe " +
    "texto sobre fundo escuro, contra ami-green-800/900; sobre fundo claro " +
    "daria o par errado",
  "ink-300":
    "placeholder (app/(site)/page.tsx) e separador aria-hidden " +
    "(components/layout/Breadcrumb.tsx) — isento de AA por desenho, e testado " +
    "à parte, para REPROVAR, logo abaixo",
};

const FUNDOS_FORA_DO_TESTE: Record<string, string> = {
  "ami-green-600":
    "fundo de botão e item de menu ativo, sempre com text-white (não é token " +
    "nosso) — nunca carrega um dos tons de TEXTO_DE_CORPO",
  "ami-green-700":
    "só aparece via hover: nos mesmos botões de ami-green-600 — mesmo texto " +
    "branco, e o estado de repouso já fica de fora pelo motivo acima",
  "ami-green-800":
    "fundo da plaqueta de iniciais (components/diretorio/Placa.tsx), com " +
    "text-ami-lima-400 — o par real já é medido no describe texto sobre fundo " +
    "escuro, junto com canvas/surface sobre ami-green-800",
  "ami-green-900":
    "fundo do herói, do rodapé e da legenda de foto, com text-ami-lima-400 ou " +
    "text-white — o par real já é medido no describe texto sobre fundo escuro, " +
    "junto com canvas/surface sobre ami-green-900",
  warn:
    "só aparece como bg-warn/5 (components/editorial/RascunhoLegalNaTela.tsx), " +
    "5% de opacidade — a cor renderizada nunca é o tom cheio do token, então " +
    "medir --color-warn opaco testaria uma cor que a tela nunca mostra",
};

/*
  Todo token usado como cor de texto pertence a esta lista ou a
  TEXTO_FORA_DO_TESTE — não é seleção do que parece arriscado.
  `ami-green-600` ficou de fora numa primeira passada porque parecia cor de
  botão, e uma mutação mostrou que ele podia cair para 2,86:1 sem nada
  reclamar. A completude das duas listas juntas é conferida à parte, no
  describe "as duas listas cobrem todo token em uso" — se um token de texto
  novo não entrar em nenhuma das duas, aquele describe reprova.

  Exceção real, não descuido: tokens usados como texto só sobre fundo
  ESCURO (`ami-lima-400`) ficam de fora de propósito. Esta lista testa
  contra os quatro fundos claros do sistema — medir esse token aqui
  testaria o par errado. `ami-lima-400` dá 1,48:1 em canvas e 1,63:1 em
  surface: não é regressão, é a física que barra esse tom como texto
  sobre fundo claro. Quem usar esse token sobre fundo escuro tem um teste
  próprio contra `ami-green-800`/`ami-green-900` no describe de fundo
  escuro, mais abaixo.
*/
const TEXTO_DE_CORPO = ["ink-900", "ink-600", "ink-400", "warn", "ami-green-600", "ami-green-700"];

/*
  Os fundos, e por que são quatro e não dois.

  A lista era `["canvas", "surface"]`, e deixava de fora dois fundos que
  carregam texto de verdade. A prova de que o buraco era real: apagar
  `--color-ami-lima-100` inteiro do `@theme` deixava os 22 testes desta
  suíte verdes, e treze classes `bg-` do site viravam nada.

  `ami-lima-100` é fundo PERMANENTE de texto em `components/base/Chip.tsx`
  (a pílula "Associado AMI", `bg-ami-lima-100 text-ami-green-700`) e fundo
  de passagem de mouse em outros doze lugares — 13 usos de `bg-`, mais que
  `bg-canvas`, que tem 11. É também o par mais apertado de todo o sistema:
  `ink-400` sobre ele dá 4,61:1, onze centésimos acima do mínimo, e o uso é
  real (`app/(site)/associacao/page.tsx`, o cartão que muda de fundo no
  hover).

  `surface-fundo` é o fundo de `.moldura`, em `app/globals.css` — e aqui a
  frase exata importa, porque a fácil seria falsa: `.moldura` não é
  aplicada em componente nenhum hoje. O efeito de casca dupla foi refeito
  à mão com `bg-surface p-2` em `app/(site)/page.tsx` e em
  `app/(site)/noticias/[slug]/page.tsx`. O token entra nesta lista porque a
  declaração é real e o dia em que alguém usar a classe não pode ser o dia
  em que o par deixa de ser medido; que a classe esteja sem consumidor é
  outro assunto, registrado na seção 6 da spec desta fatia.

  Esta lista continua escrita à mão de propósito: derivá-la de
  `tokensEm("bg")` sem filtro traria fundo de botão e de banner junto com
  fundo de corpo, e perderia este token — nunca usado como classe `bg-`. A
  varredura entra de outro jeito, conferindo completude: ver o describe "as
  duas listas cobrem todo token em uso".
*/
const FUNDOS_CLAROS = ["canvas", "surface", "surface-fundo", "ami-lima-100"];

describe("texto sobre os quatro fundos claros", () => {
  for (const fundo of FUNDOS_CLAROS) {
    for (const tinta of TEXTO_DE_CORPO) {
      it(`${tinta} sobre ${fundo}`, () => {
        const r = razaoDeContraste(T[tinta], T[fundo]);
        expect(
          r,
          `--color-${tinta} sobre --color-${fundo} dá ${r.toFixed(2)}:1, abaixo de ${MINIMO}:1`,
        ).toBeGreaterThanOrEqual(MINIMO);
      });
    }
  }

  for (const fundo of FUNDOS_CLAROS) {
    it(`ink-300 fica de fora de propósito, sobre ${fundo}`, () => {
      /*
        `ink-300` é placeholder e ícone desabilitado — nunca texto que alguém
        precisa ler. Se um dia ele passar de 4,5:1, o motivo dele deixou de
        existir e o comentário de globals.css precisa ser revisto.

        Os quatro fundos precisam da mesma checagem: `surface` é o mais
        claro deles, então é onde qualquer tom escurecido cruza o mínimo
        primeiro. Testar só `canvas` deixa passar um token que já está em
        conformidade sobre `surface` — foi o que a revisão da tarefa 1
        mostrou mutando para `#727272`: 4,18:1 sobre canvas (ainda abaixo,
        teste único não pega) mas 4,60:1 sobre surface (já acima).
      */
      expect(razaoDeContraste(T["ink-300"], T[fundo])).toBeLessThan(MINIMO);
    });
  }
});

describe("as duas listas cobrem todo token em uso", () => {
  /*
    A varredura não monta os pares — confere que ninguém foi esquecido.

    Um par de contraste é (texto, fundo), e só algumas combinações existem no
    código: `ink-400` nunca aparece sobre `ami-green-600`, que é fundo de
    botão com texto branco. Derivar os pares do grep inventaria dezenas que
    não existem — foi o que a primeira versão desta tarefa tentou, e a
    autorrevisão pegou: 31 falhas, nenhuma delas um defeito real, e a
    varredura ainda perdia `surface-fundo`.

    O que apodrece numa lista à mão é o ESQUECIMENTO — quatro vezes na fatia
    anterior. É isso que estas duas asserções impedem: um token novo em
    `text-` ou `bg-` obriga uma decisão — entrar na lista curada, ou ganhar
    uma exceção com motivo escrito em TEXTO_FORA_DO_TESTE/FUNDOS_FORA_DO_TESTE
    — e a decisão fica escrita, em vez de passar em silêncio.
  */
  it("nenhum token de texto ficou fora das duas listas", () => {
    const esquecidos = tokensEm("text").filter(
      (n) => !TEXTO_DE_CORPO.includes(n) && !(n in TEXTO_FORA_DO_TESTE),
    );
    expect(esquecidos, "token usado como texto e ausente das duas listas").toEqual([]);
  });

  it("nenhum fundo ficou fora das duas listas", () => {
    const esquecidos = tokensEm("bg").filter(
      (n) => !FUNDOS_CLAROS.includes(n) && !(n in FUNDOS_FORA_DO_TESTE),
    );
    expect(esquecidos, "token usado como fundo e ausente das duas listas").toEqual([]);
  });
});

describe("texto sobre fundo escuro", () => {
  /*
    Ficou de fora do plano original porque, segundo a autorrevisão, "esses
    pares dependem de saber qual token vai sobre qual, e essa informação não
    está no CSS, está nos componentes" — cobri-los exigiria uma lista escrita
    à mão, que apodrece.

    A varredura da rodada anterior (grep de `text-<token>` em app/ e
    components/) resolveu isso: o token da família antiga (a que a tarefa 3
    migrou) era usado só sobre verde escuro, nunca sobre fundo claro, e
    `ami-lima-400` é o token novo com o mesmo papel (marca sobre o verde,
    ou fundo de texto escuro). O par deixou de ser suposição.

    Este describe testa o par novo, `ami-lima-400`, que é o que continua
    existindo depois da tarefa 3 migrar e apagar a família antiga do
    `@theme`.
  */
  /*
    Os dois cremes sobre cada verde, e não só um.

    A spec pede "creme sobre o verde profundo", e creme é `canvas`. Este
    arquivo media `surface`, que é o creme mais CLARO — o caso mais fácil:
    17,33:1 contra os 15,75:1 de `canvas` sobre `ami-green-900`. Medir só o
    mais fácil é o erro simétrico ao que a revisão da tarefa 1 pegou em
    `ink-300`, e o critério que o arquivo já aplica lá vale aqui: quando dois
    tons dividem o mesmo papel, mede-se o par que cruza o mínimo primeiro, e
    o outro junto, porque nenhum dos dois é hipotético.

    Os dois estão em uso: `bg-canvas` aparece em 11 lugares e `bg-surface`
    em mais, e ambos convivem sobre o verde do herói e do rodapé.
  */
  const PARES_ESCUROS: [string, string][] = [
    ["canvas", "ami-green-900"],
    ["canvas", "ami-green-800"],
    ["surface", "ami-green-900"],
    ["surface", "ami-green-800"],
    ["ami-lima-400", "ami-green-900"],
    ["ami-lima-400", "ami-green-800"],
    ["ink-900", "ami-lima-400"],
  ];

  for (const [tinta, fundo] of PARES_ESCUROS) {
    it(`${tinta} sobre ${fundo}`, () => {
      const r = razaoDeContraste(T[tinta], T[fundo]);
      expect(
        r,
        `--color-${tinta} sobre --color-${fundo} dá ${r.toFixed(2)}:1, abaixo de ${MINIMO}:1`,
      ).toBeGreaterThanOrEqual(MINIMO);
    });
  }

  it("o acento nunca serve como letra sobre fundo claro", () => {
    /*
      `ami-lima-400` sobre o creme dá pouco mais de 1:1 — invisível. Ele só
      existe como fundo de texto escuro, ou como marca sobre o verde.

      Esta asserção falha se alguém um dia clarear o creme ou escurecer o
      acento até o par virar legível: nesse momento a regra "nunca é letra"
      deixou de ser física e virou escolha, e o comentário que a afirma
      precisa ser revisto.
    */
    expect(razaoDeContraste(T["ami-lima-400"], T["canvas"])).toBeLessThan(MINIMO);
  });
});

