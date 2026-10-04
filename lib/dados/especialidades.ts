import { cache } from "react";
import { buscarMedicos } from "@/lib/dados/medicos";
import { clienteServidor } from "@/lib/dados/cliente";
import type { EspecialidadeComContagem } from "@/lib/dados/tipos";

/**
 * Especialidades com quantos profissionais publicados cada uma tem.
 *
 * A contagem sai da mesma fonte que a listagem, de propósito: se o título da
 * página diz 7 e a lista mostra 6, o número está sendo escrito à mão em algum
 * lugar — e é isso que esta função existe para impedir.
 *
 * Especialidade sem nenhum profissional publicado não entra: uma página vazia
 * indexada é conteúdo raso.
 */
export async function especialidadesComContagem(): Promise<
  EspecialidadeComContagem[]
> {
  const medicos = await buscarMedicos();
  const contagem = new Map<string, EspecialidadeComContagem>();

  for (const m of medicos) {
    for (const e of m.especialidades) {
      const atual = contagem.get(e.slug);
      if (atual) atual.total += 1;
      else contagem.set(e.slug, { nome: e.nome, slug: e.slug, total: 1 });
    }
  }

  return [...contagem.values()].sort(
    (a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

/* Memoizada: a página chama isto no generateMetadata e de novo no corpo,
   e sem cache seriam duas idas ao banco por requisição. O argumento é uma
   string, então a comparação por identidade do cache funciona.

   Só o nome e o slug. O "Sobre a especialidade" (o que faz, quando
   procurar, o revisor) vem do Sanity (`textoDaEspecialidade`,
   lib/sanity/consultas.ts). As colunas `o_que_faz` e `quando_procurar`
   continuam no banco, sem uso no site. */
export const especialidadePorSlug = cache(
  async (slug: string): Promise<{ nome: string; slug: string } | null> => {
    const { data, error } = await clienteServidor()
      .from("especialidade")
      .select("nome, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new Error(`Falha ao buscar a especialidade: ${error.message}`);
    if (!data) return null;

    return { nome: data.nome as string, slug: data.slug as string };
  },
);
