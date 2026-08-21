import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
    `@sanity/sdk-react` (dependência transitiva de `sanity`, usada para
    detectar se o Studio roda dentro do Dashboard da Sanity) publica
    `dist/index.js` com JSX cru, não compilado. Nem Turbopack nem webpack
    aceitam `<Componente>` dentro de um arquivo `.js`: os dois leem `<` como
    início de expressão regular e o build para com "Unterminated regexp
    literal" ou "Unexpected token '<'". Listar aqui manda o Next rodar esse
    pacote pelo próprio pipeline de compilação, que reconhece JSX, em vez de
    tratá-lo como código já pronto para rodar sem transformação.
  */
  transpilePackages: ["@sanity/sdk-react"],
};

export default nextConfig;
