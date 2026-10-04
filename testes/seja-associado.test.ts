import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { DeviceMobile, MapPin, Phone, PhoneCall } from "@phosphor-icons/react/dist/ssr";
import { FaleComAmi } from "@/components/associacao/FaleComAmi";
import estilos from "@/components/editorial/PaginaDeTexto.module.css";
import { SEJA_ASSOCIADO } from "@/lib/rascunhosLegais";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  Seja associado: o rascunho em código, a página renderizada nas duas chaves
  de demonstração (com o Sanity trocado por um dublê) e o quadro "Fale com
  a AMI". Os dados da entidade vêm de lib/ami.ts.
*/

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const dados = vi.hoisted(() => ({ paginas: {} as Record<string, unknown> }));

vi.mock("@/lib/sanity/consultas", () => ({
  paginaPorSlug: async (slug: string) => dados.paginas[slug] ?? null,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  dados.paginas = {};
});

async function pagina(slug: string, chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const { default: Pagina } = await import("@/app/(site)/associacao/[pagina]/page");
  return htmlDe(await Pagina({ params: Promise.resolve({ pagina: slug }) }));
}

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const DOC = {
  titulo: "Seja associado",
  slug: "seja-associado",
  resumo: "O texto da AMI.",
  atualizadoEm: "2026-11-01T12:00:00Z",
  corpo: [
    {
      _type: "block",
      _key: "a",
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s", text: "Texto escrito pela AMI.", marks: [] }],
    },
  ],
};

describe("o rascunho de Seja associado", () => {
  it("as três seções, na ordem do desenho", () => {
    expect(SEJA_ASSOCIADO.secoes.map((s) => s.titulo)).toEqual([
      "O que é a AMI",
      "Quem pode se associar",
      "Como se associar",
    ]);
  });

  it("O que é a AMI: uma frase e a lista Dados da entidade, com os mesmos dados de antes", () => {
    expect(SEJA_ASSOCIADO.secoes[0]).toEqual({
      titulo: "O que é a AMI",
      paragrafos: ["A Associação Médica de Imperatriz está em atividade desde 1975."],
      tituloDaLista: "Dados da entidade",
      lista: [
        "Associação privada.",
        "Inscrita no CNPJ sob o número 06.651.376/0001-42.",
        "Sede na Rua Coriolano Milhomem, 39, Centro, Imperatriz - MA, CEP 65900-330.",
      ],
    });
  });

  it("o que falta está marcado, com a frase do desenho", () => {
    expect(SEJA_ASSOCIADO.secoes[1].paragrafos).toEqual([
      "A associação é aberta a médicos com inscrição regular no Conselho Regional de Medicina.",
      "[PROVISÓRIO] Valor de anuidade, benefícios do quadro associativo e demais critérios de admissão: texto da AMI a entrar.",
    ]);
  });
});

describe("a página, renderizada", () => {
  it("o h2 com a âncora, a frase, o subtítulo e a lista", async () => {
    const html = await pagina("seja-associado", "false");
    expect(html).toContain(
      '<h2 id="secao-o-que-e-a-ami">O que é a AMI</h2>' +
        "<p>A Associação Médica de Imperatriz está em atividade desde 1975.</p>" +
        "<h3>Dados da entidade</h3>" +
        "<ul><li>Associação privada.</li>" +
        `<li>Inscrita no CNPJ sob o número <span class="${estilos.inteiro}">06.651.376/0001-42</span>.</li>` +
        `<li>Sede na Rua Coriolano Milhomem, 39, Centro, Imperatriz - MA, CEP <span class="${estilos.inteiro}">65900-330</span>.</li></ul>`,
    );
  });

  it("os telefones de Como se associar não quebram no meio, como no desenho", async () => {
    const html = await pagina("seja-associado", "false");
    expect(html).toContain(
      `<p>Pelo telefone <span class="${estilos.inteiro}">(99) 3524-3716</span> ou ` +
        `<span class="${estilos.inteiro}">(99) 98802-0205</span>, ou presencialmente na sede`,
    );
  });

  it("na demonstração, a moldura a entrar, sem a marca", async () => {
    const html = await pagina("seja-associado", "true");
    expect(html).toContain(
      `<p class="${estilos.falta}" data-a-entrar="">Valor de anuidade, benefícios do quadro associativo e demais critérios de admissão: texto da AMI a entrar.</p>`,
    );
  });

  it("fora dela, sem a moldura", async () => {
    const html = await pagina("seja-associado", "false");
    expect(html).not.toContain("data-a-entrar");
    expect(html).not.toContain("Valor de anuidade");
  });

  it("nenhum PROVISÓRIO, nos dois modos", async () => {
    for (const chave of ["true", "false"]) {
      expect(await pagina("seja-associado", chave), chave).not.toContain("PROVISÓRIO");
    }
  });

  it("o quadro Fale com a AMI fecha a coluna, nos dois modos, e também com o texto do Studio", async () => {
    for (const chave of ["true", "false"]) {
      expect(await pagina("seja-associado", chave), chave).toMatch(/data-fale-com-ami=""[\s\S]*<\/div><\/div><\/article>/);
    }
    dados.paginas["seja-associado"] = DOC;
    const doStudio = await pagina("seja-associado", "false");
    expect(doStudio).toContain("<p>Texto escrito pela AMI.</p>");
    expect(doStudio).toContain('data-fale-com-ami=""');
  });

  it("as outras páginas de texto não têm o quadro", async () => {
    dados.paginas.estatuto = { ...DOC, titulo: "Estatuto", slug: "estatuto" };
    expect(await pagina("estatuto", "true")).not.toContain("data-fale-com-ami");
  });
});

describe("o quadro Fale com a AMI", () => {
  const html = renderToString(createElement(FaleComAmi));

  it("o ícone num ladrilho branco, o título e a frase", () => {
    expect(html).toMatch(
      new RegExp(
        `^<div class="${estilos.chamada}" data-fale-com-ami="">` +
          `<span class="ladrilho-icone ladrilho-icone--pequeno" aria-hidden="true">`,
      ),
    );
    expect(html).toContain(desenho(PhoneCall, 23, "duotone"));
    expect(html).toContain("<div><h3>Fale com a AMI</h3><p>Pelo telefone ou na sede, no Centro de Imperatriz.</p></div>");
  });

  it("Ligar para o fixo, o celular e Como chegar, nessa ordem", () => {
    const links = [...html.matchAll(/<a class="([^"]+)" href="([^"]+)" aria-label="([^"]+)">([\s\S]*?)<\/a>/g)];
    expect(links.map((m) => [m[1], m[2], m[3], tela(m[4])])).toEqual([
      ["botao", "tel:+559935243716", "Ligar para a AMI, (99) 3524-3716", "Ligar (99) 3524-3716"],
      ["botao-contorno", "tel:+5599988020205", "Ligar para a AMI, (99) 98802-0205", "(99) 98802-0205"],
      [
        "botao-contorno",
        "https://www.google.com/maps/search/?api=1&amp;query=Rua%20Coriolano%20Milhomem%2C%2039%2C%20Centro%2C%20Imperatriz%20-%20MA%2C%2065900-330",
        "Como chegar à sede da AMI (abre o mapa)",
        "Como chegar",
      ],
    ]);
    expect(links[0][4].startsWith(desenho(Phone, 20, "regular"))).toBe(true);
    expect(links[1][4].startsWith(desenho(DeviceMobile, 20, "regular"))).toBe(true);
    expect(links[2][4].startsWith(desenho(MapPin, 20, "regular"))).toBe(true);
    expect(html).toContain(`<span class="${estilos.numero}">(99) 3524-3716</span>`);
    expect(html).toContain(`<span class="${estilos.numero}">(99) 98802-0205</span>`);
  });

  it("sem WhatsApp, enquanto a AMI não confirmar o número", () => {
    expect(html).not.toMatch(/whatsapp|wa\.me/i);
  });
});

describe("o CSS do quadro", () => {
  const css = semNotas(fonte("../components/editorial/PaginaDeTexto.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("no fundo da página, a 40px do texto, com o ícone à esquerda e os botões embaixo", () => {
    const r = regra(base(css), ".coluna .chamada");
    expect(r).toMatch(/margin-top: 40px;/);
    expect(r).toMatch(/background: var\(--color-canvas\);/);
    expect(r).toMatch(/grid-template-columns: 44px minmax\(0, 1fr\);/);
    expect(regra(base(css), ".chamada :global(.ladrilho-icone)")).toMatch(/background: var\(--color-surface\);/);
    expect(regra(base(css), ".chamada .acoes")).toMatch(/grid-column: 1 \/ -1;/);
  });

  it("no celular, um botão por linha, na largura toda", () => {
    expect(regra(cel(), ".chamada .acoes")).toMatch(/grid-template-columns: 1fr;/);
    expect(regra(cel(), ".chamada .acoes > a")).toMatch(/width: 100%;/);
    expect(regra(cel(), ".chamada .acoes > a")).toMatch(/height: 46px;/);
  });
});
