import { Writable } from "node:stream";
import type { ReactNode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import estilosDaHome from "@/app/(site)/inicio.module.css";
import type { Banner, EmpresaParceira, ResumoNoticia } from "@/lib/sanity/tipos";

/*
  A home de verdade, renderizada.

  Importa o `app/(site)/page.tsx` real e troca SÓ as cinco fontes de dados:
  especialidades, médicos, banners, notícias e empresas parceiras. Todo o resto é o código do
  site — os componentes, `moldurasDaHome`, `desenhoDaFotografia` e a leitura
  da chave em lib/demonstracao.ts. O HTML sai de `renderToPipeableStream`,
  que espera o `UltimasNoticias` assíncrono terminar.

  É o que fecha o buraco que testes/home.test.ts admite no topo: lá se lê o
  texto-fonte, e uma seção embrulhada em `{false && …}` continua no texto.
  Aqui ela some do HTML, e o teste fica vermelho.

  COMO A CHAVE É CONTROLADA. Em produção, `NEXT_PUBLIC_DADOS_DEMONSTRACAO` é
  gravado no código durante `next build`. No Vitest não há essa gravação:
  lib/demonstracao.ts lê `process.env` uma vez, quando o módulo é avaliado.
  Por isso cada caso faz `vi.stubEnv` e depois `vi.resetModules()` antes de
  importar a página — o módulo é avaliado de novo com o valor novo, que é o
  equivalente, aqui, de uma build com aquele valor. Escolhi isto, e não um
  `vi.mock` de lib/demonstracao.ts, porque assim o caminho inteiro é o real,
  inclusive `saoDadosDeDemonstracao` ("false" exato desliga). O que isto NÃO
  prova: qual valor a build de produção recebeu.
*/

const dados = vi.hoisted(() => ({
  banners: [] as Banner[],
  noticias: [] as ResumoNoticia[],
  parceiras: [] as EmpresaParceira[],
}));

vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () => [
    { nome: "Cardiologia", slug: "cardiologia", total: 3 },
    { nome: "Pediatria", slug: "pediatria", total: 2 },
  ],
}));
vi.mock("@/lib/dados/medicos", () => ({
  buscarMedicos: async () => Array.from({ length: 24 }, (_, i) => ({ id: i })),
}));
vi.mock("@/lib/sanity/banners", () => ({
  bannersAtivos: async () => dados.banners,
}));
vi.mock("@/lib/sanity/consultas", () => ({
  listarNoticias: async (limite = 20) => dados.noticias.slice(0, limite),
  listarEmpresasParceiras: async () => dados.parceiras,
}));

const BANNER: Banner = {
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
  destino: "/noticias",
  ordem: 10,
};

const NOTICIA: ResumoNoticia = {
  titulo: "Assembleia geral ordinária",
  slug: "assembleia-geral",
  resumo: "A diretoria convoca os associados.",
  autor: { nome: "Fulano de Tal", crm: "1234", crmUf: "MA" },
  publicadoEm: "2026-09-30",
};

async function renderizarHome(
  chave: string | undefined,
  conteudo: {
    banners?: Banner[];
    noticias?: ResumoNoticia[];
    parceiras?: EmpresaParceira[];
  } = {},
): Promise<string> {
  dados.banners = conteudo.banners ?? [];
  dados.noticias = conteudo.noticias ?? [];
  dados.parceiras = conteudo.parceiras ?? [];
  if (chave === undefined) vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", undefined);
  else vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();

  const { default: Home } = await import("@/app/(site)/page");
  const arvore: ReactNode = await Home();

  return new Promise<string>((pronto, falhou) => {
    let html = "";
    const destino = new Writable({
      write(pedaco, _codificacao, seguir) {
        html += pedaco.toString();
        seguir();
      },
      final(seguir) {
        pronto(html);
        seguir();
      },
    });
    const fluxo = renderToPipeableStream(arvore, {
      onAllReady: () => fluxo.pipe(destino),
      onError: falhou,
    });
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

/** Posição de cada marca no HTML, conferindo que todas existem e crescem. */
function emOrdem(html: string, marcas: string[]) {
  let antes = -1;
  for (const marca of marcas) {
    const aqui = html.indexOf(marca, antes + 1);
    expect(aqui, `falta "${marca}" depois da marca anterior`).toBeGreaterThan(antes);
    antes = aqui;
  }
}

/* As seções que existem com ou sem chave: se alguma sumir, a home quebrou. */
const SEMPRE = [
  "<h1",
  'data-bloco="numeros"',
  'data-bloco="encontre"',
  'data-bloco="associe"',
];

describe("a home renderizada", () => {
  it("chave verdadeira e sem conteúdo: as molduras saem na ordem combinada", async () => {
    const html = await renderizarHome("true");
    emOrdem(html, [
      "<h1",
      "Arte a entrar: <!-- -->Seja associado",
      "Arte a entrar: <!-- -->Encontre um médico",
      "Arte a entrar: <!-- -->Sua AMI",
      'data-bloco="numeros"',
      'id="encontre"',
      'id="sua-ami"',
      'data-bloco="associe"',
      "Texto da AMI a entrar.",
      "Texto da AMI a entrar.",
      "Texto da AMI a entrar.",
      'data-bloco="noticias"',
      ">Notícia a entrar</h3>",
      ">Notícia a entrar</h3>",
      ">Notícia a entrar</h3>",
      ">Notícia a entrar</h3>",
      'id="parceiros"',
      'data-bloco="parceiros"',
      ">Logotipo a entrar</li>",
    ]);
  });

  it("chave falsa e sem conteúdo: nenhum 'a entrar' e nenhuma seção provisória", async () => {
    const html = await renderizarHome("false");
    expect(html.match(/a entrar/gi) ?? [], "moldura com a chave falsa").toEqual([]);
    for (const provisoria of [
      'aria-label="Destaques da AMI"',
      'id="sua-ami"',
      "Sua AMI",
      'data-bloco="noticias"',
      'id="parceiros"',
      "Logotipo",
      'role="img"',
    ]) {
      expect(html, `${provisoria} saiu com a chave falsa`).not.toContain(provisoria);
    }
    emOrdem(html, SEMPRE);
  });

  it("um único <h1>, com o nome da associação, só para leitor de tela", async () => {
    /* Quem desenha o nome é o logotipo; o <h1> existe para o leitor de tela
       e para o Google (spec, seção 6). Nos dois modos. */
    for (const chave of ["true", "false"]) {
      const html = await renderizarHome(chave);
      expect(html.match(/<h1\b/g) ?? [], `chave ${chave}`).toHaveLength(1);
      expect(html, `chave ${chave}`).toMatch(
        /<h1 class="sr-only">Associação Médica de Imperatriz<\/h1>/,
      );
    }
  });

  it("a variável ausente vale como demonstração", async () => {
    /* Logo depois do caso "false", de propósito: se aquele valor vazasse
       para cá (stub não desfeito, módulo não reavaliado), este fica vermelho. */
    const html = await renderizarHome(undefined);
    expect(html).toContain('id="parceiros"');
    expect(html).toContain('id="sua-ami"');
  });

  it("chave verdadeira com banner e notícia reais: só o real, sem mistura", async () => {
    const html = await renderizarHome("true", { banners: [BANNER], noticias: [NOTICIA] });

    /* Carrossel: a arte real, e nenhum provisório. */
    expect(html).toContain('<img src="https://exemplo.test/assembleia.jpg"');
    expect(html).not.toContain("Arte a entrar");
    expect(html.match(/Ir para o banner /g) ?? []).toEqual([]);

    /* Notícias: a real, e nenhuma provisória. */
    const bloco = html.slice(html.indexOf('data-bloco="noticias"'), html.indexOf('id="parceiros"'));
    expect(bloco).toContain("Assembleia geral ordinária");
    expect(bloco).not.toContain("Notícia a entrar");

    /* Sua AMI, os textos de missão, visão e valores e os parceiros não têm
       conteúdo real nenhum: no modo demonstração eles continuam, e é isso
       que se espera. */
    expect(html).toContain('id="sua-ami"');
    expect(html).toContain("Texto da AMI a entrar.");
    expect(html).toContain('id="parceiros"');
  });
});

/* Duas empresas de mentira, como `listarEmpresasParceiras` as devolve. */
const PARCEIRAS: EmpresaParceira[] = ["A", "B"].map((l) => ({
  id: l,
  nome: `Empresa Exemplo ${l}`,
  logotipo: `https://exemplo.test/${l}.png`,
  logotipoSrcset: `https://exemplo.test/${l}.png 640w`,
  site: null,
}));

/** O bloco dos números, do começo da tag dele até o bloco seguinte. */
function numeros(html: string): string {
  const ini = html.lastIndexOf("<section", html.indexOf('data-bloco="numeros"'));
  return html.slice(ini, html.indexOf('data-bloco="encontre"'));
}

describe("o quarto número e a faixa das parceiras, na home renderizada", () => {
  it("chave verdadeira e nenhuma cadastrada: quatro números, o quarto conta os seis espaços", async () => {
    const html = await renderizarHome("true");
    const n = numeros(html);
    expect(n).toContain('data-quantos="4"');
    expect(n).toMatch(/<span>6<\/span><\/div><div class="[^"]+">empresas parceiras</);
    expect(n).toContain('href="/#parceiros">Ver parceiras</a>');
    expect(html.match(/>Logotipo a entrar<\/li>/g)).toHaveLength(6);
  });

  it("chave falsa e nenhuma cadastrada: três números, sem faixa", async () => {
    const html = await renderizarHome("false");
    const n = numeros(html);
    expect(n).toContain('data-quantos="3"');
    expect(n).not.toMatch(/parceira/i);
    expect(html).not.toContain('id="parceiros"');
  });

  it("chave falsa e duas cadastradas: quatro números com o 2, e os dois logotipos", async () => {
    const html = await renderizarHome("false", { parceiras: PARCEIRAS });
    const n = numeros(html);
    expect(n).toContain('data-quantos="4"');
    expect(n).toMatch(/<span>2<\/span><\/div><div class="[^"]+">empresas parceiras</);
    const faixa = html.slice(html.indexOf('id="parceiros"'));
    expect(faixa).toContain('alt="Empresa Exemplo A"');
    expect(faixa).toContain('alt="Empresa Exemplo B"');
    expect(html.match(/a entrar/gi) ?? []).toEqual([]);
  });

  it("chave verdadeira e duas cadastradas: as reais, sem os espaços provisórios", async () => {
    const html = await renderizarHome("true", { parceiras: PARCEIRAS });
    expect(numeros(html)).toMatch(/<span>2<\/span><\/div><div class="[^"]+">empresas parceiras</);
    expect(html).toContain('alt="Empresa Exemplo B"');
    expect(html).not.toContain("Logotipo a entrar");
  });
});

/** A tag de abertura de cada bloco de primeiro nível, na ordem do HTML. */
function blocos(html: string): { nome: string; faixa: boolean }[] {
  return [...html.matchAll(/<[a-z]+ [^>]*data-bloco="([^"]+)"[^>]*>/g)].map((m) => ({
    nome: m[1],
    faixa: m[0].includes("data-faixa"),
  }));
}

describe("as faixas de ponta a ponta e o fim da página", () => {
  /*
    O rodapé emenda na faixa de cima só quando a página termina numa faixa
    (a regra com `:has` em components/layout/Rodape.module.css, que olha o
    ÚLTIMO elemento). Aqui se confere o lado da home: quais blocos são
    faixa, e qual bloco fecha a página em cada caso. Na tela, a auditoria
    visual (scripts/auditoria-visual.js) mede o espaço do último bloco ao
    rodapé (`ultimoAoRodape`).
  */
  it("a busca, Seja associado e parceiros levam data-faixa, e só eles", async () => {
    const html = await renderizarHome("true");
    expect(blocos(html).map((b) => b.nome)).toEqual([
      "carrossel",
      "numeros",
      "encontre",
      "sua-ami",
      "associe",
      "noticias",
      "parceiros",
    ]);
    expect(blocos(html).filter((b) => b.faixa).map((b) => b.nome)).toEqual([
      "encontre",
      "associe",
      "parceiros",
    ]);
  });

  it("todo bloco menos o carrossel entra com a .revelar, como no desenho", async () => {
    /* A `.revelar` só marca o bloco. Quem decide é
       components/layout/Revelar.tsx, no navegador: o bloco que já abre na
       primeira tela fica parado, e só o que abre abaixo dela anima. Por
       isso os números, a busca e "Seja associado" podem levá-la. */
    const html = await renderizarHome("true");
    const tags = [...html.matchAll(/<[a-z]+ [^>]*data-bloco="([^"]+)"[^>]*>/g)];
    const comRevelar = tags
      .filter((m) => /class="(?:[^"]* )?revelar[ "]/.test(m[0]))
      .map((m) => m[1]);
    expect(comRevelar).toEqual(["numeros", "encontre", "sua-ami", "associe", "noticias", "parceiros"]);
  });

  it("o HTML do servidor não esconde nada: nenhum bloco sai com data-revelar", async () => {
    /* O estado escondido é `data-revelar="espera"`, e só o navegador o põe.
       Sem JavaScript, a página inteira aparece. */
    for (const chave of ["true", "false"]) {
      const html = await renderizarHome(chave, { banners: [BANNER], noticias: [NOTICIA] });
      expect(html).toContain("revelar");
      expect(html).not.toContain("data-revelar");
    }
  });

  it("os blocos ficam no invólucro que leva a coluna e o ritmo", async () => {
    /* As regras de app/(site)/inicio.module.css só valem para filhos de
       `.home`: sem a classe, todo espaço entre blocos some. */
    const html = await renderizarHome("true");
    expect(html).toMatch(new RegExp(`<div class="${estilosDaHome.home}">`));
    /* E o primeiro bloco vem logo depois do <h1>, que é por onde o CSS o acha. */
    expect(html).toMatch(/<\/h1><section [^>]*data-bloco="carrossel"/);
  });

  it("na demonstração, a página termina na faixa dos parceiros", async () => {
    const html = await renderizarHome("true");
    expect(blocos(html).at(-1)).toEqual({ nome: "parceiros", faixa: true });
    expect(html.trimEnd().endsWith("</section></div>")).toBe(true);
  });

  it("fora da demonstração e sem notícia, termina em Seja associado, que é faixa", async () => {
    const html = await renderizarHome("false");
    expect(html).not.toContain('data-bloco="parceiros"');
    expect(blocos(html).at(-1)).toEqual({ nome: "associe", faixa: true });
  });

  it("fora da demonstração e com notícia, termina nas notícias, que não são faixa", async () => {
    const html = await renderizarHome("false", { noticias: [NOTICIA] });
    expect(blocos(html).at(-1)).toEqual({ nome: "noticias", faixa: false });
  });

  it("nenhum bairro na home, nos dois modos", async () => {
    for (const chave of ["true", "false"]) {
      expect(await renderizarHome(chave), chave).not.toMatch(/bairro/i);
    }
  });
});
