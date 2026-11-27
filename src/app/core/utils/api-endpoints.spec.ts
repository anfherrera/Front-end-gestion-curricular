import { environment } from '@env/environment';
import { ApiEndpoints } from './api-endpoints';

type Grupo = Record<string, unknown>;

/** Recorre los grupos de ApiEndpoints y devuelve [ruta, valor] de cada endpoint. */
function endpoints(grupo: Grupo, prefijo = ''): [string, unknown][] {
  return Object.entries(grupo).flatMap(([clave, valor]) =>
    valor && typeof valor === 'object'
      ? endpoints(valor as Grupo, `${prefijo}${clave}.`)
      : ([[`${prefijo}${clave}`, valor]] as [string, unknown][])
  );
}

describe('ApiEndpoints', () => {
  const grupos = Object.fromEntries(
    Object.entries(ApiEndpoints).filter(([clave, valor]) => clave !== 'BASE_URL' && typeof valor === 'object')
  ) as Grupo;
  const todos = endpoints(grupos);

  it('usa la URL del entorno como base', () => {
    expect(ApiEndpoints.BASE_URL).toBe(environment.apiUrl);
    // Solo comprueba que el recorrido encuentra los endpoints (35 tras quitar los grupos sin uso)
    expect(todos.length).toBeGreaterThan(30);
  });

  it('todas las URLs fijas cuelgan de la base y no llevan barra final ni dobles barras', () => {
    for (const [ruta, valor] of todos.filter(([, v]) => typeof v === 'string')) {
      const url = valor as string;
      expect(url.startsWith(`${environment.apiUrl}/`))
        .withContext(ruta)
        .toBeTrue();
      expect(url.endsWith('/')).withContext(ruta).toBeFalse();
      expect(url.slice(environment.apiUrl.length)).withContext(ruta).not.toContain('//');
    }
  });

  it('todas las URLs con parámetro cuelgan de la base e incluyen el valor recibido', () => {
    const funciones = todos.filter(([, v]) => typeof v === 'function');
    expect(funciones.length).toBeGreaterThanOrEqual(4);
    for (const [ruta, valor] of funciones) {
      const fn = valor as (...args: unknown[]) => string;
      const args = Array.from({ length: fn.length }, (_, i) => `p${i}x`);
      const url = fn(...args);
      expect(url.startsWith(`${environment.apiUrl}/`))
        .withContext(ruta)
        .toBeTrue();
      for (const arg of args) {
        expect(url).withContext(ruta).toContain(arg);
      }
    }
  });

  it('arma las rutas con parámetros como las espera el backend', () => {
    const base = environment.apiUrl;
    expect(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.ESTUDIANTES_ELEGIBLES(3)).toBe(
      `${base}/cursos-verano/cursos/3/estudiantes-elegibles`
    );
    expect(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.ESTUDIANTES_CURSO(3)).toBe(
      `${base}/cursos-verano/cursos/3/estudiantes`
    );
    expect(ApiEndpoints.SOLICITUDES.BY_ID(45)).toBe(`${base}/solicitudes/45`);
  });

  it('codifica el nombre del archivo al descargar un PDF', () => {
    expect(ApiEndpoints.ARCHIVOS.DESCARGAR_PDF('oficio reingreso&1.pdf')).toBe(
      `${environment.apiUrl}/archivos?nombre=oficio%20reingreso%261.pdf`
    );
  });
});
