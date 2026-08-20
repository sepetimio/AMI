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
    },
  },
});
