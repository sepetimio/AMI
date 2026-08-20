/**
 * Renderiza um bloco de dados estruturados.
 *
 * O conteúdo vem sempre dos nossos construtores, nunca de entrada de usuário —
 * é por isso que dangerouslySetInnerHTML é seguro aqui. Ainda assim, `<` é
 * escapado: uma barra de fechamento dentro do JSON encerraria o <script>.
 */
export function JsonLd({ dados }: { dados: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(dados).replace(/</g, "\\u003c"),
      }}
    />
  );
}
