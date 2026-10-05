import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRight, ArrowUpRight, Phone } from "@phosphor-icons/react/dist/ssr";
import estilosPagina from "@/app/(site)/encontre.module.css";
import { SIZES_DA_SEDE } from "@/components/associacao/QuemSomos";
import estilosQuem from "@/components/associacao/QuemSomos.module.css";
import { CanaisDeContato } from "@/components/contato/CanaisDeContato";
import estilos from "@/components/contato/Contato.module.css";
import { SedeDaAmi } from "@/components/contato/SedeDaAmi";
import estilosAssocie from "@/components/home/SejaAssociado.module.css";
import { linkDoMapaDaAmi } from "@/lib/ami";
import { canaisDeContato } from "@/lib/paginaDeContato";
import { tituloDePagina } from "@/lib/seo/metadados";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { topoSemAVolta } from "@/testes/renderizar";

/*
  O contato (/contato): os três canais, a sede com o fecho e a página de
  verdade, nas duas chaves de demonstração. Os dados são os de lib/ami.ts.

  A foto da sede é trocada por um dublê que mostra o que recebeu, como em
  testes/associacao-topo.test.ts: o desenho da moldura "Fotografia a
  entrar" (com o `data-a-entrar`) já é testado em testes/molduras.test.ts,
  e aqui interessa o que a sede pede a ela.

  A chave de demonstração é lida quando lib/demonstracao.ts é importado:
  cada caso da página troca a chave e importa a página de novo. A página
  é síncrona, como testes/caminhos-de-filiacao.test.ts espera.
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

afterEach(() => {
  vi.unstubAllEnvs();
});

const desenho = (Componente: Icon, size: number) =>
  renderToString(createElement(Componente, { size, weight: "regular", className: "", "aria-hidden": "true" }));

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** O `&` como o HTML o escreve dentro de um atributo. */
const atributo = (texto: string) => texto.replaceAll("&", "&amp;");

describe("os canais", () => {
  const html = renderToString(createElement(CanaisDeContato, { canais: canaisDeContato() }));
  const canais = [...html.matchAll(/<li class="[^"]*" data-canal="">[\s\S]*?<\/li>/g)].map((m) => m[0]);
  const botao = (canal: string) => /<a [^>]*>[\s\S]*?<\/a>/.exec(canal)![0];

  it("um bloco na caixa da página, com o título para quem navega por cabeçalhos, e três cartões", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="canais" aria-labelledby="canais-titulo"><h2 id="canais-titulo" class="sr-only">Canais de contato</h2><ul class="${estilos.canais}" role="list">`,
      ),
    );
    expect(canais).toHaveLength(3);
  });

  it("o telefone da sede: o rótulo abre o cartão, depois o número, a frase e Ligar", () => {
    expect(canais[0]).toContain(
      `<li class="${estilos.canal}" data-canal="">` +
        `<p class="${estilos.rotulo}" data-rotulo="">Telefone da sede</p>` +
        `<p class="${estilos.dado}" data-dado="">(99) 3524-3716</p>` +
        `<p class="${estilos.nota}">Linha fixa, na sede da AMI.</p><div class="${estilos.acao}" data-acao="">`,
    );
    const a = botao(canais[0]);
    expect(a).toContain('class="botao"');
    expect(a).toContain('href="tel:+559935243716"');
    expect(a).toContain('aria-label="Ligar para a sede da AMI, (99) 3524-3716"');
    expect(a).toContain(desenho(Phone, 20));
    expect(tela(a)).toBe("Ligar");
  });

  it("o celular: o rótulo abre o cartão, e Ligar com o telefone", () => {
    expect(canais[1].startsWith(
      `<li class="${estilos.canal}" data-canal=""><p class="${estilos.rotulo}" data-rotulo="">Celular</p>` +
        `<p class="${estilos.dado}" data-dado="">(99) 98802-0205</p>`,
    )).toBe(true);
    const a = botao(canais[1]);
    expect(a).toContain(desenho(Phone, 20));
    expect(a).toContain('href="tel:+5599988020205"');
    expect(a).toContain('aria-label="Ligar para o celular da AMI, (99) 98802-0205"');
  });

  it("o Instagram: o perfil em letra menor, e Abrir o Instagram na mesma aba", () => {
    expect(canais[2].startsWith(
      `<li class="${estilos.canal}" data-canal=""><p class="${estilos.rotulo}" data-rotulo="">Instagram</p>`,
    )).toBe(true);
    expect(canais[2]).toContain(
      `<p class="${estilos.dado} ${estilos.longo}" data-dado="">@associacaomedicadeimperatriz</p>`,
    );
    const a = botao(canais[2]);
    expect(a).toContain('class="botao-contorno"');
    expect(a).toContain('href="https://www.instagram.com/associacaomedicadeimperatriz/"');
    expect(a).toContain('aria-label="Abrir o Instagram da AMI"');
    expect(a).toContain(desenho(ArrowUpRight, 20));
    expect(a).not.toContain("target=");
    expect(tela(a)).toBe("Abrir o Instagram");
  });

  it("nenhum ladrilho: o único ícone de cada canal é o do botão", () => {
    expect(html).not.toContain("ladrilho-icone");
    for (const [i, c] of canais.entries()) {
      expect(c.match(/<svg/g), `canal ${i + 1}`).toHaveLength(1);
      expect(botao(c), `canal ${i + 1}`).toContain("<svg");
    }
  });

  it("sem e-mail, sem WhatsApp e sem formulário", () => {
    expect(html).not.toMatch(/mailto|whatsapp|wa\.me|<form/i);
  });
});

describe("a sede, na demonstração", () => {
  const html = renderToString(createElement(SedeDaAmi, { demonstracao: true }));

  it("faixa branca de ponta a ponta, que entra ao rolar, com o texto e a foto lado a lado", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="sede" data-faixa="" aria-labelledby="sede-titulo" class="revelar ${estilosAssocie.faixa} ${estilos.sedeDoContato}">` +
          `<div class="${estilosAssocie.duplo} ${estilosAssocie.comFoto}"><div class="${estilosAssocie.corpo} ${estilosQuem.corpo} ${estilos.corpo}">`,
      ),
    );
  });

  it("SEDE na coluna do texto, Onde fica a AMI e a frase", () => {
    expect(html).toContain(
      `<span class="rotulo-secao" data-coluna="">Sede</span>` +
        `<h2 id="sede-titulo" class="${estilosAssocie.titulo}">Onde fica a AMI</h2>` +
        `<p class="${estilos.texto}">No Centro de Imperatriz, na Rua Coriolano Milhomem.</p>`,
    );
  });

  it("o quadro do endereço, sem ladrilho: o nome, o endereço em três linhas e o CNPJ", () => {
    expect(html).toContain(
      `<div class="${estilosQuem.sede}">` +
        `<div><h3 class="${estilosQuem.sedeTitulo}">Associação Médica de Imperatriz</h3>` +
        `<address class="${estilosQuem.endereco}">Rua Coriolano Milhomem, 39<br/>Centro, Imperatriz – MA<br/>CEP <span class="numero-tabular">65900-330</span></address>` +
        `<p class="${estilos.cnpj}">CNPJ 06.651.376/0001-42</p></div>`,
    );
  });

  it("Como chegar abre o Google Maps na mesma aba, como em Quem somos, com o texto visível no rótulo", () => {
    expect(html).toContain(`<div class="${estilosQuem.acoes} ${estilos.acoes}"><a class="botao" `);
    const a = /<a class="botao" [^>]*>[\s\S]*?<\/a>/.exec(html)![0];
    expect(a).toContain(`href="${atributo(linkDoMapaDaAmi())}"`);
    expect(a).not.toContain("target=");
    expect(a).toContain('aria-label="Como chegar à sede da AMI (abre o mapa)"');
    expect(a).toContain(desenho(ArrowUpRight, 20));
    expect(a).not.toContain("nova aba");
    expect(tela(a)).toBe("Como chegar");
  });

  it("o horário como moldura, sem ladrilho: o título e a frase a entrar", () => {
    expect(html).toContain(
      `<div class="${estilosQuem.sede} ${estilos.horario}" data-a-entrar="horário de atendimento">` +
        `<h3 class="${estilosQuem.sedeTitulo}">Horário de atendimento</h3>` +
        `<p class="${estilos.falta}">Horário de atendimento da sede a entrar.</p></div>`,
    );
  });

  it("à direita, a foto da sede, com a largura desenhada de Quem somos", () => {
    expect(html).toContain(
      `<div class="${estilosAssocie.foto}"><span data-fotografia="sede" data-sizes="${SIZES_DA_SEDE}" data-demonstracao="true" class="${estilosAssocie.fotografia}"></span></div>`,
    );
  });

  it("nenhum ladrilho: os únicos ícones são os de Como chegar e Seja associado", () => {
    expect(html).not.toContain("ladrilho-icone");
    expect(html.match(/<svg/g)).toHaveLength(2);
    expect(html.match(/<a [^>]*>[^<]*<svg/g)).toHaveLength(2);
  });

  it("depois do fio, o fecho, sem ladrilho: Médico interessado em se associar? e Seja associado", () => {
    expect(html).toContain(
      `<div class="${estilos.separa}" aria-hidden="true"></div>` +
        `<div class="${estilos.fecho}" data-coluna="">` +
        `<p><strong>Médico interessado em se associar?</strong> A página Seja associado diz quem pode se associar e como fazer isso.</p>` +
        `<a class="botao-contorno" href="/associacao/seja-associado">Seja associado ${desenho(ArrowRight, 20)}</a></div></section>`,
    );
  });
});

describe("a sede, fora da demonstração", () => {
  const html = renderToString(createElement(SedeDaAmi, { demonstracao: false }));

  it("sem a foto: duas colunas de texto, com o título preso no alto", () => {
    expect(html).toContain(
      `<div class="${estilosAssocie.duplo}"><div class="${estilosAssocie.corpo} ${estilosQuem.corpo} ${estilosQuem.semFoto} ${estilos.corpo}" data-sem-foto="">`,
    );
    expect(html).not.toContain("data-fotografia");
  });

  it("sem nenhuma moldura: nem o horário", () => {
    expect(html).not.toContain("data-a-entrar");
    expect(html).not.toContain("a entrar");
    expect(html).not.toContain("Horário");
  });

  it("nenhum ladrilho: os únicos ícones são os de Como chegar e Seja associado", () => {
    expect(html).not.toContain("ladrilho-icone");
    expect(html.match(/<svg/g)).toHaveLength(2);
    expect(html.match(/<a [^>]*>[^<]*<svg/g)).toHaveLength(2);
  });

  it("o endereço, o CNPJ, Como chegar e o fecho ficam", () => {
    expect(html).toContain("Rua Coriolano Milhomem, 39");
    expect(html).toContain("CNPJ 06.651.376/0001-42");
    expect(html).toContain(`href="${atributo(linkDoMapaDaAmi())}"`);
    expect(html).toContain('href="/associacao/seja-associado"');
  });
});

async function pagina(chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const modulo = await import("@/app/(site)/contato/page");
  return { html: renderToString(modulo.default()), modulo };
}

const blocos = (html: string) => [...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);

describe("a página /contato", () => {
  it("a faixa curta, os canais e a sede, no invólucro de coluna e ritmo, nas duas chaves", async () => {
    for (const chave of ["true", "false"]) {
      const { html } = await pagina(chave);
      expect(html, chave).toMatch(new RegExp(`^<div class="${estilosPagina.pagina}"><section data-bloco="topo"`));
      expect(blocos(html), chave).toEqual(["topo", "canais", "sede"]);
      expect(html.match(/<h1\b/g), chave).toHaveLength(1);
    }
  });

  it("a faixa: CONTATO, Fale com a AMI e a frase, sem ícone", async () => {
    const { html } = await pagina("true");
    expect(html).toContain('data-coluna="">Contato</span>');
    expect(html).toContain(">Fale com a AMI</h1>");
    expect(html).toContain(">Pelo telefone, pelo Instagram ou na sede, no Centro de Imperatriz.</p>");
    for (const chave of ["true", "false"]) {
      expect(topoSemAVolta((await pagina(chave)).html), chave).not.toContain("<svg");
    }
  });

  it("os únicos svg da página são os dos cinco botões e links: Ligar, Ligar, Abrir o Instagram, Como chegar e Seja associado", async () => {
    for (const chave of ["true", "false"]) {
      const { html } = await pagina(chave);
      const emLink = [...html.matchAll(/<a [^>]*>[\s\S]*?<\/a>/g)].reduce((n, m) => n + (m[0].match(/<svg/g)?.length ?? 0), 0);
      expect(html.match(/<svg/g), chave).toHaveLength(5);
      expect(emLink, chave).toBe(5);
    }
  });

  it("a sede fecha a página e é faixa: o rodapé emenda nela", async () => {
    for (const chave of ["true", "false"]) {
      expect((await pagina(chave)).html, chave).toMatch(/<section data-bloco="sede" data-faixa=""[\s\S]*<\/section><\/div>$/);
    }
  });

  it("o horário e a foto só na demonstração", async () => {
    const demo = (await pagina("true")).html;
    expect(demo).toContain('data-a-entrar="horário de atendimento"');
    expect(demo).toContain('data-fotografia="sede"');
    const fora = (await pagina("false")).html;
    expect(fora).not.toContain("data-a-entrar");
    expect(fora).not.toContain("data-fotografia");
  });

  it("nenhum link abre outra aba, e todo rótulo de botão contém, em sequência, o texto que está nele", async () => {
    const { html } = await pagina("true");
    expect(html).not.toContain("target=");
    const comRotulo = [...html.matchAll(/<a [^>]*aria-label="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
    expect(comRotulo.length).toBeGreaterThanOrEqual(4);
    for (const [, rotulo, conteudo] of comRotulo) {
      expect(rotulo, rotulo).toContain(tela(conteudo));
    }
  });

  it("sem JSON-LD, Cabeceira, trilha, BreadcrumbList ou PROVISÓRIO", async () => {
    for (const chave of ["true", "false"]) {
      const { html } = await pagina(chave);
      expect(html, chave).not.toContain("application/ld+json");
      expect(html, chave).not.toContain("Trilha de navegação");
      expect(html, chave).not.toContain("-mt-32");
      expect(html, chave).not.toContain("BreadcrumbList");
      expect(html, chave).not.toContain("PROVISÓRIO");
    }
  });

  it("os metadados continuam os de antes", async () => {
    const { modulo } = await pagina("true");
    const m = await modulo.generateMetadata();
    expect(m.title).toBe(tituloDePagina("Fale com a AMI"));
    expect(m.description).toBe("Endereço, telefone e Instagram da Associação Médica de Imperatriz.");
    expect(m.alternates).toEqual({ canonical: "/contato" });
  });

  it("refeita de hora em hora (revalidate de 3600s)", async () => {
    const { modulo } = await pagina("true");
    expect(modulo.revalidate).toBe(3600);
  });
});

describe("o CSS do contato", () => {
  const css = semNotas(fonte("../components/contato/Contato.module.css"));
  const tablet = () => bloco(css, "@media (min-width: 701px) and (max-width: 980px)");
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("três cartões brancos lado a lado, com o botão no pé", () => {
    expect(regra(base(css), ".canais")).toMatch(/grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
    expect(regra(base(css), ".canal")).toMatch(/background: var\(--color-surface\);/);
    expect(regra(base(css), ".canal")).toMatch(/border-radius: 18px;/);
    expect(regra(base(css), ".acao")).toMatch(/margin-top: auto;/);
  });

  it("o número grande na letra dos títulos, sem quebrar; o perfil do Instagram menor, e pode quebrar", () => {
    const dado = regra(base(css), ".dado");
    expect(dado).toMatch(/font-family: var\(--font-titulo\);/);
    expect(dado).toMatch(/font-size: 32px;/);
    expect(dado).toMatch(/white-space: nowrap;/);
    const longo = regra(base(css), ".dado.longo");
    expect(longo).toMatch(/font-size: 20px;/);
    expect(longo).toMatch(/white-space: normal;/);
    expect(longo).toMatch(/overflow-wrap: anywhere;/);
  });

  it("no tablet, cada canal vira uma linha: o texto na borda esquerda e o botão à direita", () => {
    expect(regra(tablet(), ".canais")).toMatch(/grid-template-columns: 1fr;/);
    expect(regra(tablet(), ".canal")).toMatch(/grid-template-columns: minmax\(0, 1fr\) auto;/);
    for (const seletor of [".rotulo", ".dado", ".nota"])
      expect(regra(tablet(), seletor), seletor).toMatch(/grid-column: 1;/);
    expect(regra(tablet(), ".acao")).toMatch(/grid-column: 2;/);
  });

  it("no celular, uma coluna só: o texto e, embaixo, o botão na largura toda, sem a frase de apoio", () => {
    expect(regra(cel(), ".canal")).toMatch(/grid-template-columns: minmax\(0, 1fr\);/);
    expect(cel()).not.toContain("grid-column: 2");
    expect(regra(cel(), ".acao > a")).toMatch(/width: 100%;/);
    expect(regra(cel(), ".nota")).toMatch(/display: none;/);
  });

  it("sem ladrilho: nenhuma regra dele nem coluna para ele; o rótulo abre o cartão, sem espaço em cima", () => {
    expect(css).not.toContain("ladrilho");
    expect(css).not.toMatch(/52px|44px|40px minmax/);
    expect(regra(base(css), ".rotulo")).not.toMatch(/margin/);
  });

  it("sem a foto, o título fica no alto, valendo sobre a regra de Quem somos", () => {
    const r = regra(base(css), ".sedeDoContato .corpo[data-sem-foto]");
    expect(r).toMatch(/grid-template-rows: auto auto 1fr;/);
    expect(r).toMatch(/align-items: start;/);
  });

  it("os parágrafos quebram com o text-wrap: pretty do desenho, sem palavra sozinha no fim", () => {
    for (const seletor of [".nota", ".sedeDoContato .texto", ".falta", ".fecho p"])
      expect(regra(base(css), seletor), seletor).toMatch(/text-wrap: pretty;/);
  });

  it("o horário a entrar: cinza e em itálico", () => {
    const r = regra(base(css), ".falta");
    expect(r).toMatch(/color: var\(--color-ink-400\);/);
    expect(r).toMatch(/font-style: italic;/);
  });

  it("o fio antes do fecho: 72px, 48px do tablet para baixo", () => {
    expect(regra(base(css), ".separa")).toMatch(/margin: 72px 0;/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".separa")).toMatch(/margin: 48px 0;/);
  });

  it("o fecho: a frase na borda esquerda e o botão à direita; no celular, o botão na largura toda embaixo", () => {
    expect(regra(base(css), ".fecho")).toMatch(/grid-template-columns: minmax\(0, 1fr\) auto;/);
    expect(regra(cel(), ".fecho")).toMatch(/grid-template-columns: minmax\(0, 1fr\);/);
    expect(regra(cel(), ".fecho > a")).toMatch(/width: 100%;/);
  });
});
