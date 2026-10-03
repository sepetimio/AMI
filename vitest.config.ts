import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/* Os testes cobrem a lógica pura de `lib/` e `sanity/`, mais uma exceção
   deliberada: `testes/revalidar.test.ts` importa o handler de
   `app/api/revalidar/route.ts`. Aquela é a única rota pública do site, o
   caminho que devolve 400 nasceu de um 500 que se arrancava sem credencial
   nenhuma, e ele se exercita com um `NextRequest` de verdade, sem mock. Uma
   convenção não pode deixar a rota exposta sem teste.

   Não há teste de interface no sentido usual — nada de clicar, digitar ou
   afirmar sobre pixel: o custo de manter não se paga num site deste porte.
   `testes/carrossel.test.ts` é a segunda exceção, e não é disso que ele
   trata: ele renderiza o carrossel com `renderToString` só para comparar
   duas saídas de servidor entre si, porque compatibilidade de hidratação não
   dá para ler no código nem o `npm run build` verifica.
   `testes/porta-da-busca.test.ts`, `testes/molduras.test.ts` e
   `testes/fotografia-trava.test.ts` também
   renderizam com `renderToString`, e também sem clicar nem medir pixel: só
   leem o HTML de servidor, para saber se um campo ou uma moldura saiu.
   `testes/home-renderizada.test.ts` faz o mesmo com a home inteira, com
   `renderToPipeableStream` e as fontes de dados trocadas por dublês. */
export default defineConfig({
  test: {
    include: ["testes/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    /* Forma de array, com `find` em regex de correspondência exata (`^...$`),
       de propósito: a forma de objeto do Vite casa por prefixo, então
       `sanity: "@sanity/types"` também reescreveria "sanity/structure" para
       "@sanity/types/structure", um subcaminho que não existe nesse pacote.
       O erro resultante ("./structure" is not exported... from package
       @sanity/types) aponta para o pacote errado. Não trocar de volta para a
       forma de objeto sem preservar essa correspondência exata. */
    alias: [
      { find: /^@\//, replacement: fileURLToPath(new URL("./", import.meta.url)) },
      /* `sanity` reexporta `defineField`/`defineType`/`defineArrayMember` de
         `@sanity/types` (ver `export * from "@sanity/types"` em
         node_modules/sanity/lib/index.js), mas o próprio módulo principal
         carrega, de saída, toda a interface do Studio em React, com JSX
         escrito diretamente em arquivos `.js` que nem o esbuild nem o oxc
         (usados pelo Vitest) transformam por padrão. O Next, em produção,
         resolve isso porque compila `sanity.config.ts` com seu próprio
         pipeline. Aqui, para testar só a definição dos schemas, aponta
         direto para o pacote de onde essas funções realmente vêm. */
      { find: /^sanity$/, replacement: "@sanity/types" },
    ],
  },
});
