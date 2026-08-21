import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

/*
  A única porta para o Sanity, espelhando o papel de `lib/dados/` em relação
  ao Supabase. Nenhuma página constrói cliente próprio.

  `createClient` vem de `next-sanity`, não de `@sanity/client`: o pacote
  direto está em 8.x e o `next-sanity@13` exige 7.26 por peer. Importar da
  raiz do next-sanity garante que se use exatamente a versão resolvida.

  `useCdn: false` é decisão, não descuido. O CDN do Sanity serve conteúdo com
  atraso de até um minuto, e este site já tem a sua própria camada de cache no
  Next, invalidada por webhook na tarefa 4. Com CDN ligado, publicar uma
  notícia dispararia a invalidação do Next e a página buscaria de novo do CDN,
  ainda obsoleto: a correção só apareceria no ciclo seguinte, e ninguém
  entenderia por quê.
*/
export const cliente = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  /*
    "published" garante que rascunho nunca vaze para o site público. É o
    padrão da biblioteca, escrito aqui porque é uma garantia que importa e
    silêncio não é garantia.
  */
  perspective: "published",
});
