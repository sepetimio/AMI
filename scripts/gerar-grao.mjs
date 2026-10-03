import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

/* Textura granulada do verde (bloco de busca e rodapé). O desenho usava um
   filtro SVG; no site é PNG pequeno repetido, porque o filtro é redesenhado
   a cada rolagem. Semente fixa: rodar de novo gera o mesmo arquivo.
   Rode da raiz do projeto: node scripts/gerar-grao.mjs */
const L = 240;
let s = 20261003;
const aleatorio = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const linhas = Buffer.alloc((L * 2 + 1) * L);
for (let y = 0; y < L; y++) {
  linhas[y * (L * 2 + 1)] = 0; // filtro "nenhum" da linha
  for (let x = 0; x < L; x++) {
    const i = y * (L * 2 + 1) + 1 + x * 2;
    linhas[i] = 255;                               // cinza: branco
    linhas[i + 1] = Math.round(aleatorio() * 230); // alfa: o grão
  }
}

const crc = (b) => {
  let c = ~0;
  for (const byte of b) { c ^= byte; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return ~c >>> 0;
};
const pedaco = (tipo, dados) => {
  const t = Buffer.from(tipo);
  const tam = Buffer.alloc(4); tam.writeUInt32BE(dados.length);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, dados])));
  return Buffer.concat([tam, t, dados, c]);
};
const cabeca = Buffer.alloc(13);
cabeca.writeUInt32BE(L, 0); cabeca.writeUInt32BE(L, 4);
cabeca[8] = 8; cabeca[9] = 4; // 8 bits, cinza com alfa

mkdirSync("public/textura", { recursive: true });
writeFileSync("public/textura/grao.png", Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  pedaco("IHDR", cabeca),
  pedaco("IDAT", deflateSync(linhas)),
  pedaco("IEND", Buffer.alloc(0)),
]));
console.log("public/textura/grao.png");
