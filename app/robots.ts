import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* /painel entra na Fase 4 e já fica bloqueado desde agora, para que
         nenhuma tela autenticada apareça no índice por descuido. */
      disallow: ["/api/", "/painel/", "/_next/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
