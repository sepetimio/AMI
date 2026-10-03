import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Fotografia } from "@/components/base/Fotografia";
import { UltimasNoticias } from "@/components/editorial/UltimasNoticias";
import { Carrossel } from "@/components/home/Carrossel";
import { BairrosEParceiros } from "@/components/home/BairrosEParceiros";
import { SejaAssociado } from "@/components/home/SejaAssociado";
import { SuaAmi } from "@/components/home/SuaAmi";
import { ESPACOS, espacosProvisorios, type NomeEspaco } from "@/lib/imagens";
import {
  BANNERS_PROVISORIOS,
  desenhoDaFotografia,
  moldurasDaHome,
  quemEhAmi,
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
  tipo: "arte",
  id: "real",
  nome: "Assembleia",
  imagem: "https://exemplo.test/assembleia.jpg",
  imagemSrcset: "https://exemplo.test/assembleia.jpg 3000w",
  alt: "Assembleia geral no dia 12 de março, às 19h, na sede da AMI",
  imagemCelular: null,
  imagemCelularSrcset: null,
  tema: "escuro",
  foco: null,
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
  const saida = html(createElement(Carrossel, { itens: BANNERS_PROVISORIOS }));

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

  it("cobre o slide inteiro, na proporção do slide do computador (1192 × 512), e sem <img>", () => {
    /* Cinco: os três reais mais as duas cópias das pontas da fita
       (lib/carrossel.ts), que repetem o último e o primeiro. */
    expect(vezes(saida, "aspect-ratio:1192 / 512")).toBe(5);
    expect(saida).not.toContain("<img");
  });

  it("gira como o real: setas, três bolinhas e pausa", () => {
    expect(saida).toContain('aria-label="Anterior"');
    expect(saida).toContain('aria-label="Próximo"');
    expect(saida).toContain('aria-label="Pausar"');
    expect(vezes(saida, "Ir para o banner ")).toBe(3);
  });

  it("um banner real continua saindo como <img>, sem moldura", () => {
    const real = html(createElement(Carrossel, { itens: [REAL] }));
    expect(real).toContain('<img src="https://exemplo.test/assembleia.jpg"');
    expect(real).not.toContain("a entrar");
  });
});

/* O bloco "Sua AMI" (que substituiu o cartão provisório de mesmo nome) é
   medido em testes/sua-ami-e-associe.test.ts: o texto visível inteiro,
   sem número nenhum, e nada fora da demonstração. */

describe("as quatro notícias provisórias", () => {
  it("sem notícia real e com provisorias, saem quatro peças Notícia a entrar", async () => {
    const saida = await noticias([], true);
    expect(vezes(saida, ">Notícia a entrar</h3>")).toBe(4);
  });

  it("na forma do desenho: o destaque e três na lista, cada uma com a moldura no lugar da capa", async () => {
    /* A forma em detalhe (destaque, lista, divisórias) está em
       testes/noticias-da-home.test.ts. */
    const saida = await noticias([], true);
    expect(vezes(saida, "<article")).toBe(4);
    expect(vezes(saida, 'aria-label="Espaço reservado para a capa de uma notícia"')).toBe(4);
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

describe("a parte de empresas parceiras", () => {
  const saida = html(
    createElement(BairrosEParceiros, {
      bairros: [{ nome: "Centro", slug: "centro", total: 8 }],
      parceiros: true,
    }),
  );
  const parte = saida.slice(saida.indexOf('<section id="parceiros"'));

  it("tem o rótulo e o título aprovados e seis espaços de logotipo", () => {
    expect(parte).toContain(">Empresas parceiras da AMI</span>");
    expect(parte).toContain(">Quem caminha com a AMI</h2>");
    expect(vezes(parte, ">Logotipo a entrar</li>")).toBe(6);
  });

  it("não escreve nome de empresa nenhuma", () => {
    /* Todo texto visível da parte, tirado o HTML: só pode sobrar o rótulo,
       o título e as seis legendas. Qualquer outra palavra é um nome que
       alguém pôs. A grade (seis, três e três) está no CSS, conferida em
       testes/noticias-da-home.test.ts. */
    const visivel = parte
      .replace(/<[^>]+>/g, "\n")
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    expect(visivel).toEqual([
      "Empresas parceiras da AMI",
      "Quem caminha com a AMI",
      ...Array<string>(6).fill("Logotipo a entrar"),
    ]);
  });
});

/*
  A trava. É a parte que mais importa: nenhuma moldura "a entrar" pode
  chegar ao público no lançamento.

  `home()` liga a saída de `moldurasDaHome` ao carrossel, às notícias e aos
  parceiros (dentro da faixa dos bairros), e a chave a "Sua AMI" e a "Seja
  associado", que decidem sozinhos, do jeito que app/(site)/page.tsx liga. A
  página de verdade, com as mesmas peças, é renderizada em
  testes/home-renderizada.test.ts.
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
    html(createElement(Carrossel, { itens: m.banners })),
    html(createElement(SuaAmi, { demonstracao })),
    html(
      createElement(SejaAssociado, {
        demonstracao,
        texto: { missao: null, visao: null, valores: null },
      }),
    ),
    await noticias(real.publicadas, m.noticiasProvisorias),
    html(
      createElement(BairrosEParceiros, {
        bairros: [{ nome: "Centro", slug: "centro", total: 8 }],
        parceiros: m.parceiros,
      }),
    ),
  ].join("\n");
}

/* Uma marca de cada moldura. Se alguma sair, a trava vazou. */
const MARCAS = [
  "Arte a entrar",
  "Sua AMI",
  "Texto da AMI a entrar",
  "Notícia a entrar",
  "Empresas parceiras da AMI",
  "Logotipo a entrar",
  "Fotografia a entrar",
];

/* Um slide de foto com texto, sem a foto ainda. */
const COMPOSTO_SEM_FOTO: Banner = {
  tipo: "composto",
  id: "composto",
  nome: "Os médicos de Imperatriz",
  foto: null,
  fotoSrcset: null,
  foco: null,
  fotoAlt: "",
  rotulo: null,
  titulo: "Os médicos de Imperatriz",
  texto: null,
  botao: null,
  destino: "/busca",
  ordem: 20,
};

const COMPOSTO_COM_FOTO: Banner = {
  ...COMPOSTO_SEM_FOTO,
  id: "composto-com-foto",
  foto: "https://exemplo.test/medicos.jpg",
  fotoSrcset: "https://exemplo.test/medicos.jpg 1600w",
  fotoAlt: "Médicos reunidos no auditório da AMI",
};

describe("a trava", () => {
  it("com a chave falsa e sem conteúdo real, nenhuma moldura sai — nem a da foto", async () => {
    const saida = await home(false, { banners: [], publicadas: [] });
    for (const marca of MARCAS) {
      expect(saida, `"${marca}" saiu com a chave falsa`).not.toContain(marca);
    }
    /* E as seções sem conteúdo somem, como antes: carrossel e notícias não
       deixam nem a casca. */
    expect(saida).not.toContain("Destaques da AMI");
    expect(saida).not.toContain("Fique por dentro da AMI");
  });

  it("com a chave falsa, nada provisório sai em nenhuma combinação de conteúdo", () => {
    for (const banners of [[], [REAL]]) {
      for (const temNoticia of [false, true]) {
        const m = moldurasDaHome(false, { banners, temNoticia });
        expect(m.banners).toEqual(banners);
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

  it("os três provisórios são do tipo provisorio, e um banner real nunca é", () => {
    expect(BANNERS_PROVISORIOS.map((b) => b.tipo)).toEqual([
      "provisorio",
      "provisorio",
      "provisorio",
    ]);
    expect(REAL.tipo).toBe("arte");
  });

  it("um banner com foto e texto também conta como real: tira os provisórios", () => {
    const m = moldurasDaHome(true, { banners: [REAL, COMPOSTO_SEM_FOTO], temNoticia: false });
    expect(m.banners).toEqual([REAL, COMPOSTO_SEM_FOTO]);
  });

  it("fora da demonstração, o slide de foto com texto sem foto sai do carrossel", () => {
    /* Dentro dela, a área da foto vira moldura (o caso de cima); fora, uma
       moldura seria "a entrar" chegando ao público. O com foto fica. */
    const m = moldurasDaHome(false, {
      banners: [REAL, COMPOSTO_SEM_FOTO, COMPOSTO_COM_FOTO],
      temNoticia: false,
    });
    expect(m.banners).toEqual([REAL, COMPOSTO_COM_FOTO]);
  });

  it("fora da demonstração, só com slides sem foto, o carrossel fica vazio e some", () => {
    /* Vazio, e não os provisórios: fora da demonstração eles nunca saem. */
    expect(
      moldurasDaHome(false, { banners: [COMPOSTO_SEM_FOTO], temNoticia: false }).banners,
    ).toEqual([]);
    /* Na demonstração, o mesmo slide fica, e os provisórios não entram. */
    expect(
      moldurasDaHome(true, { banners: [COMPOSTO_SEM_FOTO], temNoticia: false }).banners,
    ).toEqual([COMPOSTO_SEM_FOTO]);
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

  it("chave falsa + foto provisória = nada desenhado, em todos os espaços", () => {
    const espacos = Object.keys(ESPACOS) as NomeEspaco[];
    expect(espacos).toEqual(["sede", "cidade", "salao", "associados"]);
    for (const espaco of espacos) {
      expect(html(createElement(Fotografia, { espaco, demonstracao: false })), espaco).toBe("");
    }
  });

  it("chave verdadeira: a moldura de antes, na proporção da foto", () => {
    const saida = html(createElement(Fotografia, { espaco: "sede", demonstracao: true }));
    expect(saida).toContain("Fotografia a entrar: <!-- -->Fachada da sede da AMI");
    expect(saida).toContain("aspect-ratio:1280 / 960");
  });
});

describe("os dois espaços de foto da tarefa 8", () => {
  it("auditório e associados, nas proporções do desenho, ainda provisórios", () => {
    const { salao, associados } = ESPACOS;
    expect([salao.largura, salao.altura, salao.rotulo, salao.provisoria]).toEqual([
      2000,
      1125,
      "Auditório da AMI",
      true,
    ]);
    expect([associados.largura, associados.altura, associados.rotulo, associados.provisoria]).toEqual([
      1600,
      1100,
      "Associados da AMI",
      true,
    ]);
  });

  it("entram na lista de pendências da AMI, cada um dizendo o que falta", () => {
    const pendentes = espacosProvisorios().map(([nome]) => nome);
    expect(pendentes).toContain("salao");
    expect(pendentes).toContain("associados");
    /* O `precisa` é o pedido que a AMI lê: diz o assunto e a largura
       mínima, como os dois de antes. */
    expect(ESPACOS.salao.precisa).toMatch(/auditório/i);
    expect(ESPACOS.salao.precisa).toMatch(/no mínimo \d+px de largura/);
    expect(ESPACOS.associados.precisa).toMatch(/associados/i);
    expect(ESPACOS.associados.precisa).toMatch(/no mínimo \d+px de largura/);
  });

  it("com a chave verdadeira, as molduras saem na proporção da foto", () => {
    const salao = html(createElement(Fotografia, { espaco: "salao", demonstracao: true }));
    expect(salao).toContain("Fotografia a entrar: <!-- -->Auditório da AMI");
    expect(salao).toContain("aspect-ratio:2000 / 1125");
    const associados = html(createElement(Fotografia, { espaco: "associados", demonstracao: true }));
    expect(associados).toContain("Fotografia a entrar: <!-- -->Associados da AMI");
    expect(associados).toContain("aspect-ratio:1600 / 1100");
  });
});

describe("quem e a AMI", () => {
  const vazio = { missao: null, visao: null, valores: null };

  it("sem texto e em demonstracao, os tres cartoes saem como 'Texto da AMI a entrar'", () => {
    expect(quemEhAmi(true, vazio).cartoes.map((c) => [c.titulo, c.texto, c.provisorio])).toEqual([
      ["Missão", "Texto da AMI a entrar.", true],
      ["Visão", "Texto da AMI a entrar.", true],
      ["Valores", "Texto da AMI a entrar.", true],
    ]);
  });

  it("sem texto e fora da demonstracao, nenhum cartao sai", () => {
    expect(quemEhAmi(false, vazio).cartoes).toEqual([]);
  });

  it("com texto, sai o texto, nos dois modos", () => {
    const t = { missao: "M", visao: null, valores: "V" };
    expect(quemEhAmi(false, t).cartoes.map((c) => c.titulo)).toEqual(["Missão", "Valores"]);
    expect(quemEhAmi(false, t).cartoes.map((c) => [c.texto, c.provisorio])).toEqual([
      ["M", false],
      ["V", false],
    ]);
    /* Na demonstração o que falta vira moldura no lugar dele, e o real
       continua real: a ordem é sempre missão, visão, valores. */
    expect(quemEhAmi(true, t).cartoes.map((c) => [c.titulo, c.texto, c.provisorio])).toEqual([
      ["Missão", "M", false],
      ["Visão", "Texto da AMI a entrar.", true],
      ["Valores", "V", false],
    ]);
  });

  it("texto em branco conta como texto nenhum", () => {
    const branco = { missao: "", visao: "   ", valores: null };
    expect(quemEhAmi(false, branco).cartoes).toEqual([]);
    expect(quemEhAmi(true, branco).cartoes.every((c) => c.provisorio)).toBe(true);
  });

  it("o texto real sai aparado, sem os espaços das pontas", () => {
    expect(quemEhAmi(false, { missao: "  Cuidar.\n", visao: null, valores: null }).cartoes).toEqual([
      { titulo: "Missão", texto: "Cuidar.", provisorio: false },
    ]);
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
