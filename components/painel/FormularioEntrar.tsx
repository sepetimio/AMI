"use client";

import { useActionState } from "react";
import { entrar, type EstadoDeEntrada } from "@/app/painel/entrar/acoes";

const INICIAL: EstadoDeEntrada = { erro: null };

const CAMPO =
  "w-full rounded-controle border border-line bg-surface px-4 py-3 text-[16px] " +
  "text-ink-900 outline-none focus-visible:border-ami-green-600";

export function FormularioEntrar() {
  const [estado, acao, pendente] = useActionState(entrar, INICIAL);

  return (
    <form action={acao} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className="block text-[14px] font-medium text-ink-600">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={`mt-1 ${CAMPO}`}
        />
      </div>

      <div>
        <label htmlFor="senha" className="block text-[14px] font-medium text-ink-600">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className={`mt-1 ${CAMPO}`}
        />
      </div>

      {/* `role="alert"` avisa na hora; `aria-live` cobre quem já estava lendo. */}
      <p aria-live="polite" role="alert" className="min-h-6 text-[15px] text-warn">
        {estado.erro}
      </p>

      <button
        type="submit"
        disabled={pendente}
        className="pressiona inline-flex min-h-12 w-full items-center justify-center rounded-controle bg-ami-green-600 px-6 text-[15px] font-semibold text-white shadow-apoio hover:bg-ami-green-700 disabled:opacity-60"
      >
        {pendente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
