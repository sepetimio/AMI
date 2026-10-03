import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";
import {
  ROLAGEM_SEM_CARROSSEL,
  destinoDaBusca,
  deveMostrarBarra,
  passouDoTopo,
} from "@/lib/barra-do-pe";

const ROD = semComentarios(fonte("../components/layout/Rodape.tsx"));
const BARRA = semComentarios(fonte("../components/layout/BarraDoPe.tsx"));
const LAYOUT = semComentarios(fonte("../app/(site)/layout.tsx"));
const LF = (css: string) => css.replaceAll("\r\n", "\n");
const CSS_ROD = LF(fonte("../components/layout/Rodape.module.css"));
const CSS_BARRA = LF(fonte("../components/layout/BarraDoPe.module.css"));

/* O corpo de uma regra `seletor { ... }` de um CSS, para a asserção olhar a
   regra certa e não o arquivo todo. */
function regra(css: string, seletor: string): string {
  const ini = css.indexOf(`${seletor} {`);
  expect(ini, `falta a regra ${seletor}`).toBeGreaterThan(-1);
  return css.slice(ini, css.indexOf("}", ini));
}

/* Tudo o que vem depois de `@media (max-width: 700px) {` até o fim do
   arquivo: nos dois CSS esse é o último bloco, e o que está dentro vale só
   no celular. */
function noCelular(css: string): string {
  const ini = css.indexOf("@media (max-width: 700px) {");
  expect(ini, "falta o @media (max-width: 700px)").toBeGreaterThan(-1);
  return css.slice(ini);
}

describe("o rodape", () => {
  it("tem as tres colunas do desenho", () => {
    for (const t of ["A Associação", "Encontre um médico", "Fale com a AMI"]) {
      expect(ROD).toContain(t);
    }
  });

  it("le endereco, telefones e CNPJ de lib/ami.ts, nao escreve a mao", () => {
    expect(ROD).toContain("AMI.endereco");
    expect(ROD).toContain("AMI.telefones");
    expect(ROD).toContain("AMI.cnpj");
    expect(ROD).not.toMatch(/3524-3716/);
  });

  it("mantem o aviso de demonstracao e o aviso informativo", () => {
    /* A trava decide se o aviso sai: não basta importá-la. */
    expect(ROD).toMatch(/\{DADOS_DEMONSTRACAO \?[\s\S]*?fictícios/);
    expect(ROD).toContain("não substitui a consulta");
  });

  it("mantem os tres links legais", () => {
    for (const h of ["/politica-de-privacidade", "/termos-de-uso", "/politica-de-cookies"]) {
      expect(ROD).toContain(h);
    }
  });

  it("tem a textura do verde e a luz que passeia", () => {
    expect(ROD).toContain("textura-verde");
    expect(ROD).toMatch(/className=\{`brilho /);
  });

  it("as listas longas de especialidades e bairros sairam; o indice /medicos fica", () => {
    expect(ROD).not.toContain("especialidadesComContagem");
    expect(ROD).not.toContain("bairrosComContagem");
    expect(ROD).toContain('href="/medicos"');
  });

  it("emenda no bloco de cima com a regua de ritmo", () => {
    expect(regra(CSS_ROD, ".rodape")).toMatch(/margin-top:\s*var\(--ritmo\)/);
  });

  it("no celular deixa 100px mais a area segura embaixo, para a barra nao cobrir o fim", () => {
    expect(regra(noCelular(CSS_ROD), ".rodape")).toMatch(
      /padding:\s*44px 0 calc\(100px \+ env\(safe-area-inset-bottom\)\)/,
    );
  });

  it("passar o mouse nos links deixa branco, nao verde", () => {
    const r = regra(CSS_ROD, ".coluna a:hover,\n.base a:hover");
    expect(r).toContain("var(--color-white)");
    expect(r).not.toMatch(/lima|green/);
  });

  it("nao ha cor em codigo hexadecimal: so tokens e branco translucido", () => {
    expect(CSS_ROD).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe("a barra do pe", () => {
  it("existe em todas as paginas publicas, depois do rodape", () => {
    expect(LAYOUT).toContain("<BarraDoPe");
    expect(LAYOUT.indexOf("<BarraDoPe")).toBeGreaterThan(LAYOUT.indexOf("<Rodape"));
  });

  it("leva a busca da home na home e a /busca fora dela", () => {
    expect(BARRA).toContain('href="#encontre"');
    expect(BARRA).toContain('href="/busca"');
    expect(BARRA).toContain('destino === "#encontre"');
    expect(destinoDaBusca("/")).toBe("#encontre");
    expect(destinoDaBusca("/medicos")).toBe("/busca");
    expect(destinoDaBusca("/busca")).toBe("/busca");
    expect(destinoDaBusca("/noticias/uma-materia")).toBe("/busca");
  });

  it("liga pelo telefone de lib/ami.ts", () => {
    expect(BARRA).toContain("hrefTelefone");
    expect(BARRA).toContain("AMI.telefones[0]");
  });

  it("depois do pulo, foca o campo de busca, 600ms depois", () => {
    expect(BARRA).toMatch(/ESPERA_DO_PULO_MS = 600/);
    expect(BARRA).toContain("#encontre input");
    expect(BARRA).toMatch(/\.focus\(\{ preventScroll: true \}\)/);
  });

  it("some enquanto a busca esta na tela: observador com limiar de 20%", () => {
    expect(BARRA).toContain("IntersectionObserver");
    expect(BARRA).toMatch(/threshold: 0\.2/);
  });

  it("aceita a ausencia do carrossel e do bloco de busca", () => {
    expect(BARRA).toContain('[data-bloco="carrossel"]');
    expect(BARRA).toMatch(/carrossel \? carrossel\.getBoundingClientRect\(\)\.bottom : null/);
    expect(BARRA).toMatch(/blocoDeBusca\s*\? new IntersectionObserver/);
  });

  it("desfaz o observador e o ouvinte de rolagem ao sair", () => {
    expect(BARRA).toContain("observador?.disconnect()");
    expect(BARRA).toMatch(/removeEventListener\("scroll", atualizar\)/);
  });

  it("e um nav com nome, para o leitor de tela", () => {
    expect(BARRA).toMatch(/<nav\s+aria-label="Atalhos"/);
  });

  it("so existe abaixo de 700px", () => {
    expect(regra(CSS_BARRA, ".barra")).toMatch(/display:\s*none/);
    expect(regra(noCelular(CSS_BARRA), ".barra")).toMatch(/display:\s*flex/);
  });

  it("respeita a area segura do aparelho", () => {
    expect(regra(noCelular(CSS_BARRA), ".barra")).toMatch(
      /bottom:\s*calc\(12px \+ env\(safe-area-inset-bottom\)\)/,
    );
  });

  it("escondida, nao recebe foco do teclado", () => {
    const r = regra(noCelular(CSS_BARRA), ".barra");
    expect(r).toMatch(/transform:\s*translateY\(150%\)/);
    expect(r).toMatch(/visibility:\s*hidden/);
    expect(regra(noCelular(CSS_BARRA), ".visivel")).toMatch(/visibility:\s*visible/);
  });

  it("nao ha cor em codigo hexadecimal: so tokens e branco translucido", () => {
    expect(CSS_BARRA).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe("quando a barra do pe aparece", () => {
  it("sem carrossel, depois de 600px de rolagem", () => {
    expect(ROLAGEM_SEM_CARROSSEL).toBe(600);
    expect(passouDoTopo(null, 0)).toBe(false);
    expect(passouDoTopo(null, 600)).toBe(false);
    expect(passouDoTopo(null, 601)).toBe(true);
  });

  it("com carrossel, quando o fundo dele sobe acima do topo da janela", () => {
    expect(passouDoTopo(300, 5000)).toBe(false);
    expect(passouDoTopo(0, 5000)).toBe(false);
    expect(passouDoTopo(-1, 0)).toBe(true);
  });

  it("some enquanto a busca esta na tela, mesmo depois de passar do topo", () => {
    expect(deveMostrarBarra(true, false)).toBe(true);
    expect(deveMostrarBarra(true, true)).toBe(false);
    expect(deveMostrarBarra(false, false)).toBe(false);
    expect(deveMostrarBarra(false, true)).toBe(false);
  });
});
