export const environment = {
  production: true,
  apiUrl: 'https://back-end-gestion-curricular-xd7m.onrender.com/api', // URL de producción
  // Configuración para producción
  debug: false,
  logLevel: 'error',
  // Configuración de timeouts
  httpTimeout: 15000, // 15 segundos
  // Configuración de retry
  maxRetries: 2,
  retryDelay: 2000, // 2 segundos
};
