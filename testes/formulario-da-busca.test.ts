import { describe, expect, it } from "vitest";
import {
  aoEnviar,
  enderecoDosValores,
  estadoInicial,
  valoresAposNavegar,
  type EstadoDoFormulario,
  type ValoresDaBusca,
} from "@/lib/formulario-da-busca";

/*
  O que o campo e a lista da busca mostram enquanto o endereço muda
  (lib/formulario-da-busca.ts). O formulário mostra a escolha na hora; a URL
  de cada envio chega depois, uma a uma, em ordem.
*/

const v = (especialidade: string, termo = ""): ValoresDaBusca => ({ termo, especialidade });

/** Envia cada valor, em sequência, a partir do estado dado. */
function enviar(estado: EstadoDoFormulario, ...valores: ValoresDaBusca[]): EstadoDoFormulario {
  return valores.reduce(aoEnviar, estado);
}

describe("enderecoDosValores", () => {
  it("é o endereço da busca, sem os campos vazios e sem espaço nas pontas", () => {
    expect(enderecoDosValores(v(""))).toBe("/busca");
    expect(enderecoDosValores(v("cardiologia"))).toBe("/busca?especialidade=cardiologia");
    expect(enderecoDosValores(v("pediatria", "  ana "))).toBe("/busca?termo=ana&especialidade=pediatria");
  });
});

describe("aoEnviar", () => {
  it("mostra o que foi enviado e guarda o envio, em ordem", () => {
    const e = enviar(estadoInicial(v("")), v("cardiologia"), v("pediatria"));
    expect(e.valores).toEqual(v("pediatria"));
    expect(e.daUrl).toEqual(v(""));
    expect(e.envios.map((x) => x.endereco)).toEqual([
      "/busca?especialidade=cardiologia",
      "/busca?especialidade=pediatria",
    ]);
  });

  it("o mesmo endereço duas vezes seguidas fica um envio só, com os valores do último", () => {
    const e = enviar(estadoInicial(v("")), v("cardiologia", "ana"), v("cardiologia", "ana "));
    expect(e.envios).toEqual([{ endereco: "/busca?termo=ana&especialidade=cardiologia", valores: v("cardiologia", "ana ") }]);
  });

  it("enviar o endereço que já está na URL, sem nada a caminho, não espera nada", () => {
    expect(aoEnviar(estadoInicial(v("cardiologia")), v("cardiologia")).envios).toEqual([]);
  });

  it("voltar à escolha da URL com outra a caminho espera as duas", () => {
    const e = enviar(estadoInicial(v("")), v("cardiologia"), v(""));
    expect(e.envios.map((x) => x.endereco)).toEqual(["/busca?especialidade=cardiologia", "/busca"]);
  });
});

describe("valoresAposNavegar", () => {
  it("três trocas seguidas: as URLs de antes da última não voltam a lista", () => {
    let e = enviar(estadoInicial(v("")), v("cardiologia"), v("pediatria"), v("urologia"));
    const vistos: string[] = [];
    for (const url of [v("cardiologia"), v("pediatria"), v("urologia")]) {
      e = valoresAposNavegar(e, url);
      vistos.push(e.valores.especialidade);
    }
    expect(vistos).toEqual(["urologia", "urologia", "urologia"]);
    expect(e).toEqual(estadoInicial(v("urologia")));
  });

  it("se só a URL do último envio chegar, ela fecha a espera", () => {
    const e = valoresAposNavegar(enviar(estadoInicial(v("")), v("cardiologia"), v("pediatria")), v("pediatria"));
    expect(e).toEqual(estadoInicial(v("pediatria")));
  });

  it("a URL intermediária anda a fila: a que vem depois dela ainda é esperada", () => {
    const e = valoresAposNavegar(enviar(estadoInicial(v("")), v("cardiologia"), v("pediatria")), v("cardiologia"));
    expect(e.valores).toEqual(v("pediatria"));
    expect(e.daUrl).toEqual(v("cardiologia"));
    expect(e.envios.map((x) => x.endereco)).toEqual(["/busca?especialidade=pediatria"]);
  });

  it("o texto digitado durante a troca fica, intermediária ou última", () => {
    let e = enviar(estadoInicial(v("")), v("cardiologia"), v("pediatria"));
    e = { ...e, valores: { ...e.valores, termo: "ana" } };
    e = valoresAposNavegar(e, v("cardiologia"));
    expect(e.valores).toEqual(v("pediatria", "ana"));
    e = valoresAposNavegar(e, v("pediatria"));
    expect(e.valores).toEqual(v("pediatria", "ana"));
    expect(e.envios).toEqual([]);
  });

  it("na URL do último envio, o campo que a pessoa não mexeu fica como a URL diz", () => {
    /* "  ana " vira "ana" na URL; sem mexer no campo depois, o campo mostra
       "ana". */
    const e = valoresAposNavegar(aoEnviar(estadoInicial(v("")), v("", "  ana ")), v("", "ana"));
    expect(e.valores).toEqual(v("", "ana"));
  });

  it("a URL que não é de envio nenhum (o × do filtro, o voltar) manda no campo e na lista", () => {
    const e = valoresAposNavegar(enviar(estadoInicial(v("")), v("cardiologia", "ana")), v("", "ana"));
    expect(e).toEqual(estadoInicial(v("", "ana")));
    const sem = valoresAposNavegar({ ...estadoInicial(v("pediatria")), valores: v("pediatria", "rascunho") }, v(""));
    expect(sem).toEqual(estadoInicial(v("")));
  });
});
