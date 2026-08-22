import { createServerClient, type CookieOptions } from "@supabase/ssr";
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    /* Mesma mensagem de `lib/painel/servidor.ts`: quem abre o painel bate
       aqui primeiro, e é esta que a pessoa vai ver. */
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copie .env.local.exemplo para .env.local e preencha.",
    );
  }

  /*
    O que a renovação de sessão produzir fica guardado aqui, e não numa
    resposta — porque a resposta que este proxy devolve pode ser um desvio,
    criado depois. Acumula em vez de substituir: o Supabase pode chamar
    `setAll` mais de uma vez numa requisição, e a segunda chamada apagaria o
    que a primeira escreveu.
  */
  const cookiesDaSessao: { name: string; value: string; options: CookieOptions }[] = [];
  const cabecalhosDaSessao: Record<string, string> = {};

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (paraGravar, cabecalhos) => {
        cookiesDaSessao.push(...paraGravar);

        /*
          Os cabeçalhos dizem a CDN e a proxy reverso para não guardar esta
          resposta. Sem eles, uma resposta que grava cookie de sessão pode ser
          cacheada e servida a outra pessoa, com o token dentro. Acumula em
          `cabecalhosDaSessao` porque `setAll` pode ser chamado mais de uma
          vez, e `entregar` aplica tudo de uma vez só, no fim.
        */
        for (const [nome, valor] of Object.entries(cabecalhos)) {
          cabecalhosDaSessao[nome] = valor;
        }

        /* A requisição também precisa enxergar o cookie novo, para que a
           renderização desta mesma requisição use o token renovado. */
        for (const { name, value } of paraGravar) request.cookies.set(name, value);
      },
    },
  });

  /* Chamar `getUser` é o que dispara a renovação do token. */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
    A saída única.

    Sem ela, um desvio devolveria uma resposta que nunca viu a renovação: o
    navegador ficaria com o par de cookies antigo, JÁ GASTO no servidor, e a
    pessoa seria desconectada em silêncio na requisição seguinte.

    Cookies e cabeçalhos andam sempre juntos. Levar os cookies sem os
    cabeçalhos seria pior do que não levar nada — um desvio com `Set-Cookie` e
    sem `Cache-Control` é exatamente o que o segundo argumento existe para
    impedir.
  */
  function entregar(resposta: NextResponse): NextResponse {
    for (const { name, value, options } of cookiesDaSessao) {
      resposta.cookies.set(name, value, options);
    }
    for (const [nome, valor] of Object.entries(cabecalhosDaSessao)) {
      resposta.headers.set(nome, valor);
    }
    return resposta;
  }

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
    destino.search = "";
    return entregar(NextResponse.redirect(destino));
  }

  if (user && naTelaDeEntrar) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/painel";
    destino.search = "";
    return entregar(NextResponse.redirect(destino));
  }

  return entregar(NextResponse.next({ request }));
}

export const config = {
  matcher: ["/painel/:path*"],
};
