import { cache } from "react";
import { clienteServidor } from "@/lib/dados/cliente";
import { aplicarFiltros, ordenar } from "@/lib/dados/filtros";
import type {
  Filtros,
  Medico,
  RecursoAcessibilidade,
} from "@/lib/dados/tipos";

/* Uma seleção só, com as junções aninhadas. Trazer tudo de uma vez evita o
   problema de N+1 consultas — 24 perfis não podem virar 97 idas ao banco. */
const SELECAO = `
  id, slug, nome, crm, crm_uf, foto, bio, telemedicina, associado_ami,
  profissional_especialidade (
    rqe, principal,
    especialidade ( nome, slug )
  ),
  atendimento (
    horario ( dia_semana, abre, fecha ),
    local (
      id, logradouro, numero, telefone, whatsapp, estacionamento,
      bairro ( id, nome, slug ),
      local_acessibilidade ( recurso )
    )
  )
`;

/* O Postgres devolve `time` como "08:00:00"; a interface e os testes
   trabalham com "HH:MM". */
const hhmm = (t: string) => t.slice(0, 5);

/* eslint-disable @typescript-eslint/no-explicit-any */
function paraDominio(linha: any): Medico {
  return {
    id: linha.id,
    slug: linha.slug,
    nome: linha.nome,
    crm: linha.crm,
    crmUf: linha.crm_uf,
    foto: linha.foto,
    bio: linha.bio,
    telemedicina: linha.telemedicina,
    associadoAmi: linha.associado_ami,
    especialidades: (linha.profissional_especialidade ?? []).map((pe: any) => ({
      nome: pe.especialidade.nome,
      slug: pe.especialidade.slug,
      rqe: pe.rqe,
      principal: pe.principal,
    })),
    /*
      Ordenado por `id` do local. A consulta já pede ao PostgREST que devolva
      `atendimento` ordenado pelo próprio id — mas PostgREST não promete
      ordem estável em recursos aninhados, então este sort é cinto e
      suspensório: garante a mesma ordem independentemente do que o banco
      devolver, e continua correto mesmo que a consulta mude no futuro e
      perca aquele `.order`. Sem isso, `locais[0]` — que `LinhaMedico`,
      `jsonld.ts` e a página de perfil usam para decidir bairro, telefone,
      selo de aberto/fechado e endereço do JSON-LD — poderia apontar para um
      consultório diferente a cada renderização de um médico com dois
      endereços, e o ISR congelaria essa escolha arbitrária por uma hora.
    */
    locais: (linha.atendimento ?? [])
      .map((a: any) => ({
        id: a.local.id,
        logradouro: a.local.logradouro,
        numero: a.local.numero,
        bairro: a.local.bairro,
        telefone: a.local.telefone,
        whatsapp: a.local.whatsapp,
        estacionamento: a.local.estacionamento,
        acessibilidade: (a.local.local_acessibilidade ?? []).map(
          (r: any) => r.recurso as RecursoAcessibilidade,
        ),
        horarios: (a.horario ?? []).map((h: any) => ({
          diaSemana: h.dia_semana,
          abre: hhmm(h.abre),
          fecha: hhmm(h.fecha),
        })),
      }))
      .sort((a: { id: number }, b: { id: number }) => a.id - b.id),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Todos os profissionais visíveis, uma vez por requisição.
 *
 * Envolvido em `cache` do React de propósito. Uma página de faceta chama a
 * camada de dados cinco vezes — para o título, para o resumo, para a lista
 * filtrada, para os bairros e para as especialidades relacionadas. Sem isto,
 * seriam cinco varreduras da tabela inteira e cinco mapeamentos completos na
 * mesma renderização. Com `cache`, é uma só, e as outras quatro reaproveitam.
 *
 * Sem argumento de propósito: `cache` compara argumentos por identidade, e
 * dois objetos de filtro iguais mas distintos furariam a memoização. Filtrar
 * é barato e acontece em memória; buscar é que custa.
 */
const todosVisiveis = cache(async (): Promise<Medico[]> => {
  const { data, error } = await clienteServidor()
    .from("profissional")
    .select(SELECAO)
    .eq("publicado", true)
    .eq("situacao", "ativo")
    /*
      Sem ordem explícita, o PostgREST não promete estabilidade nos registros
      de um recurso aninhado — `LinhaMedico`, `jsonld.ts` e a página de
      perfil tomam `locais[0]` como "o" consultório do médico, e um médico com
      dois endereços poderia alternar entre um e outro a cada renderização.
      Ordenar pelo id do próprio `atendimento` torna a resposta determinística
      na origem; `paraDominio` ainda reordena por id do local como garantia
      adicional que não depende do banco.
    */
    .order("id", { foreignTable: "atendimento" });

  if (error) throw new Error(`Falha ao buscar médicos: ${error.message}`);
  return (data ?? []).map(paraDominio);
});

/**
 * Busca com filtros.
 *
 * A publicação é filtrada no banco — e a RLS garante isso de novo, mesmo que
 * alguém remova aquela linha. O restante é filtrado em memória por
 * `aplicarFiltros`, que é puro e testado. Com a ordem de 500 registros a
 * diferença de desempenho é irrelevante, e a lógica fica testável sem banco.
 */
export async function buscarMedicos(filtros: Filtros = {}): Promise<Medico[]> {
  return ordenar(
    aplicarFiltros(await todosVisiveis(), filtros),
    filtros.ordem ?? "relevancia",
    filtros.termo,
  );
}

/**
 * Perfil por slug.
 *
 * Filtra por `situacao` igual à busca, de propósito: sem isso um
 * profissional inativo sumiria da listagem e continuaria alcançável pela URL
 * direta, o que é pior que qualquer um dos dois comportamentos inteiros.
 *
 * A pergunta mais funda — o que deve acontecer com a URL de quem parou de
 * atender, já que endereço publicado não deveria desaparecer — pede uma
 * resposta desenhada, com a página no ar dizendo que o profissional não
 * atende mais. Isso é trabalho do Plano 2. Aqui o que importa é que os dois
 * caminhos concordem.
 */
export async function medicoPorSlug(slug: string): Promise<Medico | null> {
  /* Sai da mesma lista memoizada: numa página de perfil que também mostra
     profissionais relacionados, isto economiza a segunda ida ao banco. */
  return (await todosVisiveis()).find((m) => m.slug === slug) ?? null;
}

/**
 * Alimenta o sitemap e a geração estática das rotas de perfil.
 *
 * Mesmo par de condições das outras duas consultas: um slug no sitemap que
 * devolve 404 é um convite que o site não honra.
 */
export async function slugsDeMedicos(): Promise<string[]> {
  return (await todosVisiveis()).map((m) => m.slug);
}
