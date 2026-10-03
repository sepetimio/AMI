import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Carrossel } from "@/components/home/Carrossel";
import { ServicosDaAmi } from "@/components/home/ServicosDaAmi";
import { BANNERS_PROVISORIOS } from "@/lib/molduras";
import type { Banner } from "@/lib/sanity/tipos";

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

  it("com ele, a grade passa a 2 por linha no tablet e 4 no computador", () => {
    expect(com).toContain("grid gap-4 md:grid-cols-2 lg:grid-cols-4");
  });

  it("sem ele, o cartão some e a grade volta a ser a de três", () => {
    expect(sem).not.toContain("Sua AMI");
    expect(sem).not.toContain("a entrar");
    expect(sem).toContain("grid gap-4 md:grid-cols-3");
  });
});
