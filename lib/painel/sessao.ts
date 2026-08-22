import { redirect } from "next/navigation";
import { clienteDoPainel } from "@/lib/painel/servidor";

/*
  A camada que decide.

  O `proxy.ts` faz só o desvio otimista, olhando o cookie. Aqui a pergunta é
  outra e mais cara: quem é esta pessoa, e ela é admin? Por isso `getUser()`,
  que confere com o servidor de autenticação, e não `getSession()`, que lê o
  cookie e acredita nele.

  Uma conta autenticada SEM linha em `perfil_usuario` chega até aqui e é
  mandada embora — e mesmo que não fosse, não veria nada, porque política
  nenhuma do banco a reconhece. Esta função é a primeira tranca; o Postgres é
  a última.
*/

export type Sessao = {
  usuarioId: string;
  papel: "admin" | "associado";
  profissionalId: number | null;
};

export async function sessaoAtual(): Promise<Sessao | null> {
  const cliente = await clienteDoPainel();

  const {
    data: { user },
  } = await cliente.auth.getUser();

  if (!user) return null;

  const { data, error } = await cliente
    .from("perfil_usuario")
    .select("papel, profissional_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    usuarioId: user.id,
    papel: data.papel,
    profissionalId: data.profissional_id,
  };
}

/** Devolve a sessão do admin, ou desvia para a tela de entrar. */
export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await sessaoAtual();
  if (!sessao || sessao.papel !== "admin") redirect("/painel/entrar");
  return sessao;
}
