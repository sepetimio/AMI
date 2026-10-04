import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowUpRight, Heartbeat, MapPin, Phone, SealCheck, Stethoscope } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import { FaixaDaAssociacao } from "@/components/associacao/FaixaDaAssociacao";
import estilosFaixa from "@/components/associacao/FaixaDaAssociacao.module.css";
import { QuemSomos, SIZES_DA_SEDE } from "@/components/associacao/QuemSomos";
import estilosQuem from "@/components/associacao/QuemSomos.module.css";
import estilosBusca from "@/components/busca/FaixaDaBusca.module.css";
import { PrincipiosDaAmi } from "@/components/home/PrincipiosDaAmi";
import estilosAssocie from "@/components/home/SejaAssociado.module.css";
import { TEXTO_INSTITUCIONAL, quemEhAmi } from "@/lib/molduras";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";

/*
  Os dois blocos de cima de A Associação, no HTML de servidor: a faixa verde
  com os três números e "Quem somos" (a sede, a apresentação e Missão,
  visão e valores), nos dois modos.

  A foto da sede é trocada por um dublê que mostra o que recebeu: o desenho
  da moldura "Fotografia a entrar" já é testado em testes/molduras.test.ts,
  e aqui interessa o que "Quem somos" pede a ela.
*/

vi.mock("@/components/base/Fotografia", () => ({
  Fotografia: (p: { espaco: string; sizes: string; demonstracao: boolean; className: string }) =>
    createElement("span", {
      "data-fotografia": p.espaco,
      "data-sizes": p.sizes,
      "data-demonstracao": String(p.demonstracao),
      className: p.className,
    }),
}));

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

describe("a faixa verde de A Associação", () => {
  const html = renderToString(createElement(FaixaDaAssociacao, { anos: 51, medicos: 24, especialidades: 14 }));

  it("faixa de ponta a ponta que abre a página, sem Cabeceira nem trilha", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="topo" data-faixa="" data-abertura="" aria-labelledby="associacao-titulo" class="textura-verde ${estilosBusca.faixa} ${estilosFaixa.inst}"><div class="brilho" aria-hidden="true"></div>`,
      ),
    );
    expect(html).not.toContain("Trilha de navegação");
  });

  it("o rótulo, o título com o ano de fundação e o parágrafo verdadeiro", () => {
    expect(html).toContain(
      `<div><span class="rotulo-secao ${estilosBusca.sobre}" data-coluna="">A Associação</span>` +
        `<h1 id="associacao-titulo" class="${estilosBusca.titulo}">Desde 1975 com os médicos de Imperatriz</h1>` +
        `<p class="${estilosBusca.texto}">A Associação Médica de Imperatriz está em atividade desde 1975 e representa a classe médica na região sul do Maranhão. Mantém este diretório para que a população encontre quem atende perto de casa, com informação correta e verificada.</p></div>`,
    );
  });

  it("à direita, os três números da home, cada um com o ícone num ladrilho de vidro", () => {
    expect(html).toContain(`<ul class="${estilosFaixa.numeros}" aria-label="A AMI em números">`);
    const numeros = [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    expect(numeros.map(tela)).toEqual(["51 anos de AMI", "24 médicos no diretório", "14 especialidades"]);
    expect(numeros[0]).toBe(
      `<span class="${estilosFaixa.vidro}" aria-hidden="true">${desenho(SealCheck, 20, "duotone")}</span>` +
        `<span class="${estilosFaixa.grande}">51</span><span class="${estilosFaixa.rotulo}">anos de AMI</span>`,
    );
    expect(numeros[1]).toContain(desenho(Stethoscope, 20, "duotone"));
    expect(numeros[2]).toContain(desenho(Heartbeat, 20, "duotone"));
  });
});

const BLOCOS = [
  {
    _type: "block",
    _key: "a",
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: "s", text: "A AMI reúne os médicos da região.", marks: [] }],
  },
] as PortableTextBlock[];

const quem = (demonstracao: boolean, apresentacao: Parameters<typeof QuemSomos>[0]["apresentacao"], texto = TEXTO_INSTITUCIONAL) =>
  renderToString(createElement(QuemSomos, { demonstracao, apresentacao, texto }));

describe("Quem somos, na demonstração e sem o texto da AMI", () => {
  const html = quem(true, { tipo: "a-entrar" });

  it("faixa branca de ponta a ponta, que entra ao rolar, com o texto e a foto lado a lado", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="quem-somos" data-faixa="" aria-labelledby="quem-somos-titulo" class="revelar ${estilosAssocie.faixa}">` +
          `<div class="${estilosAssocie.duplo} ${estilosAssocie.comFoto}"><div class="${estilosAssocie.corpo} ${estilosQuem.corpo}">`,
      ),
    );
  });

  it("o rótulo na coluna do texto, o título e a apresentação a entrar", () => {
    expect(html).toContain(
      `<span class="rotulo-secao" data-coluna="">Quem somos</span>` +
        `<h2 id="quem-somos-titulo" class="${estilosAssocie.titulo}">A Associação Médica de Imperatriz</h2>` +
        `<p class="${estilosQuem.apresentacao} ${estilosQuem.falta}" data-a-entrar="apresentação">Texto da AMI a entrar.</p>`,
    );
  });

  it("o quadro da sede: o pino, o endereço em três linhas, Como chegar e o telefone fixo", () => {
    expect(html).toContain(
      `<div class="${estilosQuem.sede}"><span class="ladrilho-icone ladrilho-icone--pequeno" aria-hidden="true">${desenho(MapPin, 23, "duotone")}</span>` +
        `<div><h3 class="${estilosQuem.sedeTitulo}">Sede da AMI</h3>` +
        `<address class="${estilosQuem.endereco}">Rua Coriolano Milhomem, 39<br/>Centro, Imperatriz – MA<br/>CEP 65900-330</address></div>`,
    );
    expect(html).toContain(
      `<div class="${estilosQuem.acoes}"><a class="botao" href="https://www.google.com/maps/search/?api=1&amp;query=Rua%20Coriolano%20Milhomem%2C%2039%2C%20Centro%2C%20Imperatriz%20-%20MA%2C%2065900-330" aria-label="Como chegar à sede da AMI (abre o mapa)">Como chegar ${desenho(ArrowUpRight, 20, "regular")}</a>` +
        `<a class="botao-contorno" href="tel:+559935243716" aria-label="Ligar (99) 3524-3716 para a AMI">${desenho(Phone, 20, "regular")} <!-- -->(99) 3524-3716</a></div>`,
    );
  });

  it("o nome acessível de cada botão da sede contém o texto visível, em sequência", () => {
    const acoes = new RegExp(`<div class="${estilosQuem.acoes}">[\\s\\S]*?</div>`).exec(html)![0];
    const botoes = [...acoes.matchAll(/aria-label="([^"]+)">([\s\S]*?)<\/a>/g)].map((m) => [m[1], tela(m[2])]);
    expect(botoes).toEqual([
      ["Como chegar à sede da AMI (abre o mapa)", "Como chegar"],
      ["Ligar (99) 3524-3716 para a AMI", "(99) 3524-3716"],
    ]);
    for (const [nome, visivel] of botoes) expect(nome).toContain(visivel);
  });

  it("à direita, a foto da sede, com a largura desenhada", () => {
    expect(html).toContain(
      `<div class="${estilosAssocie.foto}"><span data-fotografia="sede" data-sizes="${SIZES_DA_SEDE}" data-demonstracao="true" class="${estilosAssocie.fotografia}"></span></div>`,
    );
    expect(SIZES_DA_SEDE).toBe(
      "(max-width: 700px) calc(100vw - 64px), (max-width: 980px) calc(100vw - 104px), " +
        "(max-width: 1240px) calc(50vw - 96px), 524px",
    );
  });

  it("depois do fio, Princípios: Missão, visão e valores a entrar, sem texto de introdução", () => {
    expect(html).toContain(
      `<div class="${estilosAssocie.quem}" style="--cartoes:3"><div class="${estilosAssocie.intro}"><span class="rotulo-secao">Princípios</span><h3 class="${estilosAssocie.introTitulo}">Missão, visão e valores</h3></div>`,
    );
    expect(html.match(/Texto da AMI a entrar\./g)).toHaveLength(4);
  });
});

describe("Quem somos, fora da demonstração", () => {
  const html = quem(false, null);

  it("sem a foto, o texto em duas colunas; sem nenhuma moldura", () => {
    expect(html).toContain(
      `<div class="${estilosAssocie.duplo}"><div class="${estilosAssocie.corpo} ${estilosQuem.corpo} ${estilosQuem.semFoto}">`,
    );
    expect(html).not.toContain("data-fotografia");
    expect(html).not.toContain("data-a-entrar");
    expect(html).not.toContain("a entrar");
  });

  it("sem o texto de Missão, visão e valores, o bloco sai inteiro; a sede fica", () => {
    expect(html).not.toContain(estilosAssocie.quem);
    expect(html).not.toContain("Princípios");
    expect(html).toContain("Sede da AMI");
  });

  it("com a apresentação da AMI no Studio, ela sai, nos dois modos", () => {
    for (const demonstracao of [true, false]) {
      expect(quem(demonstracao, { tipo: "texto", blocos: BLOCOS })).toContain(
        `<div class="${estilosQuem.apresentacao}"><p>A AMI reúne os médicos da região.</p></div>`,
      );
    }
  });

  it("a moldura da apresentação sai só quando ela chega como a entrar, e não pelo modo", () => {
    // Quem decide é `apresentacaoDaAssociacao` (lib/associacao.ts); o bloco só desenha o que recebe.
    const html = quem(true, null);
    expect(html).not.toContain(estilosQuem.apresentacao);
    expect(html).toContain("Sede da AMI");
  });

  it("com o texto de um princípio, só o cartão dele", () => {
    const html = quem(false, null, { missao: "Representar os médicos.", visao: null, valores: null });
    expect(html).toContain('style="--cartoes:1"');
    expect(html).toContain("Representar os médicos.");
  });
});

describe("Missão, visão e valores, num componente só para a home e para A Associação", () => {
  it("com texto de introdução (a home), o parágrafo dele sai depois do título", () => {
    const html = renderToString(
      createElement(PrincipiosDaAmi, {
        cartoes: quemEhAmi(true, TEXTO_INSTITUCIONAL).cartoes,
        rotulo: "Quem somos",
        titulo: "Quem é a AMI?",
        texto: "Introdução.",
      }),
    );
    expect(html).toContain(
      `<h3 class="${estilosAssocie.introTitulo}">Quem é a AMI?</h3><p class="${estilosAssocie.introTexto}">Introdução.</p></div>`,
    );
    expect([...html.matchAll(new RegExp(`<span class="${estilosAssocie.ordem}" aria-hidden="true">(\\d+)</span>`, "g"))].map((m) => m[1])).toEqual([
      "01",
      "02",
      "03",
    ]);
  });

  it("o texto da AMI é um só, nulo até ela entregar", () => {
    expect(TEXTO_INSTITUCIONAL).toEqual({ missao: null, visao: null, valores: null });
  });
});

describe("o CSS da faixa verde", () => {
  const css = semNotas(fonte("../components/associacao/FaixaDaAssociacao.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("os números à direita, presos ao pé do texto, valendo sobre a regra da busca", () => {
    const r = regra(base(css), ".inst[data-faixa]");
    expect(r).toMatch(/grid-template-columns: minmax\(0, 1fr\) auto;/);
    expect(r).toMatch(/gap: 72px;/);
    expect(r).toMatch(/align-items: end;/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".inst[data-faixa]")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("título até 12ch e parágrafo até 31em", () => {
    expect(regra(base(css), ".inst h1")).toMatch(/max-width: 12ch;/);
    expect(regra(base(css), ".inst h1 + p")).toMatch(/max-width: 31em;/);
  });

  it("três colunas com fio; no celular, uma fileira de três, sem ícone", () => {
    expect(regra(base(css), ".numeros")).toMatch(/grid-template-columns: repeat\(3, auto\);/);
    expect(regra(base(css), ".numeros li")).toMatch(/border-left: 1px solid rgba\(255, 255, 255, 0\.16\);/);
    expect(regra(base(css), ".grande")).toMatch(/font-size: 48px;/);
    expect(regra(base(css), ".rotulo")).toMatch(/color: #DDE7D6;/);
    expect(regra(cel(), ".vidro")).toMatch(/display: none;/);
    expect(regra(cel(), ".grande")).toMatch(/font-size: 32px;/);
    expect(regra(cel(), ".numeros")).toMatch(/border-top: 1px solid rgba\(255, 255, 255, 0\.16\);/);
  });
});

describe("o CSS de Quem somos", () => {
  const css = semNotas(fonte("../components/associacao/QuemSomos.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("o quadro da sede: fio em cima, o ícone à esquerda e os botões embaixo do endereço", () => {
    const r = regra(base(css), ".sede");
    expect(r).toMatch(/border-top: 1px solid var\(--color-line\);/);
    expect(r).toMatch(/grid-template-columns: 44px minmax\(0, 1fr\);/);
    expect(regra(base(css), ".acoes")).toMatch(/grid-column: 2;/);
  });

  it("sem a foto: o título à esquerda e a sede à direita, sem o fio nem o recuo do lado da foto", () => {
    const corpo = regra(base(css), ".corpo.semFoto");
    expect(corpo).toMatch(/grid-template-columns: minmax\(0, 1\.15fr\) minmax\(0, 1fr\);/);
    expect(corpo).toMatch(/padding: 0;/);
    const r = regra(base(css), ".semFoto .sede");
    expect(r).toMatch(/grid-column: 2;/);
    expect(r).toMatch(/border: 0;/);
  });

  it("a apresentação quebra com text-wrap: pretty, como o p do desenho", () => {
    expect(regra(base(css), ".apresentacao")).toMatch(/text-wrap: pretty;/);
  });

  it("no celular, os dois botões lado a lado, na largura toda", () => {
    expect(regra(cel(), ".acoes")).toMatch(/grid-template-columns: 1fr 1fr;/);
    expect(regra(cel(), ".acoes > a")).toMatch(/width: 100%;/);
    expect(regra(cel(), ".corpo.semFoto")).toMatch(/display: block;/);
  });

  it("a introdução sem texto (Princípios) não deixa espaço embaixo do título", () => {
    const associe = semNotas(fonte("../components/home/SejaAssociado.module.css"));
    expect(regra(base(associe), ".introTitulo:last-child")).toMatch(/margin-bottom: 0;/);
  });
});
