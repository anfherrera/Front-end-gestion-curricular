// Comprueba que los componentes usen el Sistema de Diseño TIC (src/app/core/design-system):
// ningún color hex ni nombre de fuente escrito a mano fuera de los tokens.
//
// Uso:  npm run lint:estilos              (revisa src/)
//       node scripts/comprobar-estilos.mjs archivo1 archivo2   (lint-staged)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const RAIZ = process.cwd();
const EXCLUIDOS = [join('src', 'app', 'core', 'design-system') + sep];
const EXTENSIONES = /\.(css|scss|html|ts)$/;
const FUENTES_PERMITIDAS =
  /font-family:\s*(var\(--[a-z-]+\)|\$\{FONTS\.(body|display)\}|inherit|'Courier New', monospace)\s*(!important)?\s*;?/;
// Un color después de ":", espacio, "(", "," o comillas (no un selector #id al principio de la línea)
const COLOR_HEX = /[:\s(,'"`]#[0-9a-fA-F]{3,8}\b(?![\w-])/;
// rgb()/rgba() con un color que no sea negro ni blanco (esos se permiten para sombras y velos)
const COLOR_RGB = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g;
// Colores por nombre en propiedades de color de CSS (white, transparent, inherit y currentColor se permiten)
const COLOR_NOMBRE =
  /(?:^|[\s;{])(?:color|background(?:-color)?|border(?:-[a-z]+)?-color|fill|stroke|outline-color)\s*:\s*(red|green|blue|orange|yellow|purple|pink|gray|grey|black|brown|cyan|magenta)\b/;

function archivosDe(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivosDe(ruta) : [ruta];
  });
}

const entrada = process.argv.slice(2);
const archivos = (entrada.length ? entrada : archivosDe(join(RAIZ, 'src')))
  .map((a) => relative(RAIZ, a))
  .filter((a) => EXTENSIONES.test(a) && !a.endsWith('.spec.ts') && !EXCLUIDOS.some((e) => a.startsWith(e)));

const problemas = [];
for (const archivo of archivos) {
  readFileSync(archivo, 'utf8')
    .split('\n')
    .forEach((linea, i) => {
      // Líneas de comentario (/* … */ de varias líneas, // y *) y comentarios dentro de la línea
      if (/^\s*(\*|\/\*|\/\/)/.test(linea)) return;
      const sinComentario = linea.replace(/\/\*.*?\*\/|\s\/\/.*$/g, '');
      const hex = sinComentario.match(COLOR_HEX);
      if (hex) {
        problemas.push(
          `${archivo}:${i + 1}  color ${hex[0].trim().replace(/^['"`:]/, '')}: usar var(--token) o COLORS`
        );
      }
      for (const [texto, r, g, b] of sinComentario.matchAll(COLOR_RGB)) {
        const rgb = `${r},${g},${b}`;
        if (rgb !== '0,0,0' && rgb !== '255,255,255') {
          problemas.push(
            `${archivo}:${i + 1}  ${texto}…): usar var(--token) o color-mix(in srgb, var(--token) X%, transparent)`
          );
        }
      }
      if (/\.(css|scss)$/.test(archivo)) {
        // Redondeos: solo los tokens --radio-* (guía, pág. 29), 0 o inherit
        const radio = sinComentario.match(/border(?:-[a-z]+)*-radius\s*:\s*([^;}]+)/);
        if (radio && /\d+(\.\d+)?(px|%|rem|em)/.test(radio[1].replace(/var\([^)]*\)/g, ''))) {
          problemas.push(`${archivo}:${i + 1}  ${radio[0].trim()}: usar var(--radio-*)`);
        }
        // Tamaños de letra: solo los tokens --text-* y --tam-icono-* (guía, pág. 26) o inherit
        const tam = sinComentario.match(/font-size\s*:\s*([^;}]+)/);
        if (tam && !/^\s*(var\(--(text-[a-z0-9-]+|tam-icono(-[a-z]+)?|breadcrumb-size)\)|inherit)\s*(!important)?\s*$/.test(tam[1])) {
          problemas.push(`${archivo}:${i + 1}  ${tam[0].trim()}: usar var(--text-*) o var(--tam-icono-*)`);
        }
        const nombre = sinComentario.match(COLOR_NOMBRE);
        if (nombre) problemas.push(`${archivo}:${i + 1}  color "${nombre[1]}": usar var(--token)`);
      }
      const fuente = sinComentario.match(/font-family:[^;]*;?/);
      if (fuente && !FUENTES_PERMITIDAS.test(fuente[0])) {
        problemas.push(`${archivo}:${i + 1}  ${fuente[0].trim()}: usar var(--font-body) o var(--font-display)`);
      }
    });
}

if (problemas.length) {
  console.error(`Estilos fuera del Sistema de Diseño TIC (${problemas.length}):\n  ` + problemas.join('\n  '));
  console.error('Ver src/app/core/design-system/README.md');
  process.exit(1);
}
console.log(`Estilos: ${archivos.length} archivos sin colores ni fuentes escritos a mano.`);
