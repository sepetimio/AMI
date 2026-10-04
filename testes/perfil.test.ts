import { describe, expect, it, vi } from "vitest";
import estilosDaFoto from "@/components/diretorio/FotoDoMedico.module.css";
import estilos from "@/components/perfil/Perfil.module.css";
import { SIZES_DO_PERFIL } from "@/components/perfil/TopoDoPerfil";
import type { LocalAtendimento, Medico } from "@/lib/dados/tipos";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  O perfil de verdade, renderizado: app/(site)/medico/[slug]/page.tsx com a
  camada de dados trocada por um dublê.
*/

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NAO_ENCONTRADO");
  },
  usePathname: () => "/medico/aline-peixoto",
  useRouter: () => ({ push: () => {} }),
}));

const dados = vi.hoisted(() => ({ todos: [] as Medico[] }));
vi.mock("@/lib/dados/medicos", () => ({
  medicoPorSlug: async (slug: string) => dados.todos.find((m) => m.slug === slug) ?? null,
  buscarMedicos: async () => dados.todos,
  slugsDeMedicos: async () => dados.todos.map((m) => m.slug),
}));

const { default: PaginaPerfil } = await import("@/app/(site)/medico/[slug]/page");

function local(id: number, bairro: string, logradouro: string, numero: string, telefone: string | null): LocalAtendimento {
  return {
    id,
    logradouro,
    numero,
    bairro: { id, nome: bairro, slug: bairro.toLowerCase() },
    telefone,
    whatsapp: telefone,
    estacionamento: true,
    acessibilidade: ["acesso_cadeirante"],
  };
}

const ALINE: Medico = {
  id: 1,
  slug: "aline-peixoto",
  nome: "Aline Peixoto",
  crm: "11918",
  crmUf: "MA",
  foto: null,
  bio: "Aline Peixoto é médica, com registro de especialista em Neurologia.\n\nAs consultas são marcadas por telefone.",
  telemedicina: true,
  associadoAmi: true,
  especialidades: [{ nome: "Neurologia", slug: "neurologia", rqe: "12222", principal: true }],
  locais: [
    local(1, "Nova Imperatriz", "Rua Projetada 114", "198", "(99) 3018-9994"),
    local(2, "Juçara", "Rua Projetada 117", "219", "(99) 3023-0707"),
  ],
};

const CRISTINA: Medico = {
  ...ALINE,
  id: 2,
  slug: "cristina-bezerra",
  nome: "Cristina Bezerra",
  bio: null,
  locais: [local(3, "Centro", "Rua A", "1", "(99) 3027-1420")],
};

const BRUNO: Medico = {
  ...CRISTINA,
  id: 3,
  slug: "bruno-cavalcante",
  nome: "Bruno Cavalcante",
  especialidades: [
    { nome: "Cardiologia", slug: "cardiologia", rqe: null, principal: true },
    { nome: "Neurologia", slug: "neurologia", rqe: null, principal: false },
  ],
};

async function perfil(medico: Medico = ALINE, outros: Medico[] = [CRISTINA, BRUNO]) {
  dados.todos = [medico, ...outros];
  return htmlDe(await PaginaPerfil({ params: Promise.resolve({ slug: medico.slug }) }));
}

/* O texto da tela, sem o JSON-LD e sem as tags; todo espaço (o sem quebra
   também) vira um espaço só. */
const tela = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

const trecho = (html: string, marca: string) => {
  const ini = html.indexOf(marca);
  expect(ini, `falta ${marca}`).toBeGreaterThan(-1);
  return html.slice(ini);
};

/* Os blocos de JSON-LD da página, já lidos. */
const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]) as Record<string, unknown>,
  );

describe("o topo do perfil", () => {
  it("um h1 com o nome, e nada da Cabeceira nem do breadcrumb", async () => {
    const html = await perfil();
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(new RegExp(`<h1 id="perfil-nome" class="${estilos.nome}">Aline Peixoto</h1>`));
    expect(html).not.toContain("Trilha de navegação");
    expect(html).not.toContain("-mt-32");
  });

  it("o rótulo é o link de volta para a busca", async () => {
    const html = await perfil();
    expect(html).toMatch(/<a [^>]*href="\/busca"[^>]*>.*?Encontre um médico<\/a>/);
    expect(html).toContain('<a class="rotulo-secao link-de-volta" href="/busca">');
  });

  it("MÉDICO · CRM e a especialidade com RQE", async () => {
    const t = tela(await perfil());
    expect(t).toContain("MÉDICO · CRM/MA 11918");
    expect(t).toContain("Neurologia RQE 12222");
    /* "RQE" e o número juntos, com o espaço que não quebra e sem o
       `<!-- -->` que o React põe entre dois textos vizinhos. */
    const topo = trecho(await perfil(), 'data-bloco="perfil"');
    expect(topo.slice(0, topo.indexOf("</section>"))).toContain(`<span class="${estilos.rqe}">RQE\u00a012222</span>`);
  });

  it("Ligar e WhatsApp do consultório principal", async () => {
    const topo = trecho(await perfil(), 'data-bloco="perfil"');
    const acoes = topo.slice(topo.indexOf(`class="${estilos.acoes}"`), topo.indexOf("</div>", topo.indexOf(`class="${estilos.acoes}"`)));
    expect(acoes).toMatch(/<a class="botao" href="tel:\+559930189994" aria-label="Ligar para Aline Peixoto, \(99\) 3018-9994">/);
    expect(acoes).toMatch(/<a class="botao-contorno" href="https:\/\/wa\.me\/559930189994" aria-label="WhatsApp de Aline Peixoto">/);
  });

  it("a linha do consultório: bairro, telefone e 'ver os N endereços' para #onde-atende", async () => {
    const html = await perfil();
    const linha = trecho(html, `class="${estilos.linhaDoConsultorio}"`);
    expect(tela(linha.slice(0, linha.indexOf("</p>")))).toContain(
      "Consultório em Nova Imperatriz · (99) 3018-9994 · ver os 2 endereços",
    );
    expect(linha).toContain('<a href="#onde-atende">');
  });

  it("um consultório só: sem 'ver os endereços'", async () => {
    const html = await perfil({ ...ALINE, locais: [ALINE.locais[0]] });
    expect(html).not.toContain("ver os");
  });

  it("consultório principal sem telefone: só o WhatsApp no topo, e a linha sem número", async () => {
    const semTel = { ...ALINE.locais[0], telefone: null };
    const html = await perfil({ ...ALINE, locais: [semTel] });
    const topo = trecho(html, 'data-bloco="perfil"');
    expect(topo.slice(0, topo.indexOf("</section>"))).not.toContain("tel:");
    expect(topo).toContain("https://wa.me/559930189994");
    expect(tela(html)).toContain("Consultório em Nova Imperatriz");
  });

  it("sem consultório: sem botões no topo e sem a linha", async () => {
    const html = await perfil({ ...ALINE, locais: [] });
    expect(html).not.toContain(`class="${estilos.acoes}"`);
    expect(html).not.toContain(`class="${estilos.linhaDoConsultorio}"`);
  });

  it("número vazio ou só com espaço não vira botão: nada de wa.me/55 sozinho nem tel: vazio", async () => {
    for (const vazio of ["", "  ", " - "]) {
      const html = await perfil({ ...ALINE, locais: [{ ...ALINE.locais[0], telefone: vazio, whatsapp: vazio }] }, []);
      expect(html, JSON.stringify(vazio)).not.toContain("wa.me");
      expect(html, JSON.stringify(vazio)).not.toContain("tel:");
      expect(html, JSON.stringify(vazio)).not.toContain(`class="${estilos.acoes}"`);
      expect(tela(html), JSON.stringify(vazio)).toContain("Consultório em Nova Imperatriz ");
      expect(tela(html), JSON.stringify(vazio)).not.toContain("Consultório em Nova Imperatriz ·");
    }
  });

  it("sem foto, as iniciais; com foto, o retrato com prioridade e o sizes do desenho", async () => {
    expect(await perfil()).toMatch(/>AP<\/span>/);
    const html = await perfil({ ...ALINE, foto: "https://exemplo.test/aline.jpg" });
    const img = /<img [^>]*>/.exec(trecho(html, 'data-bloco="perfil"'))![0];
    expect(img).toContain('alt="Retrato de Aline Peixoto"');
    expect(img).toMatch(/fetchpriority="high"/i);
    expect(img).toContain(`sizes="${SIZES_DO_PERFIL}"`);
  });

  it("com foto ou sem, o mesmo quadro: o primeiro filho do topo leva a classe .foto do perfil", async () => {
    /* O cartão verde das iniciais ocupa o mesmo espaço do retrato: a mesma
       classe no mesmo lugar, e a proporção vem dela (o CSS, mais abaixo). */
    const quadro = (html: string) => /data-bloco="perfil"[^>]*>\s*<div ([^>]*)>/.exec(html)![1];
    const sem = quadro(await perfil());
    const com = quadro(await perfil({ ...ALINE, foto: "https://exemplo.test/aline.jpg" }));
    for (const q of [sem, com]) {
      const classes = /class="([^"]*)"/.exec(q)![1].split(" ");
      expect(classes).toContain(estilos.foto);
      expect(classes).toContain(estilosDaFoto.foto);
    }
    expect(sem).toContain(estilosDaFoto.semFoto);
    expect(com).toContain(estilosDaFoto.comFoto);
  });
});

describe("onde atende", () => {
  it("um cartão por consultório: bairro, endereço, telefone e os três botões", async () => {
    const html = await perfil();
    const secao = trecho(html, 'id="onde-atende"');
    expect(secao.match(/<article /g)).toHaveLength(2);
    expect(tela(secao)).toContain("Nova Imperatriz Rua Projetada 114, 198 Nova Imperatriz, Imperatriz – MA (99) 3018-9994");
    expect(secao).toContain('aria-label="Ligar para o consultório de Nova Imperatriz"');
    expect(secao).toContain('aria-label="WhatsApp do consultório de Juçara"');
    expect(secao).toContain(
      'href="https://www.google.com/maps/search/?api=1&amp;query=Rua%20Projetada%20114%2C%20198%2C%20Nova%20Imperatriz%2C%20Imperatriz%20%E2%80%93%20MA"',
    );
    expect(secao).toContain('aria-label="Como chegar ao consultório de Juçara (abre o mapa)"');
  });

  it("o WhatsApp de cada cartão abre o número daquele consultório, com o 55 uma vez só", async () => {
    const html = await perfil({
      ...ALINE,
      locais: [
        { ...ALINE.locais[0], whatsapp: "(99) 98118-9994" },
        { ...ALINE.locais[1], whatsapp: "55 99 3023-0707" },
      ],
    });
    const secao = trecho(html, 'id="onde-atende"');
    expect(secao).toContain(
      '<a class="botao-contorno" href="https://wa.me/5599981189994" aria-label="WhatsApp do consultório de Nova Imperatriz">',
    );
    expect(secao).toContain(
      '<a class="botao-contorno" href="https://wa.me/559930230707" aria-label="WhatsApp do consultório de Juçara">',
    );
  });

  it("consultório sem WhatsApp e sem telefone: só o Como chegar", async () => {
    const html = await perfil({ ...ALINE, locais: [{ ...ALINE.locais[0], telefone: null, whatsapp: null }] });
    const secao = trecho(html, 'id="onde-atende"');
    expect(secao).not.toContain("Ligar para o consultório");
    expect(secao).not.toContain("WhatsApp do consultório");
    expect(secao).toContain("Como chegar ao consultório");
  });

  it("número vazio no consultório: sem Ligar, sem WhatsApp e sem a linha do telefone", async () => {
    const html = await perfil({ ...ALINE, locais: [{ ...ALINE.locais[0], telefone: " ", whatsapp: "" }] });
    const secao = trecho(html, 'id="onde-atende"');
    expect(secao).not.toContain("Ligar para o consultório");
    expect(secao).not.toContain("WhatsApp do consultório");
    expect(secao).not.toContain(`class="numero-tabular ${estilos.tel}"`);
  });
});

describe("sobre, outros médicos e a nota", () => {
  it("Sobre: um parágrafo por bloco da biografia", async () => {
    const secao = trecho(await perfil(), 'data-bloco="sobre"');
    expect(secao.slice(0, secao.indexOf("</section>")).match(/<p>/g)).toHaveLength(2);
  });

  it("biografia vazia: sem Sobre", async () => {
    expect(await perfil({ ...ALINE, bio: null })).not.toContain('data-bloco="sobre"');
    expect(await perfil({ ...ALINE, bio: "  " })).not.toContain('data-bloco="sobre"');
    expect(await perfil({ ...ALINE, bio: "\n\n \n" })).not.toContain('data-bloco="sobre"');
  });

  it("outros médicos da mesma especialidade principal, com o link para todos", async () => {
    const html = await perfil();
    const secao = trecho(html, 'data-bloco="outros"');
    expect(secao).toContain(">Outros médicos de Neurologia</h2>");
    expect(secao).toMatch(/<a class="botao-linha" href="\/medicos\/neurologia">Ver todos de Neurologia/);
    /* A seta do desenho tem a altura da letra do botão (13px), não 20. */
    const seta = /Ver todos de Neurologia(?:<!-- -->)? <svg [^>]*>/.exec(secao)![0];
    expect(seta).toContain('width="13"');
    expect(seta).toContain('height="13"');
    expect(secao).toContain('href="/medico/cristina-bezerra"');
    expect(secao).not.toContain('href="/medico/bruno-cavalcante"');
  });

  it("outros médicos: até quatro", async () => {
    const colegas = [1, 2, 3, 4, 5].map((n) => ({ ...CRISTINA, id: 10 + n, slug: `colega-${n}`, nome: `Colega ${n}` }));
    const secao = trecho(await perfil(ALINE, colegas), 'data-bloco="outros"');
    expect(secao.match(/href="\/medico\/colega-\d"/g)).toHaveLength(4);
  });

  it("sem outros médicos: sem a seção", async () => {
    expect(await perfil(ALINE, [BRUNO])).not.toContain('data-bloco="outros"');
  });

  it("a nota final", async () => {
    expect(tela(await perfil())).toContain(
      "As informações desta página são fornecidas pelo profissional e revisadas pela Associação Médica de Imperatriz. Conteúdo informativo; não substitui a consulta médica.",
    );
  });

  it("os blocos, nesta ordem", async () => {
    const blocos = [...(await perfil()).matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);
    expect(blocos).toEqual(["perfil", "onde-atende", "sobre", "outros", "nota"]);
  });
});

describe("o que fica e o que saiu", () => {
  it("o JSON-LD do médico continua; o da trilha sai, porque a trilha não aparece na tela", async () => {
    const tipos = jsonLd(await perfil()).map((j) => j["@type"]);
    expect(tipos).toEqual(["Physician"]);
  });

  it("o JSON-LD do médico não diz telemedicina, que não aparece na tela", async () => {
    const [medico] = jsonLd(await perfil());
    expect(ALINE.telemedicina).toBe(true);
    expect(medico.availableService).toBeUndefined();
    expect(JSON.stringify(medico).toLowerCase()).not.toContain("telemedicina");
  });

  it("nada de selo, telemedicina, acessibilidade ou estacionamento na tela", async () => {
    const t = tela(await perfil()).toLowerCase();
    for (const fora of ["associado ami", "telemedicina", "cadeirante", "estacionamento", "acessibilidade"]) {
      expect(t, fora).not.toContain(fora);
    }
  });

  it("nada do link antigo de especialidade no bairro", async () => {
    const html = await perfil();
    expect(html).not.toContain("no bairro");
    expect(html).not.toMatch(/href="\/medicos\/neurologia\/[^"]+"/);
  });

  it("slug que não existe: 404", async () => {
    dados.todos = [ALINE];
    await expect(PaginaPerfil({ params: Promise.resolve({ slug: "ninguem" }) })).rejects.toThrow("NAO_ENCONTRADO");
  });
});

describe("o CSS do perfil", () => {
  const css = semNotas(fonte("../components/perfil/Perfil.module.css"));
  const global = semNotas(fonte("../app/globals.css"));
  const daFoto = semNotas(fonte("../components/diretorio/FotoDoMedico.module.css"));

  it("foto de 460px ao lado do texto; .85fr no tablet; em cima, na largura toda, no celular", () => {
    expect(regra(base(css), ".topo")).toMatch(/grid-template-columns: minmax\(0, 460px\) minmax\(0, 1fr\)/);
    expect(regra(base(css), ".topo")).toMatch(/gap: 64px/);
    expect(regra(base(css), ".foto")).toMatch(/aspect-ratio: 4 \/ 5/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".topo")).toMatch(/minmax\(0, 0?\.85fr\) minmax\(0, 1fr\)/);
    const cel = bloco(css, "@media (max-width: 700px)");
    expect(regra(cel, ".topo")).toMatch(/grid-template-columns: 1fr/);
    expect(regra(cel, ".topo")).toMatch(/padding: 0/);
    expect(regra(cel, ".texto")).toMatch(/padding: 0 var\(--m\)/);
  });

  it("o quadro sem foto tem o tamanho do retrato: só a proporção 4:5 e a coluna decidem, com ou sem foto", () => {
    /* Nenhuma regra dá largura, altura ou outra proporção ao quadro, nem no
       perfil, nem nas classes de FotoDoMedico que mudam com a foto; e as
       iniciais crescem com ele: 160px no computador, 120px no celular. */
    const medidas = /(^|[\s;{])(width|height|min-width|min-height|max-width|max-height|aspect-ratio):/;
    const cel = bloco(css, "@media (max-width: 700px)");
    expect(regra(base(css), ".foto").replace(/aspect-ratio: 4 \/ 5;/, "")).not.toMatch(medidas);
    expect(regra(cel, ".foto")).not.toMatch(medidas);
    for (const c of [".foto", ".comFoto", ".semFoto"]) {
      expect(regra(daFoto, c), c).not.toMatch(medidas);
    }
    expect(regra(base(css), ".foto")).toMatch(/--tamanho-iniciais: 160px/);
    expect(regra(cel, ".foto")).toMatch(/--tamanho-iniciais: 120px/);
  });

  it("consultórios dois por linha, um abaixo de 1180px; no celular, Ligar na largura toda e os outros dois lado a lado", () => {
    expect(regra(base(css), ".consultorios")).toMatch(/repeat\(2, minmax\(0, 1fr\)\)/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".consultorios")).toMatch(/grid-template-columns: 1fr/);
    expect(regra(base(css), ".acoesDoConsultorio")).toMatch(/margin-top: auto/);
    const cel = bloco(css, "@media (max-width: 700px)");
    expect(regra(cel, ".acoesDoConsultorio")).toMatch(/grid-template-columns: 1fr 1fr/);
    expect(regra(cel, ".acoesDoConsultorio > :global(.botao)")).toMatch(/grid-column: 1 \/ -1/);
  });

  it("no celular, Como chegar sozinho na linha vai de ponta a ponta: depois do Ligar sem WhatsApp, ou sem os dois", () => {
    const cel = bloco(css, "@media (max-width: 700px)");
    expect(cel).toMatch(
      /\n\s*\.acoesDoConsultorio > :global\(\.botao\) \+ a:last-child,\s*\.acoesDoConsultorio > a:only-child \{\s*grid-column: 1 \/ -1;\s*\}/,
    );
  });

  it("os botões do topo meio a meio no celular, e um só na largura toda", () => {
    const cel = bloco(css, "@media (max-width: 700px)");
    expect(regra(cel, ".acoes")).toMatch(/grid-template-columns: 1fr 1fr/);
    expect(regra(cel, ".acoes > a:only-child")).toMatch(/grid-column: 1 \/ -1/);
  });

  it("a nota tem um fio fino em cima, e a leitura uma medida de 40em", () => {
    expect(regra(base(css), ".notaFinal")).toMatch(/border-top: 1px solid var\(--color-line-strong\)/);
    expect(regra(base(css), ".leitura")).toMatch(/max-width: calc\(40em \+ 2 \* var\(--m\)\)/);
  });

  it(".botao-contorno: pílula branca de 48px, borda que escurece no mouse, sem verde claro", () => {
    expect(regra(global, ".botao-contorno")).toMatch(/height: 48px/);
    expect(regra(global, ".botao-contorno:hover")).toMatch(/border-color: #B9BFC8/);
    expect(regra(global, ".botao-contorno:hover")).not.toMatch(/lima|green/);
  });
});

describe("a barra do pé do perfil", () => {
  it("com telefone no consultório principal: a barra do médico, e os botões do topo marcados", async () => {
    const html = await perfil();
    expect(html).toContain('data-barra-do-medico=""');
    expect(html).toMatch(new RegExp(`<div class="${estilos.acoes}" data-acoes-do-medico="">`));
  });

  it("sem telefone no consultório principal: sem a barra do médico (volta a padrão)", async () => {
    const html = await perfil({ ...ALINE, locais: [{ ...ALINE.locais[0], telefone: null }] });
    expect(html).not.toContain("data-barra-do-medico");
  });

  it("telefone em branco conta como vazio: sem a barra do médico", async () => {
    const html = await perfil({ ...ALINE, locais: [{ ...ALINE.locais[0], telefone: "  " }] });
    expect(html).not.toContain("data-barra-do-medico");
  });

  it("a barra é a do consultório principal, e com o WhatsApp em branco sobra só o Ligar", async () => {
    const html = await perfil({ ...ALINE, locais: [{ ...ALINE.locais[0], whatsapp: "  " }, ALINE.locais[1]] });
    const barra = /<nav [^>]*data-barra-do-medico[^>]*>[\s\S]*?<\/nav>/.exec(html)![0];
    expect(barra).toContain("tel:+559930189994");
    expect(barra).not.toContain("wa.me");
  });
});
