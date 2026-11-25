// Capturas de las pantallas principales de cada rol, para comparar el aspecto antes y después de un cambio visual.
// Edge/Chrome headless por Chrome DevTools Protocol, sin dependencias (como prueba-navegacion.mjs).
//
// Requisitos: front en http://localhost:4200 (npm start) y backend en :5000 con los usuarios de prueba.
// Uso:  node scripts/capturas-pantallas.mjs <carpeta-salida>
//       ALTO=3200 node scripts/capturas-pantallas.mjs <carpeta>   (página larga, a media escala)
// Variables opcionales: APP_URL, NAVEGADOR, PASS, ALTO
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SALIDA = process.argv[2];
if (!SALIDA) {
  console.error('Uso: node scripts/capturas-pantallas.mjs <carpeta-salida>');
  process.exit(2);
}
mkdirSync(SALIDA, { recursive: true });
const APP = process.env.APP_URL || 'http://localhost:4200';
const PASS = process.env.PASS || 'password123';
const ALTO = Number(process.env.ALTO || 900);
const ESCALA = ALTO > 900 ? 0.5 : 1;
const PUERTO = 9338;
const NAVEGADOR =
  process.env.NAVEGADOR ||
  [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].find((p) => existsSync(p));

/** Pantallas por usuario de prueba. */
const CASOS = [
  [
    'juanp@unicauca.edu.co',
    [
      '/welcome',
      '/funcionario/paz-salvo',
      '/funcionario/homologacion-asignaturas',
      '/funcionario/pruebas-ecaes',
      '/funcionario/modulo-estadistico',
      '/funcionario/historial-completo',
      '/funcionario/cursos-intersemestrales/dashboard',
      '/funcionario/cursos-intersemestrales/gestionar',
      '/funcionario/cursos-intersemestrales/preinscribir',
      '/notificaciones',
    ],
  ],
  ['maria@unicauca.edu.co', ['/secretaria/paz-salvo']],
  [
    'dcisneros@unicauca.edu.co',
    [
      '/estudiante/paz-salvo',
      '/estudiante/homologacion-asignaturas',
      '/estudiante/reingreso-estudiante',
      '/estudiante/pruebas-ecaes',
      '/estudiante/cursos-intersemestrales',
    ],
  ],
  ['admin@unicauca.edu.co', ['/admin/dashboard', '/admin/manage-users']],
];

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const navegador = spawn(
  NAVEGADOR,
  [
    `--remote-debugging-port=${PUERTO}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--hide-scrollbars',
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'capturas-'))}`,
    `--window-size=1366,${ALTO}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
);

async function urlDepuracion() {
  for (let i = 0; i < 50; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json();
      const pag = lista.find((t) => t.type === 'page');
      if (pag) return pag.webSocketDebuggerUrl;
    } catch {
      /* el navegador aún no escucha */
    }
    await espera(200);
  }
  throw new Error('No se pudo conectar con el navegador');
}

const ws = new WebSocket(await urlDepuracion());
let id = 0;
const pendientes = new Map();
const errores = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pendientes.has(m.id)) {
    pendientes.get(m.id)(m);
    pendientes.delete(m.id);
  }
  if (m.method === 'Runtime.exceptionThrown') {
    errores.push(m.params.exceptionDetails?.exception?.description?.split('\n')[0]);
  }
};
await new Promise((r) => (ws.onopen = r));
const enviar = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id;
    pendientes.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const evaluar = async (expr) =>
  (await enviar('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result
    ?.value;
const ruta = () => evaluar('location.pathname');
const esperarUrl = async (cond, ms = 15000) => {
  const t = Date.now();
  while (Date.now() - t < ms) {
    const u = await ruta();
    if (cond(u)) return u;
    await espera(250);
  }
  return ruta();
};
const capturar = async (nombre) => {
  const m = await enviar('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SALIDA, nombre + '.png'), Buffer.from(m.result.data, 'base64'));
};

try {
  await enviar('Runtime.enable');
  await enviar('Page.enable');
  await enviar('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: ALTO,
    deviceScaleFactor: ESCALA,
    mobile: false,
  });

  for (const [correo, rutas] of CASOS) {
    await enviar('Page.navigate', { url: `${APP}/login` });
    await esperarUrl((u) => u === '/login');
    await evaluar('localStorage.clear(); sessionStorage.clear(); true');
    await enviar('Page.navigate', { url: `${APP}/login` });
    for (let i = 0; i < 60 && !(await evaluar(`!!document.querySelector('button.login-button')`)); i++) {
      await espera(250);
    }
    await espera(1200);
    if (correo === CASOS[0][0]) await capturar('00-login');
    await evaluar(`(() => {
      const set = (sel, v) => { const el = document.querySelector(sel); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
      set('input[formcontrolname=correo]', ${JSON.stringify(correo)});
      set('input[formcontrolname=password]', ${JSON.stringify(PASS)});
      return true; })()`);
    await espera(300);
    await evaluar(`document.querySelector('button.login-button').click(); true`);
    await esperarUrl((u) => u !== '/login');
    await espera(1500);

    for (const r of rutas) {
      await evaluar(
        `(() => { history.pushState({}, '', ${JSON.stringify(r)}); window.dispatchEvent(new PopStateEvent('popstate')); return true; })()`
      );
      await esperarUrl((u) => u === r || u.startsWith(r + '/'), 8000);
      await espera(3500);
      const nombre = correo.split('@')[0] + r.replaceAll('/', '_');
      await capturar(nombre);
      const final = await ruta();
      console.log(`captura ${nombre}${final === r ? '' : ` (redirigida a ${final})`}`);
    }
  }
  console.log('errores de JS:', errores.filter(Boolean).join(' || ') || 'ninguno');
} finally {
  ws.close();
  navegador.kill();
}
