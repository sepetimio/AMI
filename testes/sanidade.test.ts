import { describe, expect, it } from "vitest";

describe("ambiente de testes", () => {
  it("executa e resolve o alias @/", async () => {
    const pacote = await import("@/package.json");
    expect(pacote.default.name).toBeTruthy();
  });
});
