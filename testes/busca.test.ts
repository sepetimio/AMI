import { describe, expect, it, vi } from "vitest";
import estilosFaixa from "@/components/busca/FaixaDaBusca.module.css";
import estilosResultados from "@/components/busca/ResultadosDaBusca.module.css";
import estilosPagina from "@/app/(site)/encontre.module.css";
import estilosCampo from "@/components/home/EncontreUmMedico.module.css";
import type { Medico } from "@/lib/dados/tipos";
import { fonte, semComentarios } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  A busca de verdade, renderizada: app/(site)/busca/page.tsx com as duas
  fontes de dados trocadas por dublês (os médicos e as especialidades). O
  formulário é componente de cliente e usa o roteador; aqui não há
  roteador, e o dublê é o mínimo que ele toca. O que só o navegador faz (ir
  para outro endereço ao trocar a lista) se lê do código.
*/

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {} }),
  usePathname: () => "/busca",
}));

const dados = vi.hoisted(() => ({ chamadas: [] as unknown[], medicos: [] as Medico[] }));
vi.mock("@/lib/dados/medicos", () => ({
  buscarMedicos: async (f: unknown) => {
    dados.chamadas.push(f);
    return dados.medicos;
  },
}));
vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () => [
    { nome: "Pediatria", slug: "pediatria", total: 2 },
    { nome: "Cardiologia", slug: "cardiologia", total: 1 },
    { nome: "Urologia", slug: "urologia", total: 0 },
  ],
}));

const { default: PaginaBusca } = await import("@/app/(site)/busca/page");

function medico(n: number, foto: string | null = null): Medico {
  return {
    id: n,
    slug: `medico-${n}`,
    nome: `Médico ${n}`,
    crm: String(1000 + n),
    crmUf: "MA",
    foto,
    bio: null,
    telemedicina: false,
    associadoAmi: true,
    especialidades: [{ nome: "Cardiologia", slug: "cardiologia", rqe: null, principal: true }],
    locais: [],
  };
}

async function busca(sp: Record<string, string>, medicos: Medico[] = [medico(1)]) {
  dados.medicos = medicos;
  return htmlDe(await PaginaBusca({ searchParams: Promise.resolve(sp) }));
}

const visivel = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

describe("a busca", () => {
  it("abre com a faixa verde e o h1 aprovado, sem a Cabeceira nem a trilha", async () => {
    const html = await busca({});
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/<h1 id="busca-titulo"[^>]*>Quem atende em Imperatriz<\/h1>/);
    expect(html).toMatch(
      new RegExp(`<section id="encontre" data-bloco="busca" data-faixa="" data-abertura="" aria-labelledby="busca-titulo" class="textura-verde ${estilosFaixa.faixa}">`),
    );
    expect(html).toContain('<div class="brilho" aria-hidden="true"></div>');
    expect(html).not.toContain("Trilha de navegação");
    expect(html).not.toContain("-mt-32");
  });

  it("o formulário: GET para /busca, o termo preenchido, o campo da home", async () => {
    const html = await busca({ termo: "Mayara" });
    expect(html).toMatch(/<form[^>]*action="\/busca"[^>]*method="get"/);
    const campo = /<input[^>]*name="termo"[^>]*>/.exec(html)![0];
    expect(campo).toContain('value="Mayara"');
    expect(campo).toContain('placeholder="Nome ou especialidade"');
    expect(html).toContain(`class="${estilosCampo.campo} ${estilosFaixa.campo}"`);
    expect(html).toMatch(new RegExp(`<button type="submit" class="botao ${estilosCampo.buscar}">Buscar`));
  });

  it("a lista: todas, depois em ordem alfabética com a contagem, e a escolhida marcada", async () => {
    const html = await busca({ especialidade: "cardiologia" });
    const opcoes = [...html.matchAll(/<option value="([^"]*)"( selected="")?>([^<]*)<\/option>/g)].map((m) => [
      m[1],
      m[3],
      Boolean(m[2]),
    ]);
    expect(opcoes).toEqual([
      ["", "Todas as especialidades", false],
      ["cardiologia", "Cardiologia (1)", true],
      ["pediatria", "Pediatria (2)", false],
    ]);
    expect(html).toMatch(/<select name="especialidade"/);
  });

  it("sem JavaScript, o botão Aplicar dentro do noscript envia o formulário", async () => {
    const html = await busca({});
    expect(html).toMatch(/<noscript><button type="submit" class="botao">Aplicar<\/button><\/noscript>/);
  });

  it("a especialidade escolhida vira 'Filtro: X ×', e o × leva à mesma busca sem ela", async () => {
    const html = await busca({ termo: "Mayara", especialidade: "cardiologia" });
    const ini = html.indexOf(`<p class="${estilosFaixa.filtroAtivo}">`);
    expect(ini, "falta a linha do filtro").toBeGreaterThan(-1);
    const filtro = html.slice(ini, html.indexOf("</p>", ini));
    /* "Filtro:" e o nome são vizinhos (o espaço entre eles é o `gap` do CSS). */
    expect(visivel(filtro)).toBe("Filtro:Cardiologia");
    const link = /<a [^>]*>/.exec(filtro)![0];
    expect(link).toContain('href="/busca?termo=Mayara"');
    expect(link).toContain('aria-label="Tirar o filtro de Cardiologia"');
    expect(link).toContain(`class="${estilosFaixa.tira}"`);
  });

  it("sem especialidade escolhida, sem a linha do filtro", async () => {
    const html = await busca({ termo: "Mayara" });
    expect(html).not.toContain("Filtro:");
  });

  it("a contagem diz quantos e em quê, e a página diz a ordem", async () => {
    const um = await busca({ especialidade: "cardiologia" });
    expect(um).toMatch(/<h2 id="contagem"[^>]*>1 médico em Cardiologia<\/h2>/);
    /* A contagem muda sem recarregar a página: quem lê a tela é avisado. */
    expect(/<h2 id="contagem"[^>]*>/.exec(um)![0]).toContain('aria-live="polite"');
    expect(um).toContain(`<p class="${estilosResultados.ordem}">Em ordem alfabética</p>`);
    const todos = await busca({}, [medico(1), medico(2), medico(3)]);
    expect(todos).toMatch(/<h2 id="contagem"[^>]*>3 médicos<\/h2>/);
  });

  it("pede ao banco só o termo e a especialidade; o resto do endereço antigo é ignorado", async () => {
    await busca({
      termo: "Mayara",
      especialidade: "cardiologia",
      bairro: "centro",
      telemedicina: "1",
      acessibilidade: "elevador",
      associados: "1",
      ordem: "relevancia",
    });
    expect(dados.chamadas.at(-1)).toEqual({ termo: "Mayara", especialidade: "cardiologia" });
  });

  it("especialidade que não existe é ignorada: sem filtro e sem 'Filtro:'", async () => {
    const html = await busca({ especialidade: "inventada" });
    expect(dados.chamadas.at(-1)).toEqual({});
    expect(html).not.toContain("Filtro:");
    expect(html).toMatch(/<option value="" selected="">Todas as especialidades<\/option>/);
  });

  it("especialidade sem nenhum médico vale como inexistente: não está na lista, não filtra", async () => {
    const html = await busca({ termo: "Mayara", especialidade: "urologia" });
    expect(dados.chamadas.at(-1)).toEqual({ termo: "Mayara" });
    expect(html).not.toContain("Filtro:");
    expect(html).not.toContain('value="urologia"');
    expect(html).toMatch(/<option value="" selected="">Todas as especialidades<\/option>/);
    expect(html).toMatch(/<h2 id="contagem"[^>]*>1 médico<\/h2>/);
  });

  it("nenhum resultado: a mensagem e o botão que limpa a busca", async () => {
    const html = await busca({ termo: "ninguém" }, []);
    expect(html).toContain(">Nenhum médico encontrado</h3>");
    expect(html).toMatch(/<a class="botao-linha" href="\/busca">Limpar a busca<\/a>/);
    expect(html).not.toContain("<ul");
  });

  it("os quatro primeiros cartões baixam a foto logo; os outros esperam a rolagem", async () => {
    const seis = [1, 2, 3, 4, 5, 6].map((n) => medico(n, `https://exemplo.test/${n}.jpg`));
    const html = await busca({}, seis);
    expect(html.match(/<img /g)).toHaveLength(6);
    expect(html.match(/loading="lazy"/g)).toHaveLength(2);
  });

  it("os blocos da página, na ordem, no invólucro de coluna e ritmo", async () => {
    const html = await busca({});
    const blocos = [...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);
    expect(blocos).toEqual(["busca", "resultados"]);
    expect(html).toMatch(new RegExp(`^<div class="${estilosPagina.pagina}"><section id="encontre"`));
  });
});

describe("o formulário ligado ao navegador", () => {
  const FORM = semComentarios(fonte("../components/busca/FormularioDaBusca.tsx"));
  const FAIXA = semComentarios(fonte("../components/busca/FaixaDaBusca.tsx"));
  /* Os trechos de cada controle, por posição: o `=>` das funções tem um `>`,
     então `[^>]*` não serve para achar o fim da tag. */
  const CAMPO = FORM.slice(FORM.indexOf("<input"), FORM.indexOf("/>", FORM.indexOf("<input")));
  const LISTA = FORM.slice(FORM.indexOf("<select"), FORM.indexOf("</select>"));

  it("enviar não recarrega nem rola: vai para o endereço montado pelos filtros", () => {
    expect(FORM).toMatch(/onSubmit=\{\(e\) => \{\s*e\.preventDefault\(\);\s*ir\(e\.currentTarget\);/);
    expect(FORM).toContain("router.push(enderecoDaBusca(filtrosDaQuery(campos)), { scroll: false });");
    expect(FORM.match(/router\.push\(/g)).toHaveLength(1);
  });

  it("trocar a lista já busca; digitar no campo, não", () => {
    expect(LISTA).toMatch(/onChange=\{\(e\) => \{[^}]*\}\);\s*ir\(e\.currentTarget\.form!\);\s*\}\}/);
    expect(CAMPO).toContain("onChange=");
    expect(CAMPO).not.toContain("ir(");
    expect(FORM.match(/onChange/g)).toHaveLength(2);
  });

  it("o formulário não é remontado a cada busca: quem usa teclado não perde o foco", () => {
    /* Uma `key` que muda com a URL troca o campo e a lista por elementos
       novos, e o foco cai no <body>. Os dois são controlados e acompanham a
       URL ajustando o estado durante a renderização. */
    const uso = FAIXA.slice(FAIXA.indexOf("<FormularioDaBusca"), FAIXA.indexOf("/>", FAIXA.indexOf("<FormularioDaBusca")));
    expect(uso).not.toContain("key=");
    expect(CAMPO).toContain("value={valores.termo}");
    expect(LISTA).toContain("value={valores.especialidade}");
    expect(FORM).not.toContain("defaultValue");
    expect(FORM).toMatch(
      /if \(daUrl\.termo !== termo \|\| daUrl\.especialidade !== especialidade\) \{\s*setDaUrl\(\{ termo, especialidade \}\);\s*setValores\(\{ termo, especialidade \}\);\s*\}/,
    );
  });
});

describe("o CSS da coluna e do ritmo da busca e do perfil", () => {
  /* O mesmo que testes/home.test.ts trava em app/(site)/inicio.module.css:
     espaço desigual entre blocos e desalinhamento são queixas do cliente. */
  const css = semNotas(fonte("../app/(site)/encontre.module.css"));

  it("todo bloco fica a --ritmo do anterior, e não há outro margin-top", () => {
    expect(regra(base(css), ".pagina > [data-bloco]")).toMatch(/margin-top: var\(--ritmo\);/);
    expect(css.match(/margin-top:[^;]*;/g)).toEqual(["margin-top: var(--ritmo);"]);
  });

  it("a coluna é a caixa de 1240px com 24px de folga, e a faixa fica fora dela", () => {
    const coluna = regra(base(css), ".pagina > [data-bloco]:not([data-faixa])");
    expect(coluna).toMatch(/width: min\(100% - 48px, 1192px\);/);
    expect(coluna).toMatch(/margin-inline: auto;/);
  });

  it("no celular, 12px de folga de cada lado", () => {
    expect(regra(bloco(css, "@media (max-width: 700px)"), ".pagina > [data-bloco]:not([data-faixa])")).toMatch(
      /width: calc\(100% - 24px\);/,
    );
  });
});

describe("o CSS da faixa da busca", () => {
  const css = semNotas(fonte("../components/busca/FaixaDaBusca.module.css"));

  it("faixa de ponta a ponta com a margem das faixas: 96px, 64px no tablet, 44px no celular", () => {
    expect(regra(base(css), ".faixa")).toMatch(/padding: 96px var\(--borda-faixa\)/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".faixa")).toMatch(/padding-top: 64px/);
    expect(regra(bloco(css, "@media (max-width: 700px)"), ".faixa")).toMatch(/padding: 44px var\(--borda-faixa\)/);
  });

  it("texto à esquerda até 340px e os campos à direita; uma coluna abaixo de 1180px", () => {
    expect(regra(base(css), ".faixa")).toMatch(/grid-template-columns: minmax\(0, 340px\) minmax\(0, 1fr\)/);
    /* Com o `;`: sem ele, `1fr 1fr` (duas colunas) também casaria. */
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".faixa")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("campo e lista lado a lado, empilhados abaixo de 820px", () => {
    expect(regra(base(css), ".filtros")).toMatch(/grid-template-columns: minmax\(0, 1\.55fr\) minmax\(0, 1fr\)/);
    expect(regra(bloco(css, "@media (max-width: 820px)"), ".filtros")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("a lista: pílula branca de 60px (56px no celular, com letra de 16px para o iPhone não aproximar)", () => {
    expect(regra(base(css), ".listaEsp select")).toMatch(/height: 60px/);
    const cel = regra(bloco(css, "@media (max-width: 700px)"), ".listaEsp select");
    expect(cel).toMatch(/height: 56px/);
    expect(cel).toMatch(/font-size: 16px/);
  });

  it("o × do filtro clareia em branco no mouse, não fica verde", () => {
    const r = regra(base(css), ".tira:hover");
    expect(r).toMatch(/rgba\(255, 255, 255, 0\.14\)/);
    expect(r).not.toMatch(/lima|green/);
  });

  it("o texto sobre o verde passa em AA no ponto mais claro medido na fatia A", () => {
    /* O ponto mais claro atrás do texto de apoio da busca da home, com a luz
       e o grão médio, medido no navegador em 03/10/2026 (rgb 53, 95, 38):
       a mesma faixa, o mesmo degradê. A conferência visual remede na busca. */
    const fundo = [53, 95, 38];
    const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const razao = (a: number[], b: number[]) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    for (const seletor of [".texto", ".filtroAtivo"]) {
      const cor = /color:\s*(#[0-9a-fA-F]{6})/.exec(regra(base(css), seletor))![1];
      expect(razao(hex(cor), fundo), seletor).toBeGreaterThanOrEqual(4.5);
    }
  });
});
