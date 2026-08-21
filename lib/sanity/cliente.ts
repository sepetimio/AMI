import { createClient, type SanityClient } from "next-sanity";

/*
  A única porta para o Sanity, espelhando o papel de `lib/dados/` em relação
  ao Supabase. Nenhuma página constrói cliente próprio.

  `createClient` vem de `next-sanity`, não de `@sanity/client`: o pacote
  direto está em 8.x e o `next-sanity@13` exige 7.26 por peer. Importar da
  raiz do next-sanity garante que se use exatamente a versão resolvida.

  A construção é preguiçosa, atrás de `obterCliente()`, e não mais uma
  constante calculada na importação do módulo. `sanity/env.ts` valida as
  variáveis de ambiente no próprio topo daquele módulo, decisão deliberada de
  falha rápida; então qualquer módulo que importasse dali no topo herdava
  essa validação na importação, mesmo sem nunca chegar a usar o cliente. Foi
  o que aconteceu com `lib/sanity/consultas.ts`: seus testes de lógica pura
  (montagem de etiqueta, montagem de GROQ) não tocam rede nenhuma, mas a
  simples importação do módulo já disparava a checagem de ambiente, e a
  suíte quebrava em qualquer máquina sem `.env.local`, inclusive em CI. A
  correção é adiar a leitura do ambiente para o primeiro uso real, não
  esconder a dependência carregando `.env.local` no runner de teste.

  Pelo mesmo motivo, o import de `sanity/env` abaixo é dinâmico (`await
  import`), e não estático no topo deste arquivo: um `import { projectId }
  from "@/sanity/env"` aqui reintroduziria a mesma validação na importação,
  só que uma camada acima, e a preguiça de `obterCliente()` não teria efeito
  nenhum.
*/
let memoria: SanityClient | undefined;

export async function obterCliente(): Promise<SanityClient> {
  if (!memoria) {
    const { apiVersion, dataset, projectId } = await import("@/sanity/env");
    memoria = createClient({
      projectId,
      dataset,
      apiVersion,
      /*
        `useCdn: false` é decisão, não descuido. O CDN do Sanity serve
        conteúdo com atraso de até um minuto, e este site já tem a sua
        própria camada de cache no Next, invalidada por webhook na tarefa 4.
        Com CDN ligado, publicar uma notícia dispararia a invalidação do
        Next e a página buscaria de novo do CDN, ainda obsoleto: a correção
        só apareceria no ciclo seguinte, e ninguém entenderia por quê.
      */
      useCdn: false,
      /*
        "published" garante que rascunho nunca vaze para o site público. É
        o padrão da biblioteca, escrito aqui porque é uma garantia que
        importa e silêncio não é garantia.
      */
      perspective: "published",
    });
  }
  return memoria;
}
