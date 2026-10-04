import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CartaoMedico, SIZES_DO_CARTAO } from "@/components/diretorio/CartaoMedico";
import { FotoDoMedico } from "@/components/diretorio/FotoDoMedico";
import { GradeMedicos } from "@/components/diretorio/GradeMedicos";
import estilosCartao from "@/components/diretorio/CartaoMedico.module.css";
import estilosFoto from "@/components/diretorio/FotoDoMedico.module.css";
import estilosGrade from "@/components/diretorio/GradeMedicos.module.css";
import type { LocalAtendimento, Medico } from "@/lib/dados/tipos";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";

/*
  O cartão do médico, a foto e a grade, no HTML de servidor. O CSS só se lê
  do arquivo (quem aplica é o navegador); a altura igual dos "Ligar" de uma
  fileira é medida pela auditoria (scripts/auditoria-visual.js).
*/

const CSS_CARTAO = semNotas(fonte("../components/diretorio/CartaoMedico.module.css"));
const CSS_FOTO = semNotas(fonte("../components/diretorio/FotoDoMedico.module.css"));
const CSS_GRADE = semNotas(fonte("../components/diretorio/GradeMedicos.module.css"));

function local(id: number, extra: Partial<LocalAtendimento> = {}): LocalAtendimento {
  return {
    id,
    logradouro: "Rua Projetada 114",
    numero: "198",
    bairro: { id, nome: "Juçara", slug: "jucara" },
    telefone: null,
    whatsapp: null,
    estacionamento: true,
    acessibilidade: ["acesso_cadeirante"],
    ...extra,
  };
}

const ALINE: Medico = {
  id: 1,
  slug: "aline-peixoto",
  nome: "Aline Peixoto",
  crm: "11918",
  crmUf: "MA",
  foto: null,
  bio: null,
  telemedicina: true,
  associadoAmi: true,
  especialidades: [{ nome: "Neurologia", slug: "neurologia", rqe: "12222", principal: true }],
  locais: [local(1), local(2, { telefone: "(99) 3018-9994" })],
};

/** O texto que aparece, sem tags nem os comentários que o React põe entre textos. */
function visivel(html: string): string[] {
  return html
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
}

const classes = (tag: string) => (/class="([^"]+)"/.exec(tag)?.[1] ?? "").split(" ");

describe("a foto do médico", () => {
  it("sem foto: as iniciais sobre o verde com textura e a luz, fora do leitor de tela", () => {
    const html = renderToString(
      createElement(FotoDoMedico, { nome: "Diego Aragão", foto: null, alt: "", sizes: "116px" }),
    );
    const abre = /^<div [^>]*>/.exec(html)![0];
    expect(abre).toContain('aria-hidden="true"');
    expect(classes(abre)).toEqual(expect.arrayContaining(["textura-verde", estilosFoto.foto, estilosFoto.semFoto]));
    expect(html).toContain('<div class="brilho"></div>');
    expect(html).toContain(`<span class="${estilosFoto.iniciais}">DA</span>`);
    expect(html).not.toContain("<img");
  });

  it("com foto: a imagem com sizes, largura e altura, preguiçosa por padrão", () => {
    const html = renderToString(
      createElement(FotoDoMedico, {
        nome: "Aline Peixoto",
        foto: "https://exemplo.test/aline.jpg",
        alt: "Retrato de Aline Peixoto",
        sizes: "280px",
        className: "x",
      }),
    );
    const abre = /^<div [^>]*>/.exec(html)![0];
    expect(classes(abre)).toEqual(expect.arrayContaining([estilosFoto.foto, estilosFoto.comFoto, "x"]));
    expect(abre).not.toContain("aria-hidden");
    const img = /<img [^>]*>/.exec(html)![0];
    for (const attr of [
      'src="https://exemplo.test/aline.jpg"',
      'alt="Retrato de Aline Peixoto"',
      'sizes="280px"',
      'width="400"',
      'height="500"',
      'loading="lazy"',
      'decoding="async"',
    ]) {
      expect(img, attr).toContain(attr);
    }
    expect(html).not.toContain(">AP<");
  });

  it("imediata: sem loading lazy; primeira: com prioridade alta", () => {
    const foto = { nome: "A B", foto: "https://exemplo.test/a.jpg", alt: "", sizes: "1px" };
    const imediata = renderToString(createElement(FotoDoMedico, { ...foto, carga: "imediata" }));
    expect(imediata).not.toContain("loading=");
    /* O React 19 escreve o atributo como `fetchPriority` (o HTML não liga
       para maiúsculas): a procura ignora a caixa, senão a negativa passaria
       à toa. */
    expect(imediata).not.toMatch(/fetchpriority/i);
    const primeira = renderToString(createElement(FotoDoMedico, { ...foto, carga: "primeira" }));
    expect(primeira).toMatch(/<img [^>]*fetchpriority="high"/i);
    expect(primeira).not.toContain("loading=");
  });
});

describe("o cartão do médico", () => {
  const html = renderToString(createElement(CartaoMedico, { medico: ALINE }));

  it("só foto, nome, MÉDICO · CRM, especialidade com RQE e Ligar", () => {
    /* O primeiro texto são as iniciais, no espaço da foto (Aline não tem foto). */
    expect(visivel(html)).toEqual([
      "AP",
      "Aline Peixoto",
      "MÉDICO · CRM/MA 11918",
      "Neurologia",
      "RQE 12222",
      "Ligar",
    ]);
  });

  it("nada de selo, bairro, telemedicina, acessibilidade ou outros endereços", () => {
    for (const fora of ["Associado", "Juçara", "elemedicina", "cadeirante", "Estacionamento", "endereço"]) {
      expect(html, fora).not.toContain(fora);
    }
  });

  it("o nome é o link do perfil, e é ele que estica o alvo pelo cartão", () => {
    expect(html).toMatch(
      new RegExp(`<h3 class="${estilosCartao.nome}"><a href="/medico/aline-peixoto">Aline Peixoto</a></h3>`),
    );
    expect(regra(base(CSS_CARTAO), ".nome a::after")).toMatch(/inset: 0/);
    expect(regra(base(CSS_CARTAO), ".nome a::after")).toMatch(/z-index: 1/);
  });

  it("Ligar liga para o primeiro consultório com telefone, por cima do link do cartão", () => {
    const ligar = /<a [^>]*data-ligar=""[^>]*>/.exec(html)![0];
    expect(ligar).toContain('href="tel:+559930189994"');
    expect(ligar).toContain('aria-label="Ligar para Aline Peixoto, (99) 3018-9994"');
    expect(classes(ligar)).toEqual(["botao", estilosCartao.ligar]);
    expect(regra(base(CSS_CARTAO), ".ligar")).toMatch(/z-index: 2/);
  });

  it("sem telefone: sem Ligar, e o espaço do botão continua lá", () => {
    const sem = renderToString(
      createElement(CartaoMedico, { medico: { ...ALINE, locais: [local(1)] } }),
    );
    expect(sem).not.toContain("tel:");
    expect(sem).not.toContain(">Ligar");
    expect(sem).toContain(`<div class="${estilosCartao.semLigar}" aria-hidden="true" data-ligar=""></div>`);
  });

  it("sem especialidade, sem a linha dela", () => {
    const sem = renderToString(createElement(CartaoMedico, { medico: { ...ALINE, especialidades: [] } }));
    expect(sem).not.toContain(`class="${estilosCartao.esp}"`);
  });

  it("a foto do cartão tem alt vazio (o nome está ao lado) e o sizes da grade", () => {
    const comFoto = renderToString(
      createElement(CartaoMedico, { medico: { ...ALINE, foto: "https://exemplo.test/a.jpg" } }),
    );
    const img = /<img [^>]*>/.exec(comFoto)![0];
    expect(img).toContain('alt=""');
    expect(img).toContain(`sizes="${SIZES_DO_CARTAO}"`);
    expect(img).toContain('loading="lazy"');
    const imediata = renderToString(
      createElement(CartaoMedico, { medico: { ...ALINE, foto: "https://exemplo.test/a.jpg" }, imediata: true }),
    );
    expect(imediata).not.toContain("loading=");
  });
});

describe("a grade", () => {
  const comFoto = (id: number): Medico => ({ ...ALINE, id, slug: `m${id}`, foto: `https://exemplo.test/${id}.jpg` });

  it("um <ul> com um cartão por médico", () => {
    const html = renderToString(createElement(GradeMedicos, { medicos: [comFoto(1), comFoto(2)] }));
    expect(html).toMatch(new RegExp(`^<ul class="${estilosGrade.grade}">`));
    expect(html.match(/<li /g)).toHaveLength(2);
  });

  it("os primeiros `imediatos` sem espera; o resto, preguiçoso", () => {
    const html = renderToString(
      createElement(GradeMedicos, { medicos: [comFoto(1), comFoto(2), comFoto(3)], imediatos: 2 }),
    );
    expect(html.match(/loading="lazy"/g)).toHaveLength(1);
  });
});

describe("o CSS do cartão e da grade", () => {
  it("4 por linha no computador, 3 até 1179px, 2 até 980px, 1 no celular", () => {
    expect(regra(base(CSS_GRADE), ".grade")).toMatch(/grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
    expect(regra(bloco(CSS_GRADE, "@media (max-width: 1180px)"), ".grade")).toMatch(/repeat\(3, minmax\(0, 1fr\)\)/);
    expect(regra(bloco(CSS_GRADE, "@media (max-width: 980px)"), ".grade")).toMatch(/repeat\(2, minmax\(0, 1fr\)\)/);
    expect(regra(bloco(CSS_GRADE, "@media (max-width: 700px)"), ".grade")).toMatch(/grid-template-columns: 1fr/);
  });

  it("retrato no computador: foto 4:5 em cima, Ligar no pé, na mesma altura em toda fileira", () => {
    expect(regra(base(CSS_CARTAO), ".medico")).toMatch(/flex-direction: column/);
    expect(regra(base(CSS_CARTAO), ".foto")).toMatch(/aspect-ratio: 4 \/ 5/);
    expect(regra(base(CSS_CARTAO), ".ligar")).toMatch(/margin-top: auto/);
    expect(regra(base(CSS_CARTAO), ".ligar")).toMatch(/height: 44px/);
    expect(regra(base(CSS_CARTAO), ".semLigar")).toMatch(/margin-top: auto/);
    expect(regra(base(CSS_CARTAO), ".semLigar")).toMatch(/height: 44px/);
  });

  it("deitado no celular: foto de 116px na lateral, de cima a baixo; 112px a 380px", () => {
    const cel = bloco(CSS_CARTAO, "@media (max-width: 700px)");
    expect(regra(cel, ".medico")).toMatch(/flex-direction: row/);
    expect(regra(cel, ".foto")).toMatch(/width: 116px/);
    expect(regra(cel, ".foto")).toMatch(/align-self: stretch/);
    expect(regra(cel, ".ligar")).toMatch(/height: 40px/);
    expect(regra(cel, ".semLigar")).toMatch(/height: 40px/);
    expect(regra(bloco(CSS_CARTAO, "@media (max-width: 380px)"), ".foto")).toMatch(/width: 112px/);
  });

  it("o sizes do cartão segue as mesmas larguras", () => {
    expect(SIZES_DO_CARTAO).toContain("(max-width: 380px) 112px");
    expect(SIZES_DO_CARTAO).toContain("(max-width: 700px) 116px");
    expect(SIZES_DO_CARTAO.endsWith(", 280px")).toBe(true);
  });

  it("as iniciais em Bricolage, na cor lima, no tamanho que quem usa decide", () => {
    const r = regra(base(CSS_FOTO), ".iniciais");
    expect(r).toMatch(/font-family: var\(--font-titulo\)/);
    expect(r).toMatch(/color: var\(--color-ami-lima-400\)/);
    expect(r).toMatch(/font-size: var\(--tamanho-iniciais, 96px\)/);
    expect(regra(base(CSS_CARTAO), ".foto")).toMatch(/--tamanho-iniciais: 96px/);
    expect(regra(bloco(CSS_CARTAO, "@media (max-width: 700px)"), ".foto")).toMatch(/--tamanho-iniciais: 42px/);
  });

  it("no mouse o cartão sobe com sombra neutra; nenhum verde claro", () => {
    expect(regra(base(CSS_CARTAO), ".medico:hover")).toMatch(/translateY\(-3px\)/);
    expect(regra(base(CSS_CARTAO), ".medico:hover")).not.toMatch(/lima|green/);
  });
});

describe("a especialidade que o cartão mostra", () => {
  /* Aline, principal Neurologia, com Ortopedia como secundária: o exemplo da
     spec de Especialidades, seção 2.3. */
  const ALINE_DUAS: Medico = {
    ...ALINE,
    especialidades: [
      { nome: "Neurologia", slug: "neurologia", rqe: "12222", principal: true },
      { nome: "Ortopedia e Traumatologia", slug: "ortopedia-e-traumatologia", rqe: "30111", principal: false },
    ],
  };

  it("sem especialidade pedida (a busca e o perfil): a principal, com o RQE dela", () => {
    const html = renderToString(createElement(CartaoMedico, { medico: ALINE_DUAS }));
    expect(visivel(html)).toEqual(["AP", "Aline Peixoto", "MÉDICO · CRM/MA 11918", "Neurologia", "RQE 12222", "Ligar"]);
    expect(html).not.toContain("Ortopedia");
  });

  it("na página de uma especialidade que o médico tem: a dela, com o RQE dela", () => {
    const html = renderToString(
      createElement(CartaoMedico, { medico: ALINE_DUAS, especialidade: "ortopedia-e-traumatologia" }),
    );
    expect(visivel(html)).toEqual([
      "AP",
      "Aline Peixoto",
      "MÉDICO · CRM/MA 11918",
      "Ortopedia e Traumatologia",
      "RQE 30111",
      "Ligar",
    ]);
  });

  it("a grade passa a especialidade da página a todos os cartões", () => {
    const html = renderToString(
      createElement(GradeMedicos, {
        medicos: [ALINE_DUAS, { ...ALINE_DUAS, id: 2, slug: "outra-aline" }],
        especialidade: "ortopedia-e-traumatologia",
      }),
    );
    expect(html.match(/>Ortopedia e Traumatologia</g)).toHaveLength(2);
    expect(html).not.toContain("Neurologia");
  });
});
