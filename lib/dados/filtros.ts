import { atendeNoDia } from "@/lib/dados/horarios";
import type { Filtros, Medico, Ordem } from "@/lib/dados/tipos";

/*
  Filtragem e ordenação em código, sobre a lista já trazida do banco.

  Com a ordem de 500 profissionais o conjunto inteiro cabe na memória do
  servidor e é percorrido em milissegundos. Se um dia a AMI virar plataforma
  regional com dezenas de milhares de perfis, estas funções são o ponto único
  a migrar para SQL — e nenhuma tela precisa mudar.
*/

/** "José" e "jose" precisam se encontrar: sem isto a busca falha em português. */
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function casaNoNome(m: Medico, termo: string): boolean {
  return normalizar(m.nome).includes(termo);
}

function casaNaEspecialidade(m: Medico, termo: string): boolean {
  return m.especialidades.some((e) => normalizar(e.nome).includes(termo));
}

export function aplicarFiltros(medicos: Medico[], filtros: Filtros): Medico[] {
  const termo = filtros.termo ? normalizar(filtros.termo) : "";

  return medicos.filter((m) => {
    if (termo && !casaNoNome(m, termo) && !casaNaEspecialidade(m, termo)) {
      return false;
    }

    if (
      filtros.especialidade &&
      !m.especialidades.some((e) => e.slug === filtros.especialidade)
    ) {
      return false;
    }

    if (
      filtros.bairro &&
      !m.locais.some((l) => l.bairro.slug === filtros.bairro)
    ) {
      return false;
    }

    if (filtros.telemedicina && !m.telemedicina) return false;
    if (filtros.somenteAssociados && !m.associadoAmi) return false;

    if (
      filtros.atendeSabado &&
      !m.locais.some((l) => atendeNoDia(l.horarios, 6))
    ) {
      return false;
    }

    /* Acessibilidade exige TODOS os recursos pedidos no mesmo local: de nada
       adianta o elevador ficar num endereço e a rampa em outro. */
    if (filtros.acessibilidade?.length) {
      const atende = m.locais.some((l) =>
        filtros.acessibilidade!.every((r) => l.acessibilidade.includes(r)),
      );
      if (!atende) return false;
    }

    return true;
  });
}

/** Alfabética em português: "Ângela" cai junto de "Angela", não no fim. */
const porNome = (a: Medico, b: Medico) =>
  a.nome.localeCompare(b.nome, "pt-BR");

/**
 * Ordenação.
 *
 * Relevância é definida de forma verificável, para que ninguém possa alegar
 * favorecimento: casar no nome vale mais que casar na especialidade, e o
 * desempate é alfabético. Sem termo digitado, relevância É a ordem alfabética.
 * Nenhum critério de qualidade, completude ou antiguidade entra na conta, e
 * não existe destaque pago nem selo comparativo neste site.
 */
export function ordenar(
  medicos: Medico[],
  ordem: Ordem,
  termo?: string,
): Medico[] {
  const lista = [...medicos];

  if (ordem === "nome" || !termo?.trim()) {
    return lista.sort(porNome);
  }

  const t = normalizar(termo);
  const peso = (m: Medico) =>
    casaNoNome(m, t) ? 0 : casaNaEspecialidade(m, t) ? 1 : 2;

  return lista.sort((a, b) => peso(a) - peso(b) || porNome(a, b));
}
