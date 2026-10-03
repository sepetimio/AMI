import { enderecoDaBusca, filtrosDaQuery } from "@/lib/dados/urlFiltros";

/*
  O que o formulário da busca (components/busca/FormularioDaBusca.tsx)
  mostra no campo e na lista enquanto o endereço muda, em funções puras.

  O formulário mostra a escolha na hora, mas a URL só muda depois, quando a
  página nova chega. Com trocas seguidas da lista, as URLs chegam uma a uma,
  em ordem: copiar cada uma no formulário faria a lista voltar por uma
  escolha anterior. Por isso o formulário guarda os endereços que ele mesmo
  enviou e ainda não viu chegar:

  - a URL é uma etapa intermediária (um envio que não é o último): nada
    muda na tela;
  - a URL é a do último envio: os envios acabaram, e só o que a pessoa não
    mexeu depois de enviar passa a ser o da URL (o texto digitado durante a
    troca fica);
  - a URL não é de nenhum envio (o × do filtro, o voltar do navegador): o
    campo e a lista passam a ser os da URL.

  E quando o roteador termina de navegar, o que sobrou na fila foi
  descartado por ele e não chega mais: a fila esvazia (`aoTerminarDeNavegar`).
*/

/** O texto do campo e a especialidade da lista; ou o que a URL diz deles. */
export type ValoresDaBusca = { termo: string; especialidade: string };

export type EstadoDoFormulario = {
  /** O que aparece no campo e na lista. */
  valores: ValoresDaBusca;
  /** A última URL que chegou ao formulário. */
  daUrl: ValoresDaBusca;
  /** Os envios do próprio formulário que a URL ainda não mostrou, em ordem. */
  envios: { endereco: string; valores: ValoresDaBusca }[];
};

/** O endereço que um envio com estes valores abre (sem os campos vazios). */
export function enderecoDosValores(v: ValoresDaBusca): string {
  return enderecoDaBusca(filtrosDaQuery(v));
}

/** O formulário recém-montado: mostra a URL e não espera envio nenhum. */
export function estadoInicial(url: ValoresDaBusca): EstadoDoFormulario {
  return { valores: url, daUrl: url, envios: [] };
}

/**
 * Enviar (Buscar, Enter, trocar a lista): mostra os valores enviados e
 * guarda o envio até a URL dele chegar. Reenviar o mesmo endereço não
 * guarda outro igual, e enviar o endereço que já está na URL, sem nada a
 * caminho, não espera nada.
 */
export function aoEnviar(estado: EstadoDoFormulario, valores: ValoresDaBusca): EstadoDoFormulario {
  const endereco = enderecoDosValores(valores);
  const anteriores =
    estado.envios.at(-1)?.endereco === endereco ? estado.envios.slice(0, -1) : estado.envios;
  const jaNaUrl = anteriores.length === 0 && endereco === enderecoDosValores(estado.daUrl);
  return { ...estado, valores, envios: jaNaUrl ? [] : [...anteriores, { endereco, valores }] };
}

/** O estado do formulário quando chega uma URL nova (as três regras do topo). */
export function valoresAposNavegar(estado: EstadoDoFormulario, url: ValoresDaBusca): EstadoDoFormulario {
  const i = estado.envios.findIndex((e) => e.endereco === enderecoDosValores(url));

  if (i === -1) return estadoInicial(url);

  if (i < estado.envios.length - 1) {
    return { ...estado, daUrl: url, envios: estado.envios.slice(i + 1) };
  }

  return fecharEspera(estado, url);
}

/**
 * O roteador terminou de navegar. Envio que ainda está na fila não chega
 * mais: o roteador o descartou (trocar para B e voltar para A, a URL atual,
 * antes de B chegar; a URL nem muda). A fila esvazia, e a tela volta a
 * mostrar a URL, menos o texto digitado depois do último envio. Sem isto, a
 * fila ficaria presa, e uma URL de fora (o voltar) igual a um envio preso
 * passaria por etapa intermediária: a lista mostraria um filtro que não
 * está valendo.
 */
export function aoTerminarDeNavegar(estado: EstadoDoFormulario): EstadoDoFormulario {
  return estado.envios.length === 0 ? estado : fecharEspera(estado, estado.daUrl);
}

/**
 * Acabou a espera, com esta URL: a lista é a dela (a lista não muda sem
 * enviar); o campo também, a não ser que a pessoa tenha digitado depois do
 * último envio, e aí o texto dela fica.
 */
function fecharEspera(estado: EstadoDoFormulario, url: ValoresDaBusca): EstadoDoFormulario {
  const ultimo = estado.envios[estado.envios.length - 1];
  const { termo } = estado.valores;
  return {
    valores: {
      termo: termo === ultimo.valores.termo ? url.termo : termo,
      especialidade: url.especialidade,
    },
    daUrl: url,
    envios: [],
  };
}
