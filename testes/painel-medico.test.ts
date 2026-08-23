import { describe, expect, it } from "vitest";
import { oQueFalta, validarMedico, type CamposDoMedico } from "@/lib/painel/medico";

function campos(p: Partial<CamposDoMedico> = {}): CamposDoMedico {
  return {
    nome: "Ana Souza", crm: "4821", crmUf: "MA",
    telemedicina: false, associadoAmi: false, situacao: "ativo", bio: "", verificadoEm: "",
    ...p,
  };
}

describe("validarMedico — o que rejeita", () => {
  it("nome vazio", () => {
    const r = validarMedico(campos({ nome: "   " }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros.nome).toBeTruthy();
  });

  it("CRM sem dígito nenhum", () => {
    const r = validarMedico(campos({ crm: "a definir" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros.crm).toBeTruthy();
  });

  it("UF que não existe", () => {
    const r = validarMedico(campos({ crmUf: "MAA" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros.crmUf).toContain("MAA");
  });

  it("situação fora do que o banco aceita", () => {
    const r = validarMedico(campos({ situacao: "afastado" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros.situacao).toBeTruthy();
  });

  it("data de verificação que não é data", () => {
    const r = validarMedico(campos({ verificadoEm: "ontem" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros.verificadoEm).toBeTruthy();
  });

  it("junta todos os erros de uma vez, em vez de parar no primeiro", () => {
    const r = validarMedico(campos({ nome: "", crm: "", crmUf: "ZZ" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.erros).sort()).toEqual(["crm", "crmUf", "nome"]);
  });
});

describe("validarMedico — o que sai limpo", () => {
  it("devolve as chaves com o nome que o banco usa", () => {
    const r = validarMedico(campos());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valor).toEqual({
      nome: "Ana Souza", crm: "4821", crm_uf: "MA",
      telemedicina: false, associado_ami: false, situacao: "ativo",
      bio: null, verificado_em: null,
    });
  });

  it("tira a pontuação do CRM e colapsa espaço do nome", () => {
    const r = validarMedico(campos({ crm: "CRM 4.821", nome: "Ana   Paula  Souza" }));
    if (!r.ok) throw new Error("não deveria rejeitar");
    expect(r.valor.crm).toBe("4821");
    expect(r.valor.nome).toBe("Ana Paula Souza");
  });

  it("UF minúscula vira maiúscula", () => {
    const r = validarMedico(campos({ crmUf: "to" }));
    if (!r.ok) throw new Error("não deveria rejeitar");
    expect(r.valor.crm_uf).toBe("TO");
  });

  it("bio e data vazias viram nulo, não string vazia", () => {
    const r = validarMedico(campos({ bio: "   ", verificadoEm: "" }));
    if (!r.ok) throw new Error("não deveria rejeitar");
    expect(r.valor.bio).toBeNull();
    expect(r.valor.verificado_em).toBeNull();
  });

  it("data válida atravessa como está", () => {
    const r = validarMedico(campos({ verificadoEm: "2026-08-22" }));
    if (!r.ok) throw new Error("não deveria rejeitar");
    expect(r.valor.verificado_em).toBe("2026-08-22");
  });

  it("carrega o campo de associado para o banco", () => {
    const r = validarMedico({
      nome: "Aline Peixoto",
      crm: "11918",
      crmUf: "MA",
      telemedicina: false,
      associadoAmi: true,
      situacao: "ativo",
      bio: "",
      verificadoEm: "",
    });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.associado_ami).toBe(true);
  });

  it("associado falso é gravado como falso, não descartado", () => {
    const r = validarMedico({
      nome: "Aline Peixoto",
      crm: "11918",
      crmUf: "MA",
      telemedicina: false,
      associadoAmi: false,
      situacao: "ativo",
      bio: "",
      verificadoEm: "",
    });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.associado_ami).toBe(false);
  });
});

describe("oQueFalta", () => {
  it("nada falta quando tudo está preenchido", () => {
    expect(oQueFalta({ temEspecialidade: true, temEndereco: true, temBio: true })).toEqual([]);
  });

  it("lista o que falta, na ordem de quem mais atrapalha", () => {
    expect(oQueFalta({ temEspecialidade: false, temEndereco: false, temBio: false })).toEqual([
      "sem especialidade",
      "sem endereço",
      "sem biografia",
    ]);
  });

  it("só a biografia faltando", () => {
    expect(oQueFalta({ temEspecialidade: true, temEndereco: true, temBio: false })).toEqual([
      "sem biografia",
    ]);
  });
});
