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

/**
 * Devolve a sessão do admin, ou desvia para a tela de entrar.
 *
 * Duas situações, dois tratamentos:
 *
 * SEM PAPEL NENHUM — conta que existe na autenticação e não tem linha em
 * `perfil_usuario`. A sessão é encerrada antes do desvio, e isso não é
 * zelo: sem encerrar, a pessoa chega à tela de entrar ainda logada, o
 * `proxy` a manda de volta para `/painel`, e as duas se revezam até o
 * navegador desistir. É o estado normal de quem criou a conta e esqueceu de
 * colar a linha de perfil.
 *
 * PAPEL ERRADO — associado, na Fase 2. Só desvia. Encerrar a sessão de um
 * associado válido que clicou num link de admin seria tirá-lo de onde ele
 * pode estar.
 */
export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await sessaoAtual();

  if (!sessao) {
    const cliente = await clienteDoPainel();
    await cliente.auth.signOut();
    redirect("/painel/entrar");
  }

  if (sessao.papel !== "admin") redirect("/painel/entrar");

  return sessao;
}
