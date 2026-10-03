import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Carrossel } from "@/components/home/Carrossel";
import estilos from "@/components/home/Carrossel.module.css";
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
  barra de tempo) foi conferido no navegador e está no relatório da tarefa
  6; o que dá para medir sem ele está em testes/fita-do-carrossel.test.ts.
*/

function arte(id: string, extra: Partial<BannerArte> = {}): BannerArte {
  return {
    tipo: "arte",
    id,
    nome: id,
    imagem: `https://exemplo.test/${id}.jpg`,
    alt: `Arte ${id}`,
    imagemCelular: null,
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
    const comCelular = html([arte("a", { imagemCelular: "https://exemplo.test/m.jpg" }), composto("b"), arte("c")]);
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
    expect(real).toMatch(/<img src="https:\/\/exemplo.test\/a.jpg" alt="Foto a"[^>]*style="object-position:25% 60%"/);
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
      html([arte("a", { imagemCelular: "https://exemplo.test/a-celular.jpg", foco: { x: 0.1, y: 0.2 } }), arte("b")]),
    )[1];
    expect(real).toMatch(
      /<picture><source media="\(max-width: 700px\)" srcSet="https:\/\/exemplo.test\/a-celular.jpg"[^>]*\/><img src="https:\/\/exemplo.test\/a.jpg" alt="Arte a"/,
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
      html([arte("a", { imagemCelular: "https://exemplo.test/a-celular.jpg" }), arte("b")]),
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
  no navegador (relatório da tarefa 6); aqui se trava que cada ouvinte é
  posto E tirado, e que mouse é só mouse.
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
