import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Carrossel } from "@/components/home/Carrossel";
import estilos from "@/components/home/Carrossel.module.css";
import {
  PROPORCAO_DA_ARTE,
  PROPORCAO_DA_FOTO,
  TAMANHO_DA_ARTE,
  TAMANHO_DA_ARTE_CELULAR,
  TAMANHO_DA_FOTO,
  caixaDaArte,
  caixaDaFoto,
  larguraDesenhada,
} from "@/lib/carrossel";
import { BANNERS_PROVISORIOS, type ItemDoCarrossel } from "@/lib/molduras";
import { ARTE_CELULAR, ARTE_LARGA } from "@/lib/sanity/banners";
import type { BannerArte, BannerComposto } from "@/lib/sanity/tipos";
import { fonte, semComentarios } from "@/testes/apoio";

/*
  O carrossel, medido no HTML de servidor.

  Duas coisas aqui não se veem de outro jeito:

  1. A saída de servidor não depende da preferência de movimento do cliente.
     `semMovimento` decide se o botão "Pausar" existe no JSX. Se o valor lido
     no servidor puder diferir do valor da primeira renderização do cliente,
     as duas árvores divergem, o React descarta a do servidor e refaz do
     zero — e só para quem tem "reduzir movimento" ligado, que é exatamente
     o público que a regra existe para proteger. No Vitest servidor e
     cliente são o mesmo processo; a prova é `renderToString` com
     `matchMedia` respondendo `true`: se o servidor consultasse a
     preferência, o botão sumiria da saída e as contagens de chamada
     passariam de zero.

  2. O desenho de cada tipo de slide e a fita com cópias nas pontas.

  O que só existe no navegador (o movimento da fita, o salto, o dedo, a
  barra de tempo) foi conferido à mão no navegador e não se mede aqui; o que
  dá para medir sem ele está em testes/fita-do-carrossel.test.ts, e a
  auditoria visual (scripts/auditoria-visual.js) confere cada slide parado.
*/

function arte(id: string, extra: Partial<BannerArte> = {}): BannerArte {
  return {
    tipo: "arte",
    id,
    nome: id,
    imagem: `https://exemplo.test/${id}.jpg`,
    imagemSrcset: `https://exemplo.test/${id}-800.jpg 800w, https://exemplo.test/${id}.jpg 3000w`,
    alt: `Arte ${id}`,
    imagemCelular: null,
    imagemCelularSrcset: null,
    tema: "escuro",
    foco: null,
    destino: null,
    ordem: 1,
    ...extra,
  };
}

function composto(id: string, extra: Partial<BannerComposto> = {}): BannerComposto {
  return {
    tipo: "composto",
    id,
    nome: id,
    foto: `https://exemplo.test/${id}.jpg`,
    fotoSrcset: `https://exemplo.test/${id}-600.jpg 600w, https://exemplo.test/${id}.jpg 1600w`,
    foco: null,
    fotoAlt: `Foto ${id}`,
    rotulo: "Associação Médica de Imperatriz",
    titulo: "Os médicos de Imperatriz, reunidos desde 1975",
    texto: "A AMI representa os profissionais que atendem em Imperatriz.",
    botao: "Seja associado",
    destino: "/associacao/seja-associado",
    ordem: 1,
    ...extra,
  };
}

/* A versão de celular de uma arte: o endereço e o `srcset` dela. */
function celular(id: string): Partial<BannerArte> {
  return {
    imagemCelular: `https://exemplo.test/${id}.jpg`,
    imagemCelularSrcset: `https://exemplo.test/${id}-540.jpg 540w, https://exemplo.test/${id}.jpg 1080w`,
  };
}

const DUAS_ARTES: ItemDoCarrossel[] = [arte("a"), arte("b")];

/* `window` não existe no ambiente `node` do Vitest. Este é o mínimo que
   `lerMovimento`/`assinarMovimento` tocariam se fossem chamadas: se elas
   forem, `chamadas` sai de zero e o teste diz onde. */
function janelaFalsa(reduzirMovimento: boolean) {
  const contador = { chamadas: 0 };
  const janela = {
    matchMedia: (consulta: string) => {
      contador.chamadas += 1;
      return {
        media: consulta,
        matches: reduzirMovimento,
        addEventListener: () => {},
        removeEventListener: () => {},
      };
    },
  };
  return { janela, contador };
}

function renderizarNoServidor(reduzirMovimento: boolean) {
  const { janela, contador } = janelaFalsa(reduzirMovimento);
  vi.stubGlobal("window", janela);
  const html = renderToString(createElement(Carrossel, { itens: DUAS_ARTES }));
  return { html, chamadas: contador.chamadas };
}

function html(itens: ItemDoCarrossel[]): string {
  return renderToString(createElement(Carrossel, { itens }));
}

/** Cada slide da fita, do `<div data-slide` até o próximo (ou o fim da fita). */
function slides(saida: string): string[] {
  const fim = saida.indexOf(`class="${estilos.controles}"`);
  const fita = fim === -1 ? saida : saida.slice(0, fim);
  return fita.split("<div data-slide").slice(1).map((s) => `<div data-slide${s}`);
}

/** A tag de abertura de um slide: os atributos dele, sem os dos filhos. */
function abertura(slide: string): string {
  return slide.slice(0, slide.indexOf(">") + 1);
}

/** As classes do `<section>` do carrossel. */
function classesDoCarrossel(saida: string): string[] {
  const m = /<section[^>]*class="([^"]*)"/.exec(saida);
  expect(m, "falta o <section> do carrossel").not.toBeNull();
  return m![1].split(" ");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Carrossel na renderização de servidor", () => {
  it("gera o botão Pausar mesmo com reduzir movimento ligado", () => {
    const { html, chamadas } = renderizarNoServidor(true);

    expect(html).toContain('aria-label="Pausar"');
    expect(chamadas).toBe(0);
  });

  it("gera a mesma árvore com a preferência ligada e desligada", () => {
    const ligado = renderizarNoServidor(true);
    const desligado = renderizarNoServidor(false);

    expect(ligado.html).toBe(desligado.html);
    expect(desligado.chamadas).toBe(0);
  });

  it("nasce parado: a barra de tempo só corre depois de hidratar", () => {
    /* Sem o React ouvindo, o fim da barra não passaria o slide e o
       carrossel ficaria parado para sempre. */
    expect(classesDoCarrossel(html(DUAS_ARTES))).toContain(estilos.parado);
  });

  it("marca o bloco para a barra do pé e a auditoria, e mantém o rótulo", () => {
    const saida = html(DUAS_ARTES);
    expect(saida).toMatch(/<section[^>]*data-bloco="carrossel"/);
    expect(saida).toMatch(/<section[^>]*aria-label="Destaques da AMI"/);
  });

  it("a barra de tempo dura INTERVALO, passado ao CSS", () => {
    expect(html(DUAS_ARTES)).toMatch(/<section[^>]*style="--intervalo:6000ms"/);
  });
});

describe("a fita", () => {
  /* Um composto na ponta (o último), para a cópia dele, na posição 0,
     levar o link do botão: é o caso que exige `tabindex="-1"` no link do
     composto, não só no da arte. */
  const itens = [arte("a", { destino: "/a" }), arte("b"), composto("c")];
  const saida = html(itens);
  const fita = slides(saida);

  it("com 2+ itens, saem n + 2 slides: a cópia do último, os reais, a cópia do primeiro", () => {
    expect(fita).toHaveLength(5);
    expect(fita[0]).toContain('src="https://exemplo.test/c.jpg"');
    expect(fita[1]).toContain('src="https://exemplo.test/a.jpg"');
    expect(fita[2]).toContain('src="https://exemplo.test/b.jpg"');
    expect(fita[3]).toContain('src="https://exemplo.test/c.jpg"');
    expect(fita[4]).toContain('src="https://exemplo.test/a.jpg"');
  });

  it("as duas cópias ficam escondidas do leitor de tela e fora da ordem do Tab", () => {
    for (const copia of [fita[0], fita[4]]) {
      expect(abertura(copia)).toContain('aria-hidden="true"');
      const links = copia.match(/<a [^>]*>/g) ?? [];
      expect(links.length, "a cópia devia ter o link do original").toBeGreaterThan(0);
      for (const link of links) expect(link).toContain('tabindex="-1"');
    }
    /* A cópia do último é o composto: o link dele é o botão. */
    expect(fita[0]).toMatch(/<a tabindex="-1" data-botao=""/);
  });

  it("os reais não são cópia: nem aria-hidden, nem link fora do Tab", () => {
    for (const real of fita.slice(1, 4)) {
      expect(abertura(real)).not.toContain("aria-hidden");
      expect(real).not.toContain('tabindex="-1"');
    }
  });

  it("só o real da tela é alcançável; os outros reais ficam inertes", () => {
    expect(abertura(fita[1])).not.toContain("inert");
    expect(abertura(fita[2])).toContain('inert=""');
    expect(abertura(fita[3])).toContain('inert=""');
  });

  it("só o primeiro real nasce ativo (as animações de entrada dele já prontas)", () => {
    const ativos = fita.map((s) => abertura(s).includes(estilos.ativo));
    expect(ativos).toEqual([false, true, false, false, false]);
  });

  it("só a primeira imagem real tem prioridade alta; as outras, inclusive as cópias, baixa", () => {
    expect(fita[1]).toMatch(/<img [^>]*fetchPriority="high"/);
    for (const outro of [fita[0], fita[2], fita[3], fita[4]]) {
      expect(outro).toMatch(/<img [^>]*fetchPriority="low"/);
      expect(outro).not.toContain('fetchPriority="high"');
    }
  });

  it("nenhuma imagem do carrossel é preguiçosa: cortada pelo clip, ela só baixaria ao entrar", () => {
    const imagens = saida.match(/<img [^>]*>/g) ?? [];
    expect(imagens).toHaveLength(5);
    for (const img of imagens) expect(img).not.toContain("loading=");
    const comCelular = html([arte("a", celular("m")), composto("b"), arte("c")]);
    expect(comCelular).not.toContain("loading=");
  });

  it("com 1 item, sem controles e sem cópias", () => {
    const um = html([arte("so")]);
    expect(slides(um)).toHaveLength(1);
    expect(um).not.toContain("data-copia");
    expect(um).not.toContain("aria-hidden=\"true\" class");
    expect(um).not.toContain(estilos.controles);
    expect(um).not.toContain("Ir para o banner");
    expect(um).not.toContain('aria-label="Pausar"');
    expect(um).not.toContain("data-copias");
  });

  it("sem item, nada", () => {
    expect(html([])).toBe("");
  });
});

describe("os controles", () => {
  const saida = html([arte("a"), arte("b"), arte("c")]);

  it("uma bolinha por item real, não pelas cópias, e a primeira marcada", () => {
    expect(saida.match(/Ir para o banner \d de 3/g)).toEqual([
      "Ir para o banner 1 de 3",
      "Ir para o banner 2 de 3",
      "Ir para o banner 3 de 3",
    ]);
    expect(saida.match(/aria-current="true"/g)).toHaveLength(1);
    expect(saida).toMatch(/aria-label="Ir para o banner 1 de 3" aria-current="true"/);
  });

  it("anterior e próximo saem com a classe que o celular esconde", () => {
    expect(saida).toMatch(new RegExp(`aria-label="Anterior" class="${estilos.ctl} ${estilos.anterior}"`));
    expect(saida).toMatch(new RegExp(`aria-label="Próximo" class="${estilos.ctl} ${estilos.proximo}"`));
  });

  it("brancos sobre arte escura, escuros sobre arte clara", () => {
    expect(classesDoCarrossel(html([arte("a", { tema: "escuro" }), arte("b")]))).toContain(estilos.escuro);
    const clara = classesDoCarrossel(html([arte("a", { tema: "claro" }), arte("b")]));
    expect(clara).toContain(estilos.claro);
    expect(clara).not.toContain(estilos.escuro);
  });

  it("a moldura provisória é verde escura: controles brancos", () => {
    expect(classesDoCarrossel(html(BANNERS_PROVISORIOS))).toContain(estilos.escuro);
  });

  it("o slide com texto, no painel branco, não pede tema nenhum", () => {
    const classes = classesDoCarrossel(html([composto("a"), arte("b")]));
    expect(classes).not.toContain(estilos.escuro);
    expect(classes).not.toContain(estilos.claro);
  });
});

describe("o slide com foto e texto montado no site", () => {
  const saida = html([composto("a", { foco: { x: 0.25, y: 0.6 } }), arte("b")]);
  const real = slides(saida)[1];

  it("sai com rótulo, título, texto e o botão com o destino, marcado para os controles", () => {
    expect(real).toContain(">Associação Médica de Imperatriz</span>");
    expect(real).toContain(">Os médicos de Imperatriz, reunidos desde 1975</div>");
    expect(real).toContain("<p>A AMI representa os profissionais que atendem em Imperatriz.</p>");
    expect(real).toMatch(
      /<a data-botao="" class="botao [^"]*" href="\/associacao\/seja-associado">Seja associado/,
    );
  });

  it("o texto vem antes da foto, dentro do bloco que fica por cima dela no celular", () => {
    const anima = real.indexOf(`class="${estilos.anima}"`);
    const foto = real.indexOf(`class="${estilos.foto}"`);
    expect(anima).toBeGreaterThan(-1);
    expect(foto).toBeGreaterThan(anima);
    expect(real.slice(anima, foto)).toContain("data-botao");
  });

  it("a foto se recorta pelo ponto de interesse", () => {
    expect(real).toMatch(/<img src="https:\/\/exemplo.test\/a.jpg" [^>]*alt="Foto a"[^>]*style="object-position:25% 60%"/);
  });

  it("sem ponto de interesse, o centro (nenhum object-position)", () => {
    expect(slides(html([composto("a"), arte("b")]))[1]).not.toContain("object-position");
  });

  it("sem botão ou sem destino, nenhum botão", () => {
    expect(html([composto("a", { botao: null }), arte("b")])).not.toContain("data-botao");
    expect(html([composto("a", { destino: null }), arte("b")])).not.toContain("data-botao");
  });

  it("sem foto, a área dela vira moldura", () => {
    const sem = slides(html([composto("a", { foto: null }), arte("b")]))[1];
    expect(sem).toContain('role="img" aria-label="Foto a entrar"');
    expect(sem).not.toContain("<img");
    /* A tarja no alto: no celular, embaixo moram o texto e os controles. */
    expect(sem).toMatch(/class="[^"]* items-start!" role="img" aria-label="Foto a entrar"/);
  });
});

describe("o slide de arte pronta", () => {
  it("com versão de celular, sai <picture> com ela para até 700px", () => {
    const real = slides(
      html([arte("a", { ...celular("a-celular"), foco: { x: 0.1, y: 0.2 } }), arte("b")]),
    )[1];
    expect(real).toMatch(
      /<picture><source media="\(max-width: 700px\)" srcSet="https:\/\/exemplo.test\/a-celular-540.jpg 540w, https:\/\/exemplo.test\/a-celular.jpg 1080w"[^>]*\/><img src="https:\/\/exemplo.test\/a.jpg" [^>]*alt="Arte a"/,
    );
    /* A larga também é recortada no tablet (3:2): o ponto de interesse vale. */
    expect(real).toMatch(/<img src="https:\/\/exemplo.test\/a.jpg"[^>]*style="object-position:10% 20%"/);
  });

  it("sem versão de celular, a larga sozinha, recortada pelo ponto de interesse", () => {
    const real = slides(html([arte("a", { foco: { x: 0.75, y: 0.35 } }), arte("b")]))[1];
    expect(real).not.toContain("<source");
    expect(real).toMatch(/<img src="https:\/\/exemplo.test\/a.jpg"[^>]*style="object-position:75% 35%"/);
  });

  it("as medidas reservadas são as que o CDN entrega", () => {
    const real = slides(
      html([arte("a", celular("a-celular")), arte("b")]),
    )[1];
    expect(real).toContain(`width="${ARTE_CELULAR.largura}" height="${ARTE_CELULAR.altura}"`);
    expect(real).toContain(`width="${ARTE_LARGA.largura}" height="${ARTE_LARGA.altura}"`);
  });

  it("com destino, o slide inteiro é o link", () => {
    const real = slides(html([arte("a", { destino: "/busca" }), arte("b")]))[1];
    expect(real).toMatch(new RegExp(`^<div data-slide[^>]*><a class="${estilos.arteLink}" href="/busca"><picture>`));
  });

  it("sem destino, link nenhum", () => {
    expect(slides(html([arte("a"), arte("b")]))[1]).not.toContain("<a ");
  });
});

describe("o srcset e o sizes das imagens do carrossel", () => {
  /* Os atributos de uma tag, para conferir cada um pelo nome. */
  function atributos(tag: string): Record<string, string> {
    return Object.fromEntries([...tag.matchAll(/ ([a-zA-Z]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  }

  it("a arte larga leva o srcset dela e o sizes da largura desenhada", () => {
    const real = slides(html([arte("a"), arte("b")]))[1];
    const img = atributos(/<img [^>]*>/.exec(real)![0]);
    expect(img.srcSet).toBe("https://exemplo.test/a-800.jpg 800w, https://exemplo.test/a.jpg 3000w");
    expect(img.sizes).toBe(TAMANHO_DA_ARTE);
  });

  it("a arte de celular, que não é recortada, leva o sizes da caixa do celular", () => {
    const real = slides(html([arte("a", celular("a-celular")), arte("b")]))[1];
    const fonte = atributos(/<source [^>]*>/.exec(real)![0]);
    expect(fonte.srcSet).toBe("https://exemplo.test/a-celular-540.jpg 540w, https://exemplo.test/a-celular.jpg 1080w");
    expect(fonte.sizes).toBe(TAMANHO_DA_ARTE_CELULAR);
    expect(TAMANHO_DA_ARTE_CELULAR).toBe("calc(100vw - 24px)");
  });

  it("a foto do composto leva o srcset dela e o sizes da largura desenhada", () => {
    const real = slides(html([composto("a"), arte("b")]))[1];
    const img = atributos(/<img [^>]*>/.exec(real)![0]);
    expect(img.srcSet).toBe("https://exemplo.test/a-600.jpg 600w, https://exemplo.test/a.jpg 1600w");
    expect(img.sizes).toBe(TAMANHO_DA_FOTO);
  });
});

/*
  O `sizes` contra a largura desenhada, janela a janela.

  `valorDoSizes` faz o que o navegador faz com o atributo: pega a primeira
  condição `(min-width: Npx)` que vale para a janela (ou o último valor, sem
  condição) e resolve `Npx` ou `calc(A vw - B px)`. A largura desenhada vem de
  lib/carrossel.ts (`caixaDaArte`, `caixaDaFoto`, `larguraDesenhada`), que
  seguem o CSS do carrossel e batem com as caixas medidas no navegador (o
  último teste abaixo). O `sizes` não pode ficar abaixo do
  que é desenhado (o navegador baixaria um arquivo pequeno e esticaria) nem
  passar dele em mais de 8px.
*/
function valorDoSizes(sizes: string, janela: number): number {
  for (const parte of sizes.split(/,\s*(?![^()]*\))/)) {
    const m = /^\(min-width: (\d+)px\) (.+)$/.exec(parte.trim());
    if (m && janela < Number(m[1])) continue;
    const valor = (m ? m[2] : parte).trim();
    const px = /^(\d+(?:\.\d+)?)px$/.exec(valor);
    if (px) return Number(px[1]);
    const calc = /^calc\((\d+(?:\.\d+)?)vw - (\d+(?:\.\d+)?)px\)$/.exec(valor);
    if (calc) return (Number(calc[1]) * janela) / 100 - Number(calc[2]);
    throw new Error(`valor de sizes que o teste não entende: ${valor}`);
  }
  throw new Error(`nenhum valor de sizes para ${janela}px`);
}

describe("o sizes é a largura desenhada, de 320 a 1920px", () => {
  const JANELAS = Array.from({ length: 1920 - 320 + 1 }, (_, i) => 320 + i);

  function confere(sizes: string, desenhada: (janela: number) => number) {
    for (const janela of JANELAS) {
      const diz = valorDoSizes(sizes, janela);
      const real = desenhada(janela);
      expect(diz, `${janela}px: o sizes diz ${diz}, a imagem tem ${real}`).toBeGreaterThanOrEqual(real - 0.01);
      expect(diz - real, `${janela}px: o sizes passa ${diz - real}px da imagem`).toBeLessThanOrEqual(8);
    }
  }

  it("a arte larga, recortada pelo cover no tablet e no celular", () => {
    confere(TAMANHO_DA_ARTE, (j) => larguraDesenhada(caixaDaArte(j), PROPORCAO_DA_ARTE));
  });

  it("a arte de celular 4:5 na caixa 4/5 do celular: a própria caixa", () => {
    for (const j of JANELAS.filter((j) => j <= 700)) {
      const caixa = caixaDaArte(j);
      expect(larguraDesenhada(caixa, 4 / 5)).toBeCloseTo(caixa.largura, 6);
      expect(valorDoSizes(TAMANHO_DA_ARTE_CELULAR, j)).toBeCloseTo(caixa.largura, 6);
    }
  });

  it("a foto 3:2 do slide com texto, onde a altura manda", () => {
    confere(TAMANHO_DA_FOTO, (j) => larguraDesenhada(caixaDaFoto(j), PROPORCAO_DA_FOTO));
  });

  it("as caixas seguem as medidas do navegador", () => {
    /* Medidas no navegador, em produção: a arte 720 × 480 a 768px e
       366 × 457,5 a 390; a foto 549 × 412 a 1440, 426 × 309 a 1000,
       322 × 390 a 768 e 366 × 457,5 a 390. */
    expect(caixaDaArte(768)).toEqual({ largura: 720, altura: 480 });
    expect(caixaDaArte(390)).toEqual({ largura: 366, altura: 457.5 });
    const f = (j: number) => {
      const c = caixaDaFoto(j);
      return [Math.round(c.largura), Math.round(c.altura)];
    };
    expect(f(1440)).toEqual([549, 412]);
    expect(f(1000)).toEqual([426, 309]);
    expect(f(768)).toEqual([322, 390]);
    expect(f(390)).toEqual([366, 458]);
  });
});

describe("o slide provisório", () => {
  it("sai com a moldura 'Arte a entrar' cobrindo o slide, e o link do destino", () => {
    const real = slides(html(BANNERS_PROVISORIOS))[1];
    expect(real).toContain('href="/associacao/seja-associado"');
    expect(real).toContain(`class="${estilos.cobre}"`);
    expect(real).toContain('role="img" aria-label="Arte a entrar: Seja associado"');
    expect(real).toContain("Arte a entrar: <!-- -->Seja associado");
    /* A tarja no alto: embaixo moram os controles. */
    expect(real).toMatch(/class="[^"]* items-start!" role="img" aria-label="Arte a entrar: Seja associado"/);
  });
});

/*
  Ligação que só existe no navegador: os ouvintes nativos. Lidos do código,
  sem comentários, porque não há como disparar `pointerenter` com
  `pointerType` nem `touchend` sem navegador. O comportamento foi conferido
  à mão no navegador; aqui se trava que cada ouvinte é posto E tirado, e que
  mouse é só mouse.
*/
describe("os ouvintes do carrossel", () => {
  const codigo = semComentarios(fonte("../components/home/Carrossel.tsx"));

  /** O corpo de `const <nome> = (...) => { ... };`. */
  function corpo(nome: string): string {
    const ini = codigo.indexOf(`const ${nome} = (`);
    expect(ini, `falta ${nome}`).toBeGreaterThan(-1);
    return codigo.slice(ini, codigo.indexOf("\n    };", ini));
  }

  it("mouse em cima pausa só se for mouse de verdade, na entrada e na saída", () => {
    expect(corpo("aoEntrarPonteiro")).toMatch(/if \(e\.pointerType !== "mouse"\) return;/);
    expect(corpo("aoSairPonteiro")).toMatch(/if \(e\.pointerType !== "mouse"\) return;/);
  });

  it("o foco só pausa quando é visível", () => {
    expect(corpo("aoEntrarFoco")).toMatch(/\.matches\(":focus-visible"\)\) return;/);
  });

  it("a fita vai aonde movimentoAte manda, nunca a uma posição calculada à parte", () => {
    /* A conta (inclusive a cópia que faz o último→primeiro ir para a
       direita) está em lib/carrossel.ts e é testada lá; aqui se trava que
       `ir` a usa para mover a fita e marcar o slide que entra. */
    const ini = codigo.indexOf("function ir(destino: Destino) {");
    expect(ini, "falta function ir").toBeGreaterThan(-1);
    const ir = codigo.slice(ini, codigo.indexOf("\n  }\n", ini));
    expect(ir).toContain("const { posicao: alvo, animar } = movimentoAte(destino, semMovimento);");
    const movimentos = [...ir.matchAll(/mover\(([^,]+),/g)].map((m) => m[1]);
    expect(movimentos.length).toBeGreaterThan(0);
    for (const arg of movimentos) expect(arg).toBe("alvo");
    expect(ir).toContain("setEntrando(alvo);");
    expect(ir).not.toContain("posicaoNaFita");
    /* E todo passo passa por destinoDoPasso. */
    expect(codigo).toMatch(/function passo\([^)]*\) \{\s*ir\(destinoDoPasso\(de, direcao, n\)\);/);
    expect(codigo.match(/\bir\(/g)).toHaveLength(1 + 1); // a definição e a chamada em `passo`
  });

  it("o dedo troca pela regra de direcaoDoDedo", () => {
    expect(corpo("aoSoltar")).toMatch(/direcaoDoDedo\(dx, dy\)/);
  });

  it("cada ouvinte posto é tirado, com a mesma função", () => {
    const pares: [string, string][] = [
      ["pointerenter", "aoEntrarPonteiro"],
      ["pointerleave", "aoSairPonteiro"],
      ["focusin", "aoEntrarFoco"],
      ["focusout", "aoSairFoco"],
      ["touchstart", "aoTocar"],
      ["touchend", "aoSoltar"],
    ];
    for (const [evento, funcao] of pares) {
      expect(codigo).toContain(`el.addEventListener("${evento}", ${funcao}`);
      expect(codigo).toContain(`el.removeEventListener("${evento}", ${funcao})`);
    }
    expect(codigo).toContain('el.addEventListener("touchstart", aoTocar, { passive: true })');
    expect(codigo).toContain('el.addEventListener("touchend", aoSoltar, { passive: true })');
    expect(codigo).toContain('window.addEventListener("resize", aoRedimensionar)');
    expect(codigo).toContain('window.removeEventListener("resize", aoRedimensionar)');
  });
});

/* O CSS que decide o que se vê: lido do arquivo, porque só o navegador o
   aplica. */
describe("o CSS do carrossel", () => {
  const css = fonte("../components/home/Carrossel.module.css").replaceAll("\r\n", "\n");

  function regra(trecho: string, seletor: string): string {
    const ini = trecho.indexOf(`${seletor} {`);
    expect(ini, `falta a regra ${seletor}`).toBeGreaterThan(-1);
    return trecho.slice(ini, trecho.indexOf("}", ini));
  }

  function bloco(media: string): string {
    const ini = css.indexOf(`@media ${media} {`);
    expect(ini, `falta o @media ${media}`).toBeGreaterThan(-1);
    const proximo = css.indexOf("\n@media", ini + 1);
    return css.slice(ini, proximo === -1 ? undefined : proximo);
  }

  it("proporção fixa: 1192 / 512 no computador, 4 / 5 no celular", () => {
    expect(regra(css, "\n.slide")).toMatch(/aspect-ratio:\s*1192 \/ 512;/);
    expect(regra(bloco("(max-width: 700px)"), ".slide")).toMatch(/aspect-ratio:\s*4 \/ 5;/);
  });

  it("no tablet, 3 / 2: na proporção do computador o texto não cabia", () => {
    expect(regra(bloco("(min-width: 701px) and (max-width: 980px)"), ".slide")).toMatch(
      /aspect-ratio:\s*3 \/ 2;/,
    );
  });

  it("de 981 a 1040px, título e texto menores: na proporção do computador o texto não cabia", () => {
    /* Medido no navegador com os textos do desenho, de 10 em 10px: sem isto
       o slide com foto passava da proporção em até 44px a 981px. */
    const faixa = bloco("(min-width: 981px) and (max-width: 1040px)");
    expect(regra(faixa, ".titulo")).toMatch(/font-size:\s*38px;/);
    expect(regra(faixa, ".anima p")).toMatch(/font-size:\s*16px;/);
  });

  it("em slide claro, controle e bolinha têm 3:1 contra o branco (WCAG 1.4.11)", () => {
    /* A conta do WCAG: a cor composta sobre o fundo (cor × alfa + fundo ×
       (1 − alfa)) contra o fundo. O fundo é o branco do slide
       (`--color-surface`); a cor do controle é o token de app/globals.css. */
    const global = fonte("../app/globals.css");
    const hex = (token: string) => {
      const m = new RegExp(`--color-${token}:\\s*#([0-9a-fA-F]{6});`).exec(global);
      expect(m, `falta o token ${token}`).not.toBeNull();
      return [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16));
    };
    const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const razao = (a: number[], b: number[]) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const sobre = (cor: number[], alfa: number, fundo: number[]) => fundo.map((f, i) => f + alfa * (cor[i] - f));
    const rgba = (r: string) => {
      const m = /background:\s*rgba\((\d+), (\d+), (\d+), ([\d.]+)\);/.exec(r);
      expect(m, `sem rgba em ${r}`).not.toBeNull();
      return { cor: [+m![1], +m![2], +m![3]], alfa: +m![4] };
    };
    const branco = hex("surface");

    const ctl = regra(css, "\n.ctl");
    expect(ctl).toMatch(/color:\s*var\(--color-ink-400\);/);
    const opacidade = Number(/opacity:\s*([\d.]+);/.exec(ctl)?.[1]);
    expect(razao(sobre(hex("ink-400"), opacidade, branco), branco)).toBeGreaterThanOrEqual(3);

    const bolinha = rgba(regra(css, "\n.bolinha > span"));
    const trilho = sobre(bolinha.cor, bolinha.alfa, branco);
    expect(razao(trilho, branco)).toBeGreaterThanOrEqual(3);

    /* A barra que enche se separa da bolinha em que corre. */
    const barra = rgba(regra(css, "\n.bolinha.ativa > span::after"));
    expect(razao(sobre(barra.cor, barra.alfa, branco), trilho)).toBeGreaterThanOrEqual(3);
  });

  it("a bolinha tem alvo de toque de 24px no mínimo, também no celular", () => {
    expect(regra(css, "\n.bolinha")).toMatch(/min-width:\s*24px;/);
    expect(regra(css, "\n.bolinha")).toMatch(/height:\s*24px;/);
    /* Nenhuma regra posterior encolhe a bolinha. */
    for (const m of css.matchAll(/\.bolinha \{[^}]*\}/g)) {
      expect(m[0]).not.toMatch(/(?:min-)?width:\s*(?:[0-9]|1[0-9]|2[0-3])px/);
      expect(m[0]).not.toMatch(/height:\s*(?:[0-9]|1[0-9]|2[0-3])px/);
    }
  });

  it("no celular o texto fica por cima da foto (o defeito da foto que cobria o texto)", () => {
    expect(regra(bloco("(max-width: 700px)"), ".anima")).toMatch(/z-index:\s*2;/);
    expect(regra(bloco("(max-width: 700px)"), ".foto")).toMatch(/position:\s*absolute;/);
  });

  it("no celular, sem anterior e próximo", () => {
    expect(bloco("(max-width: 700px)")).toMatch(/\.anterior,\n\s*\.proximo \{\n\s*display: none;/);
  });

  it("a barra enche em --intervalo e congela quando parado", () => {
    expect(regra(css, ".bolinha.ativa > span::after")).toMatch(/animation:\s*progresso var\(--intervalo\) linear forwards;/);
    expect(regra(css, ".parado .bolinha.ativa > span::after")).toMatch(/animation-play-state:\s*paused;/);
  });

  it("a fita anda com a curva do desenho", () => {
    expect(regra(css, "\n.slides")).toMatch(/transition:\s*transform 0\.95s cubic-bezier\(0\.7, 0, 0\.2, 1\);/);
  });

  it("o texto do slide não pinta outro <p> do slide (a tarja lima da moldura)", () => {
    const seletoresDeP = [...css.matchAll(/^\s*([^{}\n]*\bp)\s*\{/gm)].map((m) => m[1].trim());
    expect(seletoresDeP.length, "a varredura não achou regra de <p>").toBeGreaterThan(0);
    for (const s of seletoresDeP) expect(s, `regra de <p> fora do texto: ${s}`).toMatch(/\.anima p$|\+ p$/);
  });

  it("o carrossel corta sem virar contêiner de rolagem", () => {
    expect(regra(css, "\n.carrossel")).toMatch(/overflow:\s*clip;/);
  });
});
