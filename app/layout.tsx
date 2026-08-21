import type { Metadata } from "next";
import { fonteCorpo, fonteRegistro, fonteTitulo } from "@/lib/fontes";
import "./globals.css";

/* O endereço final entra em NEXT_PUBLIC_SITE_URL. metadataBase é o que
   transforma caminhos relativos em URL absoluta no canonical e no Open Graph. */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  /*
    Sem `template`. Os títulos vêm de lib/seo/metadados.ts, que já termina
    cada um com "| AMI" e mede o resultado contra o limite de 60 caracteres.
    Um template acrescentando o sufixo de novo produziria "… | AMI | AMI" e
    estouraria justamente o limite que aquele módulo existe para respeitar.

    `default` continua valendo para qualquer página que não defina título.

    Título como string simples em vez de `{ default: ... }`: nesta versão do
    Next, o tipo `DefaultTemplateString` exige `template` junto de `default`
    — exatamente o par que este arquivo está removendo. Uma string solta usa
    o mesmo fallback (ver docs de generate-metadata, seção `title`/`default`)
    sem reintroduzir o `template`.
  */
  title: "Associação Médica de Imperatriz",
};

export default function LayoutRaiz({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${fonteTitulo.variable} ${fonteCorpo.variable} ${fonteRegistro.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
