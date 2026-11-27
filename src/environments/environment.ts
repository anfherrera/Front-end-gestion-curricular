/** Entorno de desarrollo y pruebas (`ng serve`, `ng test`). En producción se reemplaza por environment.production.ts. */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  /** Client ID de Google (el mismo GOOGLE_CLIENT_ID del backend). Vacío: no se muestra el botón de Google. */
  googleClientId: '',
};
