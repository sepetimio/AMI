import { describe, expect, it } from "vitest";
import {
  ordenarDiretoria,
  resolverCrmDoDiretor,
  type Diretor,
} from "@/lib/dados/diretoria";

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

describe("resolverCrmDoDiretor", () => {
  it("prefere o CRM do perfil ligado, mesmo quando a linha de diretoria também tem um", () => {
    /* O perfil, quando existe, é a fonte mais confiável: é o mesmo CRM já
       verificado para publicar o profissional no diretório. */
    const resultado = resolverCrmDoDiretor(
      { crm: "10274", crmUf: "MA" },
      { crm: "99999", crmUf: "SP" },
    );
    expect(resultado).toEqual({ crm: "10274", crmUf: "MA" });
  });

  it("usa o CRM próprio da linha de diretoria quando não há perfil ligado", () => {
    /* Caso do diretor recém-eleito, ainda sem perfil publicado no
       diretório: sem isto, ele sairia na tela sem CRM nenhum, violando a
       Resolução CFM 2.336/2023, Art. 4º, I. */
    const resultado = resolverCrmDoDiretor(null, { crm: "20364", crmUf: "MA" });
    expect(resultado).toEqual({ crm: "20364", crmUf: "MA" });
  });

  it("não exibe nada quando nenhuma das duas origens tem CRM", () => {
    /* Caso normal para um diretor que não é médico (`medico = false`), por
       exemplo um contador na tesouraria: a constraint do banco não exige
       CRM dele, e não há nada para o cartão mostrar. */
    const resultado = resolverCrmDoDiretor(null, { crm: null, crmUf: null });
    expect(resultado).toEqual({ crm: null, crmUf: null });
  });
});
