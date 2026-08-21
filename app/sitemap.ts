import type { MetadataRoute } from "next";
import { buscarMedicos, slugsDeMedicos } from "@/lib/dados/medicos";
import {
  bairrosComContagem,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { facetaEhIndexavel } from "@/lib/dados/facetas";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/*
  Gerado do banco. Só entram as URLs que são de fato indexáveis — o mesmo
  corte que a página aplica no seu robots. Sitemap e meta em desacordo é
  sinal contraditório: o sitemap convida, a página recusa.
*/
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [especialidades, slugs] = await Promise.all([
    especialidadesComContagem(),
    slugsDeMedicos(),
  ]);

  const fixas: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/medicos`, changeFrequency: "weekly", priority: 0.9 },
  ];

  const porEspecialidade: MetadataRoute.Sitemap = especialidades.map((e) => ({
    url: `${SITE}/medicos/${e.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  /* Cruzamento só entra acima do corte de indexação. */
  const cruzamentos: MetadataRoute.Sitemap = [];
  for (const e of especialidades) {
    const bairros = await bairrosComContagem(e.slug);
    for (const b of bairros) {
      if (facetaEhIndexavel(b.total)) {
        cruzamentos.push({
          url: `${SITE}/medicos/${e.slug}/${b.slug}`,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  }

  const perfis: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${SITE}/medico/${slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...fixas, ...porEspecialidade, ...cruzamentos, ...perfis];
}
