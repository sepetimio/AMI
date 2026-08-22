"use server";

import { redirect } from "next/navigation";
import { clienteDoPainel } from "@/lib/painel/servidor";

export type EstadoDeEntrada = { erro: string | null };

/*
  A mensagem de erro é uma só para os dois casos, de propósito.

  "Este e-mail não existe" entrega a lista de quem tem conta a quem quiser
  descobrir, e "senha incorreta" confirma que o e-mail existe. A mensagem do
  Supabase distingue os casos, e por isso ela não é repassada.
*/
const ERRO = "E-mail ou senha não conferem.";

export async function entrar(
  _anterior: EstadoDeEntrada,
  dados: FormData,
): Promise<EstadoDeEntrada> {
  const email = String(dados.get("email") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");

  if (!email || !senha) return { erro: ERRO };

  const cliente = await clienteDoPainel();
  const { error } = await cliente.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) return { erro: ERRO };

  redirect("/painel");
}

export async function sair(): Promise<void> {
  const cliente = await clienteDoPainel();
  await cliente.auth.signOut();
  redirect("/painel/entrar");
}
