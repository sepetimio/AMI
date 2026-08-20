import { describe, expect, it } from "vitest";
import {
  MINIMO_PARA_INDEXAR,
  facetaEhIndexavel,
  paragrafoDeAbertura,
  resumirFaceta,
  type ResumoFaceta,
} from "@/lib/dados/facetas";
import type { Medico } from "@/lib/dados/tipos";

const base: ResumoFaceta = {
  especialidade: "Cardiologia",
  total: 7,
  bairrosComOferta: [
    { nome: "Centro", total: 4 },
    { nome: "Bacuri", total: 2 },
    { nome: "Juçara", total: 1 },
  ],
  totalLocais: 9,
  atendemSabado: 2,
  comTelemedicina: 3,
  locaisComAcessoCadeirante: 5,
  associados: 5,
  comMaisDeUmEndereco: 2,
};

/* A faceta mais pobre que ainda entra no índice: exatamente no corte, sem
   sábado, sem telemedicina, sem acessibilidade, sem associado. É onde o
   texto encolhe, então é onde o piso de palavras precisa valer. */
const pobreIndexavel: ResumoFaceta = {
  especialidade: "Reumatologia",
  total: MINIMO_PARA_INDEXAR,
  bairrosComOferta: [{ nome: "Centro", total: MINIMO_PARA_INDEXAR }],
  totalLocais: MINIMO_PARA_INDEXAR,
  atendemSabado: 0,
  comTelemedicina: 0,
  locaisComAcessoCadeirante: 0,
  associados: 0,
  comMaisDeUmEndereco: 0,
};

describe("facetaEhIndexavel", () => {
  it("indexa a partir do mínimo", () => {
    expect(facetaEhIndexavel(MINIMO_PARA_INDEXAR)).toBe(true);
    expect(facetaEhIndexavel(10)).toBe(true);
  });

  it("não indexa abaixo do mínimo", () => {
    expect(facetaEhIndexavel(2)).toBe(false);
    expect(facetaEhIndexavel(0)).toBe(false);
  });

  it("o mínimo é 3", () => {
    expect(MINIMO_PARA_INDEXAR).toBe(3);
  });
});

describe("paragrafoDeAbertura", () => {
  it("traz os números reais, não redondos", () => {
    const p = paragrafoDeAbertura(base);
    expect(p).toContain("7 cardiologistas");
    expect(p).toContain("9 endereços");
    expect(p).toContain("Centro");
    expect(p).toContain("2 atendem aos sábados");
  });

  it("muda de conteúdo quando os dados mudam — não é molde com palavra trocada", () => {
    const outro = paragrafoDeAbertura({
      ...base,
      especialidade: "Pediatria",
      total: 3,
      atendemSabado: 0,
      comTelemedicina: 0,
      bairrosComOferta: [{ nome: "Santa Rita", total: 3 }],
    });
    expect(outro).not.toBe(paragrafoDeAbertura(base));
    expect(outro).toContain("Santa Rita");
    expect(outro).not.toContain("sábados");
  });

  it("nomeia o bairro quando a faceta é de cruzamento", () => {
    const p = paragrafoDeAbertura({ ...base, bairro: "Centro", total: 4 });
    expect(p).toContain("no Centro");
  });

  it("concorda o singular", () => {
    const p = paragrafoDeAbertura({
      ...base,
      total: 1,
      totalLocais: 1,
      bairrosComOferta: [{ nome: "Centro", total: 1 }],
      atendemSabado: 1,
      comTelemedicina: 1,
      locaisComAcessoCadeirante: 1,
      associados: 1,
      comMaisDeUmEndereco: 1,
    });
    expect(p).toContain("1 cardiologista ");
    expect(p).not.toContain("1 cardiologistas");
    expect(p).toContain("um único endereço");
    expect(p).toContain("1 atende aos sábados");
    expect(p).toContain("1 informa acesso");
    expect(p).toContain("1 atende em mais de um endereço");
  });

  it("concorda o plural", () => {
    const p = paragrafoDeAbertura(base);
    expect(p).toContain("2 atendem aos sábados");
    expect(p).toContain("5 informam acesso");
    expect(p).toContain("2 atendem em mais de um endereço");
  });

  /* O piso de 120 palavras protege página indexável de ser rasa. Abaixo do
     corte a página sai noindex, e ali o parágrafo pode ter o tamanho que a
     verdade permitir — forçar palavras numa página que não vai ao índice
     seria encher linguiça sem ganho nenhum. */
  it("cumpre 120 a 200 palavras na faceta mais pobre que ainda indexa", () => {
    const palavras = paragrafoDeAbertura(pobreIndexavel).split(/\s+/).length;
    expect(palavras).toBeGreaterThanOrEqual(120);
    expect(palavras).toBeLessThanOrEqual(200);
  });

  it("cumpre 120 a 200 palavras também na faceta rica", () => {
    const palavras = paragrafoDeAbertura(base).split(/\s+/).length;
    expect(palavras).toBeGreaterThanOrEqual(120);
    expect(palavras).toBeLessThanOrEqual(200);
  });

  /* Começar frase com algarismo é uma das marcas mais visíveis de texto
     gerado, e em português corrido não se faz. */
  it("nenhuma frase começa com algarismo", () => {
    for (const resumo of [base, pobreIndexavel]) {
      const frases = paragrafoDeAbertura(resumo).split(/(?<=\.)\s+/);
      for (const f of frases) {
        expect(f.trimStart()).not.toMatch(/^\d/);
      }
    }
  });
});

describe("resumirFaceta", () => {
  const local = (
    id: number,
    bairro: string,
    acessibilidade: Medico["locais"][0]["acessibilidade"] = [],
  ) => ({
    id,
    logradouro: "Rua A",
    numero: "1",
    bairro: { id: 1, nome: bairro, slug: bairro.toLowerCase() },
    telefone: null,
    whatsapp: null,
    estacionamento: false,
    acessibilidade,
    horarios: [{ diaSemana: 2, abre: "08:00", fecha: "12:00" }],
  });

  const medico = (over: Partial<Medico> & { id: number }): Medico => ({
    slug: `m${over.id}`,
    nome: `Médico ${over.id}`,
    crm: String(over.id),
    crmUf: "MA",
    foto: null,
    bio: null,
    telemedicina: false,
    associadoAmi: false,
    especialidades: [],
    locais: [],
    ...over,
  });

  it("conta profissionais por bairro, não registros de local", () => {
    /* Um médico com dois consultórios no mesmo bairro é UM profissional
       atendendo ali. Contar linhas de local devolveria 2 e a frase diria
       "2 cardiologistas no Centro", o que é falso. */
    const r = resumirFaceta(
      [medico({ id: 1, locais: [local(1, "Centro"), local(2, "Centro")] })],
      "Cardiologia",
    );
    expect(r.bairrosComOferta).toEqual([{ nome: "Centro", total: 1 }]);
  });

  it("conta o mesmo profissional em cada bairro onde atende", () => {
    const r = resumirFaceta(
      [medico({ id: 1, locais: [local(1, "Centro"), local(2, "Bacuri")] })],
      "Cardiologia",
    );
    expect(r.bairrosComOferta).toEqual([
      { nome: "Bacuri", total: 1 },
      { nome: "Centro", total: 1 },
    ]);
  });

  it("conta endereços distintos, sem duplicar o consultório compartilhado", () => {
    const r = resumirFaceta(
      [
        medico({ id: 1, locais: [local(7, "Centro")] }),
        medico({ id: 2, locais: [local(7, "Centro")] }),
      ],
      "Cardiologia",
    );
    expect(r.total).toBe(2);
    expect(r.totalLocais).toBe(1);
  });

  it("conta locais com acesso para cadeirante, não profissionais", () => {
    const r = resumirFaceta(
      [
        medico({
          id: 1,
          locais: [
            local(1, "Centro", ["acesso_cadeirante"]),
            local(2, "Bacuri", ["acesso_cadeirante"]),
          ],
        }),
      ],
      "Cardiologia",
    );
    expect(r.locaisComAcessoCadeirante).toBe(2);
  });

  it("conta associados e quem atende em mais de um endereço", () => {
    const r = resumirFaceta(
      [
        medico({ id: 1, associadoAmi: true, locais: [local(1, "Centro"), local(2, "Bacuri")] }),
        medico({ id: 2, associadoAmi: false, locais: [local(3, "Centro")] }),
      ],
      "Cardiologia",
    );
    expect(r.associados).toBe(1);
    expect(r.comMaisDeUmEndereco).toBe(1);
  });

  it("ordena os bairros do mais ofertado para o menos", () => {
    const r = resumirFaceta(
      [
        medico({ id: 1, locais: [local(1, "Centro")] }),
        medico({ id: 2, locais: [local(2, "Centro")] }),
        medico({ id: 3, locais: [local(3, "Bacuri")] }),
      ],
      "Cardiologia",
    );
    expect(r.bairrosComOferta.map((b) => b.nome)).toEqual(["Centro", "Bacuri"]);
  });
});
