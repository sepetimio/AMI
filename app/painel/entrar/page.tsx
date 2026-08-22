import { FormularioEntrar } from "@/components/painel/FormularioEntrar";

export default function PaginaEntrar() {
  return (
    <div className="mx-auto max-w-[420px] py-12">
      <h1 className="text-[28px] font-semibold text-ink-900">Entrar no painel</h1>
      <p className="mt-2 text-[16px] text-ink-600">
        Acesso da equipe da AMI e da agência.
      </p>

      <FormularioEntrar />
    </div>
  );
}
