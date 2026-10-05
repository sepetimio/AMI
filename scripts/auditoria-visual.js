/*
  Auditoria visual do site da AMI no navegador.

  É a bateria da revisão final do desenho aprovado
  (docs/desenho-aprovado/home-aprovada.html), trocada para as marcas do site:
  `data-bloco` (todo bloco de primeiro nível da home), `data-coluna` (o
  rótulo pequeno de cada seção) e as classes reais dos componentes. As
  classes dos `.module.css` saem do build como `Modulo-module__hash__nome`;
  `doModulo` acha pelo começo e pelo fim, sem depender do hash.

  Uso: cole no console da página aberta, ou rode por uma ferramenta que
  avalie a expressão e espere a promessa (ela devolve um texto JSON). Rode
  com a página recém-aberta, sem rolar: a primeira conferência é a do que
  aparece parado na primeira tela.

  O que confere:
  - nenhum bloco visível na primeira tela abre desbotado ou borrado: a
    entrada ao rolar (`.revelar`, components/layout/Revelar.tsx) só pode
    esconder o que abre abaixo da tela;
  - depois de rolar a página inteira, todo bloco que esperava entrou e
    terminou com opacidade 1 e sem `filter`;
  - nada passa da borda, a não ser dentro de uma fileira que desliza;
  - nenhum `.botao` ou `.botao-linha` quebra linha ou vaza;
  - um único `h1`, nenhum `id` repetido, nenhuma imagem quebrada;
  - o cabeçalho no topo em cinco pontos de rolagem;
  - o menu em linha acima de 1180px e em gaveta abaixo, e a gaveta abre e fecha.
  Nas páginas com `data-bloco` (a home, a busca, o perfil, as de
  especialidades, as de A Associação, as de texto, as de notícias e o
  contato):
  - espaços iguais entre blocos consecutivos;
  - o texto das seções com `data-coluna` (e o rodapé) na mesma linha vertical.
    Os números e "Sua AMI" não têm `data-coluna` de propósito: os cartões dos
    números e o cartão de vidro ficam fora da coluna das faixas, como no
    desenho;
  - cada slide real: com botão, o texto à vista e os controles centrados sob
    o botão (diferença de até 2px, medida 1,5s depois de parar); sem botão
    (arte pronta, provisório), a moldura ou a arte à vista e os controles na
    margem (`--m`): sem botão não há sob o que centrá-los, e a margem é a
    linha do texto dos slides com botão;
  - os "Ligar" dos cartões de médico de uma mesma fileira na mesma altura
    (`data-ligar`, o botão ou o espaço dele);
  - os cartões do índice de especialidades: todos com a mesma altura, e em
    cada fileira o nome e a contagem na mesma linha
    (`data-cartao-de-especialidade`, `data-nome`, `data-contagem`);
  - os atalhos de "Saiba mais" (A Associação): em cada fileira, a mesma
    altura, e o título e a seta na mesma linha (`data-atalho`, `data-nome`,
    `data-seta`);
  - o índice "Nesta página" das páginas de texto: rolando até cada título,
    o item dele fica marcado (`aria-current`), e no fim da página o último
    (`data-nesta-pagina`);
  - os cartões de notícia (a lista e "Outras notícias"): em cada fileira,
    a mesma altura, a foto terminando na mesma linha, e a data e o título
    começando na mesma linha (`data-cartao-noticia`, `data-foto`,
    `data-data`, `data-titulo`);
  - os canais do contato: em cada fileira, o ícone, o rótulo e o dado
    começando na mesma linha, e o botão terminando na mesma linha
    (`data-canal`, `data-rotulo`, `data-dado`, `data-acao`);
  - acima de 700px, o texto na mesma linha vertical do logotipo;
  - a barra do pé: nunca acima de 700px; até 700px, aparece se e só se o
    bloco de abertura (o carrossel ou a faixa da busca, `[data-abertura]`)
    saiu por cima (ou a rolagem passou de 600px, sem bloco de abertura) e a
    busca não está na tela; no perfil com telefone, a barra padrão nunca
    aparece e a do médico aparece se e só se os botões do topo saíram por
    cima.
  - ao chegar pelo menu, vindo de outra página parada no topo ou no meio, a
    página nova abre em `scrollY` 0. É a última conferência, porque troca de
    página: quando a auditoria termina, a aba está noutra página.
*/
(async () => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const R = (e) => e.getBoundingClientRect();
  /* No celular (ou na emulação dele), uma página que vaza alarga a janela de
     layout e o `innerWidth` cresce junto; a largura da tela não. */
  const W = Math.min(innerWidth, screen.width);
  const H = innerHeight;
  const problemas = [];
  const info = { largura: W };
  if (innerWidth > W)
    problemas.push(`página vaza para o lado: janela de ${innerWidth}px numa tela de ${W}px`);
  const raiz = document.documentElement;

  const doModulo = (modulo, nome, dentro = document) =>
    [...dentro.querySelectorAll(`[class*="${modulo}-module__"]`)].filter((e) =>
      [...e.classList].some(
        (c) => c.startsWith(`${modulo}-module__`) && c.endsWith(`__${nome}`),
      ),
    );
  const temClasse = (e, nome) =>
    [...e.classList].some((c) => c.endsWith(`__${nome}`));
  const visivel = (e) =>
    e.checkVisibility({ visibilityProperty: true }) &&
    R(e).width > 0 &&
    R(e).height > 0;
  const rolar = async (y, ms = 120) => {
    window.scrollTo({ top: y, behavior: "instant" });
    await espera(ms);
  };
  const topoAbs = (e) => R(e).top + scrollY;

  /* 1. Primeira tela, antes de qualquer rolagem: nada desbotado ou borrado. */
  await rolar(0, 300);
  const presos = [];
  /* Os blocos da home, os que usam `.revelar` e qualquer um com animação
     presa à rolagem. Um enfeite com opacidade baixa de propósito (a marca
     d'água do aviso de vazio, components/base/EstadoVazio.tsx) não entra:
     ele não está no meio de uma animação. */
  const candidatos = new Set([
    ...document.querySelectorAll(".revelar, [data-revelar], [data-bloco]"),
    ...document
      .getAnimations()
      .filter((a) => a.timeline && !(a.timeline instanceof DocumentTimeline))
      .map((a) => a.effect?.target)
      .filter(Boolean),
  ]);
  for (const e of candidatos) {
    const r = R(e);
    if (r.height === 0 || r.bottom <= 0 || r.top >= H) continue;
    const cs = getComputedStyle(e);
    /* `blur(0px)` é o fim da entrada: igual a `none` na tela. */
    const filtro = cs.filter === "blur(0px)" ? "none" : cs.filter;
    if (Number(cs.opacity) < 1 || filtro !== "none") {
      presos.push(
        `${e.dataset.bloco ?? e.tagName.toLowerCase() + "." + [...e.classList].join(".")} ` +
          `opacity ${Number(cs.opacity).toFixed(2)} filter ${cs.filter}`,
      );
    }
  }
  if (presos.length)
    problemas.push("preso na primeira tela: " + presos.join(" | "));

  /* A rolagem pelo script vai direto ao ponto, sem a rolagem suave do site. */
  const semAnimacao = document.createElement("style");
  semAnimacao.textContent = "html{scroll-behavior:auto!important}";
  document.head.append(semAnimacao);

  /* O carrossel parado pelo botão, para nada se mover durante a medida. */
  const carrossel = document.querySelector('[data-bloco="carrossel"]');
  const botaoPausa = carrossel
    ? [...carrossel.querySelectorAll("button")].find((b) =>
        /pausar/i.test(b.ariaLabel ?? ""),
      )
    : null;
  botaoPausa?.click();

  /* 2. Uma volta pela página inteira, para as imagens preguiçosas baixarem
     e os blocos em espera entrarem. Daí em diante nenhuma medida depende da
     rolagem: a entrada dispara uma vez só, e a transição dela (0,9s) já
     terminou quando a volta acaba. */
  for (let y = 0; y < raiz.scrollHeight; y += H * 0.8) await rolar(y, 150);
  await rolar(raiz.scrollHeight, 600);
  await rolar(0, 1200);
  const naoEntraram = [...document.querySelectorAll(".revelar, [data-revelar]")]
    .filter((e) => R(e).height > 0)
    .filter((e) => {
      const cs = getComputedStyle(e);
      return (
        e.dataset.revelar === "espera" ||
        Number(cs.opacity) < 1 ||
        cs.filter !== "none"
      );
    });
  if (naoEntraram.length)
    problemas.push(
      "não entrou depois de rolar: " +
        naoEntraram
          .map(
            (e) =>
              `${e.dataset.bloco ?? e.tagName.toLowerCase()} (${e.dataset.revelar ?? "sem atributo"}, opacity ${getComputedStyle(e).opacity}, filter ${getComputedStyle(e).filter})`,
          )
          .join(" | "),
    );
  info.revelar = `${document.querySelectorAll('[data-revelar="entrou"]').length} entraram ao rolar, ${document.querySelectorAll(".revelar:not([data-revelar])").length} abriram à vista`;

  /* 3. Nada passa da borda, e nada fica cortado nela. Um elemento cortado
     por um ancestral (overflow diferente de visible) conta se a parte que
     aparece chega à borda da tela e o resto dele passa dela: é o corte na
     borda do celular que o cliente recusou. Cortado longe da borda (a marca
     dentro de uma moldura), ou inteiro fora do corte (os slides que não
     estão na vez), não conta; dentro de uma fileira que desliza (overflow-x
     auto/scroll), também não. Enfeite que passa da borda de propósito não
     conta: a luz que passeia (`.brilho`, como no desenho) e a marca d'água
     em máscara, como a do aviso de vazio (`aria-hidden`, sem clique). */
  if (raiz.scrollWidth > W)
    problemas.push(`página vaza para o lado: ${raiz.scrollWidth} > ${W}`);
  const fora = [];
  /* Recortado por `clip` (o `.sr-only`, só para leitor de tela) não aparece. */
  const recortado = (e) => getComputedStyle(e).clip.startsWith("rect");
  for (const e of document.body.querySelectorAll("*")) {
    const enfeite =
      e.closest(".brilho") ||
      (e.closest('[aria-hidden="true"]') &&
        getComputedStyle(e).pointerEvents === "none");
    if (!visivel(e) || recortado(e) || enfeite) continue;
    const bruto = R(e);
    let { left, right } = bruto;
    let desliza = false;
    for (
      let a = e.parentElement;
      a && a !== document.body;
      a = a.parentElement
    ) {
      if (recortado(a)) {
        right = left;
        break;
      }
      const cs = getComputedStyle(a);
      if (cs.overflowX === "visible") continue;
      if (cs.overflowX === "auto" || cs.overflowX === "scroll") {
        desliza = true;
        break;
      }
      const ra = R(a);
      left = Math.max(left, ra.left);
      right = Math.min(right, ra.right);
    }
    if (desliza || right <= left) continue;
    if (
      (bruto.right > W + 0.5 && right >= W - 0.5) ||
      (bruto.left < -0.5 && left <= 0.5)
    )
      fora.push(e);
  }
  if (fora.length)
    problemas.push(
      "fora da tela: " +
        fora
          .slice(0, 4)
          .map(
            (e) =>
              `${e.tagName.toLowerCase()}.${[...e.classList].join(".")} [${Math.round(R(e).left)},${Math.round(R(e).right)}]`,
          )
          .join(" | ") +
        (fora.length > 4 ? ` (+${fora.length - 4})` : ""),
    );

  /* 4. Botões: uma linha só, sem texto vazando. */
  const quebrados = [
    ...document.querySelectorAll(".botao, .botao-linha"),
  ]
    .filter(visivel)
    .filter((b) => !b.closest("[inert]") && !b.closest('[aria-hidden="true"]'))
    .filter((b) => R(b).height > 50 || b.scrollWidth > b.clientWidth + 1);
  if (quebrados.length)
    problemas.push(
      "botão quebrou linha ou vazou: " +
        quebrados
          .map(
            (b) =>
              `${b.textContent.trim()} (${Math.round(R(b).width)}×${Math.round(R(b).height)})`,
          )
          .join(", "),
    );

  /* 5. h1, ids, imagens. */
  const h1s = document.querySelectorAll("h1").length;
  if (h1s !== 1) problemas.push("h1: " + h1s);
  const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
  const dup = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
  if (dup.length) problemas.push("id repetido: " + dup.join(","));
  const imgs = [...document.images];
  const quebradas = imgs.filter((i) => i.complete && i.naturalWidth === 0);
  const pendentes = imgs.filter((i) => !i.complete);
  if (quebradas.length)
    problemas.push(
      "imagem quebrada: " +
        quebradas.map((i) => i.currentSrc || i.src).join(", "),
    );
  if (pendentes.length)
    problemas.push("imagem que não terminou de baixar: " + pendentes.length);
  info.imagens = imgs.length;

  /* 6. O cabeçalho no topo em cinco pontos de rolagem. */
  const cabeca = doModulo("Cabecalho", "cabeca")[0];
  const fim = raiz.scrollHeight - H;
  const topos = [];
  /* O painel não tem o cabeçalho do site. */
  for (const f of cabeca ? [0, 0.25, 0.5, 0.75, 1] : []) {
    await rolar(Math.round(fim * f));
    const r = R(cabeca);
    const ponto = document.elementFromPoint(
      r.left + r.width / 2,
      r.top + r.height / 2,
    );
    topos.push(Math.round(r.top));
    if (r.top < 0 || r.top > 30 || !cabeca.contains(ponto))
      problemas.push(
        `cabeçalho fora do topo a ${Math.round(f * 100)}% da rolagem (top ${Math.round(r.top)})`,
      );
  }
  info.cabecalhoTopo = topos.join("/");
  await rolar(0);

  const home = document.querySelector("[data-bloco]");
  if (home) {
    /* 7. Espaços entre blocos consecutivos. */
    const blocos = [...document.querySelectorAll("[data-bloco]")].filter(
      visivel,
    );
    const esp = [];
    for (let i = 1; i < blocos.length; i++)
      esp.push(
        Math.round((R(blocos[i]).top - R(blocos[i - 1]).bottom) * 10) / 10,
      );
    const ritmo = parseFloat(
      getComputedStyle(raiz).getPropertyValue("--ritmo"),
    );
    info.blocos = blocos.map((b) => b.dataset.bloco).join(",");
    info.espacosEntreBlocos = esp.join("/");
    info.ritmo = ritmo;
    if (esp.some((x) => Math.abs(x - ritmo) > 0.5))
      problemas.push("espaços desiguais entre blocos: " + esp.join(","));
    const cab = document.querySelector("header");
    info.cabecalhoAoPrimeiro = Math.round(
      R(blocos[0]).top - R(doModulo("Cabecalho", "cabeca")[0]).bottom,
    );
    const rodape = document.querySelector("footer");
    info.ultimoAoRodape = Math.round(R(rodape).top - R(blocos.at(-1)).bottom);
    void cab;

    /* 8. A coluna do texto: os rótulos das seções e o rodapé. */
    const colunas = [...document.querySelectorAll("[data-coluna]")].filter(
      visivel,
    );
    const lema = doModulo("Rodape", "lema")[0];
    const col = [...colunas, lema].map((e) => Math.round(R(e).left * 10) / 10);
    info.colunaTexto = col.join("/");
    if (new Set(col.map(Math.round)).size > 1)
      problemas.push("coluna de texto desigual: " + col.join(","));
    info.colunaDoLogo = Math.round(R(document.querySelector("header a")).left);
    if (W > 700 && Math.abs(info.colunaDoLogo - Math.round(col[0])) > 1)
      problemas.push(
        `texto fora da linha do logotipo: logotipo ${info.colunaDoLogo}, texto ${col[0]}`,
      );

    /* 9. O carrossel, slide por slide. */
    if (carrossel) {
      const reais = [
        ...carrossel.querySelectorAll("[data-slide]:not([data-copia])"),
      ];
      const bolinhas = [
        ...carrossel.querySelectorAll('button[aria-label^="Ir para o banner"]'),
      ];
      const controles = doModulo("Carrossel", "controles", carrossel)[0];
      const margem = parseFloat(
        getComputedStyle(carrossel).getPropertyValue("--m"),
      );
      const slides = [];
      for (let i = 0; i < reais.length; i++) {
        bolinhas[i]?.click();
        document.activeElement?.blur();
        await rolar(topoAbs(carrossel) - 90, 0);
        await espera(1500);
        const s = reais[i];
        const rs = R(s);
        const botao = s.querySelector("[data-botao]");
        let nota;
        if (botao) {
          const titulo = doModulo("Carrossel", "titulo", s)[0];
          const rt = R(titulo);
          const noPonto = document.elementFromPoint(
            rt.left + 8,
            rt.top + rt.height / 2,
          );
          const textoAVista = titulo.contains(noPonto);
          const rb = R(botao);
          const rc = R(controles);
          const desvio =
            Math.round(
              (rc.left + rc.width / 2 - (rb.left + rb.width / 2)) * 100,
            ) / 100;
          const anima = doModulo("Carrossel", "anima", s)[0];
          const cabe = R(anima).top >= rs.top - 1 && rb.bottom <= rs.bottom + 1;
          const encosta = rb.bottom > rc.top - 6;
          nota =
            `${i + 1} composto: ${textoAVista ? "texto à vista" : "TEXTO ESCONDIDO"}, desvio ${desvio}px` +
            (cabe ? "" : ", NÃO CABE") +
            (encosta ? ", BOTÃO COLA NOS CONTROLES" : "");
          if (!textoAVista || Math.abs(desvio) > 2 || !cabe || encosta)
            problemas.push("slide " + nota);
        } else {
          const tarja = [...s.querySelectorAll("*")].find(
            (e) =>
              e.children.length === 0 &&
              /a entrar/i.test(e.textContent) &&
              visivel(e),
          );
          const alvo = tarja ?? s.querySelector("img");
          const ra = alvo ? R(alvo) : null;
          const noPonto = ra
            ? document.elementFromPoint(
                ra.left + ra.width / 2,
                ra.top + ra.height / 2,
              )
            : null;
          const aVista = Boolean(
            alvo &&
            noPonto &&
            (alvo.contains(noPonto) ||
              noPonto.contains(alvo) ||
              s.contains(noPonto)),
          );
          const naMargem = Math.round((R(controles).left - rs.left) * 10) / 10;
          nota = `${i + 1} ${tarja ? "provisório" : "arte"}: ${aVista ? (tarja ? "tarja à vista" : "arte à vista") : "NÃO APARECE"}, controles a ${naMargem}px da borda (margem ${margem})`;
          if (!aVista || Math.abs(naMargem - margem) > 2)
            problemas.push("slide " + nota);
        }
        slides.push(nota);
      }
      info.slides = slides;
      info.carrossel = `${Math.round(R(carrossel).width)}×${Math.round(R(carrossel).height)}`;
    }
  }

  /* 13. Os "Ligar" de cada fileira de cartões de médico na mesma altura:
     o botão, ou o espaço dele de quem não tem telefone. */
  const fileiras = new Map();
  for (const e of document.querySelectorAll("[data-ligar]")) {
    if (R(e).height === 0) continue;
    const topoDoCartao = Math.round(topoAbs(e.closest("li")));
    if (!fileiras.has(topoDoCartao)) fileiras.set(topoDoCartao, []);
    fileiras.get(topoDoCartao).push(Math.round(topoAbs(e) * 10) / 10);
  }
  for (const [topo, ys] of fileiras) {
    if (Math.max(...ys) - Math.min(...ys) > 0.5)
      problemas.push(`"Ligar" desalinhado na fileira de ${topo}px: ${ys.join("/")}`);
  }
  info.fileirasDeCartoes = fileiras.size;

  /* 14. Os cartões do índice de especialidades: todos com a altura do mais
     alto, e em cada fileira o nome e a contagem na mesma linha. */
  const fileirasDeEsp = new Map();
  for (const c of document.querySelectorAll("[data-cartao-de-especialidade]")) {
    if (R(c).height === 0) continue;
    const topo = Math.round(topoAbs(c));
    if (!fileirasDeEsp.has(topo)) fileirasDeEsp.set(topo, []);
    fileirasDeEsp.get(topo).push({
      altura: Math.round(R(c).height * 10) / 10,
      nome: Math.round(topoAbs(c.querySelector("[data-nome]")) * 10) / 10,
      conta: Math.round(topoAbs(c.querySelector("[data-contagem]")) * 10) / 10,
    });
  }
  const espalha = (xs) => Math.max(...xs) - Math.min(...xs);
  const alturasDeEsp = [];
  for (const [topo, cs] of fileirasDeEsp) {
    for (const medida of ["nome", "conta"]) {
      const xs = cs.map((c) => c[medida]);
      if (espalha(xs) > 0.5)
        problemas.push(`cartões de especialidade com ${medida} desalinhado na fileira de ${topo}px: ${xs.join("/")}`);
    }
    alturasDeEsp.push(...cs.map((c) => c.altura));
  }
  if (alturasDeEsp.length && espalha(alturasDeEsp) > 0.5)
    problemas.push(`cartões de especialidade de alturas diferentes: ${[...new Set(alturasDeEsp)].join("/")}`);
  info.fileirasDeEspecialidades = fileirasDeEsp.size;
  info.alturaDosCartoesDeEspecialidade = [...new Set(alturasDeEsp)].join("/");

  /* 15. Os atalhos de "Saiba mais": em cada fileira, a mesma altura, e o
     título e a seta na mesma linha. No celular cada atalho é uma fileira,
     e a altura acompanha a frase. */
  const fileirasDeAtalhos = new Map();
  for (const c of document.querySelectorAll("[data-atalho]")) {
    if (R(c).height === 0) continue;
    const topo = Math.round(topoAbs(c));
    if (!fileirasDeAtalhos.has(topo)) fileirasDeAtalhos.set(topo, []);
    fileirasDeAtalhos.get(topo).push({
      altura: Math.round(R(c).height * 10) / 10,
      nome: Math.round(topoAbs(c.querySelector("[data-nome]")) * 10) / 10,
      seta: Math.round(topoAbs(c.querySelector("[data-seta]")) * 10) / 10,
    });
  }
  for (const [topo, cs] of fileirasDeAtalhos) {
    for (const medida of ["altura", "nome", "seta"]) {
      const xs = cs.map((c) => c[medida]);
      if (espalha(xs) > 0.5)
        problemas.push(`atalhos com ${medida} desigual na fileira de ${topo}px: ${xs.join("/")}`);
    }
  }
  info.fileirasDeAtalhos = fileirasDeAtalhos.size;

  /* 16. O índice "Nesta página" das páginas de texto: rolando até cada
     título (20px acima da linha de leitura, 140px, lib/nestaPagina.ts), o
     item dele fica marcado; no fim da página, o último. Só onde o índice
     da lateral aparece (acima de 980px). */
  const indice = document.querySelector("[data-nesta-pagina]");
  if (indice && visivel(indice)) {
    const links = [...indice.querySelectorAll("a")];
    const marcado = () => links.findIndex((l) => l.getAttribute("aria-current") === "location");
    const marcados = [];
    for (const [i, a] of links.entries()) {
      const alvo = document.getElementById(a.hash.slice(1));
      if (!alvo) {
        problemas.push(`índice aponta para âncora que não existe: ${a.hash}`);
        continue;
      }
      await rolar(topoAbs(alvo) - 120, 250);
      const noFim = innerHeight + scrollY >= raiz.scrollHeight - 4;
      marcados.push(marcado());
      if (marcado() !== i && !noFim)
        problemas.push(`índice: rolando até "${a.textContent}", o marcado é o ${marcado()}`);
    }
    await rolar(raiz.scrollHeight, 250);
    if (marcado() !== links.length - 1)
      problemas.push(`índice: no fim da página, o marcado é o ${marcado()}`);
    await rolar(0, 250);
    info.nestaPagina = marcados.join("/");
  }

  /* 17. Os cartões de notícia (a lista e "Outras notícias"): em cada
     fileira, a mesma altura, a foto terminando na mesma linha, e a data e o
     título começando na mesma linha. A moldura "a entrar" não tem data, e
     fica fora da medida da data. No celular cada cartão é uma fileira. */
  const fileirasDeNoticias = new Map();
  const decimo = (x) => Math.round(x * 10) / 10;
  for (const c of document.querySelectorAll("[data-cartao-noticia]")) {
    if (R(c).height === 0) continue;
    const topo = Math.round(topoAbs(c));
    if (!fileirasDeNoticias.has(topo)) fileirasDeNoticias.set(topo, []);
    const foto = c.querySelector("[data-foto]");
    const data = c.querySelector("[data-data]");
    fileirasDeNoticias.get(topo).push({
      altura: decimo(R(c).height),
      foto: decimo(topoAbs(foto) + R(foto).height),
      data: data ? decimo(topoAbs(data)) : null,
      titulo: decimo(topoAbs(c.querySelector("[data-titulo]"))),
    });
  }
  for (const [topo, cs] of fileirasDeNoticias) {
    for (const medida of ["altura", "foto", "data", "titulo"]) {
      const xs = cs.map((c) => c[medida]).filter((x) => x !== null);
      if (xs.length > 1 && espalha(xs) > 0.5)
        problemas.push(`cartões de notícia com ${medida} desigual na fileira de ${topo}px: ${xs.join("/")}`);
    }
  }
  info.fileirasDeNoticias = fileirasDeNoticias.size;

  /* 18. Os canais do contato: em cada fileira, o rótulo e o dado começando
     na mesma linha, e o botão terminando na mesma linha. Do tablet para
     baixo cada canal é uma fileira. */
  const fileirasDeCanais = new Map();
  for (const c of document.querySelectorAll("[data-canal]")) {
    if (R(c).height === 0) continue;
    const topo = Math.round(topoAbs(c));
    if (!fileirasDeCanais.has(topo)) fileirasDeCanais.set(topo, []);
    const acao = c.querySelector("[data-acao]");
    fileirasDeCanais.get(topo).push({
      rotulo: decimo(topoAbs(c.querySelector("[data-rotulo]"))),
      dado: decimo(topoAbs(c.querySelector("[data-dado]"))),
      botao: decimo(topoAbs(acao) + R(acao).height),
    });
  }
  for (const [topo, cs] of fileirasDeCanais) {
    for (const medida of ["rotulo", "dado", "botao"]) {
      const xs = cs.map((c) => c[medida]);
      if (espalha(xs) > 0.5)
        problemas.push(`canais com ${medida} desalinhado na fileira de ${topo}px: ${xs.join("/")}`);
    }
  }
  info.fileirasDeCanais = fileirasDeCanais.size;

  /* 10. O menu: em linha acima de 1180px, em gaveta abaixo. */
  const menu = document.querySelector('nav[aria-label="Principal"]');
  const abre = document.querySelector('button[aria-controls="gaveta"]');
  const emLinha = Boolean(menu) && getComputedStyle(menu).display !== "none";
  const comBotao = abre && getComputedStyle(abre).display !== "none";
  info.menu = emLinha ? "linha" : comBotao ? "gaveta" : "nenhum";
  if (!menu) info.menu = "sem menu (painel)";
  else if (emLinha === Boolean(comBotao))
    problemas.push("menu e botão de menu ao mesmo tempo, ou nenhum");
  if (menu && emLinha !== W > 1180)
    problemas.push(`menu na forma errada para ${W}px: ${info.menu}`);
  if (emLinha && [...menu.querySelectorAll("a")].some((a) => R(a).height > 40))
    problemas.push("menu quebra linha");
  if (comBotao) {
    await rolar(0);
    abre.click();
    await espera(450);
    const g = document.getElementById("gaveta");
    if (getComputedStyle(g).visibility === "hidden")
      problemas.push("gaveta não abre");
    const rg = R(g);
    if (rg.right > W + 1 || rg.left < -1) problemas.push("gaveta vaza");
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await espera(450);
    if (getComputedStyle(g).visibility !== "hidden") {
      problemas.push("gaveta não fecha com Esc");
      abre.click();
      await espera(450);
    }
  }

  /* 11. A barra do pé, e a do perfil. */
  const barra = document.querySelector('nav[aria-label="Atalhos"]');
  const barraMedico = document.querySelector("[data-barra-do-medico]");
  const acoesDoMedico = document.querySelector("[data-acoes-do-medico]");
  const abertura = document.querySelector('[data-bloco="carrossel"], [data-abertura]');
  const busca = document.getElementById("encontre");
  const aparece = (b) =>
    getComputedStyle(b).display !== "none" && temClasse(b, "visivel") && R(b).top < H;
  if (!barra) {
    info.barraDoPe = "sem barra (painel)";
  } else if (W > 700) {
    for (const y of [0, fim / 2, fim]) {
      await rolar(y, 600);
      for (const b of [barra, barraMedico].filter(Boolean))
        if (getComputedStyle(b).display !== "none")
          problemas.push(`barra do pé acima de 700px (rolagem ${Math.round(y)})`);
    }
    info.barraDoPe = "nunca";
  } else if (barraMedico) {
    const vistos = [];
    for (const y of [0, topoAbs(acoesDoMedico) + R(acoesDoMedico).height + 10, fim / 2, fim]) {
      await rolar(y, 700);
      if (getComputedStyle(barra).display !== "none")
        problemas.push(`barra padrão junto da barra do médico a ${Math.round(scrollY)}px`);
      const esperado = R(acoesDoMedico).bottom < 0;
      const viu = aparece(barraMedico);
      vistos.push(`${Math.round(scrollY)}:${viu ? "sim" : "não"}`);
      if (viu !== esperado)
        problemas.push(
          `barra do médico ${viu ? "aparece" : "não aparece"} a ${Math.round(scrollY)}px (botões do topo saíram: ${esperado})`,
        );
    }
    info.barraDoPe = "médico " + vistos.join(" ");
  } else {
    const pontos = [0];
    if (abertura) pontos.push(topoAbs(abertura) + R(abertura).height + 10);
    if (busca && busca !== abertura) pontos.push(topoAbs(busca) + R(busca).height + 10);
    pontos.push(fim / 2, fim);
    const vistos = [];
    for (const y of pontos) {
      await rolar(y, 700);
      const passou = abertura ? R(abertura).bottom < 0 : scrollY > 600;
      let fracao = 0;
      if (busca) {
        const rb = R(busca);
        fracao = Math.max(0, Math.min(rb.bottom, H) - Math.max(rb.top, 0)) / rb.height;
      }
      const viu = aparece(barra);
      vistos.push(`${Math.round(scrollY)}:${viu ? "sim" : "não"}`);
      if (fracao > 0 && fracao < 0.25) continue; /* na beira do limiar do observador */
      const esperado = passou && fracao === 0;
      if (viu !== esperado)
        problemas.push(
          `barra do pé ${viu ? "aparece" : "não aparece"} a ${Math.round(scrollY)}px (abertura saiu: ${passou}, busca na tela: ${Math.round(fracao * 100)}%)`,
        );
    }
    info.barraDoPe = vistos.join(" ");
  }
  await rolar(0);

  botaoPausa?.click();
  semAnimacao.remove();

  /* 12. Nenhuma página abre rolada ao chegar pelo menu. Roda depois de
     tirar o `semAnimacao`: com a rolagem suave desligada pela auditoria, o
     defeito não aparece. Cada destino é visitado vindo de outra página
     parada no topo (o caso que abria rolado) e no meio. */
  const estavel = async () => {
    let ultimo = -1;
    let iguais = 0;
    for (let i = 0; i < 100; i++) {
      await espera(100);
      if (scrollY === ultimo) {
        if (++iguais >= 8) return scrollY;
      } else {
        iguais = 0;
        ultimo = scrollY;
      }
    }
    return scrollY;
  };
  const ir = async (href) => {
    const antes = document.querySelector("main")?.firstElementChild;
    const link = [...document.querySelectorAll("header a")].find(
      (a) => a.getAttribute("href") === href,
    );
    link.click();
    for (let i = 0; i < 150; i++) {
      await espera(100);
      if (
        location.pathname === href &&
        document.querySelector("main")?.firstElementChild !== antes
      )
        break;
    }
    return estavel();
  };
  const destinos = [
    ...new Set(
      [...document.querySelectorAll('header a[href^="/"]')].map((a) =>
        a.getAttribute("href"),
      ),
    ),
  ].filter((h) => !h.includes("#"));
  const aberturas = [];
  for (const href of destinos) {
    for (const desde of ["topo", "meio"]) {
      if (location.pathname === href)
        await ir(destinos.find((d) => d !== href));
      const meio = Math.round((raiz.scrollHeight - innerHeight) / 2);
      window.scrollTo({ top: desde === "topo" ? 0 : meio, behavior: "instant" });
      await espera(300);
      const y = await ir(href);
      aberturas.push(`${href}@${desde}:${y}`);
      if (y !== 0)
        problemas.push(`${href} abriu rolada ${y}px (vindo de outra página, no ${desde})`);
    }
  }
  info.aberturas = aberturas.join(" ");

  return JSON.stringify({ ...info, problemas });
})();
