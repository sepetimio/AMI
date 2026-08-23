import { describe, expect, it } from "vitest";
import {
  avisoDeRqeFaltando,
  ordenarEspecialidades,
  validarRqe,
  type EspecialidadeDoMedico,
} from "@/lib/painel/especialidades";
import { fonte, semComentarios } from "@/testes/apoio";

describe("validarRqe", () => {
  it("aceita vazio, porque clínico geral sem RQE é caso normal", () => {
    const r = validarRqe("");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toBeNull();
  });

  it("espaço em branco também vira nulo", () => {
    const r = validarRqe("   ");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toBeNull();
  });

  it("guarda só os dígitos", () => {
    const r = validarRqe("RQE 12345");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toBe("12345");
  });

  it("recusa texto sem nenhum dígito", () => {
    const r = validarRqe("não tenho");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toContain("número");
  });
});

describe("avisoDeRqeFaltando", () => {
  it("sem nome nenhum, não avisa", () => {
    expect(avisoDeRqeFaltando([])).toBeNull();
  });

  it("com um nome, avisa citando ele", () => {
    const aviso = avisoDeRqeFaltando(["Cardiologia"]);
    expect(aviso).toContain("Cardiologia");
  });

  it("com dois nomes, cita os dois", () => {
    const aviso = avisoDeRqeFaltando(["Cardiologia", "Pediatria"]);
    expect(aviso).toContain("Cardiologia");
    expect(aviso).toContain("Pediatria");
  });
});

describe("ordenarEspecialidades", () => {
  const e = (nome: string, principal: boolean, id = 1): EspecialidadeDoMedico => ({
    id,
    nome,
    rqe: null,
    principal,
  });

  it("a principal vem primeiro, mesmo estando por último na entrada", () => {
    const entrada = [e("Cardiologia", false, 1), e("Alergologia", false, 2), e("Zoologia", true, 3)];
    const saida = ordenarEspecialidades(entrada);
    expect(saida[0].nome).toBe("Zoologia");
  });

  it("sem nenhuma principal, a ordem é só alfabética", () => {
    const entrada = [e("Cardiologia", false, 1), e("Alergologia", false, 2), e("Pediatria", false, 3)];
    const saida = ordenarEspecialidades(entrada).map((x) => x.nome);
    expect(saida).toEqual(["Alergologia", "Cardiologia", "Pediatria"]);
  });

  it("a ordenação é de português: acento não empurra para o fim", () => {
    const entrada = [e("Zoologia", false, 1), e("Álgebra", false, 2)];
    const saida = ordenarEspecialidades(entrada).map((x) => x.nome);
    expect(saida).toEqual(["Álgebra", "Zoologia"]);
  });

  it("lista vazia devolve lista vazia", () => {
    expect(ordenarEspecialidades([])).toEqual([]);
  });
});

describe("acoes-especialidade.ts", () => {
  const codigo = semComentarios(fonte("../app/painel/medico/[id]/acoes-especialidade.ts"));

  it("toda gravação pede as linhas afetadas de volta", () => {
    const escritas = [...codigo.matchAll(/\.(insert|update|delete)\s*\(/g)];
    expect(escritas.length).toBeGreaterThan(0);
    /* Uma chamada de `.select(` por escrita, no mínimo. */
    const selects = [...codigo.matchAll(/\.select\s*\(/g)];
    expect(selects.length).toBeGreaterThanOrEqual(escritas.length);
  });

  it("cada ação confere se veio linha antes de invalidar", () => {
    /*
      Ancora na CHAMADA `invalidar()`, não em `revalidatePath(`. Medir a posição
      de `revalidatePath(` mede a DEFINIÇÃO do helper, não o momento em que ele
      roda — com a definição no fim do arquivo, uma ação que invalidasse antes
      de conferir a linha passaria verde. E confere por ação: no arquivo inteiro,
      o `if (!data)` de uma ação cobriria o `invalidar()` de outra.
    */
    const acoes = codigo.split("export async function").slice(1);
    expect(acoes.length).toBeGreaterThan(0);

    for (const acao of acoes) {
      if (!acao.includes("invalidar()")) continue;
      const confere = acao.indexOf("if (!data)");
      expect(confere, "ação que invalida sem conferir se veio linha").toBeGreaterThan(-1);
      expect(confere).toBeLessThan(acao.indexOf("invalidar()"));
    }
  });

  it("cada ação chama exigirAdmin antes de gravar", () => {
    /*
      Por ação, não pelo arquivo inteiro: medido no arquivo inteiro, o
      `exigirAdmin()` da primeira função do arquivo cobre a escrita de toda
      ação depois dela, e uma ação nova que pulasse a guarda passaria verde.
      Mesmo corte de `export async function` que a asserção de `invalidar()`
      já usa, acima.
    */
    const acoes = codigo.split("export async function").slice(1);
    expect(acoes.length).toBeGreaterThan(0);

    for (const acao of acoes) {
      const escrita = acao.search(/\.(insert|update|delete)\s*\(/);
      if (escrita === -1) continue;
      const guarda = acao.indexOf("exigirAdmin(");
      expect(guarda, "ação que grava sem chamar exigirAdmin").toBeGreaterThan(-1);
      expect(guarda).toBeLessThan(escrita);
    }
  });

  it("só remove de profissional_especialidade", () => {
    const tabelas = [...codigo.matchAll(/from\("(\w+)"\)([\s\S]*?)(?=from\("|$)/g)];
    for (const [, tabela, trecho] of tabelas) {
      if (/\.delete\s*\(/.test(trecho)) {
        expect(tabela).toBe("profissional_especialidade");
      }
    }
  });
});
