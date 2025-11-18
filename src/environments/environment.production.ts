export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api', // URL de producción
  // Configuración para producción
  debug: false,
  logLevel: 'error',
  // Configuración de timeouts
  httpTimeout: 15000, // 15 segundos
  // Configuración de retry
  maxRetries: 2,
  retryDelay: 2000, // 2 segundos
};
