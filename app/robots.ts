import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/*
  Trava de release: o seed inventa 24 médicos com CRM plausível, publicados
  como Physician em JSON-LD e listados no sitemap. Um CRM naquela faixa pode
  muito bem pertencer a um médico de verdade — o único aviso de que são dados
  fictícios está no rodapé, que não alcança nem o snippet de busca nem o
  JSON-LD. Enquanto a flag for "true" (o padrão), o site inteiro sai
  `disallow: "/"` e sem linha de sitemap, para que os perfis fabricados nunca
  cheguem ao índice. Ela só vira "false" quando o cadastro real da AMI
  estiver carregado.
*/
const DEMO = process.env.NEXT_PUBLIC_DADOS_DEMONSTRACAO !== "false";

export default function robots(): MetadataRoute.Robots {
  if (DEMO) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* /painel entra na Fase 4 e já fica bloqueado desde agora, para que
         nenhuma tela autenticada apareça no índice por descuido. /studio é o
         Sanity embutido: também autenticado, e o próprio next-sanity já manda
         noindex no metadata. A linha aqui é a segunda tranca, para o caso de
         um rastreador que leia robots.txt e ignore a meta tag. */
      disallow: ["/api/", "/painel/", "/studio/", "/_next/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
