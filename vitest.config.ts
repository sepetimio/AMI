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
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      /* `sanity` reexporta `defineField`/`defineType`/`defineArrayMember` de
         `@sanity/types` (ver `export * from "@sanity/types"` em
         node_modules/sanity/lib/index.js), mas o próprio módulo principal
         carrega, de saída, toda a interface do Studio em React, com JSX
         escrito diretamente em arquivos `.js` que nem o esbuild nem o oxc
         (usados pelo Vitest) transformam por padrão. O Next, em produção,
         resolve isso porque compila `sanity.config.ts` com seu próprio
         pipeline. Aqui, para testar só a definição dos schemas, aponta
         direto para o pacote de onde essas funções realmente vêm. */
      sanity: "@sanity/types",
    },
  },
});
