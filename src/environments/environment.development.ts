export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api', // Backend Node.js
  // Configuración para desarrollo
  debug: true,
  logLevel: 'debug',
  // Configuración de timeouts
  httpTimeout: 30000, // 30 segundos
  // Configuración de retry
  maxRetries: 3,
  retryDelay: 1000, // 1 segundo
};
