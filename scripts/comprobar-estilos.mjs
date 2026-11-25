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
