/*
  Gera `docs/rascunhos-textos-legais.md` a partir de `lib/rascunhosLegais.ts`.

  A razão de existir: o documento que o advogado revisa e o texto que está no
  ar precisam ser o mesmo. Escritos separadamente, divergem na primeira
  correção, e a revisão passa a aprovar uma versão enquanto o visitante lê
  outra. Gerado de uma fonte só, o descompasso deixa de ser possível.

  Rode com:  npx tsx scripts/gerar-doc-legal.ts

  Por `tsx` e não por `node` direto: o módulo importa pelo apelido `@/`, que é
  a convenção do projeto inteiro, e o resolvedor do Node puro não conhece esse
  apelido. `tsx` lê o `tsconfig.json` e resolve.
*/
import fs from "node:fs";
import { RASCUNHOS_LEGAIS } from "@/lib/rascunhosLegais";

const linhas: string[] = [
  "# Rascunhos dos textos legais, para revisão jurídica",
  "",
  "> **Estes textos são rascunho e não são peça jurídica.**",
  "> Foram redigidos a partir do funcionamento real do site, para servir de",
  "> ponto de partida à revisão por advogado de direito médico, e estão",
  "> publicados no site com aviso visível de que não foram revisados.",
  "",
  "Gerado de `lib/rascunhosLegais.ts`, que é a mesma fonte que o site",
  "renderiza. **Não edite este arquivo à mão**: a correção entra no módulo, e o",
  "documento é gerado de novo com `npx tsx scripts/gerar-doc-legal.ts`.",
  "",
  "---",
  "",
  "## O que foi medido neste site, e sustenta os textos",
  "",
  "Os fatos abaixo foram verificados, não presumidos. Se algum mudar, os textos",
  "mudam junto.",
  "",
  "| Fato | Como foi verificado |",
  "|---|---|",
  "| Nenhuma página pública grava cookie | Nenhum cabeçalho `Set-Cookie` em `/`, `/medicos` e `/noticias` |",
  "| Não há ferramenta de análise nem rastreamento | Nenhuma dependência de análise, pixel ou telemetria no projeto |",
  "| Não há script de terceiro | Nenhum `script` externo no HTML servido |",
  "| Não há formulário que colete dado pessoal | A busca é `GET` e envia só termo e bairro |",
  "| Nenhuma tela pergunta sintoma ou diagnóstico | Decisão de projeto, registrada na especificação |",
  "| O único endereço externo é o link do Instagram | É link, não carregamento: nada é requisitado antes do clique |",
  "",
  "---",
  "",
  "## Pontos que dependem da AMI",
  "",
  "Estão marcados `[PROVISÓRIO]` dentro do texto, no lugar em que aparecem.",
  "",
  "1. **Encarregado pelo tratamento de dados.** O artigo 41 da Lei 13.709/2018",
  "   exige que o controlador designe um, e o nome e o contato precisam entrar",
  "   na política de privacidade.",
  "2. **Prazo de guarda dos registros de acesso do servidor.** Depende da",
  "   empresa que hospedar o site, e precisa ser confirmado antes da publicação.",
  "",
  "---",
  "",
];

for (const r of RASCUNHOS_LEGAIS) {
  linhas.push(`## ${r.titulo}`, "");
  linhas.push(`**Endereço no site:** \`/${r.slug}\``, "");
  linhas.push("**Resumo**, que aparece abaixo do título e na busca do Google:", "");
  linhas.push(`> ${r.resumo}`, "");
  linhas.push(`**Rascunho de:** ${r.atualizadoEm}`, "");
  linhas.push("");

  for (const s of r.secoes) {
    linhas.push(`### ${s.titulo}`, "");
    for (const p of s.paragrafos) linhas.push(p, "");
    if (s.lista) {
      for (const i of s.lista) linhas.push(`- ${i}`);
      linhas.push("");
    }
  }
  linhas.push("---", "");
}

linhas.push(
  "## Como publicar a versão revisada",
  "",
  "O texto aprovado entra no Studio, em `/studio`, tipo **Página",
  "institucional**, escolhendo o endereço correspondente no campo **Endereço**.",
  "No instante em que for publicado, ele substitui o rascunho no site e o aviso",
  "de não revisado some junto, sem ninguém precisar apagar nada.",
  "",
);

fs.writeFileSync("docs/rascunhos-textos-legais.md", linhas.join("\n"));
console.log("gerado: docs/rascunhos-textos-legais.md");
