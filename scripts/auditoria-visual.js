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
  Só na home (onde há `data-bloco`):
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
  - a barra do pé: nunca acima de 700px; até 700px, aparece se e só se o
    carrossel saiu por cima (ou a rolagem passou de 600px, sem carrossel) e
    a busca não está na tela.
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
     d'água da Cabeceira) não entra: ele não está no meio de uma animação. */
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
     da Cabeceira (`aria-hidden`, sem clique, opacidade 0,05). */
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

  /* 11. A barra do pé. */
  const barra = document.querySelector('nav[aria-label="Atalhos"]');
  const busca = document.getElementById("encontre");
  const barraAparece = () =>
    getComputedStyle(barra).display !== "none" &&
    temClasse(barra, "visivel") &&
    R(barra).top < H;
  if (!barra) {
    info.barraDoPe = "sem barra (painel)";
  } else if (W > 700) {
    for (const y of [0, fim / 2, fim]) {
      await rolar(y, 600);
      if (getComputedStyle(barra).display !== "none")
        problemas.push(`barra do pé acima de 700px (rolagem ${Math.round(y)})`);
    }
    info.barraDoPe = "nunca";
  } else {
    const pontos = [0];
    if (carrossel) pontos.push(topoAbs(carrossel) + R(carrossel).height + 10);
    if (busca) pontos.push(topoAbs(busca) + R(busca).height + 10);
    pontos.push(fim / 2, fim);
    const vistos = [];
    for (const y of pontos) {
      await rolar(y, 700);
      const passou = carrossel ? R(carrossel).bottom < 0 : scrollY > 600;
      let fracao = 0;
      if (busca) {
        const rb = R(busca);
        fracao =
          Math.max(0, Math.min(rb.bottom, H) - Math.max(rb.top, 0)) / rb.height;
      }
      const aparece = barraAparece();
      vistos.push(`${Math.round(scrollY)}:${aparece ? "sim" : "não"}`);
      if (fracao > 0 && fracao < 0.25)
        continue; /* na beira do limiar do observador */
      const esperado = passou && fracao === 0;
      if (aparece !== esperado)
        problemas.push(
          `barra do pé ${aparece ? "aparece" : "não aparece"} a ${Math.round(scrollY)}px (carrossel saiu: ${passou}, busca na tela: ${Math.round(fracao * 100)}%)`,
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
