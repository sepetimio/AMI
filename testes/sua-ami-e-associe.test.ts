import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { LadrilhoIcone } from "@/components/base/Icone";
import { SuaAmi } from "@/components/home/SuaAmi";
import { SejaAssociado } from "@/components/home/SejaAssociado";
import estilosSua from "@/components/home/SuaAmi.module.css";
import estilosAssocie from "@/components/home/SejaAssociado.module.css";
import { fonte } from "@/testes/apoio";

/*
  "Sua AMI", "Seja associado" e "Quem é a AMI?", medidos no HTML de servidor
  (`renderToString`). A decisão dos cartões de missão, visão e valores é
  função pura (`quemEhAmi`) e mora em testes/molduras.test.ts; aqui se vê o
  que ela vira na tela.

  O CSS só se lê do arquivo, porque quem o aplica é o navegador: no fim deste
  arquivo, regra por regra.
*/

const VAZIO = { missao: null, visao: null, valores: null };

/** O texto que o leitor vê, pedaço por pedaço, sem as tags. O `<!-- -->`
    que o React põe entre dois textos vizinhos sai antes, para "Fotografia a
    entrar: " e o rótulo virarem uma frase só, como na tela. */
function visivel(html: string): string[] {
  return html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** A tag de abertura do primeiro elemento cuja classe contém `classe`. */
function tag(html: string, classe: string): string {
  const m = new RegExp(`<[a-z0-9]+ [^>]*class="[^"]*\\b${classe}\\b[^"]*"[^>]*>`).exec(html);
  return m?.[0] ?? `(sem elemento com a classe ${classe})`;
}

describe("Sua AMI", () => {
  const html = renderToString(createElement(SuaAmi, { demonstracao: true }));

  it("fora da demonstracao nao sai nada: o bloco inteiro e provisorio", () => {
    expect(renderToString(createElement(SuaAmi, { demonstracao: false }))).toBe("");
  });

  it("e a secao #sua-ami, marcada para a auditoria e nomeada pelo titulo", () => {
    const secao = /^<section [^>]*>/.exec(html)?.[0] ?? "";
    expect(secao).toContain('id="sua-ami"');
    expect(secao).toContain('data-bloco="sua-ami"');
    expect(secao).toContain('aria-labelledby="sua-ami-titulo"');
    expect(html).toMatch(/<h2 [^>]*id="sua-ami-titulo"[^>]*>O auditório e o hall de eventos da AMI<\/h2>/);
  });

  it("tem o texto do desenho, a etiqueta em breve e o botao para /contato", () => {
    expect(html).toContain(
      "Espaços da sede para congressos, cursos, reuniões e confraternizações. Fale com a AMI para conhecer as datas livres.",
    );
    expect(html).toMatch(new RegExp(`<span class="${estilosSua.etiqueta}">em breve</span>`));
    expect(html).toMatch(/<a [^>]*class="botao [^"]*"[^>]*href="\/contato"[^>]*>Consultar disponibilidade/);
  });

  it("nao inventa capacidade, preco, metragem nem horario: o texto visivel inteiro, e nenhum algarismo", () => {
    /* Comparado por inteiro, e não só por algarismo: "cem pessoas" por
       extenso não é algarismo e passaria (lição do cartão de antes, em
       testes/molduras.test.ts). */
    const texto = visivel(html);
    expect(texto).toEqual([
      "Fotografia a entrar: Auditório da AMI",
      "Sua AMI",
      "em breve",
      "O auditório e o hall de eventos da AMI",
      "Espaços da sede para congressos, cursos, reuniões e confraternizações. Fale com a AMI para conhecer as datas livres.",
      "Consultar disponibilidade",
    ]);
    expect(texto.join(" ")).not.toMatch(/\d/);
  });

  it("a foto e a do auditorio, na proporcao dela, atras do cartao", () => {
    const fundo = html.indexOf(`class="${estilosSua.fundo}"`);
    expect(fundo).toBeGreaterThan(-1);
    expect(html).toContain("aspect-ratio:2000 / 1125");
    /* A foto vem antes do cartão no HTML: no celular ela fica em cima e o
       cartão sobe por cima da borda dela. */
    expect(fundo).toBeLessThan(html.indexOf(`class="${estilosSua.cartao}"`));
  });
});

describe("Seja associado", () => {
  const demo = renderToString(createElement(SejaAssociado, { demonstracao: true, texto: VAZIO }));
  const real = renderToString(createElement(SejaAssociado, { demonstracao: false, texto: VAZIO }));

  it("e o bloco associe, nomeado pelo titulo, com o rotulo na coluna das faixas", () => {
    for (const html of [demo, real]) {
      const secao = /^<section [^>]*>/.exec(html)?.[0] ?? "";
      expect(secao).toContain('data-bloco="associe"');
      expect(secao).toContain('aria-labelledby="associe-titulo"');
      expect(html).toMatch(/<span class="rotulo-secao" data-coluna="">Seja associado<\/span>/);
    }
  });

  it("tem o titulo, o texto e o botao do desenho", () => {
    expect(demo).toMatch(
      /<h2 [^>]*id="associe-titulo"[^>]*>Associe-se à AMI e fortaleça a medicina em Imperatriz<\/h2>/,
    );
    expect(demo).toContain("Médico com inscrição no CRM pode se associar. Fale com a AMI para saber como.");
    expect(demo).toMatch(/<a [^>]*class="botao [^"]*"[^>]*href="\/associacao\/seja-associado"[^>]*>Quero me associar/);
  });

  it("na demonstracao, a moldura dos associados ao lado do texto, em duas colunas", () => {
    expect(demo).toContain("Fotografia a entrar: <!-- -->Associados da AMI");
    expect(demo).toContain("aspect-ratio:1600 / 1100");
    expect(tag(demo, estilosAssocie.duplo)).toContain(estilosAssocie.comFoto);
    expect(demo).toContain(`class="${estilosAssocie.foto}"`);
  });

  it("fora dela, sem foto real, nao sobra coluna vazia: o texto ocupa a largura toda", () => {
    expect(real).not.toContain("a entrar");
    expect(real).not.toContain('role="img"');
    expect(real).not.toContain(`class="${estilosAssocie.foto}"`);
    expect(tag(real, estilosAssocie.duplo)).not.toContain(estilosAssocie.comFoto);
    /* O texto continua lá. */
    expect(real).toContain("Quero me associar");
  });

  it("Quem e a AMI? com o texto verdadeiro, nos dois modos", () => {
    const frase =
      "A Associação Médica de Imperatriz reúne os profissionais que atendem em Imperatriz e na região sul do Maranhão, em atividade desde 1975.";
    for (const html of [demo, real]) {
      expect(html).toContain(">Quem somos</span>");
      expect(html).toMatch(/<h3 [^>]*>Quem é a AMI\?<\/h3>/);
      expect(visivel(html)).toContain(frase);
    }
  });

  it("o ano de fundacao vem de lib/ami.ts, nao escrito a mao", async () => {
    vi.resetModules();
    vi.doMock("@/lib/ami", async (original) => {
      const verdadeiro = await original<typeof import("@/lib/ami")>();
      return { ...verdadeiro, AMI: { ...verdadeiro.AMI, fundadaEm: "1999" } };
    });
    try {
      const { SejaAssociado: ComOutroAno } = await import("@/components/home/SejaAssociado");
      const h = renderToString(createElement(ComOutroAno, { demonstracao: false, texto: VAZIO }));
      expect(visivel(h).join(" ")).toContain("em atividade desde 1999.");
    } finally {
      vi.doUnmock("@/lib/ami");
      vi.resetModules();
    }
  });

  /** Os cartões, na ordem: [ordinal, título, texto, provisório?]. */
  function cartoes(html: string): Array<[string, string, string, boolean]> {
    const partes = html.split(`<div class="${estilosAssocie.cartao}">`).slice(1);
    return partes.map((p) => {
      const ordem = new RegExp(`<span class="${estilosAssocie.ordem}" aria-hidden="true">(\\d+)</span>`).exec(p);
      const titulo = /<h4 [^>]*>([^<]+)<\/h4>/.exec(p);
      const texto = /<p class="([^"]*)">([^<]+)<\/p>/.exec(p);
      return [
        ordem?.[1] ?? "(sem ordinal escondido)",
        titulo?.[1] ?? "(sem título)",
        texto?.[2] ?? "(sem texto)",
        (texto?.[1] ?? "").split(" ").includes(estilosAssocie.falta),
      ];
    });
  }

  it("na demonstracao, tres cartoes 'a entrar', com o ordinal escondido do leitor de tela", () => {
    expect(cartoes(demo)).toEqual([
      ["01", "Missão", "Texto da AMI a entrar.", true],
      ["02", "Visão", "Texto da AMI a entrar.", true],
      ["03", "Valores", "Texto da AMI a entrar.", true],
    ]);
    /* Os números não chegam ao leitor de tela: só os escondidos existem. */
    expect(visivel(demo).filter((t) => /^\d+$/.test(t))).toEqual(["01", "02", "03"]);
    expect(demo.match(/aria-hidden="true">0\d</g)?.length).toBe(3);
  });

  it("cada cartao com o seu icone, no ladrilho pequeno", () => {
    const icones = (["bandeira", "olho", "maoCoracao"] as const).map((nome) =>
      demo.indexOf(renderToString(createElement(LadrilhoIcone, { nome, pequeno: true }))),
    );
    const titulos = ["Missão", "Visão", "Valores"].map((t) => demo.indexOf(`>${t}</h4>`));
    for (let i = 0; i < 3; i++) {
      expect(icones[i], `ícone do cartão ${i + 1}`).toBeGreaterThan(-1);
      expect(icones[i]).toBeLessThan(titulos[i]);
      if (i > 0) expect(icones[i]).toBeGreaterThan(titulos[i - 1]);
    }
  });

  it("fora da demonstracao e sem texto, a introducao fica e a grade de cartoes some", () => {
    expect(cartoes(real)).toEqual([]);
    expect(real).not.toContain("Texto da AMI");
    expect(tag(real, estilosAssocie.quem)).toContain(estilosAssocie.soIntro);
    expect(real).toContain("Quem é a AMI?");
  });

  it("com texto real, saem so os cartoes que tem texto, numerados na ordem em que aparecem", () => {
    const h = renderToString(
      createElement(SejaAssociado, {
        demonstracao: false,
        texto: { missao: "Representar os médicos.", visao: null, valores: "Ética." },
      }),
    );
    expect(cartoes(h)).toEqual([
      ["01", "Missão", "Representar os médicos.", false],
      ["02", "Valores", "Ética.", false],
    ]);
    /* A grade tem tantas colunas quantos cartões: nenhuma vazia à direita. */
    expect(tag(h, estilosAssocie.quem)).toContain("--cartoes:2");
    expect(tag(h, estilosAssocie.quem)).not.toContain(estilosAssocie.soIntro);
    expect(tag(demo, estilosAssocie.quem)).toContain("--cartoes:3");
  });
});

/* =====================================================================
   CSS. Só o navegador aplica; aqui se confere a regra escrita.
   ===================================================================== */

const CSS_SUA = fonte("../components/home/SuaAmi.module.css").replace(/\/\*[\s\S]*?\*\//g, "");
const CSS_ASSOCIE = fonte("../components/home/SejaAssociado.module.css").replace(/\/\*[\s\S]*?\*\//g, "");
const CSS_GLOBAL = fonte("../app/globals.css");

/* O conteúdo entre as chaves do @media que começa com `abre`. */
function media(css: string, abre: string): string {
  const ini = css.indexOf(`${abre} {`);
  expect(ini, `falta o bloco ${abre}`).toBeGreaterThan(-1);
  let nivel = 0;
  for (let i = css.indexOf("{", ini); i < css.length; i++) {
    if (css[i] === "{") nivel++;
    if (css[i] === "}" && --nivel === 0) return css.slice(css.indexOf("{", ini) + 1, i);
  }
  throw new Error(`bloco ${abre} sem fim`);
}

/* O CSS fora de qualquer @media. */
function base(css: string): string {
  return css.replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*[^{}]*\}/g, "");
}

/* O corpo da regra `seletor { ... }`, com o seletor exato começando a linha. */
function regra(css: string, seletor: string): string {
  const m = new RegExp(`(^|\\n)\\s*${seletor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{([^}]*)\\}`).exec(css);
  if (!m) throw new Error(`falta a regra ${seletor}`);
  return m[2];
}

describe("o CSS de Sua AMI", () => {
  it("no computador, a foto cobre o bloco e o cartao de vidro assenta embaixo", () => {
    const b = base(CSS_SUA);
    expect(regra(b, ".vitrine")).toMatch(/min-height: 560px/);
    expect(regra(b, ".vitrine")).toMatch(/align-items: flex-end/);
    expect(regra(b, ".fundo")).toMatch(/position: absolute/);
    expect(regra(b, ".cartao")).toMatch(/backdrop-filter: blur\(16px\) saturate\(1\.3\)/);
    expect(regra(b, ".cartao")).toMatch(/max-width: 500px/);
  });

  it("o zoom so vale para a foto de verdade: na moldura ele cortava a tarja", () => {
    for (const css of [CSS_SUA, CSS_ASSOCIE]) {
      expect(regra(base(css), ".fotografia")).not.toMatch(/transform/);
      expect(css).not.toMatch(/(^|[\s,])\.fotografia[^{]*\{[^}]*transform: scale/);
    }
    expect(regra(base(CSS_SUA), "img.fotografia")).toMatch(/transform: scale\(1\.04\)/);
  });

  it("no celular, foto em cima e o cartao sobreposto, sem vidro", () => {
    const m = media(CSS_SUA, "@media (max-width: 700px)");
    expect(regra(m, ".vitrine")).toMatch(/display: block/);
    expect(regra(m, ".fundo")).toMatch(/position: relative/);
    expect(regra(m, ".fundo")).toMatch(/aspect-ratio: 4 \/ 3/);
    expect(regra(m, ".cartao")).toMatch(/margin: -40px 12px 12px/);
    expect(regra(m, ".cartao")).toMatch(/backdrop-filter: none/);
  });

  it("a 360px e menos, o botao de 260px cabe no cartao: menos folga e texto meio ponto menor", () => {
    const m = media(CSS_SUA, "@media (max-width: 360px)");
    expect(regra(m, ".cartao")).toMatch(/padding: 22px 16px/);
    expect(regra(m, ".acao")).toMatch(/padding: 0 18px/);
    expect(regra(m, ".acao")).toMatch(/font-size: 13\.5px/);
  });

  it("o texto do cartao de vidro passa em AA mesmo sobre a parte mais escura da foto", () => {
    /* Pior caso: preto puro atrás do vidro. O branco a X% sobre o preto dá
       um cinza de 255·X; o texto é ink-600, lido do token. */
    const alfa = Number(/background: rgba\(255, 255, 255, ([\d.]+)\)/.exec(regra(base(CSS_SUA), ".cartao"))?.[1]);
    expect(regra(base(CSS_SUA), ".texto")).toMatch(/color: var\(--color-ink-600\)/);
    const ink600 = /--color-ink-600: (#[0-9A-Fa-f]{6})/.exec(CSS_GLOBAL)?.[1] ?? "";
    const fundo = Math.round(255 * alfa);
    expect(contraste(ink600, [fundo, fundo, fundo])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("o CSS de Seja associado", () => {
  it("faixa branca de ponta a ponta com a margem das faixas, sem repetir a formula", () => {
    expect(regra(base(CSS_ASSOCIE), ".faixa")).toMatch(/padding: 96px var\(--borda-faixa\)/);
    expect(regra(base(CSS_ASSOCIE), ".faixa")).toMatch(/background: var\(--color-surface\)/);
    expect(regra(media(CSS_ASSOCIE, "@media (max-width: 700px)"), ".faixa")).toMatch(
      /padding: 44px var\(--borda-faixa\)/,
    );
    expect(CSS_ASSOCIE).not.toContain("1240px");
  });

  it("duas colunas so com foto, e so no computador; no celular a foto vai para cima", () => {
    expect(regra(base(CSS_ASSOCIE), ".duplo")).not.toMatch(/grid-template-columns: 1fr 1fr/);
    expect(regra(base(CSS_ASSOCIE), ".duplo.comFoto")).toMatch(/grid-template-columns: 1fr 1fr/);
    expect(regra(media(CSS_ASSOCIE, "@media (max-width: 980px)"), ".duplo.comFoto")).toMatch(
      /grid-template-columns: 1fr;/,
    );
    expect(regra(media(CSS_ASSOCIE, "@media (max-width: 700px)"), ".foto")).toMatch(/order: -1/);
  });

  it("a grade de Quem e a AMI tem uma coluna por cartao, e no celular vira linhas", () => {
    expect(regra(base(CSS_ASSOCIE), ".quem")).toMatch(
      /grid-template-columns: 1\.35fr repeat\(var\(--cartoes\), 1fr\)/,
    );
    expect(regra(base(CSS_ASSOCIE), ".quem.soIntro")).toMatch(/grid-template-columns: 1fr;/);
    const cel = media(CSS_ASSOCIE, "@media (max-width: 700px)");
    expect(regra(cel, ".quem")).toMatch(/grid-template-columns: 1fr;/);
    expect(regra(cel, ".cartao")).toMatch(/grid-template-columns: 44px 1fr/);
  });

  it("os cartoes ficam sobre fundo neutro: nenhum hex, nenhum tom quente", () => {
    /* O cliente recusou duas vezes o creme atrás destes cartões. Só tokens
       neutros, e as sombras do desenho, que são cinza-azuladas. */
    expect(regra(base(CSS_ASSOCIE), ".cartao")).toMatch(/background: var\(--color-surface\)/);
    for (const css of [CSS_ASSOCIE, CSS_SUA]) {
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      for (const m of css.matchAll(/rgba\((\d+), (\d+), (\d+),/g)) {
        const [r, , b] = [m[1], m[2], m[3]].map(Number);
        /* Neutro: o vermelho nunca passa o azul (um tom quente passa). */
        expect(r, m[0]).toBeLessThanOrEqual(b);
      }
      expect(css).not.toMatch(/--color-(?!surface|line|canvas|ink|ami-green-(?:600|800))[a-z-]+/);
    }
  });

  it("o ordinal e o texto a entrar ficam em ink-400, que passa em AA no branco", () => {
    expect(regra(base(CSS_ASSOCIE), ".ordem")).toMatch(/color: var\(--color-ink-400\)/);
    expect(regra(base(CSS_ASSOCIE), ".falta")).toMatch(/color: var\(--color-ink-400\)/);
    const ink400 = /--color-ink-400: (#[0-9A-Fa-f]{6})/.exec(CSS_GLOBAL)?.[1] ?? "";
    expect(contraste(ink400, [255, 255, 255])).toBeGreaterThanOrEqual(4.5);
  });
});

/** Razão de contraste WCAG entre um hex e uma cor RGB. */
function contraste(hex: string, rgb: number[]): number {
  const canal = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = (c: number[]) => 0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2]);
  const a = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [x, y] = [lum(a), lum(rgb)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
