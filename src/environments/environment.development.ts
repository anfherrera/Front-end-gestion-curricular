export const environment = {
  production: false,
  apiUrl: 'https://back-end-gestion-curricular.onrender.com/api',
  // Configuración para desarrollo
  debug: true,
  logLevel: 'debug',
  // Configuración de timeouts
  httpTimeout: 30000, // 30 segundos
  // Configuración de retry
  maxRetries: 3,
  retryDelay: 1000, // 1 segundo
};
