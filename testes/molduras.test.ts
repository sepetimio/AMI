import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Fotografia } from "@/components/base/Fotografia";
import { UltimasNoticias } from "@/components/editorial/UltimasNoticias";
import { Carrossel } from "@/components/home/Carrossel";
import { EmpresasParceiras } from "@/components/home/EmpresasParceiras";
import { ServicosDaAmi } from "@/components/home/ServicosDaAmi";
import {
  BANNERS_PROVISORIOS,
  desenhoDaFotografia,
  moldurasDaHome,
} from "@/lib/molduras";
import type { Banner, ResumoNoticia } from "@/lib/sanity/tipos";

/* `UltimasNoticias` busca as notícias ela mesma. Aqui não há Sanity: este
   dublê devolve o que cada teste puser em `publicadas`. */
const sanity = vi.hoisted(() => ({ publicadas: [] as ResumoNoticia[] }));
vi.mock("@/lib/sanity/consultas", () => ({
  listarNoticias: async () => sanity.publicadas,
}));

const NOTICIA: ResumoNoticia = {
  titulo: "Assembleia geral ordinária",
  slug: "assembleia-geral",
  resumo: "A diretoria convoca os associados.",
  autor: { nome: "Fulano de Tal", crm: "1234", crmUf: "MA" },
  publicadoEm: "2026-09-30",
};

/** O bloco de notícias da home, com as notícias "publicadas" dadas. */
async function noticias(publicadas: ResumoNoticia[], provisorias?: boolean) {
  sanity.publicadas = publicadas;
  const elemento = await UltimasNoticias(
    provisorias === undefined ? {} : { provisorias },
  );
  return elemento ? renderToString(elemento) : "";
}

/*
  As molduras provisórias da home, medidas no HTML de servidor.

  Renderiza com `renderToString` pelo mesmo motivo de
  testes/porta-da-busca.test.ts: uma varredura de texto-fonte não distingue
  uma moldura viva de uma dentro de `{false && …}` (ver o topo de
  testes/home.test.ts). O que este arquivo NÃO vê está no relatório da
  tarefa e no fim deste arquivo.
*/

const REAL: Banner = {
  id: "real",
  nome: "Assembleia",
  imagem: "https://exemplo.test/assembleia.jpg",
  alt: "Assembleia geral no dia 12 de março, às 19h, na sede da AMI",
  destino: null,
  ordem: 10,
};

function html(elemento: ReturnType<typeof createElement>): string {
  return renderToString(elemento);
}

/** Quantas vezes `trecho` aparece em `texto`. */
function vezes(texto: string, trecho: string): number {
  return texto.split(trecho).length - 1;
}

describe("o carrossel com os três banners provisórios", () => {
  const saida = html(createElement(Carrossel, { banners: BANNERS_PROVISORIOS }));

  it("desenha as três molduras, nesta ordem, cada uma com o seu destino", () => {
    const ordem = [
      ["Arte a entrar: <!-- -->Seja associado", 'href="/associacao/seja-associado"'],
      ["Arte a entrar: <!-- -->Encontre um médico", 'href="/busca"'],
      ["Arte a entrar: <!-- -->Sua AMI", 'href="/contato"'],
    ];
    let desde = 0;
    for (const [legenda, destino] of ordem) {
      const link = saida.indexOf(destino, desde);
      const texto = saida.indexOf(legenda, desde);
      expect(link, `falta ${destino} depois da posição ${desde}`).toBeGreaterThanOrEqual(0);
      expect(texto, `falta "${legenda}" dentro de ${destino}`).toBeGreaterThan(link);
      desde = texto;
    }
  });

  it("na proporção da arte real, 3000 × 856, e sem <img>", () => {
    expect(vezes(saida, "aspect-ratio:3000 / 856")).toBe(3);
    expect(saida).not.toContain("<img");
  });

  it("gira como o real: setas, três bolinhas e pausa", () => {
    expect(saida).toContain(">Anterior<");
    expect(saida).toContain(">Próximo<");
    expect(saida).toContain(">Pausar<");
    expect(vezes(saida, "Ir para o banner ")).toBe(3);
  });

  it("um banner real continua saindo como <img>, sem moldura", () => {
    const real = html(createElement(Carrossel, { banners: [REAL] }));
    expect(real).toContain('<img src="https://exemplo.test/assembleia.jpg"');
    expect(real).not.toContain("a entrar");
  });
});

describe("o cartão provisório Sua AMI", () => {
  const props = { total: 24, especialidades: 9, ultimaNoticia: null };
  const com = html(createElement(ServicosDaAmi, { ...props, suaAmi: true }));
  const sem = html(createElement(ServicosDaAmi, props));

  /** O cartão inteiro, do `<a>` tracejado até o `</a>` dele. */
  function cartao(saida: string): string {
    const inicio = saida.lastIndexOf("<a", saida.indexOf("border-dashed"));
    return saida.slice(inicio, saida.indexOf("</a>", inicio) + 4);
  }

  it("é um link para /contato, com título, texto e ação aprovados", () => {
    const c = cartao(com);
    /* Sem depender da ordem dos atributos: o `Link` imprime `class` antes
       de `href`. */
    expect(c).toMatch(/^<a [^>]*href="\/contato"/);
    expect(c).toContain(">Sua AMI</h3>");
    expect(c).toContain("Auditório e hall de eventos da AMI para alugar.");
    expect(c).toContain("Consultar disponibilidade");
  });

  it("vem marcado como provisório", () => {
    expect(cartao(com)).toContain("Serviço a entrar");
  });

  it("não inventa preço, capacidade, metragem nem horário, e não tem foto", () => {
    const texto = cartao(com).replace(/<[^>]+>/g, " ");
    expect(texto, "número no cartão").not.toMatch(/\d/);
    expect(cartao(com)).not.toMatch(/<img|role="img"/);
  });

  /** As classes da grade dos cartões, inteiras. */
  function grade(saida: string): string {
    return /class="mt-6 grid gap-4 ([^"]*)"/.exec(saida)?.[1].trim() ?? "(sem grade)";
  }

  it("com ele, a grade passa a 2 por linha do tablet para cima, nunca 4", () => {
    /* Quatro lado a lado espremia o campo de busca para 128px a 1280 (226px
       com três) — medido, ver o comentário no componente. */
    expect(grade(com)).toBe("md:grid-cols-2");
  });

  it("sem ele, o cartão some e a grade volta a ser a de três", () => {
    expect(sem).not.toContain("Sua AMI");
    expect(sem).not.toContain("a entrar");
    expect(grade(sem)).toBe("md:grid-cols-3");
  });
});

describe("as três notícias provisórias", () => {
  it("sem notícia real e com provisorias, saem três cartões Notícia a entrar", async () => {
    const saida = await noticias([], true);
    expect(vezes(saida, ">Notícia a entrar</h3>")).toBe(3);
  });

  it("com a forma do cartão real: <li> com a caixa de capa de 160 × 112", async () => {
    const saida = await noticias([], true);
    expect(vezes(saida, "<li ")).toBe(3);
    expect(vezes(saida, "h-[112px]")).toBe(3);
    expect(vezes(saida, "sm:w-[160px]")).toBe(3);
  });

  it("não levam a lugar nenhum", async () => {
    const saida = await noticias([], true);
    /* O único link do bloco é o "Ver todas" do título. */
    const links = [...saida.matchAll(/<a [^>]*href="([^"]*)"/g)].map((m) => m[1]);
    expect(links).toEqual(["/noticias"]);
  });

  it("havendo uma notícia real, os provisórios somem todos", async () => {
    const saida = await noticias([NOTICIA], true);
    expect(saida).toContain("Assembleia geral ordinária");
    expect(saida).not.toContain("a entrar");
  });

  it("sem provisorias e sem notícia, o bloco não existe — o padrão de antes", async () => {
    expect(await noticias([], false)).toBe("");
    expect(await noticias([])).toBe("");
  });
});

describe("a faixa de empresas parceiras", () => {
  const saida = html(createElement(EmpresasParceiras));

  it("tem o título aprovado e seis espaços de logotipo", () => {
    expect(saida).toContain(">Empresas parceiras da AMI</h2>");
    expect(vezes(saida, ">Logotipo a entrar</p>")).toBe(6);
    expect(vezes(saida, 'role="img"')).toBe(6);
  });

  it("não escreve nome de empresa nenhuma", () => {
    /* Todo texto visível da faixa, tirado o HTML: só pode sobrar o título e
       as seis legendas. Qualquer outra palavra é um nome que alguém pôs. */
    const visivel = saida
      .replace(/<[^>]+>/g, "\n")
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    expect(visivel).toEqual([
      "Empresas parceiras da AMI",
      ...Array<string>(6).fill("Logotipo a entrar"),
    ]);
  });
});

/*
  A trava. É a parte que mais importa: nenhuma moldura "a entrar" pode
  chegar ao público no lançamento.

  `home()` liga a saída de `moldurasDaHome` aos quatro componentes, mais a
  fotografia provisória do bloco institucional, do jeito
  que app/(site)/page.tsx liga — a ligação de lá é conferida por texto-fonte
  em testes/home.test.ts, porque a página busca dados e não renderiza aqui.
*/
async function home(
  demonstracao: boolean,
  real: { banners: Banner[]; publicadas: ResumoNoticia[] },
) {
  const m = moldurasDaHome(demonstracao, {
    banners: real.banners,
    temNoticia: real.publicadas.length > 0,
  });
  return [
    html(createElement(Carrossel, { banners: m.banners })),
    html(
      createElement(ServicosDaAmi, {
        total: 24,
        especialidades: 9,
        ultimaNoticia: null,
        suaAmi: m.suaAmi,
      }),
    ),
    await noticias(real.publicadas, m.noticiasProvisorias),
    m.parceiros ? html(createElement(EmpresasParceiras)) : "",
    html(createElement(Fotografia, { espaco: "sede", demonstracao })),
  ].join("\n");
}

/* Uma marca de cada moldura. Se alguma sair, a trava vazou. */
const MARCAS = [
  "Arte a entrar",
  "Sua AMI",
  "Serviço a entrar",
  "Notícia a entrar",
  "Empresas parceiras da AMI",
  "Logotipo a entrar",
  "Fotografia a entrar",
];

describe("a trava", () => {
  it("com a chave falsa e sem conteúdo real, nenhuma moldura sai — nem a da foto", async () => {
    const saida = await home(false, { banners: [], publicadas: [] });
    for (const marca of MARCAS) {
      expect(saida, `"${marca}" saiu com a chave falsa`).not.toContain(marca);
    }
    /* E as seções sem conteúdo somem, como antes: carrossel e notícias não
       deixam nem a casca. */
    expect(saida).not.toContain("Destaques da AMI");
    expect(saida).not.toContain("Da associação");
  });

  it("com a chave falsa, nada provisório sai em nenhuma combinação de conteúdo", () => {
    for (const banners of [[], [REAL]]) {
      for (const temNoticia of [false, true]) {
        const m = moldurasDaHome(false, { banners, temNoticia });
        expect(m.banners).toEqual(banners);
        expect(m.suaAmi).toBe(false);
        expect(m.noticiasProvisorias).toBe(false);
        expect(m.parceiros).toBe(false);
      }
    }
  });

  it("com a chave verdadeira e sem conteúdo real, todas saem, a da foto também", async () => {
    /* O outro lado: sem ele, um teste que nunca mostra moldura nenhuma
       passaria o de cima de graça. */
    const saida = await home(true, { banners: [], publicadas: [] });
    for (const marca of MARCAS) {
      expect(saida, `"${marca}" não saiu com a chave verdadeira`).toContain(marca);
    }
  });

  it("um banner real tira os três provisórios, mesmo com a chave verdadeira", () => {
    const m = moldurasDaHome(true, { banners: [REAL], temNoticia: false });
    expect(m.banners).toEqual([REAL]);
  });

  it("uma notícia real tira as provisórias, mesmo com a chave verdadeira", () => {
    const m = moldurasDaHome(true, { banners: [], temNoticia: true });
    expect(m.noticiasProvisorias).toBe(false);
  });
});

describe("a fotografia provisória obedece a mesma trava", () => {
  it("a decisão: provisória só vira moldura com a chave verdadeira", () => {
    expect(desenhoDaFotografia(true, false)).toBe("nada");
    expect(desenhoDaFotografia(true, true)).toBe("moldura");
    /* Material real sai sempre, com ou sem demonstração. */
    expect(desenhoDaFotografia(false, false)).toBe("foto");
    expect(desenhoDaFotografia(false, true)).toBe("foto");
  });

  it("chave falsa + foto provisória = nada desenhado, nos dois espaços", () => {
    for (const espaco of ["sede", "cidade"] as const) {
      expect(html(createElement(Fotografia, { espaco, demonstracao: false }))).toBe("");
    }
  });

  it("chave verdadeira: a moldura de antes, na proporção da foto", () => {
    const saida = html(createElement(Fotografia, { espaco: "sede", demonstracao: true }));
    expect(saida).toContain("Fotografia a entrar: <!-- -->Fachada da sede da AMI");
    expect(saida).toContain("aspect-ratio:1280 / 960");
  });
});

/*
  O que este arquivo NÃO pega.

  - A página em si. `home()` acima refaz a ligação de app/(site)/page.tsx;
    se a página ligar diferente, isto continua verde. A ligação de lá é
    conferida por texto-fonte em testes/home.test.ts, que não distingue
    `{molduras.parceiros ? …}` de `{false && molduras.parceiros ? …}`.
  - O valor da chave em produção. `DADOS_DEMONSTRACAO` é `NEXT_PUBLIC_`, e o
    Next grava o valor no código durante `next build`: trocar a variável sem
    refazer a build não muda a home. O que este arquivo prova é a decisão
    dado o valor, não qual valor a build recebeu.
  - Nada visual: proporção na tela, quebra de linha da tarja, a largura
    do campo de busca na grade 2 × 2. HTML de servidor diz qual classe saiu, não o que ela faz.
  - O carrossel girando de verdade: temporizador, rolagem e pausa só
    acontecem no navegador.
*/
