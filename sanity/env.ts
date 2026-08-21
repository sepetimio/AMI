import { exigir } from "@/sanity/exigir";

/*
  Variáveis de ambiente do Sanity, num lugar só e validadas na importação.

  A validação na importação é decisão: a falha silenciosa aqui é cara. Sem
  projectId o cliente seria construído mesmo assim e só quebraria na primeira
  consulta, com erro de rede que não menciona configuração nenhuma. Falhar
  cedo, com o nome da variável e o endereço de onde tirá-la, transforma meia
  hora de investigação em trinta segundos.
*/

export const projectId = exigir(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
);

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

/*
  Data fixa, nunca `new Date()`. A API do Sanity versiona por data: pedir a
  versão de hoje significa que o comportamento pode mudar sozinho amanhã, e
  uma consulta que funcionava passa a não funcionar sem ninguém ter tocado no
  código. Congelada aqui, a atualização vira uma decisão com commit.
*/
export const apiVersion = "2026-08-21";
