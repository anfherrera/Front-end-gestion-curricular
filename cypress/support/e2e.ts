// ***********************************************************
// Support file para pruebas E2E de Cypress
// ***********************************************************

import './commands';

// Configuración global
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevenir que Cypress falle por excepciones no capturadas
  console.log('Uncaught exception:', err.message);
  return false;
});

// Antes de cada prueba
beforeEach(() => {
  // Limpiar localStorage y sessionStorage
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Métricas de usabilidad
let metricas: any = {
  tiemposRespuesta: [],
  elementosVisibles: [],
  interaccionesExitosas: 0,
  interaccionesFallidas: 0
};

Cypress.Commands.add('iniciarMedicion', () => {
  cy.window().then((win) => {
    win.performance.mark('inicio-medicion');
  });
});

Cypress.Commands.add('finalizarMedicion', (nombre: string) => {
  cy.window().then((win) => {
    win.performance.mark('fin-medicion');
    win.performance.measure(nombre, 'inicio-medicion', 'fin-medicion');
    const medicion = win.performance.getEntriesByName(nombre)[0];
    metricas.tiemposRespuesta.push({
      nombre,
      duracion: medicion.duration
    });
    cy.task('log', `⏱️ ${nombre}: ${medicion.duration.toFixed(2)}ms`);
  });
});

Cypress.Commands.add('registrarElementoVisible', (selector: string) => {
  metricas.elementosVisibles.push(selector);
});

Cypress.Commands.add('registrarInteraccionExitosa', () => {
  metricas.interaccionesExitosas++;
});

Cypress.Commands.add('registrarInteraccionFallida', () => {
  metricas.interaccionesFallidas++;
});

Cypress.Commands.add('obtenerMetricas', () => {
  return cy.wrap(metricas);
});

// Declaración de tipos para TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      iniciarMedicion(): Chainable<void>;
      finalizarMedicion(nombre: string): Chainable<void>;
      registrarElementoVisible(selector: string): Chainable<void>;
      registrarInteraccionExitosa(): Chainable<void>;
      registrarInteraccionFallida(): Chainable<void>;
      obtenerMetricas(): Chainable<any>;
    }
  }
}

