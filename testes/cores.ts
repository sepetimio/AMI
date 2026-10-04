/*
  Achar e classificar as cores escritas no código do site, para os testes que
  varrem o site inteiro (testes/tom-quente.test.ts e a sombra sem verde de
  testes/base-visual.test.ts).

  Entende as notações que o CSS aceita para uma cor literal: hex de 3, 4, 6
  ou 8 dígitos, `rgb()`/`rgba()` (com vírgula ou espaço, número ou %),
  `hsl()`/`hsla()`, `oklch()` e os nomes de cor da família do creme. Tudo vira
  RGB de 0 a 255, para a mesma regra valer qualquer que seja a notação.
*/
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export type Rgb = [number, number, number];
export type CorAchada = { texto: string; rgb: Rgb };

/* Os nomes de cor do CSS que são creme, bege ou marfim. Valores da
   especificação (CSS Color 4, lista de nomes). */
export const NOMES_QUENTES: Record<string, Rgb> = {
  ivory: [255, 255, 240],
  beige: [245, 245, 220],
  cornsilk: [255, 248, 220],
  linen: [250, 240, 230],
  oldlace: [253, 245, 230],
  seashell: [255, 245, 238],
  floralwhite: [255, 250, 240],
  antiquewhite: [250, 235, 215],
  wheat: [245, 222, 179],
  bisque: [255, 228, 196],
  papayawhip: [255, 239, 213],
  blanchedalmond: [255, 235, 205],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  lemonchiffon: [255, 250, 205],
};

const limitar = (v: number) => Math.min(255, Math.max(0, v));

/* Um número de canal: "128", "50%" (de 255) ou "0.5" quando `escala` é 1. */
function canal(t: string, escala: number): number {
  return t.endsWith("%") ? (parseFloat(t) / 100) * 255 : (parseFloat(t) * 255) / escala;
}

/* Os três primeiros argumentos de uma função de cor (vírgula, espaço ou
   barra), ou `null` quando algum não é número: uma cor montada com `var()`
   (`rgb(var(--x))`) não tem valor escrito para julgar, e o valor dela é
   julgado onde a variável é definida. */
function argumentos(dentro: string): [string, string, string] | null {
  const partes = dentro.split(/[\s,/]+/).filter(Boolean).slice(0, 3);
  if (partes.length < 3 || partes.some((p) => !Number.isFinite(parseFloat(p)))) return null;
  return partes as [string, string, string];
}

function deHex(h: string): Rgb {
  const curto = h.length <= 4;
  const pares = curto ? [...h.slice(0, 3)].map((c) => c + c) : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)];
  return pares.map((p) => parseInt(p, 16)) as Rgb;
}

function deHsl(h: number, s: number, l: number): Rgb {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => limitar(Math.round(v * 255))) as Rgb;
}

/* OKLCH para sRGB (CSS Color 4: OKLab, LMS, sRGB linear, gama). */
function deOklch(l: number, c: number, h: number): Rgb {
  const r = (h * Math.PI) / 180;
  const a = c * Math.cos(r);
  const b = c * Math.sin(r);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  const gama = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  return lin.map((v) => limitar(Math.round(gama(Math.min(1, Math.max(0, v))) * 255))) as Rgb;
}

/* Toda cor literal de um texto de CSS (ou de um valor arbitrário do
   Tailwind, com `_` no lugar do espaço). Passe o texto já sem comentários. */
export function coresNoTexto(css: string): CorAchada[] {
  const achadas: CorAchada[] = [];
  for (const m of css.matchAll(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g)) {
    achadas.push({ texto: m[0], rgb: deHex(m[1]) });
  }
  for (const m of css.matchAll(/rgba?\(([^)]*)\)/gi)) {
    const args = argumentos(m[1]);
    if (!args) continue;
    const [r, g, b] = args;
    achadas.push({ texto: m[0], rgb: [r, g, b].map((v) => limitar(canal(v, 255))) as Rgb });
  }
  for (const m of css.matchAll(/hsla?\(([^)]*)\)/gi)) {
    const args = argumentos(m[1]);
    if (!args) continue;
    const [h, s, l] = args;
    achadas.push({ texto: m[0], rgb: deHsl(parseFloat(h), parseFloat(s) / 100, parseFloat(l) / 100) });
  }
  for (const m of css.matchAll(/oklch\(([^)]*)\)/gi)) {
    const args = argumentos(m[1]);
    if (!args) continue;
    const [l, c, h] = args;
    const claridade = l.endsWith("%") ? parseFloat(l) / 100 : parseFloat(l);
    const croma = c.endsWith("%") ? (parseFloat(c) / 100) * 0.4 : parseFloat(c);
    achadas.push({ texto: m[0], rgb: deOklch(claridade, croma, parseFloat(h)) });
  }
  for (const m of css.matchAll(/(?<![\w-])([a-z]+)(?![\w-])/gi)) {
    const nome = m[1].toLowerCase();
    if (nome in NOMES_QUENTES) achadas.push({ texto: m[0], rgb: NOMES_QUENTES[nome] });
  }
  return achadas;
}

/* Matiz (0 a 360), saturação e luminosidade (0 a 1) do HSL. */
export function hslDe([r, g, b]: Rgb): { h: number; s: number; l: number } {
  const [x, y, z] = [r / 255, g / 255, b / 255];
  const max = Math.max(x, y, z);
  const min = Math.min(x, y, z);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === x ? ((y - z) / d) % 6 : max === y ? (z - x) / d + 2 : (x - y) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

/*
  Quente, para o site: o creme e o bege que o cliente recusou.
  - matiz entre 20° e 70° (do laranja ao amarelo) com saturação acima de 8%;
  - ou um cinza claro (luminosidade acima de 75%) com o vermelho claramente
    acima do azul (5 ou mais, de 255) e sem o verde acima do vermelho: o
    "branco quente". Com o verde por cima é o cinza esverdeado do texto sobre
    a busca verde (#cfd8c9), que não é creme.
*/
export function ehQuente(rgb: Rgb): boolean {
  const { h, s, l } = hslDe(rgb);
  if (s > 0.08 && h >= 20 && h <= 70) return true;
  const [r, g, b] = rgb;
  return l > 0.75 && r - b >= 5 && r >= g;
}

/* Os arquivos do site com um final (".css", ".tsx"), de app/ e components/,
   com o texto já em LF. */
export function arquivosDoSite(final: string): { arquivo: string; texto: string }[] {
  const raiz = fileURLToPath(new URL("..", import.meta.url));
  const andar = (pasta: string): string[] =>
    readdirSync(join(raiz, pasta), { withFileTypes: true }).flatMap((e) => {
      const caminho = `${pasta}/${e.name}`;
      if (e.isDirectory()) return andar(caminho);
      return e.name.endsWith(final) ? [caminho] : [];
    });
  return ["app", "components"].flatMap(andar).map((arquivo) => ({
    arquivo,
    texto: readFileSync(join(raiz, arquivo), "utf8").replaceAll("\r\n", "\n"),
  }));
}
