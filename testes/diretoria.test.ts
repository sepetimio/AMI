import { describe, expect, it } from "vitest";
import { ordenarDiretoria, type Diretor } from "@/lib/dados/diretoria";

const D = (p: Partial<Diretor>): Diretor => ({
  id: 1,
  nome: "Fulano",
  cargo: "Diretor",
  ordem: 10,
  slugDoPerfil: null,
  crm: null,
  crmUf: null,
  medico: true,
  foto: null,
  ...p,
});

describe("ordenarDiretoria", () => {
  it("respeita a ordem definida pela AMI", () => {
    /* A hierarquia da diretoria não é alfabética nem cronológica: presidente
       vem antes de vice, que vem antes de tesoureiro. Só a AMI sabe a ordem,
       e ela vive na coluna `ordem`. */
    const fora = [D({ id: 3, ordem: 30 }), D({ id: 1, ordem: 10 }), D({ id: 2, ordem: 20 })];
    expect(ordenarDiretoria(fora).map((d) => d.id)).toEqual([1, 2, 3]);
  });

  it("desempata por nome quando a ordem repete", () => {
    /* Dois vogais com a mesma ordem é caso normal. Sem desempate, a ordem
       na tela mudaria a cada consulta ao banco, e a página pareceria
       instável sem motivo. */
    const empate = [
      D({ id: 1, nome: "Zilda", ordem: 40 }),
      D({ id: 2, nome: "Ana", ordem: 40 }),
    ];
    expect(ordenarDiretoria(empate).map((d) => d.nome)).toEqual(["Ana", "Zilda"]);
  });

  it("não altera o array recebido", () => {
    const original = [D({ id: 2, ordem: 20 }), D({ id: 1, ordem: 10 })];
    ordenarDiretoria(original);
    expect(original.map((d) => d.id)).toEqual([2, 1]);
  });
});
