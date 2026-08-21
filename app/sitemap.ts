import type { MetadataRoute } from "next";
import { buscarMedicos } from "@/lib/dados/medicos";
import { facetaEhIndexavel } from "@/lib/dados/facetas";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/*
  Gerado do banco. Só entram as URLs que são de fato indexáveis — o mesmo
  corte que a página aplica no seu robots. Sitemap e meta em desacordo é
  sinal contraditório: o sitemap convida, a página recusa.
*/
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /*
    Uma consulta só, e todo o resto se calcula em memória.

    A versão anterior chamava bairrosComContagem dentro do laço de
    especialidades, e cada chamada varre a tabela inteira: dezesseis idas ao
    banco para montar um arquivo. O `cache` do React não ajuda aqui — ele
    depende do armazenamento por renderização do Next, e uma rota de
    metadados como esta compila como manipulador, não como componente.
  */
  const todos = await buscarMedicos();

  const fixas: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/medicos`, changeFrequency: "weekly", priority: 0.9 },
  ];

  /* Profissionais distintos por especialidade e por cruzamento. Conjuntos,
     não contadores: quem tem dois consultórios no mesmo bairro conta uma vez. */
  const porEspecialidade = new Map<string, Set<number>>();
  const porCruzamento = new Map<string, Set<number>>();

  for (const m of todos) {
    const bairros = new Set(m.locais.map((l) => l.bairro.slug));
    for (const e of m.especialidades) {
      if (!porEspecialidade.has(e.slug)) porEspecialidade.set(e.slug, new Set());
      porEspecialidade.get(e.slug)!.add(m.id);
      for (const b of bairros) {
        const chave = `${e.slug}/${b}`;
        if (!porCruzamento.has(chave)) porCruzamento.set(chave, new Set());
        porCruzamento.get(chave)!.add(m.id);
      }
    }
  }

  const especialidades: MetadataRoute.Sitemap = [...porEspecialidade.keys()]
    .sort()
    .map((slug) => ({
      url: `${SITE}/medicos/${slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  /*
    Cruzamento só entra acima do corte de indexação.

    Listar um cruzamento que a própria página marca como noindex seria sinal
    contraditório: o sitemap convidando o robô e a página o recusando.
  */
  const cruzamentos: MetadataRoute.Sitemap = [...porCruzamento.entries()]
    .filter(([, ids]) => facetaEhIndexavel(ids.size))
    .map(([caminho]) => caminho)
    .sort()
    .map((caminho) => ({
      url: `${SITE}/medicos/${caminho}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  const perfis: MetadataRoute.Sitemap = todos
    .map((m) => m.slug)
    .sort()
    .map((slug) => ({
      url: `${SITE}/medico/${slug}`,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  return [...fixas, ...especialidades, ...cruzamentos, ...perfis];
}
