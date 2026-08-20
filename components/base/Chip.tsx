export function Chip({
  children,
  tom = "neutro",
}: {
  children: React.ReactNode;
  tom?: "neutro" | "associado";
}) {
  /* Sobre fundo claro a ação e o destaque usam verde-600. A menta só entra
     como preenchimento, nunca como cor de texto. */
  const cores =
    tom === "associado"
      ? "bg-ami-mint-100 text-ami-green-700 border-ami-green-600/30"
      : "bg-canvas text-ink-600 border-line";

  return (
    <span
      className={`inline-flex items-center rounded-chip border px-2.5 py-0.5 text-xs font-semibold ${cores}`}
    >
      {children}
    </span>
  );
}
