import type { Metadata } from "next";
import { fonteCorpo, fonteTitulo } from "@/lib/fontes";
import "./globals.css";

/* O endereço final entra em NEXT_PUBLIC_SITE_URL. metadataBase é o que
   transforma caminhos relativos em URL absoluta no canonical e no Open Graph. */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Associação Médica de Imperatriz",
    template: "%s | AMI",
  },
};

export default function LayoutRaiz({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${fonteTitulo.variable} ${fonteCorpo.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
