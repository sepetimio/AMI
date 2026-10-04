import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowLeft, Bone, Stethoscope } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import estilosBusca from "@/components/busca/FaixaDaBusca.module.css";
import estilosResultados from "@/components/busca/ResultadosDaBusca.module.css";
import estilosGrade from "@/components/diretorio/GradeMedicos.module.css";
import { FaixaDaEspecialidade } from "@/components/especialidades/FaixaDaEspecialidade";
import estilosFaixa from "@/components/especialidades/FaixaDaEspecialidade.module.css";
import { MedicosDaEspecialidade } from "@/components/especialidades/MedicosDaEspecialidade";
import { SobreAEspecialidade } from "@/components/especialidades/SobreAEspecialidade";
import estilosSobre from "@/components/especialidades/SobreAEspecialidade.module.css";
import type { Medico } from "@/lib/dados/tipos";
import type { TextoDeEspecialidade } from "@/lib/sanity/tipos";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";

/*
  Os três blocos da página de cada especialidade, no HTML de servidor: a
  faixa verde, a contagem com a grade de médicos e o "Sobre". O CSS se lê
  do arquivo; o alinhamento e o ritmo são medidos pela auditoria
  (scripts/auditoria-visual.js).
*/

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

describe("a faixa da especialidade", () => {
  const html = renderToString(
    createElement(FaixaDaEspecialidade, {
      nome: "Ortopedia e Traumatologia",
      slug: "ortopedia-e-traumatologia",
      paragrafo: "Parágrafo de abertura.",
    }),
  );

  it("faixa verde de ponta a ponta que abre a página", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="topo" data-faixa="" data-abertura="" aria-labelledby="especialidade-titulo" class="textura-verde ${estilosBusca.faixa} ${estilosFaixa.especialidade}">`,
      ),
    );
    expect(html).toContain('<div class="brilho" aria-hidden="true"></div>');
    /* Sem campo de busca, sem o id que a barra do pé procura. */
    expect(html).not.toContain('id="encontre"');
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<input");
  });

  it("no lugar do rótulo, o link de volta para o índice, na coluna do texto", () => {
    const link = /<a [^>]*href="\/medicos"[^>]*>/.exec(html)![0];
    expect(link).toContain(`class="rotulo-secao ${estilosBusca.sobre} ${estilosFaixa.volta}"`);
    expect(link).toContain('data-coluna=""');
    const ini = html.indexOf(link) + link.length;
    const dentro = html.slice(ini, html.indexOf("</a>", ini));
    expect(dentro.startsWith(desenho(ArrowLeft, 20, "regular"))).toBe(true);
    expect(tela(dentro)).toBe("Especialidades");
  });

  it("o título com o nome e Imperatriz, e o parágrafo de abertura", () => {
    expect(html).toContain(
      `<h1 id="especialidade-titulo" class="${estilosBusca.titulo}">Ortopedia e Traumatologia em Imperatriz</h1>`,
    );
    expect(html).toContain(`<p class="${estilosBusca.texto}">Parágrafo de abertura.</p>`);
  });

  it("à direita, o ícone da especialidade no ladrilho de vidro, fora do leitor de tela", () => {
    expect(html).toContain(`<div class="${estilosFaixa.selo}" aria-hidden="true">${desenho(Bone, 84, "duotone")}</div>`);
    const nova = renderToString(
      createElement(FaixaDaEspecialidade, { nome: "Angiologia", slug: "angiologia", paragrafo: "x" }),
    );
    expect(nova).toContain(desenho(Stethoscope, 84, "duotone"));
  });
});

function medico(id: number, nome: string, foto: string | null = null): Medico {
  return {
    id,
    slug: `medico-${id}`,
    nome,
    crm: String(10000 + id),
    crmUf: "MA",
    foto,
    bio: null,
    telemedicina: false,
    associadoAmi: true,
    especialidades: [
      { nome: "Neurologia", slug: "neurologia", rqe: "12222", principal: true },
      { nome: "Ortopedia e Traumatologia", slug: "ortopedia-e-traumatologia", rqe: "30111", principal: false },
    ],
    locais: [],
  };
}

describe("a contagem e a grade de médicos", () => {
  const html = renderToString(
    createElement(MedicosDaEspecialidade, {
      medicos: [medico(1, "Aline Peixoto"), medico(2, "Gustavo Serra")],
      especialidade: "ortopedia-e-traumatologia",
    }),
  );

  it("a contagem, na coluna do texto, e a frase da ordem", () => {
    expect(html).toMatch(/^<section data-bloco="medicos" aria-labelledby="contagem">/);
    expect(html).toContain(`<h2 id="contagem" class="${estilosResultados.contagem}" data-coluna="">2 médicos</h2>`);
    expect(html).toContain(`<p class="${estilosResultados.ordem}">Em ordem alfabética</p>`);
    const um = renderToString(
      createElement(MedicosDaEspecialidade, { medicos: [medico(1, "Aline Peixoto")], especialidade: "neurologia" }),
    );
    expect(um).toContain(">1 médico</h2>");
  });

  it("a grade da busca, com a especialidade da página em cada cartão", () => {
    expect(html).toContain(`<ul class="${estilosGrade.grade}">`);
    expect(html.match(/>Ortopedia e Traumatologia</g)).toHaveLength(2);
    expect(html).toContain("RQE 30111");
    expect(html).not.toContain("Neurologia");
  });

  it("os quatro primeiros cartões baixam a foto logo; os outros esperam a rolagem", () => {
    const seis = [1, 2, 3, 4, 5, 6].map((n) => medico(n, `Médico ${n}`, `https://exemplo.test/${n}.jpg`));
    const comFotos = renderToString(
      createElement(MedicosDaEspecialidade, { medicos: seis, especialidade: "ortopedia-e-traumatologia" }),
    );
    expect(comFotos.match(/<img /g)).toHaveLength(6);
    expect(comFotos.match(/loading="lazy"/g)).toHaveLength(2);
  });
});

describe("o Sobre a especialidade", () => {
  const bloco_ = (texto: string, extra: Record<string, unknown> = {}) =>
    ({
      _type: "block",
      _key: `b-${texto.length}`,
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s", text: texto, marks: [] }],
      ...extra,
    }) as PortableTextBlock;
  const item = (texto: string) => bloco_(texto, { listItem: "bullet", level: 1 });
  const TEXTO: TextoDeEspecialidade = {
    oQueFaz: [bloco_("O ortopedista cuida dos ossos e das articulações.")],
    quandoProcurar: [item("Dor nas articulações."), item("Entorse."), bloco_("Fratura pede pronto-socorro.")],
    revisorNome: "Dra. Exemplo Revisora",
    revisorCrm: "CRM/MA 10000",
    mesDaRevisao: "setembro de 2026",
  };
  const comTexto = renderToString(
    createElement(SobreAEspecialidade, { nome: "Ortopedia e Traumatologia", sobre: { tipo: "texto", texto: TEXTO } }),
  );
  const aEntrar = renderToString(
    createElement(SobreAEspecialidade, { nome: "Ortopedia e Traumatologia", sobre: { tipo: "a-entrar" } }),
  );

  it("faixa branca de ponta a ponta, que entra ao rolar", () => {
    for (const html of [comTexto, aEntrar]) {
      expect(html).toMatch(
        new RegExp(
          `^<section data-bloco="sobre" data-faixa="" aria-labelledby="sobre-titulo" class="revelar ${estilosSobre.faixa}">`,
        ),
      );
      expect(html).toContain('<h2 id="sobre-titulo" data-coluna="">Sobre a ortopedia e traumatologia</h2>');
    }
  });

  it("com o texto da AMI: as duas colunas com parágrafo e lista, como o Studio guardou", () => {
    expect(comTexto).toContain(`<div class="${estilosSobre.colunas}">`);
    expect(comTexto).toContain("<h3>O que faz</h3><p>O ortopedista cuida dos ossos e das articulações.</p>");
    expect(comTexto).toContain(
      "<h3>Quando procurar</h3><ul><li>Dor nas articulações.</li><li>Entorse.</li></ul><p>Fratura pede pronto-socorro.</p>",
    );
  });

  it("com o texto da AMI: quem revisou, o CRM, o mês, e o aviso", () => {
    const revisao = comTexto.slice(comTexto.indexOf(`<div class="${estilosSobre.revisao}">`));
    expect(tela(revisao)).toBe(
      "Revisado por Dra. Exemplo Revisora · CRM/MA 10000 · revisão em setembro de 2026 " +
        "Conteúdo informativo; não substitui a consulta médica.",
    );
    expect(revisao).toContain("<b>Dra. Exemplo Revisora</b>");
    expect(revisao).toContain(`<span class="${estilosSobre.crm}">CRM/MA 10000</span>`);
  });

  it("a entrar: a frase no lugar dos dois textos, sem a linha do revisor", () => {
    expect(aEntrar.match(new RegExp(`<p class="${estilosSobre.falta}">Texto da AMI a entrar\\.</p>`, "g"))).toHaveLength(2);
    expect(aEntrar).toContain(`<h3>O que faz</h3><p class="${estilosSobre.falta}">`);
    expect(aEntrar).toContain(`<h3>Quando procurar</h3><p class="${estilosSobre.falta}">`);
    expect(aEntrar).not.toContain("Revisado por");
    expect(aEntrar).toContain("Conteúdo informativo; não substitui a consulta médica.");
  });

  it("nenhum texto provisório", () => {
    for (const html of [comTexto, aEntrar]) expect(html).not.toContain("PROVISÓRIO");
  });
});

describe("o CSS da faixa da especialidade", () => {
  const css = semNotas(fonte("../components/especialidades/FaixaDaEspecialidade.module.css"));

  it("texto à esquerda e o ícone à direita até o celular, valendo sobre a regra da busca", () => {
    /* `.especialidade[data-faixa]` pesa mais que `.faixa`
       (FaixaDaBusca.module.css), que abaixo de 1180px vira uma coluna só. */
    expect(regra(base(css), ".especialidade[data-faixa]")).toMatch(/grid-template-columns: minmax\(0, 1fr\) auto;/);
    expect(regra(bloco(css, "@media (max-width: 700px)"), ".especialidade[data-faixa]")).toMatch(
      /grid-template-columns: 1fr;/,
    );
  });

  it("título até 14ch e parágrafo até 34em", () => {
    expect(regra(base(css), ".especialidade h1")).toMatch(/max-width: 14ch;/);
    expect(regra(base(css), ".especialidade h1 + p")).toMatch(/max-width: 34em;/);
  });

  it("o parágrafo quebra como o `p` do desenho, sem palavra sozinha na última linha", () => {
    expect(regra(base(css), ".especialidade h1 + p")).toMatch(/text-wrap: pretty;/);
  });

  it("o ladrilho de vidro: 168px, 128px no tablet, fora no celular", () => {
    const selo = regra(base(css), ".selo");
    expect(selo).toMatch(/width: 168px;/);
    expect(selo).toMatch(/border-radius: 40px;/);
    expect(selo).toMatch(/color: var\(--color-ami-lima-400\);/);
    expect(regra(base(css), ".selo svg")).toMatch(/width: 84px;/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".selo")).toMatch(/width: 128px;/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".selo svg")).toMatch(/width: 64px;/);
    expect(regra(bloco(css, "@media (max-width: 700px)"), ".selo")).toMatch(/display: none;/);
  });

  it("a seta do link de volta anda para a esquerda no mouse", () => {
    expect(regra(base(css), ".volta")).toMatch(/display: inline-flex;/);
    expect(regra(base(css), ".volta:hover svg")).toMatch(/translateX\(-3px\)/);
  });
});

describe("o CSS do Sobre", () => {
  const css = semNotas(fonte("../components/especialidades/SobreAEspecialidade.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("faixa branca de ponta a ponta: 96px, 64px no tablet, 44px no celular, sem margem embaixo", () => {
    const f = regra(base(css), ".faixa");
    expect(f).toMatch(/padding: 96px var\(--borda-faixa\);/);
    expect(f).toMatch(/background: var\(--color-surface\);/);
    expect(f).not.toMatch(/margin/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".faixa")).toMatch(/padding-top: 64px;/);
    expect(regra(cel(), ".faixa")).toMatch(/padding: 44px var\(--borda-faixa\);/);
  });

  it("duas colunas, uma no celular", () => {
    expect(regra(base(css), ".colunas")).toMatch(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    expect(regra(base(css), ".colunas")).toMatch(/gap: 40px 64px;/);
    expect(regra(cel(), ".colunas")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("a lista com o ponto verde do desenho, sem marcador do navegador", () => {
    expect(regra(base(css), ".colunas ul")).toMatch(/list-style: none;/);
    expect(regra(base(css), ".colunas li::before")).toMatch(/background: var\(--color-ami-green-600\);/);
  });

  it("a linha da revisão: fio em cima, cinza do texto de apoio; empilhada no celular", () => {
    const r = regra(base(css), ".revisao");
    expect(r).toMatch(/border-top: 1px solid var\(--color-line\);/);
    expect(r).toMatch(/color: var\(--color-ink-400\);/);
    expect(regra(cel(), ".revisao")).toMatch(/flex-direction: column;/);
  });

  it("os parágrafos quebram como o `p` do desenho, sem palavra sozinha na última linha", () => {
    /* Sem isso, a 390px o aviso "Conteúdo informativo; não substitui a
       consulta médica." terminava em "médica." sozinho; no desenho, em
       "consulta médica.". As listas ficam de fora, como no desenho. */
    expect(regra(base(css), ".faixa p")).toMatch(/text-wrap: pretty;/);
  });

  it("o texto a entrar, como em Quem é a AMI?: cinza e em itálico", () => {
    const r = regra(base(css), ".colunas .falta");
    expect(r).toMatch(/color: var\(--color-ink-400\);/);
    expect(r).toMatch(/font-style: italic;/);
  });
});
