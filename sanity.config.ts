import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { ptBRLocale } from "@sanity/locale-pt-br";
import { apiVersion, dataset, projectId } from "./sanity/env";
import { tipos } from "./sanity/schemas";

/*
  Na raiz do projeto porque a linha de comando do Sanity procura este arquivo
  exatamente aqui. Mover para dentro de `sanity/` quebra `npx sanity deploy` e
  `npx sanity dataset export`.

  `basePath` precisa bater com a rota em `app/studio/[[...tool]]`. Divergindo,
  o Studio carrega mas a navegação interna monta endereços que dão 404.
*/
export default defineConfig({
  name: "ami",
  title: "Associação Médica de Imperatriz",
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [
    /* O `@sanity/locale-pt-br` traduz os formulários, mas não tem bundle para
       a ferramenta de estrutura, então a aba do topo sairia "Structure". Quem
       vai usar isto é a secretaria da AMI: o título é a única palavra dali que
       ela lê o dia inteiro. */
    structureTool({ title: "Conteúdo" }),
    /* Interface do Studio em português. A spec pede locale pt-BR, e não é
       detalhe: quem vai escrever ali é a secretaria da AMI, não um
       desenvolvedor. Um formulário com "Publish" e "Discard changes" gera
       ligação para a agência a cada dúvida. */
    ptBRLocale(),
    /* Vision é o console de GROQ. Fica só em desenvolvimento: em produção ele
       é uma janela de leitura livre no conteúdo para quem tiver acesso ao
       Studio, e não acrescenta nada a quem só edita texto. */
    ...(process.env.NODE_ENV === "development"
      ? [visionTool({ defaultApiVersion: apiVersion })]
      : []),
  ],
  /* Tipos definidos na tarefa 2: autor, noticia e paginaInstitucional. */
  schema: { types: tipos },
});
