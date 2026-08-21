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
  it("prefere a coluna própria da linha de diretoria", () => {
    /* A restrição `diretor_medico_tem_inscricao` (0004_diretoria_crm.sql)
       exige `crm`/`crm_uf` na própria linha de todo diretor médico
       publicado. É a única inscrição que o banco garante existir e que o
       visitante anônimo sempre enxerga, então é ela que manda quando as duas
       origens divergem. */
    expect(
      resolverCrmDoDiretor(
        { crm: "20364", crmUf: "MA" },
        { crm: "10274", crmUf: "MA" },
      ),
    ).toEqual({ crm: "20364", crmUf: "MA" });
  });

  it("usa só a coluna própria quando não há perfil ligado", () => {
    /* Caso do diretor recém-eleito, ainda sem perfil no diretório. */
    expect(
      resolverCrmDoDiretor({ crm: "20364", crmUf: "MA" }, null),
    ).toEqual({ crm: "20364", crmUf: "MA" });
  });

  it("cai no perfil ligado quando a coluna própria está vazia", () => {
    /* Este é o caso que faltava, e a falta dele deixou passar uma regressão
       ao vivo: a página da diretoria ficou sem nenhum CRM na tela porque a
       consulta parou de projetar o CRM do perfil, e nenhum teste reclamou.

       A reserva não enfraquece a garantia. A garantia mora na restrição do
       banco, que continua exigindo as colunas próprias. Aqui, quando o
       perfil existe e está publicado, `profissional.crm` é `not null` e veio
       da mesma verificação que liberou aquele médico para o diretório: é
       dado correto e ao alcance. Omiti-lo seria produzir exatamente a tela
       que a Resolução CFM 2.336/2023, Art. 4º, I proíbe. */
    expect(
      resolverCrmDoDiretor(
        { crm: null, crmUf: null },
        { crm: "10274", crmUf: "MA" },
      ),
    ).toEqual({ crm: "10274", crmUf: "MA" });
  });

  it("ignora a origem que tem só metade da inscrição", () => {
    /* CRM sem UF não identifica ninguém: duas UFs numeram inscrições de
       forma independente. Meia inscrição vale zero, e passa a vez. */
    expect(
      resolverCrmDoDiretor(
        { crm: "20364", crmUf: null },
        { crm: "10274", crmUf: "MA" },
      ),
    ).toEqual({ crm: "10274", crmUf: "MA" });
  });

  it("não exibe nada para o diretor que não é médico", () => {
    /* `medico = false`, um contador na tesouraria por exemplo: a restrição
       do banco não exige CRM dele, e não há nada para o cartão mostrar. */
    expect(
      resolverCrmDoDiretor({ crm: null, crmUf: null }, null),
    ).toEqual({ crm: null, crmUf: null });
  });

  it("devolve vazio quando nenhuma das duas origens tem inscrição", () => {
    /* Mesma forma do caso acima, mas com `medico = true`: um diretor médico
       publicado e sem CRM em lugar nenhum. A restrição do banco torna esse
       estado impossível de gravar, e é por isso que a função não precisa
       inventar nada aqui. Se ele aparecer mesmo assim, devolver vazio é o
       que faz `CartaoDiretor` omitir a linha inteira em vez de escrever
       "MÉDICO · CRM/null" ao lado de um nome. */
    expect(
      resolverCrmDoDiretor({ crm: null, crmUf: null }, null),
    ).toEqual({ crm: null, crmUf: null });
  });
});
