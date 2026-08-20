/*
  Gera supabase/seed/seed.sql. Determinístico: sem Math.random e sem Date.now,
  para que rodar duas vezes produza exatamente o mesmo arquivo.

  Rode com:  npx tsx supabase/seed/gerar-seed.ts
*/
import { writeFileSync } from "node:fs";

const BAIRROS = [
  "Centro",
  "Nova Imperatriz",
  "Bacuri",
  "Juçara",
  "Maranhão Novo",
  "Parque do Buriti",
  "Vila Lobão",
  "Santa Rita",
];

const ESPECIALIDADES = [
  "Clínica Médica",
  "Cardiologia",
  "Dermatologia",
  "Ginecologia e Obstetrícia",
  "Ortopedia e Traumatologia",
  "Pediatria",
  "Oftalmologia",
  "Psiquiatria",
  "Endocrinologia",
  "Gastroenterologia",
  "Neurologia",
  "Otorrinolaringologia",
  "Urologia",
  "Reumatologia",
];

const NOMES = [
  "Mayara Viana", "Rafael Coelho", "Larissa Nogueira", "Tiago Barbosa",
  "Camila Freitas", "Otávio Lemos", "Beatriz Sampaio", "Henrique Portela",
  "Juliana Marques", "Diego Aragão", "Patrícia Cordeiro", "Fábio Rocha",
  "Renata Bastos", "Marcelo Tavares", "Aline Peixoto", "Gustavo Serra",
  "Vanessa Quirino", "Leonardo Prata", "Simone Andrade", "Rodrigo Meireles",
  "Cristina Bezerra", "Anderson Vilela", "Tatiane Furtado", "Bruno Cavalcante",
];

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const slug = (s: string) =>
  semAcento(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const aspas = (s: string) => "'" + s.replace(/'/g, "''") + "'";

/* Distribuição de especialidades e bairros. Clínica Médica tem 4 profissionais
   (3 em Centro + 1 em Nova Imperatriz). Cardiologia tem 2 em Centro.
   Assim, "Clínica Médica / Centro" fica com 3 (indexável) e
   "Cardiologia / Centro" fica com 2 (não indexável). */
const ESPECIALIDADE_DE = [
  0, 0, 0, 0,  // Clínica Médica: profissionais 0-3
  1, 1,        // Cardiologia: profissionais 4-5
  2, 2,        // Dermatologia: profissionais 6-7
  3,           // Ginecologia: profissional 8
  4,           // Ortopedia: profissional 9
  5,           // Pediatria: profissional 10
  6,           // Oftalmologia: profissional 11
  7,           // Psiquiatria: profissional 12
  8,           // Endocrinologia: profissional 13
  9,           // Gastroenterologia: profissional 14
  10,          // Neurologia: profissional 15
  11,          // Otorrinolaringologia: profissional 16
  12,          // Urologia: profissional 17
  13, 13, 13, 13, 13, 13,  // Reumatologia: profissionais 18-23 (6 profissionais)
];

const BAIRRO_DE = [
  0, 0, 0, 1,        // Clínica Médica: Centro(0), Centro(0), Centro(0), Nova Imperatriz(1)
  0, 0,              // Cardiologia: Centro(0), Centro(0)
  1, 2,              // Dermatologia: Nova Imperatriz(1), Bacuri(2)
  3, 4, 5, 6, 7, 0,  // Ginecologia até Endocrinologia: Juçara a Centro
  1, 2, 3, 4, 5, 6, 7, 0, 1, 2,  // Gastroenterologia até Reumatologia: cycling through bairros
];

const linhas: string[] = [
  "-- Dados de demonstração. Fictícios, mas verossímeis para Imperatriz-MA.",
  "-- Gerado por supabase/seed/gerar-seed.ts — não edite à mão.",
  "",
  "truncate horario, atendimento, local_acessibilidade, local,",
  "  formacao, profissional_especialidade, profissional, estabelecimento,",
  "  bairro, especialidade restart identity cascade;",
  "",
];

linhas.push("insert into bairro (nome, slug) values");
linhas.push(
  BAIRROS.map((b) => "  (" + aspas(b) + ", " + aspas(slug(b)) + ")").join(",\n") + ";",
  "",
);

linhas.push(
  "insert into especialidade (nome, slug, o_que_faz, quando_procurar) values",
);
linhas.push(
  ESPECIALIDADES.map((e) => {
    const oQueFaz =
      "[PROVISÓRIO] Texto sobre a atuação em " + e.toLowerCase() +
      ", a ser escrito e revisado por médico associado.";
    const quando =
      "[PROVISÓRIO] Sinais e situações que levam à consulta em " +
      e.toLowerCase() + ", a ser escrito e revisado por médico associado.";
    return (
      "  (" + aspas(e) + ", " + aspas(slug(e)) + ", " +
      aspas(oQueFaz) + ", " + aspas(quando) + ")"
    );
  }).join(",\n") + ";",
  "",
);

/* Profissionais. A variação é proposital e distribuída por índice:
   telemedicina em 1 de 3, associado em 3 de 4, sábado em 1 de 4. */
linhas.push(
  "insert into profissional (slug, nome, crm, crm_uf, bio, telemedicina, " +
    "associado_ami, publicado, verificado_em) values",
);
linhas.push(
  NOMES.map((nome, i) => {
    const bio =
      "[PROVISÓRIO] Biografia de " + nome +
      ", a ser substituída por texto enviado pelo profissional.";
    return (
      "  (" + aspas(slug(nome)) + ", " + aspas(nome) + ", " +
      aspas(String(10000 + i * 137)) + ", 'MA', " + aspas(bio) + ", " +
      (i % 3 === 0) + ", " + (i % 4 !== 0) + ", true, '2026-08-19')"
    );
  }).join(",\n") + ";",
  "",
);

/* Cada profissional recebe uma especialidade. Os que caem em Clínica Médica
   ficam sem RQE — caso normal que o site precisa saber exibir. */
linhas.push(
  "insert into profissional_especialidade " +
    "(profissional_id, especialidade_id, rqe, principal) values",
);
linhas.push(
  NOMES.map((_, i) => {
    const esp = ESPECIALIDADE_DE[i] + 1;
    /* Clínica Médica é o caso do clínico sem especialidade registrada. */
    const rqe = esp === 1 ? "null" : aspas(String(20000 + i * 91));
    return "  (" + (i + 1) + ", " + esp + ", " + rqe + ", true)";
  }).join(",\n") + ";",
  "",
);

linhas.push(
  "insert into local (logradouro, numero, bairro_id, telefone, whatsapp, " +
    "estacionamento) values",
);
linhas.push(
  NOMES.map((_, i) => {
    const bairro = BAIRRO_DE[i] + 1;
    const tel = "99" + String(30000000 + i * 13571).slice(0, 8);
    return (
      "  (" + aspas("Rua Projetada " + (100 + i)) + ", " +
      aspas(String(100 + i * 7)) + ", " + bairro + ", " +
      aspas(tel) + ", " + aspas(tel) + ", " + (i % 2 === 0) + ")"
    );
  }).join(",\n") + ";",
  "",
);

linhas.push("insert into local_acessibilidade (local_id, recurso) values");
linhas.push(
  NOMES.flatMap((_, i) => {
    const r: string[] = [];
    if (i % 2 === 0) r.push("  (" + (i + 1) + ", 'acesso_cadeirante')");
    if (i % 3 === 0) r.push("  (" + (i + 1) + ", 'banheiro_adaptado')");
    if (i % 5 === 0) r.push("  (" + (i + 1) + ", 'elevador')");
    return r;
  }).join(",\n") + ";",
  "",
);

linhas.push("insert into atendimento (profissional_id, local_id) values");
linhas.push(
  NOMES.map((_, i) => "  (" + (i + 1) + ", " + (i + 1) + ")").join(",\n") + ";",
  "",
);

/* Horários: todos atendem de segunda a sexta; 1 em cada 4 atende sábado.
   Sem essa variação, o filtro de sábado não teria o que filtrar. */
linhas.push("insert into horario (atendimento_id, dia_semana, abre, fecha) values");
linhas.push(
  NOMES.flatMap((_, i) => {
    const f: string[] = [];
    for (let d = 1; d <= 5; d++) {
      f.push("  (" + (i + 1) + ", " + d + ", '08:00', '12:00')");
      f.push("  (" + (i + 1) + ", " + d + ", '14:00', '18:00')");
    }
    if (i % 4 === 0) f.push("  (" + (i + 1) + ", 6, '08:00', '12:00')");
    return f;
  }).join(",\n") + ";",
  "",
);

writeFileSync(
  new URL("./seed.sql", import.meta.url),
  linhas.join("\n") + "\n",
  "utf8",
);

console.log(
  "seed.sql gerado: " + NOMES.length + " profissionais, " +
    ESPECIALIDADES.length + " especialidades, " + BAIRROS.length + " bairros",
);

/* Conferência do corte de indexação: sem um cruzamento com três ou mais,
   metade do controle de facetas fica sem dado para exercitar. */
const porEspecialidade = new Map<string, number>();
const porCruzamento = new Map<string, number>();
NOMES.forEach((_, i) => {
  const e = ESPECIALIDADES[ESPECIALIDADE_DE[i]];
  const b = BAIRROS[BAIRRO_DE[i]];
  porEspecialidade.set(e, (porEspecialidade.get(e) ?? 0) + 1);
  porCruzamento.set(e + " / " + b, (porCruzamento.get(e + " / " + b) ?? 0) + 1);
});
const indexaveis = [...porCruzamento.entries()].filter(([, n]) => n >= 3);
console.log(
  "  maior especialidade: " +
    Math.max(...porEspecialidade.values()) +
    " profissionais",
);
console.log(
  "  cruzamentos indexaveis (3+): " +
    (indexaveis.length
      ? indexaveis.map(([k, n]) => k + " (" + n + ")").join(", ")
      : "NENHUM — o corte de indexacao ficaria sem dado para exercitar"),
);
