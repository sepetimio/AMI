import { Writable } from "node:stream";
import type { ReactNode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Banner, ResumoNoticia } from "@/lib/sanity/tipos";

/*
  A home de verdade, renderizada.

  Importa o `app/(site)/page.tsx` real e troca SÓ as quatro fontes de dados:
  especialidades, médicos, banners e notícias. Todo o resto é o código do
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
}));

vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () => [
    { nome: "Cardiologia", slug: "cardiologia", total: 3 },
    { nome: "Pediatria", slug: "pediatria", total: 2 },
  ],
  bairrosComContagem: async () => [{ nome: "Centro", slug: "centro", total: 4 }],
}));
vi.mock("@/lib/dados/medicos", () => ({
  buscarMedicos: async () => Array.from({ length: 24 }, (_, i) => ({ id: i })),
}));
vi.mock("@/lib/sanity/banners", () => ({
  bannersAtivos: async () => dados.banners,
}));
vi.mock("@/lib/sanity/consultas", () => ({
  listarNoticias: async (limite = 20) => dados.noticias.slice(0, limite),
}));

const BANNER: Banner = {
  id: "real",
  nome: "Assembleia",
  imagem: "https://exemplo.test/assembleia.jpg",
  alt: "Assembleia geral no dia 12 de março, às 19h, na sede da AMI",
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
  conteudo: { banners?: Banner[]; noticias?: ResumoNoticia[] } = {},
): Promise<string> {
  dados.banners = conteudo.banners ?? [];
  dados.noticias = conteudo.noticias ?? [];
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
  ">Serviços da AMI</h2>",
  'id="especialidades"',
  'id="institucional"',
  'id="bairros"',
];

describe("a home renderizada", () => {
  it("chave verdadeira e sem conteúdo: as molduras saem na ordem combinada", async () => {
    const html = await renderizarHome("true");
    emOrdem(html, [
      "<h1",
      "Arte a entrar: <!-- -->Seja associado",
      "Arte a entrar: <!-- -->Encontre um médico",
      "Arte a entrar: <!-- -->Sua AMI",
      ">Serviços da AMI</h2>",
      ">Sua AMI</h3>",
      'id="especialidades"',
      "Fotografia a entrar",
      'id="institucional"',
      'id="ultimas-noticias"',
      ">Notícia a entrar</h3>",
      ">Notícia a entrar</h3>",
      ">Notícia a entrar</h3>",
      'id="bairros"',
      'id="parceiros"',
      ">Logotipo a entrar</p>",
    ]);
  });

  it("chave falsa e sem conteúdo: nenhum 'a entrar' e nenhuma seção provisória", async () => {
    const html = await renderizarHome("false");
    expect(html.match(/a entrar/gi) ?? [], "moldura com a chave falsa").toEqual([]);
    for (const provisoria of [
      'aria-label="Destaques da AMI"',
      "Sua AMI",
      'id="ultimas-noticias"',
      'id="parceiros"',
      'role="img"',
    ]) {
      expect(html, `${provisoria} saiu com a chave falsa`).not.toContain(provisoria);
    }
    emOrdem(html, SEMPRE);
  });

  it("a variável ausente vale como demonstração", async () => {
    /* Logo depois do caso "false", de propósito: se aquele valor vazasse
       para cá (stub não desfeito, módulo não reavaliado), este fica vermelho. */
    const html = await renderizarHome(undefined);
    expect(html).toContain('id="parceiros"');
    expect(html).toContain(">Sua AMI</h3>");
  });

  it("chave verdadeira com banner e notícia reais: só o real, sem mistura", async () => {
    const html = await renderizarHome("true", { banners: [BANNER], noticias: [NOTICIA] });

    /* Carrossel: a arte real, e nenhum provisório. */
    expect(html).toContain('<img src="https://exemplo.test/assembleia.jpg"');
    expect(html).not.toContain("Arte a entrar");
    expect(html.match(/Ir para o banner /g) ?? []).toEqual([]);

    /* Notícias: a real, e nenhuma provisória. */
    const bloco = html.slice(html.indexOf('id="ultimas-noticias"'), html.indexOf('id="bairros"'));
    expect(bloco).toContain("Assembleia geral ordinária");
    expect(bloco).not.toContain("Notícia a entrar");

    /* Sua AMI, parceiros e a foto da sede não têm conteúdo real nenhum: no
       modo demonstração eles continuam, e é isso que se espera. */
    expect(html).toContain(">Sua AMI</h3>");
    expect(html).toContain('id="parceiros"');
  });
});
