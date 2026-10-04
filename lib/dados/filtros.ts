import { especialidadeCasaTermo, normalizar } from "@/lib/dados/sinonimos";
import type { Filtros, Medico } from "@/lib/dados/tipos";

/*
  Filtragem e ordenação em código, sobre a lista já trazida do banco.

  Com a ordem de 500 profissionais o conjunto inteiro cabe na memória do
  servidor e é percorrido em milissegundos. Se um dia a AMI virar plataforma
  regional com dezenas de milhares de perfis, estas funções são o ponto único
  a migrar para SQL — e nenhuma tela precisa mudar.
*/

function casaNoNome(m: Medico, termo: string): boolean {
  return normalizar(m.nome).includes(termo);
}

/*
  Busca por especialidade casa por PREFIXO de token (nome formal, nome da
  profissão e abreviações — ver lib/dados/sinonimos.ts), não por substring:
  "uro" tem que achar Urologia sem achar Neurologia, mesmo a sequência de
  letras "uro" estando dentro de "neurologista". Nome de médico continua
  usando substring logo acima — lá o padrão é sobrenome no meio do nome.
*/
function casaNaEspecialidade(m: Medico, termo: string): boolean {
  return m.especialidades.some((e) => especialidadeCasaTermo(e.nome, termo));
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

    return true;
  });
}

/** Alfabética em português: "Ângela" cai junto de "Angela", não no fim. */
export const porNome = (a: Medico, b: Medico) =>
  a.nome.localeCompare(b.nome, "pt-BR");

/**
 * A ordem do site: sempre alfabética, e a busca diz isso na tela ("Em ordem
 * alfabética"). Nenhum critério de destaque, qualidade, completude ou
 * antiguidade, e nenhum destaque pago nem selo comparativo neste site.
 */
export function emOrdemAlfabetica(medicos: Medico[]): Medico[] {
  return [...medicos].sort(porNome);
}
