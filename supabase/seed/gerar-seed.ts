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
    const esp = (i % ESPECIALIDADES.length) + 1;
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
    const bairro = (i % BAIRROS.length) + 1;
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
