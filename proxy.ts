import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/*
  ATENÇÃO ao nome do arquivo.

  No Next 16 esta convenção se chama `proxy.ts` e a função exportada se chama
  `proxy`. O antigo `middleware.ts` está descontinuado, e — o que torna o erro
  caro — um `middleware.ts` aqui não daria erro nenhum: seria só um arquivo
  que ninguém chama, e o painel ficaria sem renovação de sessão.

  O filtro no fim cobre só `/painel`. O site público precisa ficar de fora: ele
  é gerado estaticamente com revalidação de uma hora, e cookie de sessão numa
  resposta cacheável é o caminho mais curto para servir a sessão de uma pessoa
  a outra.
*/
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (paraGravar, cabecalhos) => {
        for (const { name, value } of paraGravar) {
          request.cookies.set(name, value);
        }

        resposta = NextResponse.next({ request });

        for (const { name, value, options } of paraGravar) {
          resposta.cookies.set(name, value, options);
        }

        /*
          O segundo argumento não é enfeite. Ele traz os cabeçalhos que dizem
          a CDN e a proxy reverso para não guardar esta resposta. Sem eles,
          uma resposta que grava cookie de sessão pode ser cacheada e servida
          a outra pessoa — com o token dentro. Omitir não dá erro.
        */
        for (const [nome, valor] of Object.entries(cabecalhos)) {
          resposta.headers.set(nome, valor);
        }
      },
    },
  });

  /* Chamar `getUser` aqui é o que dispara a renovação do token. */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const naTelaDeEntrar = caminho.startsWith("/painel/entrar");

  /*
    Desvio otimista, e só. Quem decide de verdade é `exigirAdmin()` em cada
    página, e depois dela o banco: uma conta autenticada sem papel de admin
    passa por aqui e não vê nada, porque política nenhuma a reconhece.
  */
  if (!user && !naTelaDeEntrar) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/painel/entrar";
    return NextResponse.redirect(destino);
  }

  if (user && naTelaDeEntrar) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/painel";
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  matcher: ["/painel/:path*"],
};
