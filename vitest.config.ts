import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/* Os testes cobrem só a lógica pura de `lib/`. Não há teste de interface:
   o custo de manter não se paga num site deste porte. */
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
