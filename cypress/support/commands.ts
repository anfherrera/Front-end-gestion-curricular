// ***********************************************
// Comandos personalizados para pruebas E2E
// ***********************************************

/**
 * Comando para login
 */
Cypress.Commands.add('login', (correo: string, password: string) => {
  cy.visit('/login');
  cy.get('input[formControlName="correo"]').clear().type(correo);
  cy.get('input[formControlName="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/home');
});

/**
 * Comando para verificar visibilidad y editabilidad de campos
 */
Cypress.Commands.add('verificarCampoFormulario', (selector: string, debeSer: 'visible' | 'editable' | 'ambos') => {
  if (debeSer === 'visible' || debeSer === 'ambos') {
    cy.get(selector).should('be.visible');
  }
  if (debeSer === 'editable' || debeSer === 'ambos') {
    cy.get(selector).should('not.be.disabled');
  }
});

/**
 * Comando para verificar estado de botón según validez del formulario
 */
Cypress.Commands.add('verificarEstadoBoton', (selector: string, debeEstar: 'habilitado' | 'deshabilitado') => {
  if (debeEstar === 'habilitado') {
    cy.get(selector).should('not.be.disabled');
  } else {
    cy.get(selector).should('be.disabled');
  }
});

/**
 * Comando para verificar mensaje de éxito o error
 */
Cypress.Commands.add('verificarMensaje', (tipo: 'success' | 'error' | 'warning', texto?: string) => {
  cy.get('.mat-mdc-snack-bar-container, .mat-snack-bar-container', { timeout: 10000 })
    .should('be.visible');
  
  if (texto) {
    cy.get('.mat-mdc-snack-bar-container, .mat-snack-bar-container')
      .should('contain', texto);
  }
});

/**
 * Comando para navegar con verificación
 */
Cypress.Commands.add('navegarYVerificar', (ruta: string, elementoEsperado?: string) => {
  cy.visit(ruta);
  cy.url().should('include', ruta);
  
  if (elementoEsperado) {
    cy.get(elementoEsperado).should('exist');
  }
});

/**
 * Comando para subir archivo
 */
Cypress.Commands.add('subirArchivo', (selector: string, nombreArchivo: string, tipo: string) => {
  cy.get(selector).selectFile({
    contents: Cypress.Buffer.from('Contenido de prueba'),
    fileName: nombreArchivo,
    mimeType: tipo
  }, { force: true });
});

/**
 * Comando para esperar carga completa de página
 */
Cypress.Commands.add('esperarCargaCompleta', () => {
  cy.get('body').should('exist');
  cy.wait(500); // Esperar animaciones
});

// Declaración de tipos para TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      login(correo: string, password: string): Chainable<void>;
      verificarCampoFormulario(selector: string, debeSer: 'visible' | 'editable' | 'ambos'): Chainable<void>;
      verificarEstadoBoton(selector: string, debeEstar: 'habilitado' | 'deshabilitado'): Chainable<void>;
      verificarMensaje(tipo: 'success' | 'error' | 'warning', texto?: string): Chainable<void>;
      navegarYVerificar(ruta: string, elementoEsperado?: string): Chainable<void>;
      subirArchivo(selector: string, nombreArchivo: string, tipo: string): Chainable<void>;
      esperarCargaCompleta(): Chainable<void>;
    }
  }
}

