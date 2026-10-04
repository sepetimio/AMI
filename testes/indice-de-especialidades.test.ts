import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { Baby, Heartbeat, Stethoscope } from "@phosphor-icons/react/dist/ssr";
import estilosPagina from "@/app/(site)/encontre.module.css";
import estilosBusca from "@/components/busca/FaixaDaBusca.module.css";
import estilosResultados from "@/components/busca/ResultadosDaBusca.module.css";
import estilosIndice from "@/components/especialidades/FaixaDoIndice.module.css";
import estilosGrade from "@/components/especialidades/GradeDeEspecialidades.module.css";
import estilosCampo from "@/components/home/EncontreUmMedico.module.css";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  O índice de especialidades de verdade, renderizado: app/(site)/medicos/page.tsx
  com as duas fontes de dados trocadas por dublês. A lista chega fora de
  ordem e com uma especialidade sem médico, como o banco nunca devolve, para
  a página mostrar que ordena e filtra sozinha. O CSS se lê do arquivo; a
  altura igual dos cartões e o alinhamento do nome e da contagem são medidos
  pela auditoria (scripts/auditoria-visual.js).
*/

vi.mock("@/lib/dados/medicos", () => ({
  buscarMedicos: async () => Array.from({ length: 24 }, (_, i) => ({ id: i + 1 })),
}));
vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () => [
    { nome: "Pediatria", slug: "pediatria", total: 3 },
    { nome: "Clínica Médica", slug: "clinica-medica", total: 4 },
    { nome: "Otorrinolaringologia", slug: "otorrinolaringologia", total: 1 },
    { nome: "Cardiologia", slug: "cardiologia", total: 3 },
    { nome: "Urologia", slug: "urologia", total: 0 },
    { nome: "Angiologia", slug: "angiologia", total: 2 },
  ],
}));

const pagina = await import("@/app/(site)/medicos/page");
const HTML = await htmlDe(await pagina.default());

/* Cada cartão, do `<li` ao `</li>`. */
const cartoes = [...HTML.matchAll(/<li [^>]*data-cartao-de-especialidade=""[\s\S]*?<\/li>/g)].map((m) => m[0]);
const desenho = (Componente: Icon, size: number) =>
  renderToString(createElement(Componente, { size, weight: "duotone", className: "", "aria-hidden": "true" }));

describe("o índice de especialidades", () => {
  it("abre com a faixa verde de ponta a ponta, no invólucro de coluna e ritmo, sem Cabeceira nem trilha", () => {
    expect(HTML).toMatch(
      new RegExp(
        `^<div class="${estilosPagina.pagina}"><section id="encontre" data-bloco="topo" data-faixa="" data-abertura="" aria-labelledby="especialidades-titulo" class="textura-verde ${estilosBusca.faixa} ${estilosIndice.indice}">`,
      ),
    );
    expect(HTML).toContain('<div class="brilho" aria-hidden="true"></div>');
    expect(HTML).not.toContain("Trilha de navegação");
    expect(HTML).not.toContain("-mt-32");
    /* Sem trilha na tela, sem BreadcrumbList: dado estruturado sem o
       equivalente visível é marcação enganosa (lib/seo/jsonld.ts). */
    expect(HTML).not.toContain("BreadcrumbList");
  });

  it("o rótulo, o título e a linha de apoio com o total de médicos", () => {
    expect(HTML.match(/<h1\b/g)).toHaveLength(1);
    expect(HTML).toContain(`<span class="rotulo-secao ${estilosBusca.sobre}" data-coluna="">Especialidades</span>`);
    expect(HTML).toContain(
      `<h1 id="especialidades-titulo" class="${estilosBusca.titulo}">Especialidades em Imperatriz</h1>`,
    );
    expect(HTML).toContain(
      `<p class="${estilosBusca.texto}">24 médicos associados, cada um com o número de registro no CRM. Escolha a área para ver quem atende.</p>`,
    );
  });

  it("o campo: o da busca da home, GET para /busca com o termo, sem lista de especialidades", () => {
    const form = /<form [^>]*>/.exec(HTML)![0];
    for (const attr of ['action="/busca"', 'method="get"', 'role="search"', `class="${estilosCampo.campo} ${estilosIndice.campo}"`]) {
      expect(form, attr).toContain(attr);
    }
    const campo = /<input[^>]*name="termo"[^>]*>/.exec(HTML)![0];
    expect(campo).toContain('type="search"');
    expect(campo).toContain('placeholder="Nome ou especialidade"');
    expect(HTML).toMatch(new RegExp(`<button type="submit" class="botao ${estilosCampo.buscar}">Buscar`));
    expect(HTML).not.toContain("<select");
  });

  it("a contagem das especialidades com médico e a frase da ordem, longa e curta", () => {
    expect(HTML).toContain(
      `<h2 id="contagem-de-especialidades" class="${estilosResultados.contagem}" data-coluna="">5 especialidades</h2>`,
    );
    expect(HTML).toContain(
      `<p class="${estilosResultados.ordem}"><span class="${estilosGrade.ordemLonga}">Em ordem alfabética</span><span class="${estilosGrade.ordemCurta}">De A a Z</span></p>`,
    );
  });

  it("um cartão por especialidade com médico, em ordem alfabética, cada um levando à página dela", () => {
    const links = [...HTML.matchAll(/<a href="\/medicos\/([^"]+)">([^<]*)<\/a>/g)].map((m) => [m[1], m[2]]);
    expect(links).toEqual([
      ["angiologia", "Angiologia"],
      ["cardiologia", "Cardiologia"],
      ["clinica-medica", "Clínica Médica"],
      ["otorrinolaringologia", "Otorrino­laringologia"],
      ["pediatria", "Pediatria"],
    ]);
    expect(cartoes).toHaveLength(5);
  });

  it("cada cartão: o ladrilho com o ícone, o nome, a contagem e a seta", () => {
    const cardio = cartoes[1];
    expect(cardio).toMatch(new RegExp(`^<li class="${estilosGrade.cartao}" data-cartao-de-especialidade="">`));
    expect(cardio).toContain(`<span class="ladrilho-icone" aria-hidden="true">${desenho(Heartbeat, 28)}</span>`);
    expect(cardio).toContain(
      `<h3 class="${estilosGrade.nome}" data-nome=""><a href="/medicos/cardiologia">Cardiologia</a></h3>`,
    );
    expect(cardio).toContain(`<span class="${estilosGrade.conta}" data-contagem="">3 médicos</span>`);
    expect(cardio).toMatch(new RegExp(`<span class="${estilosGrade.seta}" aria-hidden="true"><svg`));
  });

  it("a contagem concorda; o ícone vem da tabela, e quem não está nela fica com o estetoscópio", () => {
    expect(cartoes[3]).toContain(">1 médico<");
    expect(cartoes[4]).toContain(desenho(Baby, 28));
    expect(cartoes[0]).toContain(desenho(Stethoscope, 28));
  });

  it("os dois blocos da página, na ordem", () => {
    expect([...HTML.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1])).toEqual(["topo", "especialidades"]);
  });

  it("sem os cartões antigos do índice nem a lista de bairros", () => {
    expect(HTML).not.toContain("Por especialidade");
    expect(HTML).not.toContain("por-bairro");
  });
});

describe("os metadados do índice continuam os de antes", () => {
  it("título, descrição e canonical", async () => {
    const m = await pagina.generateMetadata();
    expect(m.title).toBe("Médicos em Imperatriz - MA | 24 profissionais | AMI");
    expect(m.description).toBe(
      "24 médicos em 6 especialidades em Imperatriz - MA. Veja endereço, telefone e especialidade de cada médico.",
    );
    expect(m.alternates).toEqual({ canonical: "/medicos" });
  });
});

describe("o CSS da faixa do índice", () => {
  const css = semNotas(fonte("../components/especialidades/FaixaDoIndice.module.css"));

  it("a coluna do texto vai a 440px, e vale sobre a da busca pelo peso do seletor", () => {
    /* `.indice[data-faixa]` (classe e atributo) pesa mais que `.faixa`
       (FaixaDaBusca.module.css), qualquer que seja a ordem das folhas. */
    expect(regra(base(css), ".indice[data-faixa]")).toMatch(/grid-template-columns: minmax\(0, 440px\) minmax\(0, 1fr\);/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".indice[data-faixa]")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("título até 12ch e linha de apoio até 24em, em toda largura", () => {
    expect(regra(base(css), ".indice h1")).toMatch(/max-width: 12ch;/);
    expect(regra(base(css), ".indice h1 + p")).toMatch(/max-width: 24em;/);
  });

  it("a linha de apoio quebra como no desenho, sem palavra sozinha na última linha", () => {
    /* O desenho põe `text-wrap: pretty` em todo `p`. Sem ele, a 1440, 1024
       e 768px a linha de apoio terminava em "atende." sozinho. Ele vem do
       `.texto` da busca, que a linha de apoio usa, e não se repete aqui. */
    const busca = semNotas(fonte("../components/busca/FaixaDaBusca.module.css"));
    expect(regra(base(busca), ".texto")).toMatch(/text-wrap: pretty;/);
    expect(css).not.toContain("text-wrap");
  });

  it("o campo na largura da coluna, até 760px abaixo de 1180px", () => {
    expect(regra(base(css), ".campo")).toMatch(/width: 100%;/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".campo")).toMatch(/max-width: 760px;/);
  });
});

describe("o CSS da grade de especialidades", () => {
  const css = semNotas(fonte("../components/especialidades/GradeDeEspecialidades.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("4 por linha, 3 até 1179px, 2 até 980px e 2 no celular", () => {
    expect(regra(base(css), ".grade")).toMatch(/grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".grade")).toMatch(/repeat\(3, minmax\(0, 1fr\)\)/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".grade")).toMatch(/repeat\(2, minmax\(0, 1fr\)\)/);
    expect(regra(cel(), ".grade")).toMatch(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    expect(regra(cel(), ".grade")).toMatch(/gap: 10px;/);
  });

  it("todos os cartões com a mesma altura, e a contagem presa ao pé", () => {
    expect(regra(base(css), ".grade")).toMatch(/grid-auto-rows: 1fr;/);
    expect(regra(base(css), ".cartao")).toMatch(/flex-direction: column;/);
    expect(regra(base(css), ".pe")).toMatch(/margin-top: auto;/);
  });

  it("o anel de foco vai no cartão só onde há :has; sem ele, o nome fica com o anel dele", () => {
    const comHas = bloco(css, "@supports selector(:has(*))");
    expect(regra(comHas, ".nome a:focus-visible")).toMatch(/outline: none;/);
    expect(regra(comHas, ".cartao:has(.nome a:focus-visible)")).toMatch(
      /outline: 2px solid var\(--color-ami-green-600\);/,
    );
    /* Fora do @supports, nenhum `outline: none`: um navegador sem `:has`
       apagaria o anel do nome sem pôr o do cartão. */
    expect(css.replace(comHas, "")).not.toContain("outline: none");
  });

  it("o cartão inteiro leva à especialidade: o link do nome se estica por ele", () => {
    const r = regra(base(css), ".nome a::after");
    expect(r).toMatch(/inset: 0;/);
    expect(r).toMatch(/z-index: 1;/);
    expect(regra(base(css), ".cartao")).toMatch(/position: relative;/);
  });

  it("no mouse: borda mais escura, sombra neutra e 1px de subida; nada verde", () => {
    const r = regra(base(css), ".cartao:hover");
    expect(r).toMatch(/translateY\(-1px\)/);
    expect(r).toMatch(/border-color: var\(--color-line-strong\);/);
    expect(r).toMatch(/rgba\(16, 24, 40, 0\.09\)/);
    expect(r).not.toMatch(/lima|green/);
    expect(regra(base(css), ".cartao:hover .seta")).toMatch(/border-color: var\(--color-line-strong\);/);
  });

  it("no celular: cartões compactos, ladrilho de 40px e a frase curta da ordem", () => {
    expect(regra(cel(), ".cartao")).toMatch(/padding: 16px 16px 14px;/);
    expect(regra(cel(), ".cartao :global(.ladrilho-icone)")).toMatch(/width: 40px;/);
    expect(regra(cel(), ".nome")).toMatch(/font-size: 17px;/);
    expect(regra(base(css), ".ordemCurta")).toMatch(/display: none;/);
    expect(regra(cel(), ".ordemLonga")).toMatch(/display: none;/);
    expect(regra(cel(), ".ordemCurta")).toMatch(/display: inline;/);
  });
});
