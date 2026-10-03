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

  /*
    As páginas de especialidade por bairro (/medicos/<especialidade>/<bairro>)
    saíram do site junto com os bairros, em 03/10/2026. Quem chega pelo
    endereço antigo, de um link guardado ou do Google, vai para a página da
    especialidade, com redirecionamento permanente (308), para o buscador
    trocar o endereço guardado.
  */
  async redirects() {
    return [
      {
        source: "/medicos/:especialidade/:bairro",
        destination: "/medicos/:especialidade",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
