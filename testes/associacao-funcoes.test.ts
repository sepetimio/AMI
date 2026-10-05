import { describe, expect, it } from "vitest";
import type { PortableTextBlock } from "@portabletext/react";
import {
  CONVITE_PARA_ASSOCIAR,
  LIMITE_DA_DIRETORIA_EM_DESTAQUE,
  MINIMO_DE_ATALHOS,
  apresentacaoDaAssociacao,
  atalhosDoSaibaMais,
  diretoriaEmDestaque,
  numerosDaAssociacao,
} from "@/lib/associacao";
import type { Diretor } from "@/lib/dados/diretoria";

/*
  O que a página A Associação decide, em funções puras: os atalhos de
  "Saiba mais", a diretoria em destaque, os números da faixa verde, a
  apresentação e o texto do convite. Os textos esperados são os da spec
  (docs/superpowers/specs/2026-10-03-associacao-design.md) e do desenho.
*/

const SEJA = "/associacao/seja-associado";
const ESTATUTO = "/associacao/estatuto";
const EDITORIAL = "/associacao/politica-editorial";

describe("os atalhos de Saiba mais", () => {
  it("na demonstração, os três, na ordem; o que não existe vai como texto a entrar", () => {
    expect(atalhosDoSaibaMais(true, [SEJA])).toEqual([
      {
        titulo: "Seja associado",
        frase: "Quem pode se associar à AMI e como fazer isso.",
        caminho: SEJA,
        icone: "parceria",
        aEntrar: false,
      },
      {
        titulo: "Estatuto",
        frase: "As regras que organizam a associação.",
        caminho: ESTATUTO,
        icone: "pergaminho",
        aEntrar: true,
      },
      {
        titulo: "Política editorial",
        frase: "Como o site escolhe, apura e revisa o que publica.",
        caminho: EDITORIAL,
        icone: "artigo",
        aEntrar: true,
      },
    ]);
  });

  it("fora da demonstração, só os que existem", () => {
    expect(atalhosDoSaibaMais(false, [SEJA, ESTATUTO]).map((a) => [a.caminho, a.aEntrar])).toEqual([
      [SEJA, false],
      [ESTATUTO, false],
    ]);
  });

  it("com as três páginas no ar, nenhum a entrar, nos dois modos", () => {
    for (const demo of [true, false]) {
      expect(atalhosDoSaibaMais(demo, [EDITORIAL, SEJA, ESTATUTO]).map((a) => a.aEntrar), String(demo)).toEqual([
        false,
        false,
        false,
      ]);
    }
  });

  it("sobrando um só (Seja associado, que o fecho repete logo abaixo), nenhum", () => {
    expect(MINIMO_DE_ATALHOS).toBe(2);
    expect(atalhosDoSaibaMais(false, [SEJA])).toEqual([]);
    expect(atalhosDoSaibaMais(false, [ESTATUTO])).toEqual([]);
    expect(atalhosDoSaibaMais(false, [])).toEqual([]);
  });

  it("Benefícios não entra, mesmo publicada", () => {
    const titulos = atalhosDoSaibaMais(true, [SEJA, "/associacao/beneficios"]).map((a) => a.titulo);
    expect(titulos).toEqual(["Seja associado", "Estatuto", "Política editorial"]);
  });
});

function diretor(id: number): Diretor {
  return {
    id,
    nome: `Diretor ${id}`,
    cargo: "Diretor",
    ordem: id * 10,
    slugDoPerfil: null,
    crm: String(10000 + id),
    crmUf: "MA",
    medico: true,
    foto: null,
  };
}

describe("a diretoria em destaque", () => {
  it("os quatro primeiros, na ordem da AMI", () => {
    expect(LIMITE_DA_DIRETORIA_EM_DESTAQUE).toBe(4);
    const seis = [1, 2, 3, 4, 5, 6].map(diretor);
    expect(diretoriaEmDestaque(seis).map((d) => d.id)).toEqual([1, 2, 3, 4]);
  });

  it("com menos de quatro, todos; sem nenhum, nenhum", () => {
    expect(diretoriaEmDestaque([diretor(1), diretor(2)]).map((d) => d.id)).toEqual([1, 2]);
    expect(diretoriaEmDestaque([])).toEqual([]);
  });

  it("não mexe na lista recebida", () => {
    const lista = [1, 2, 3, 4, 5].map(diretor);
    diretoriaEmDestaque(lista);
    expect(lista).toHaveLength(5);
  });
});

describe("os números da faixa verde", () => {
  it("anos, médicos e especialidades, com o rótulo da home", () => {
    expect(numerosDaAssociacao({ anos: 51, medicos: 24, especialidades: 14 })).toEqual([
      { valor: 51, rotulo: "anos de AMI" },
      { valor: 24, rotulo: "médicos no diretório" },
      { valor: 14, rotulo: "especialidades" },
    ]);
  });

  it("concorda o singular", () => {
    expect(numerosDaAssociacao({ anos: 1, medicos: 1, especialidades: 1 }).map((n) => n.rotulo)).toEqual([
      "ano de AMI",
      "médico no diretório",
      "especialidade",
    ]);
  });
});

describe("a apresentação oficial", () => {
  const CORPO = [
    {
      _type: "block",
      _key: "a",
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s", text: "A AMI é…", marks: [] }],
    },
  ] as PortableTextBlock[];

  it("com o texto da AMI no Studio, sai nos dois modos", () => {
    expect(apresentacaoDaAssociacao(true, CORPO)).toEqual({ tipo: "texto", blocos: CORPO });
    expect(apresentacaoDaAssociacao(false, CORPO)).toEqual({ tipo: "texto", blocos: CORPO });
  });

  it("sem texto: a entrar na demonstração, nada fora dela", () => {
    for (const vazio of [null, undefined, []]) {
      expect(apresentacaoDaAssociacao(true, vazio)).toEqual({ tipo: "a-entrar" });
      expect(apresentacaoDaAssociacao(false, vazio)).toBeNull();
    }
  });
});

describe("o convite para se associar", () => {
  it("o texto aprovado da faixa da home, que o fecho de A Associação repete", () => {
    expect(CONVITE_PARA_ASSOCIAR).toEqual({
      titulo: "Associe-se à AMI e fortaleça a medicina em Imperatriz",
      texto: "Médico com inscrição no CRM pode se associar. Fale com a AMI para saber como.",
    });
  });
});
