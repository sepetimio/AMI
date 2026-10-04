import { describe, expect, it } from "vitest";
import {
  LIMITE_DE_OUTROS,
  consultorioPrincipal,
  enderecoDoLocal,
  especialidadeDoCartao,
  especialidadePrincipal,
  iniciais,
  linkDoMapa,
  linkDoWhatsapp,
  numeroPreenchido,
  opcoesDeEspecialidade,
  outrosMedicos,
  paragrafosDaBio,
  telefoneDoCartao,
  textoDaContagem,
} from "@/lib/encontre";
import * as contato from "@/lib/contato";
import type { LocalAtendimento, Medico } from "@/lib/dados/tipos";

function local(id: number, bairro: string, extra: Partial<LocalAtendimento> = {}): LocalAtendimento {
  return {
    id,
    logradouro: "Rua Projetada 114",
    numero: "198",
    bairro: { id, nome: bairro, slug: bairro.toLowerCase().replace(/\s+/g, "-") },
    telefone: null,
    whatsapp: null,
    estacionamento: false,
    acessibilidade: [],
    ...extra,
  };
}

let proximoId = 1;
function medico(nome: string, principal: string | null, extra: Partial<Medico> = {}): Medico {
  return {
    id: proximoId++,
    slug: nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "-"),
    nome,
    crm: "11918",
    crmUf: "MA",
    foto: null,
    bio: null,
    telemedicina: false,
    associadoAmi: true,
    especialidades: principal
      ? [{ nome: principal, slug: principal.toLowerCase(), rqe: null, principal: true }]
      : [],
    locais: [],
    ...extra,
  };
}

describe("iniciais", () => {
  it("a primeira letra do primeiro nome e a do último", () => {
    expect(iniciais("Diego Aragão")).toBe("DA");
    expect(iniciais("Maria da Silva Costa")).toBe("MC");
  });
  it("ignora espaço sobrando e mantém o acento", () => {
    expect(iniciais("  Ângela   Prado ")).toBe("ÂP");
  });
  it("nome de uma palavra só: as duas primeiras letras, não a mesma duas vezes", () => {
    expect(iniciais("Jorge")).toBe("JO");
  });
  it("sem nome, uma interrogação", () => {
    expect(iniciais("   ")).toBe("?");
  });
});

describe("especialidade principal e consultório principal", () => {
  it("a marcada como principal, mesmo que não seja a primeira", () => {
    const m = medico("Ana Lima", null, {
      especialidades: [
        { nome: "Pediatria", slug: "pediatria", rqe: null, principal: false },
        { nome: "Neurologia", slug: "neurologia", rqe: "1", principal: true },
      ],
    });
    expect(especialidadePrincipal(m)?.slug).toBe("neurologia");
  });
  it("sem marca, a primeira; sem nenhuma, null", () => {
    const m = medico("Ana Lima", null, {
      especialidades: [
        { nome: "Pediatria", slug: "pediatria", rqe: null, principal: false },
        { nome: "Neurologia", slug: "neurologia", rqe: null, principal: false },
      ],
    });
    expect(especialidadePrincipal(m)?.slug).toBe("pediatria");
    expect(especialidadePrincipal(medico("Ana Lima", null))).toBeNull();
  });
  it("o consultório principal é o primeiro; sem consultório, null", () => {
    const m = medico("Ana Lima", null, { locais: [local(1, "Centro"), local(2, "Juçara")] });
    expect(consultorioPrincipal(m)?.id).toBe(1);
    expect(consultorioPrincipal(medico("Ana Lima", null))).toBeNull();
  });
});

describe("o telefone do cartão", () => {
  it("é o do primeiro consultório que tem telefone", () => {
    const m = medico("Ana Lima", null, {
      locais: [local(1, "Centro"), local(2, "Juçara", { telefone: "(99) 3023-0707" })],
    });
    expect(telefoneDoCartao(m)).toBe("(99) 3023-0707");
  });
  it("sem telefone em nenhum, null", () => {
    expect(telefoneDoCartao(medico("Ana Lima", null, { locais: [local(1, "Centro")] }))).toBeNull();
  });
  it("telefone em branco não conta: passa ao consultório seguinte, ou fica sem", () => {
    const branco = local(1, "Centro", { telefone: "   " });
    const m = medico("Ana Lima", null, {
      locais: [branco, local(2, "Juçara", { telefone: "(99) 3023-0707" })],
    });
    expect(telefoneDoCartao(m)).toBe("(99) 3023-0707");
    expect(telefoneDoCartao(medico("Ana Lima", null, { locais: [branco] }))).toBeNull();
  });
});

describe("o endereço e os links do consultório", () => {
  const novaImperatriz = local(1, "Nova Imperatriz");

  it("o endereço em duas linhas, como no desenho", () => {
    expect(enderecoDoLocal(novaImperatriz)).toEqual([
      "Rua Projetada 114, 198",
      "Nova Imperatriz, Imperatriz – MA",
    ]);
  });
  it("sem número, a primeira linha é só o logradouro", () => {
    expect(enderecoDoLocal(local(1, "Centro", { numero: null }))[0]).toBe("Rua Projetada 114");
  });
  it("Como chegar: a busca do Google Maps pelo endereço completo, igual à do desenho", () => {
    expect(linkDoMapa(novaImperatriz)).toBe(
      "https://www.google.com/maps/search/?api=1&query=" +
        "Rua%20Projetada%20114%2C%20198%2C%20Nova%20Imperatriz%2C%20Imperatriz%20%E2%80%93%20MA",
    );
  });
  it("WhatsApp: wa.me/55 e o número só com dígitos", () => {
    expect(linkDoWhatsapp("(99) 3018-9994")).toBe("https://wa.me/559930189994");
    expect(linkDoWhatsapp("99 98802 0205")).toBe("https://wa.me/5599988020205");
  });
  it("WhatsApp que já vem com o 55 não fica com 55 duas vezes", () => {
    expect(linkDoWhatsapp("+55 (99) 98802-0205")).toBe("https://wa.me/5599988020205");
  });
  it("o link e o número preenchido são os de lib/contato.ts, reexportados, não cópias", () => {
    expect(linkDoWhatsapp).toBe(contato.linkDoWhatsapp);
    expect(numeroPreenchido).toBe(contato.numeroPreenchido);
  });
  it("número sem nenhum dígito é número nenhum: o botão não sai", () => {
    for (const vazio of [null, undefined, "", "   ", " - ", "()"]) {
      expect(numeroPreenchido(vazio), JSON.stringify(vazio)).toBeNull();
    }
    expect(numeroPreenchido("(99) 3018-9994")).toBe("(99) 3018-9994");
  });
});

describe("outros médicos", () => {
  const aline = medico("Aline Peixoto", "Neurologia");
  const neuro = ["Zeca Moura", "Cristina Bezerra", "Álvaro Dias", "Bruna Reis", "Carlos Lima"].map((n) =>
    medico(n, "Neurologia"),
  );
  const secundaria = medico("Beto Souza", "Cardiologia", {
    especialidades: [
      { nome: "Cardiologia", slug: "cardiologia", rqe: null, principal: true },
      { nome: "Neurologia", slug: "neurologia", rqe: null, principal: false },
    ],
  });
  const todos = [aline, secundaria, ...neuro];

  it("até 4, da mesma especialidade principal, sem o próprio, em ordem alfabética", () => {
    expect(outrosMedicos(aline, todos).map((m) => m.nome)).toEqual([
      "Álvaro Dias",
      "Bruna Reis",
      "Carlos Lima",
      "Cristina Bezerra",
    ]);
    expect(LIMITE_DE_OUTROS).toBe(4);
  });
  it("quem tem a especialidade só como secundária não entra", () => {
    expect(outrosMedicos(aline, todos).map((m) => m.nome)).not.toContain("Beto Souza");
  });
  it("com menos que 4, os que houver; sem ninguém, vazio", () => {
    expect(outrosMedicos(aline, [aline, neuro[1]]).map((m) => m.nome)).toEqual(["Cristina Bezerra"]);
    expect(outrosMedicos(aline, [aline, secundaria])).toEqual([]);
  });
  it("médico sem especialidade não tem outros", () => {
    expect(outrosMedicos(medico("Sem Nada", null), todos)).toEqual([]);
  });
  it("não altera a lista recebida", () => {
    const copia = [...todos];
    outrosMedicos(aline, todos);
    expect(todos).toEqual(copia);
  });
});

describe("a lista de especialidades da busca", () => {
  it("em ordem alfabética, com a contagem, sem as vazias", () => {
    expect(
      opcoesDeEspecialidade([
        { nome: "Pediatria", slug: "pediatria", total: 3 },
        { nome: "Cardiologia", slug: "cardiologia", total: 3 },
        { nome: "Urologia", slug: "urologia", total: 0 },
        { nome: "Clínica Médica", slug: "clinica-medica", total: 4 },
      ]),
    ).toEqual([
      { valor: "cardiologia", rotulo: "Cardiologia (3)" },
      { valor: "clinica-medica", rotulo: "Clínica Médica (4)" },
      { valor: "pediatria", rotulo: "Pediatria (3)" },
    ]);
  });
});

describe("a contagem e a biografia", () => {
  it("a contagem concorda e diz a especialidade escolhida", () => {
    expect(textoDaContagem(24, null)).toBe("24 médicos");
    expect(textoDaContagem(1, null)).toBe("1 médico");
    expect(textoDaContagem(0, null)).toBe("0 médicos");
    expect(textoDaContagem(3, "Cardiologia")).toBe("3 médicos em Cardiologia");
  });
  it("a biografia vira um parágrafo por bloco separado por linha em branco", () => {
    expect(paragrafosDaBio("Um.\n\nDois.\n  \nTrês.")).toEqual(["Um.", "Dois.", "Três."]);
    expect(paragrafosDaBio("Linha\núnica")).toEqual(["Linha\núnica"]);
    expect(paragrafosDaBio("   ")).toEqual([]);
  });
});

describe("a especialidade do cartão", () => {
  const aline = medico("Aline Peixoto", null, {
    especialidades: [
      { nome: "Neurologia", slug: "neurologia", rqe: "12222", principal: true },
      { nome: "Ortopedia e Traumatologia", slug: "ortopedia-e-traumatologia", rqe: "30111", principal: false },
    ],
  });

  it("na página de uma especialidade que o médico tem, a dela, com o RQE dela", () => {
    expect(especialidadeDoCartao(aline, "ortopedia-e-traumatologia")).toEqual({
      nome: "Ortopedia e Traumatologia",
      slug: "ortopedia-e-traumatologia",
      rqe: "30111",
      principal: false,
    });
  });

  it("fora de uma página de especialidade (a busca, o perfil), a principal", () => {
    expect(especialidadeDoCartao(aline)?.slug).toBe("neurologia");
    expect(especialidadeDoCartao(aline, null)?.slug).toBe("neurologia");
  });

  it("na página de uma especialidade que ele não tem, a principal", () => {
    expect(especialidadeDoCartao(aline, "pediatria")?.slug).toBe("neurologia");
  });

  it("sem especialidade nenhuma, null", () => {
    expect(especialidadeDoCartao(medico("Sem Nada", null), "pediatria")).toBeNull();
  });
});
