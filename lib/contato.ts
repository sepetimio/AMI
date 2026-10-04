/*
  Os números de contato (telefone e WhatsApp) e o link do mapa, em funções puras e sem
  dependência nenhuma: a barra do pé do perfil (components/perfil/
  BarraDoMedico.tsx) roda no navegador e importa daqui. Se isto morasse em
  lib/encontre.ts, a barra levaria junto, para o navegador, tudo o que ele
  importa, inclusive a tabela de sinônimos da busca.

  Uma regra só para o número brasileiro, usada pelo `tel:` (`hrefTelefone`,
  lib/ami.ts), pelo WhatsApp (`linkDoWhatsapp`) e pelo número na tela
  (`formatarTelefone`, lib/formato.ts).
*/

/**
 * O número brasileiro só com dígitos, sem o 55 do país e sem o 0 da
 * ligação de longa distância: DDD e número, 10 dígitos no fixo e 11 no
 * celular. Cada prefixo só sai quando sobram 10 ou 11 dígitos depois dele:
 * "55 3018-9994" é um fixo do DDD 55, do Rio Grande do Sul, e fica como
 * está; "(099) 3018-9994" fica sem o 0. Nenhum DDD começa com 0.
 */
export function numeroNacional(numero: string): string {
  const digitos = numero.replace(/\D/g, "");
  const sobra = (prefixo: string) =>
    digitos.startsWith(prefixo) && [10, 11].includes(digitos.length - prefixo.length);
  if (sobra("55")) return digitos.slice(2);
  if (sobra("0")) return digitos.slice(1);
  return digitos;
}

/** O link do WhatsApp: `wa.me/55` mais o número de `numeroNacional`. */
export function linkDoWhatsapp(numero: string): string {
  return `https://wa.me/55${numeroNacional(numero)}`;
}

/**
 * O número de um botão (Ligar, WhatsApp), quando ele tem algum dígito; vazio,
 * só espaço ou só pontuação, null. Sem isto, um campo em branco no cadastro
 * viraria um "WhatsApp" que abre `wa.me/55` sem número.
 */
export function numeroPreenchido(numero: string | null | undefined): string | null {
  return numero && /\d/.test(numero) ? numero : null;
}

/** "Como chegar": a busca do Google Maps por um endereço escrito, sem chave nem serviço novo. */
export function buscaNoMapa(endereco: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}
