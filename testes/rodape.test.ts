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

  it("os links das colunas, com seus destinos, nesta ordem", () => {
    const links = [...ROD.matchAll(/<Link href="([^"]+)">([^<]+)<\/Link>/g)].map((m) => [m[2], m[1]]);
    expect(links).toEqual([
      ["Quem somos", "/associacao"],
      ["Diretoria", "/associacao/diretoria"],
      ["Notícias", "/noticias"],
      ["Seja associado", "/associacao/seja-associado"],
      ["Sua AMI", "/#sua-ami"],
      ["Buscar", "/busca"],
      ["Especialidades", "/medicos"],
      ["Bairros", "/busca"],
    ]);
  });

  it("os tres links legais, com seus destinos, nesta ordem", () => {
    const legais = [...ROD.matchAll(/rotulo: "([^"]+)", href: "([^"]+)"/g)].map((m) => [m[1], m[2]]);
    expect(legais).toEqual([
      ["Política de privacidade", "/politica-de-privacidade"],
      ["Termos de uso", "/termos-de-uso"],
      ["Política de cookies", "/politica-de-cookies"],
    ]);
  });

  it("os contatos ligam de verdade: telefone, Instagram e CEP vem de lib/ami.ts", () => {
    expect(ROD).toContain("href={hrefTelefone(t)}");
    expect(ROD).toContain("href={AMI.redes.instagram}");
    expect(ROD).toContain("{AMI.endereco.cep}");
  });

  it("o brilho e enfeite: fica fora da arvore de acessibilidade", () => {
    expect(ROD).toMatch(/className=\{`brilho \$\{styles\.luz\}`\} aria-hidden/);
  });

  /*
    A cor do texto do corpo é 92% de branco, e NÃO os 82% do desenho aprovado.
    Foi decisão: a luz do canto passa por baixo do texto, e no ponto mais claro
    do fundo 82% dava 4,04:1 (abaixo dos 4,5:1 do AA) e 92% dá 4,60:1, calculado
    à mão. Quem quiser voltar aos 82% do desenho precisa medir de novo antes de
    mexer neste número; o texto de baixo (`.base`, 70%) tem a mesma amarra.
  */
  it("o texto do corpo e branco a 92%, nao 82%, por contraste", () => {
    expect(regra(CSS_ROD, ".rodape")).toMatch(/color:\s*rgba\(255, 255, 255, 0\.92\)/);
    expect(regra(CSS_ROD, ".base")).toMatch(/color:\s*rgba\(255, 255, 255, 0\.7\)/);
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

  it("o observador le a entrada, e a decisao recebe o que ele leu", () => {
    expect(BARRA).toContain("buscaNaTela = entradas[0].isIntersecting");
    expect(BARRA).toContain("deveMostrarBarra(passou, buscaNaTela)");
    expect(BARRA).toContain("observador?.observe(blocoDeBusca!)");
  });

  it("a classe que mostra a barra e posta quando ela deve aparecer", () => {
    expect(BARRA).toContain("visivel ? styles.visivel");
  });

  it("o ouvinte de rolagem entra e sai em par", () => {
    expect(BARRA).toContain('window.addEventListener("scroll", atualizar, { passive: true })');
    expect(BARRA).toContain('window.removeEventListener("scroll", atualizar)');
  });

  it("o toque na home foca o campo", () => {
    expect(BARRA).toContain("onClick={focarOCampo}");
  });

  it("o efeito se refaz a cada pagina: o layout persiste entre elas", () => {
    expect(BARRA).toMatch(/\},\s*\[caminho\]\);/);
  });

  it("o link de ligar diz para quem liga", () => {
    expect(BARRA).toContain('aria-label="Ligar para a AMI"');
  });

  it("escondida some so depois da animacao; ao aparecer, na hora", () => {
    expect(regra(noCelular(CSS_BARRA), ".barra")).toMatch(/visibility 0s linear 0\.45s/);
    expect(regra(noCelular(CSS_BARRA), ".visivel")).toMatch(/transition-delay:\s*0s/);
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
