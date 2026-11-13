// Prueba de navegación real en Edge/Chrome headless (Chrome DevTools Protocol, sin dependencias).
//
// Para cada rol inicia sesión, recorre sus pantallas como si pulsara el sidebar y comprueba:
//   - que cada ruta abre (no redirige a /welcome ni a /login),
//   - que no hay errores de Angular/JS en consola (NG0, TypeError, guards),
//   - que las rutas de otro rol se niegan,
//   - en cursos intersemestrales, que el diálogo de crear curso trae el selector de salón,
//   - en paz y salvo, que cada rol llama a sus propios endpoints.
//
// Requisitos: front en http://localhost:4200 (npm start) y backend en :5000.
// Sin backend: SIN_BACKEND=1 siembra una sesión simulada (prueba rutas y guards, no datos).
//
// Uso:  npm run test:navegacion
//       SIN_BACKEND=1 npm run test:navegacion
// Variables opcionales: APP_URL, NAVEGADOR (ruta a msedge.exe / chrome.exe), PASS
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP = process.env.APP_URL || 'http://localhost:4200';
const PASS = process.env.PASS || 'password123';
const SIN_BACKEND = process.env.SIN_BACKEND === '1';
const PUERTO = 9335;

const NAVEGADOR = process.env.NAVEGADOR || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find(p => existsSync(p));

const SUB_CURSOS = ['dashboard', 'gestionar', 'preinscribir', 'inscribir', 'solicitudes'];

/** Casos por usuario de prueba (datos semilla de import.sql). */
const casos = [
  {
    correo: 'juanp@unicauca.edu.co', rol: 'funcionario',
    rutas: ['/funcionario/paz-salvo', '/funcionario/pruebas-ecaes', '/funcionario/reingreso-estudiante',
      '/funcionario/homologacion-asignaturas', '/funcionario/modulo-estadistico', '/funcionario/historial-completo'],
    cursos: true,
    pazSalvoEndpoint: 'listarSolicitud-PazYSalvo/Funcionario',
    negadas: ['/coordinador/paz-salvo', '/secretaria/paz-salvo', '/admin/dashboard'],
  },
  {
    correo: 'josefina@unicauca.edu.co', rol: 'coordinador',
    rutas: ['/coordinador/paz-salvo', '/coordinador/reingreso-estudiante', '/coordinador/homologacion-asignaturas',
      '/coordinador/modulo-estadistico', '/coordinador/historial-completo'],
    cursos: true,
    pazSalvoEndpoint: 'listarSolicitud-PazYSalvo/Coordinador',
    negadas: ['/funcionario/paz-salvo', '/secretaria/paz-salvo'],
  },
  {
    correo: 'maria@unicauca.edu.co', rol: 'secretaria',
    rutas: ['/secretaria/paz-salvo', '/secretaria/reingreso-estudiante', '/secretaria/homologacion-asignaturas'],
    negadas: ['/funcionario/paz-salvo', '/coordinador/modulo-estadistico'],
  },
  {
    correo: 'dcisneros@unicauca.edu.co', rol: 'estudiante',
    rutas: ['/estudiante/paz-salvo', '/estudiante/cursos-intersemestrales',
      '/estudiante/cursos-intersemestrales/cursos-ofertados', '/estudiante/reingreso-estudiante',
      '/estudiante/homologacion-asignaturas', '/estudiante/pruebas-ecaes'],
    negadas: ['/funcionario/modulo-estadistico', '/secretaria/paz-salvo'],
  },
  {
    correo: 'admin@unicauca.edu.co', rol: 'admin',
    rutas: ['/admin/dashboard'],
    negadas: [],
  },
];

const espera = ms => new Promise(r => setTimeout(r, ms));
// Errores de consola que indican fallo de la app (no de red ni de backend caído)
const ERROR_GRAVE = /NG0\d|TypeError|ReferenceError|is not a function|Cannot read prop|guard/i;
const IGNORAR = /favicon|ERR_ABORTED|ERR_CONNECTION_REFUSED|HttpErrorResponse|Http failure/i;

async function urlDepuracion() {
  for (let i = 0; i < 50; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json();
      const pag = lista.find(t => t.type === 'page');
      if (pag) return pag.webSocketDebuggerUrl;
    } catch {}
    await espera(200);
  }
  throw new Error('No se pudo conectar con el navegador');
}

function cliente(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pendientes = new Map();
  const errores = [];
  const peticiones = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pendientes.has(m.id)) { pendientes.get(m.id)(m); pendientes.delete(m.id); }
    if (m.method === 'Network.requestWillBeSent') peticiones.push(m.params.request.url);
    if (m.method === 'Runtime.exceptionThrown') errores.push(m.params.exceptionDetails?.exception?.description?.split('\n')[0] || 'excepción');
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      errores.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' ').split('\n')[0].slice(0, 200));
    }
  };
  const abierto = new Promise(r => (ws.onopen = r));
  const enviar = async (method, params = {}) => {
    await abierto;
    return new Promise(r => { const i = ++id; pendientes.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  };
  const evaluar = async expr => (await enviar('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
  return { enviar, evaluar, errores, peticiones, cerrar: () => ws.close() };
}

if (!NAVEGADOR) {
  console.error('No se encontró Edge ni Chrome. Indique la ruta con NAVEGADOR=...');
  process.exit(2);
}

const perfil = mkdtempSync(join(tmpdir(), 'prueba-navegacion-'));
const navegador = spawn(NAVEGADOR, [`--remote-debugging-port=${PUERTO}`, '--headless=new', '--disable-gpu', '--no-first-run',
  `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' });

let fallos = 0;
const falla = msg => { fallos++; console.log(`  FALLO: ${msg}`); };

try {
  const c = cliente(await urlDepuracion());
  await c.enviar('Runtime.enable');
  await c.enviar('Page.enable');
  await c.enviar('Network.enable');

  const ruta = () => c.evaluar('location.pathname');
  const esperarUrl = async (cond, ms = 15000) => {
    const t = Date.now();
    while (Date.now() - t < ms) { const u = await ruta(); if (cond(u)) return u; await espera(250); }
    return ruta();
  };
  // Navegación interna de Angular, como al pulsar el sidebar (sin recargar la página)
  const ir = r => c.evaluar(`(() => { history.pushState({}, '', ${JSON.stringify(r)}); window.dispatchEvent(new PopStateEvent('popstate')); return true; })()`);
  const erroresGraves = () => [...new Set(c.errores)].filter(e => !IGNORAR.test(e) && ERROR_GRAVE.test(e));

  async function iniciarSesion(caso) {
    await c.enviar('Page.navigate', { url: `${APP}/login` });
    await esperarUrl(u => u === '/login');
    await c.evaluar('localStorage.clear(); sessionStorage.clear(); true');

    if (SIN_BACKEND) {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = `x.${Buffer.from(JSON.stringify({ sub: caso.correo, exp })).toString('base64url')}.x`;
      await c.evaluar(`(() => {
        localStorage.setItem('token', ${JSON.stringify(token)});
        localStorage.setItem('tokenExp', '${exp * 1000}');
        localStorage.setItem('userRole', '${caso.rol}');
        localStorage.setItem('usuario', JSON.stringify({ id_usuario: 1, correo: ${JSON.stringify(caso.correo)}, nombre_completo: 'Prueba', rol: { nombre: '${caso.rol}' } }));
        return true; })()`);
      await c.enviar('Page.navigate', { url: `${APP}/welcome` });
      return esperarUrl(u => u === '/welcome', 10000);
    }

    await c.enviar('Page.navigate', { url: `${APP}/login` });
    // Esperar a que el formulario esté renderizado e hidratado (la primera carga tarda más)
    for (let i = 0; i < 60 && !(await c.evaluar(`!!document.querySelector('button.login-button')`)); i++) await espera(250);
    await espera(1000);
    await c.evaluar(`(() => {
      const set = (sel, v) => { const el = document.querySelector(sel); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
      set('input[formcontrolname=correo]', ${JSON.stringify(caso.correo)});
      set('input[formcontrolname=password]', ${JSON.stringify(PASS)});
      return true; })()`);
    await espera(300);
    await c.evaluar(`document.querySelector('button.login-button').click(); true`);
    return esperarUrl(u => u !== '/login');
  }

  async function comprobarRuta(r) {
    c.errores.length = 0;
    await ir(r);
    const final = await esperarUrl(u => u === r || u.startsWith(r + '/') || u === '/welcome' || u === '/login', 8000);
    await espera(1500);
    const errs = erroresGraves();
    const abre = final === r || final.startsWith(r + '/');
    console.log(`${abre ? 'ABRE  ' : 'NEGADA'} ${r} -> ${final}${errs.length ? `  | errores: ${errs.slice(0, 2).join(' || ')}` : ''}`);
    if (!abre) falla(`${r} no abre`);
    if (errs.length) falla(`errores en ${r}`);
  }

  for (const caso of casos) {
    console.log(`\n=== ${caso.rol} (${caso.correo})${SIN_BACKEND ? ' [sesión simulada]' : ''}`);
    const trasLogin = await iniciarSesion(caso);
    console.log(`sesión -> ${trasLogin}`);
    if (trasLogin === '/login') { falla('no inicia sesión'); continue; }
    await espera(1000);

    for (const r of caso.rutas) await comprobarRuta(r);

    if (caso.cursos) {
      const base = `/${caso.rol}/cursos-intersemestrales`;
      for (const sub of SUB_CURSOS) await comprobarRuta(`${base}/${sub}`);

      // Selector de salón en "crear curso" (antes faltaba en coordinador)
      await ir(`${base}/gestionar`);
      await esperarUrl(u => u === `${base}/gestionar`);
      await espera(2000);
      await c.evaluar(`(() => { const b = [...document.querySelectorAll('button')].find(x => /crear|nuevo/i.test(x.textContent)); b?.click(); return !!b; })()`);
      await espera(2000);
      const salon = await c.evaluar(`!!document.querySelector('mat-dialog-container mat-select[formcontrolname=id_salon]')`);
      console.log(`       crear curso: selector de salón ${salon ? 'sí' : 'NO'}`);
      if (!salon) falla('falta el selector de salón en crear curso');
      await c.enviar('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await espera(800);
    }

    if (caso.pazSalvoEndpoint) {
      c.peticiones.length = 0;
      await ir('/welcome');
      await esperarUrl(u => u === '/welcome');
      await ir(`/${caso.rol}/paz-salvo`);
      await espera(2500);
      const llamadas = c.peticiones.filter(u => /pazysalvo/i.test(u));
      const propio = llamadas.some(u => u.includes(caso.pazSalvoEndpoint));
      console.log(`       paz y salvo llama a ${caso.pazSalvoEndpoint}: ${propio ? 'sí' : 'NO'}`);
      if (!propio) falla(`paz y salvo no llama a ${caso.pazSalvoEndpoint}`);
    }

    for (const r of caso.negadas) {
      await ir(r);
      const final = await esperarUrl(u => u === '/welcome' || u === '/login', 8000);
      const negada = final !== r;
      console.log(`${negada ? 'NEGADA' : 'ABRE  '} ${r} -> ${final} (debe negarse)`);
      if (!negada) falla(`${r} debería negarse para ${caso.rol}`);
    }
  }
  c.cerrar();
} finally {
  navegador.kill();
  await espera(500);
  try { rmSync(perfil, { recursive: true, force: true }); } catch {}
}

console.log(`\n${fallos ? `FALLOS: ${fallos}` : 'Todo correcto'}`);
process.exit(fallos ? 1 : 0);
