import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import estilosPagina from "@/app/(site)/encontre.module.css";
import { FaixaDaDiretoria } from "@/components/associacao/FaixaDaDiretoria";
import estilosFaixa from "@/components/associacao/FaixaDaDiretoria.module.css";
import { CartaoDiretor } from "@/components/diretorio/CartaoDiretor";
import estilosDiretor from "@/components/diretorio/CartaoDiretor.module.css";
import { SIZES_DO_CARTAO } from "@/components/diretorio/CartaoMedico";
import estilosCartao from "@/components/diretorio/CartaoMedico.module.css";
import { GradeDeDiretores } from "@/components/diretorio/GradeDeDiretores";
import estilosGrade from "@/components/diretorio/GradeMedicos.module.css";
import type { Diretor } from "@/lib/dados/diretoria";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe, topoSemAVolta } from "@/testes/renderizar";

/*
  A diretoria: o cartão de diretor, a grade, a faixa com a pílula do
  mandato e a página de verdade (app/(site)/associacao/diretoria/page.tsx),
  com a diretoria trocada por um dublê e as duas chaves de demonstração.
  Nomes e CRMs de mentira, os mesmos da diretoria de teste do banco.
*/

const dados = vi.hoisted(() => ({ diretoria: [] as Diretor[] }));

vi.mock("@/lib/dados/diretoria", () => ({ listarDiretoria: async () => dados.diretoria }));

afterEach(() => {
  vi.unstubAllEnvs();
  dados.diretoria = [];
});

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

function diretor(p: Partial<Diretor> = {}): Diretor {
  return {
    id: 1,
    nome: "Mayara Viana",
    cargo: "Presidente",
    ordem: 10,
    slugDoPerfil: "mayara-viana",
    crm: "10000",
    crmUf: "MA",
    medico: true,
    foto: null,
    ...p,
  };
}

const QUATRO = [
  diretor(),
  diretor({ id: 2, nome: "Rafael Coelho", cargo: "Vice-presidente", ordem: 20, slugDoPerfil: "rafael-coelho", crm: "10137" }),
  diretor({ id: 3, nome: "Larissa Nogueira", cargo: "Diretora científica", ordem: 30, slugDoPerfil: "larissa-nogueira", crm: "10274" }),
  diretor({ id: 4, nome: "Tiago Barbosa", cargo: "Tesoureiro", ordem: 40, slugDoPerfil: "tiago-barbosa", crm: "10411" }),
];

describe("o cartão de diretor", () => {
  const html = renderToString(createElement(CartaoDiretor, { diretor: diretor() }));

  it("é o cartão da busca, com a marca de diretor", () => {
    expect(html).toMatch(
      new RegExp(`^<li class="${estilosCartao.medico} ${estilosDiretor.diretor}" data-diretor="">`),
    );
    expect(html).not.toContain("data-sem-perfil");
  });

  it("sem foto, as iniciais no espaço da foto", () => {
    expect(html).toContain(`${estilosCartao.foto} ${estilosDiretor.foto}"`);
    expect(html).toContain(">MV</span>");
  });

  it("o cargo em cima do nome, o nome levando ao perfil, e MÉDICO · CRM/UF", () => {
    expect(html).toContain(
      `<div class="${estilosCartao.texto}"><p class="${estilosDiretor.cargo}">Presidente</p>` +
        `<h3 class="${estilosCartao.nome}"><a href="/medico/mayara-viana">Mayara Viana</a></h3>` +
        `<p class="${estilosCartao.crm}">MÉDICO · CRM/MA 10000</p></div>`,
    );
  });

  it("Ver perfil no lugar de Ligar: só desenha, fora do leitor de tela, porque o cartão inteiro é o link", () => {
    expect(html).toContain(
      `<span class="botao ${estilosCartao.ligar} ${estilosDiretor.verPerfil}" aria-hidden="true" data-ligar="">Ver perfil ${desenho(ArrowRight, 20, "regular")}</span>`,
    );
    expect(html).not.toContain("tel:");
    expect(html).not.toContain(">Ligar");
  });

  it("sem perfil publicado: sem link e sem botão, mas o espaço do botão fica", () => {
    const sem = renderToString(createElement(CartaoDiretor, { diretor: diretor({ slugDoPerfil: null }) }));
    expect(sem).toMatch(/^<li [^>]*data-sem-perfil=""/);
    expect(sem).not.toContain("<a ");
    expect(sem).toContain(`<h3 class="${estilosCartao.nome}">Mayara Viana</h3>`);
    expect(sem).not.toContain("Ver perfil");
    expect(sem).toContain(`<div class="${estilosCartao.semLigar}" aria-hidden="true" data-ligar=""></div>`);
  });

  it("quem não tem CRM (não é médico) fica sem a linha do CRM", () => {
    const contador = renderToString(
      createElement(CartaoDiretor, { diretor: diretor({ medico: false, crm: null, crmUf: null }) }),
    );
    expect(contador).not.toContain("CRM");
  });

  it("com foto: o retrato com a largura desenhada da grade da busca; logo ou só ao rolar", () => {
    const comFoto = (imediata: boolean) =>
      renderToString(createElement(CartaoDiretor, { diretor: diretor({ foto: "https://exemplo.test/m.jpg" }), imediata }));
    expect(comFoto(false)).toContain(`sizes="${SIZES_DO_CARTAO}"`);
    expect(comFoto(false)).toContain('loading="lazy"');
    expect(comFoto(true)).not.toContain('loading="lazy"');
    expect(comFoto(false)).toContain('alt=""');
  });
});

describe("a grade de diretores", () => {
  it("a grade da busca, um cartão por diretor, na ordem; os primeiros baixam a foto logo", () => {
    const seis = [1, 2, 3, 4, 5, 6].map((n) => diretor({ id: n, nome: `Diretor ${n}`, foto: `https://exemplo.test/${n}.jpg` }));
    const html = renderToString(createElement(GradeDeDiretores, { diretores: seis, imediatos: 4 }));
    /* As fotos que baixam logo ganham do React um <link rel="preload">
       solto, que o renderToString põe antes da grade. */
    expect(html).toMatch(new RegExp(`^(<link rel="preload" as="image"[^>]*/>){4}<ul class="${estilosGrade.grade}">`));
    expect(html.match(/data-diretor=""/g)).toHaveLength(6);
    expect(html.match(/loading="lazy"/g)).toHaveLength(2);
    expect([...html.matchAll(/>(Diretor \d)</g)].map((m) => m[1])).toEqual(seis.map((d) => d.nome));
  });
});

describe("a faixa da diretoria", () => {
  const demo = renderToString(createElement(FaixaDaDiretoria, { demonstracao: true }));
  const real = renderToString(createElement(FaixaDaDiretoria, { demonstracao: false }));

  it("a faixa curta: volta à associação, o título e a frase, sem ícone fora do link de volta", () => {
    for (const html of [demo, real]) {
      expect(/<a [^>]*href="\/associacao"/.test(html)).toBe(true);
      expect(html).toContain(">Diretoria da AMI</h1>");
      expect(html).toContain(">Quem responde pela associação. Cada nome traz o número de inscrição no CRM.</p>");
      expect(topoSemAVolta(html)).not.toContain("<svg");
    }
  });

  it("na demonstração, a pílula do mandato, como moldura, logo depois da frase, só com o texto", () => {
    expect(demo).toContain(
      `<p class="${estilosFaixa.pilula}" data-a-entrar="mandato">Gestão <em>(período a entrar)</em></p></div>`,
    );
  });

  it("fora dela, sem a pílula", () => {
    expect(real).not.toContain("data-a-entrar");
    expect(real).not.toContain("Gestão");
  });
});

async function pagina(chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const modulo = await import("@/app/(site)/associacao/diretoria/page");
  return { html: await htmlDe(await modulo.default()), metadata: modulo.metadata };
}

describe("a página da diretoria", () => {
  it("a faixa e a grade, no invólucro de coluna e ritmo, sem Cabeceira, trilha nem BreadcrumbList", async () => {
    dados.diretoria = QUATRO;
    const { html } = await pagina("true");
    expect(html).toMatch(new RegExp(`^<div class="${estilosPagina.pagina}"><section data-bloco="topo"`));
    expect([...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1])).toEqual(["topo", "diretoria"]);
    expect(html).toContain('<h2 id="membros-titulo" class="sr-only">Membros da diretoria</h2>');
    expect(html).not.toContain("Trilha de navegação");
    expect(html).not.toContain("-mt-32");
    expect(html).not.toContain("BreadcrumbList");
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("os quatro, na ordem, a presidência primeiro, todos do mesmo tamanho", async () => {
    dados.diretoria = QUATRO;
    const { html } = await pagina("false");
    expect([...html.matchAll(/class="[^"]*" data-diretor=""/g)]).toHaveLength(4);
    expect([...html.matchAll(/<p class="[^"]+">(Presidente|Vice-presidente|Diretora científica|Tesoureiro)<\/p>/g)].map((m) => m[1])).toEqual([
      "Presidente",
      "Vice-presidente",
      "Diretora científica",
      "Tesoureiro",
    ]);
  });

  it("com foto, os quatro da primeira fileira a baixam logo, e o quinto espera a rolagem", async () => {
    const cinco = [
      ...QUATRO,
      diretor({ id: 5, nome: "Camila Freitas", cargo: "Secretária", ordem: 50, slugDoPerfil: "camila-freitas", crm: "10548" }),
    ];
    dados.diretoria = cinco.map((d) => ({ ...d, foto: `https://exemplo.test/${d.id}.jpg` }));
    const { html } = await pagina("false");
    expect(html.match(/<img /g)).toHaveLength(5);
    expect(html.match(/loading="lazy"/g)).toHaveLength(1);
  });

  it("a grade fecha a página: o rodapé fica a --ritmo", async () => {
    dados.diretoria = QUATRO;
    const { html } = await pagina("true");
    expect(html).toMatch(/<\/ul><\/section><\/div>$/);
  });

  it("a pílula só na demonstração; nenhum PROVISÓRIO", async () => {
    dados.diretoria = QUATRO;
    expect((await pagina("true")).html).toContain('data-a-entrar="mandato"');
    const fora = (await pagina("false")).html;
    expect(fora).not.toContain("data-a-entrar");
    expect(fora).not.toContain("PROVISÓRIO");
  });

  it("sem diretoria cadastrada, o aviso de vazio no lugar da grade", async () => {
    const { html } = await pagina("false");
    expect(html).toContain("Diretoria ainda não cadastrada");
    expect(html).not.toContain("data-diretor");
  });

  it("os metadados continuam os de antes", async () => {
    const { metadata } = await pagina("true");
    expect(metadata.description).toBe(
      "Quem responde pela Associação Médica de Imperatriz, com cargo, nome e número de inscrição no CRM.",
    );
    expect(metadata.alternates).toEqual({ canonical: "/associacao/diretoria" });
  });
});

describe("o CSS do cartão de diretor", () => {
  const css = semNotas(fonte("../components/diretorio/CartaoDiretor.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("o cargo: rótulo verde pequeno, em caixa alta, 8px acima do nome", () => {
    const r = regra(base(css), ".cargo");
    expect(r).toMatch(/font-size: 12px;/);
    expect(r).toMatch(/text-transform: uppercase;/);
    expect(r).toMatch(/color: var\(--color-ami-green-600\);/);
    expect(r).toMatch(/margin-bottom: 8px;/);
    expect(regra(cel(), ".cargo")).toMatch(/font-size: 10\.5px;/);
  });

  it("Ver perfil não recebe o clique, e escurece quando o mouse está no cartão", () => {
    expect(regra(base(css), ".verPerfil")).toMatch(/pointer-events: none;/);
    expect(regra(base(css), ".diretor:hover .verPerfil")).toMatch(/#22751F 0%, #1A5E18 100%/);
  });

  it("sem perfil, o cartão não sobe nem amplia a foto, qualquer que seja a ordem das folhas", () => {
    expect(regra(base(css), ".diretor[data-sem-perfil]:hover")).toMatch(/transform: none;/);
    expect(regra(base(css), ".diretor[data-sem-perfil][data-diretor]:hover img")).toMatch(/transform: none;/);
  });

  it("no celular, o espaço da foto com 150px de altura mínima", () => {
    expect(regra(cel(), ".diretor .foto")).toMatch(/min-height: 150px;/);
  });
});

describe("o CSS da pílula do mandato", () => {
  const css = semNotas(fonte("../components/associacao/FaixaDaDiretoria.module.css"));

  it("tracejada em lima, com o texto claro do desenho", () => {
    const r = regra(base(css), ".pilula");
    expect(r).toMatch(/border: 1px dashed rgba\(168, 212, 112, 0\.5\);/);
    expect(r).toMatch(/color: #DDE7D6;/);
    expect(regra(base(css), ".pilula em")).toMatch(/color: #B9C6B2;/);
  });

  it("nenhuma regra para ícone dentro da pílula", () => {
    expect(css).not.toContain("svg");
  });
});
