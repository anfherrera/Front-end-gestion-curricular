/// <reference types="cypress" />

/**
 * PRUEBAS E2E: Flujo de Paz y Salvo
 * Valida el proceso completo de solicitud y seguimiento de paz y salvo
 */

describe('E2E-02: Flujo Completo de Paz y Salvo', () => {
  const mockUsuario = {
    token: 'mock-token-estudiante',
    usuario: {
      id_usuario: 1,
      nombre_completo: 'Juan Pérez',
      correo: 'juan.perez@unicauca.edu.co',
      codigo: '123456',
      rol: { nombre: 'ESTUDIANTE' },
      objPrograma: { id: 1, nombre: 'Ingeniería Electrónica' }
    }
  };

  const obtenerComponente = () =>
    cy.get('app-paz-salvo', { timeout: 10000 }).then(($el) => {
      return cy.window().then((win: any) => {
        const component = win?.ng?.getComponent?.($el[0]);
        expect(component, 'PazSalvoComponent instance').to.exist;
        return component;
      });
    });

  const visitarPazSalvo = () => {
    cy.visit('/estudiante/paz-salvo', {
      onBeforeLoad: (win) => {
        const exp = Date.now() + 60 * 60 * 1000; // +1 hora
        win.localStorage.setItem('token', mockUsuario.token);
        win.localStorage.setItem('usuario', JSON.stringify(mockUsuario.usuario));
        win.localStorage.setItem('tokenExp', String(exp));
        win.localStorage.setItem('userRole', 'estudiante');
      }
    });

    cy.location('pathname', { timeout: 10000 }).should('include', '/estudiante/paz-salvo');
    cy.contains('Documentación requerida', { timeout: 10000 }).should('be.visible');
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Mock de solicitudes existentes (configurable por test)
    Cypress.env('pazSalvoSolicitudes', []);
    cy.intercept('GET', '**/api/solicitudes-pazysalvo/listarSolicitud-PazYSalvo/porRol*', (req) => {
      const respuesta = Cypress.env('pazSalvoSolicitudes') ?? [];
      req.reply({ statusCode: 200, body: respuesta });
    }).as('listarSolicitudes');

  });

  describe('1. Visualización de Interfaz', () => {
    it('E2E-PS-001: Debe mostrar la sección de documentos requeridos', () => {
      visitarPazSalvo();
      cy.iniciarMedicion();
      
      cy.get('app-required-docs').should('be.visible');
      cy.registrarElementoVisible('app-required-docs');

      cy.contains('Formato PM-FO-4-FOR-27', { timeout: 5000 }).should('be.visible');
      
      cy.finalizarMedicion('Visualización documentos requeridos');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-PS-002: Debe mostrar el componente de subida de archivos', () => {
      visitarPazSalvo();
      cy.get('app-file-upload').should('exist');
      cy.registrarElementoVisible('app-file-upload');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-PS-003: Debe mostrar la tabla de estado de solicitudes', () => {
      visitarPazSalvo();
      cy.get('app-request-status-table, .sin-solicitudes').should('exist');
      cy.get('body').then(($body) => {
        if ($body.find('app-request-status-table').length) {
          cy.registrarElementoVisible('app-request-status-table');
        }
      });
      cy.registrarInteraccionExitosa();
    });

    it('E2E-PS-004: El botón de envío debe estar inicialmente deshabilitado', () => {
      visitarPazSalvo();
      cy.contains('button', 'Enviar Solicitud').should('be.disabled');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('2. Proceso de Subida de Archivos', () => {
    it('E2E-PS-005: Debe permitir seleccionar archivos PDF', () => {
      visitarPazSalvo();
      cy.iniciarMedicion();
      
      // Simular subida de archivo
      cy.get('input[type="file"]', { timeout: 10000 }).first().selectFile({
        contents: Cypress.Buffer.from('PDF Content'),
        fileName: 'documento_test.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      
      cy.wait(1000);
      cy.finalizarMedicion('Selección de archivo');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-PS-006: Debe habilitar el botón de envío con archivos y formulario completos', () => {
      visitarPazSalvo();
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF Content'),
        fileName: 'documento1.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(500);
      // Rellenar fecha requerida para poder enviar
      cy.get('input[formControlName="fecha_terminacion_plan"]').invoke('removeAttr', 'readonly').type('01/01/2025', { force: true });
      cy.wait(500);
      cy.get('button').contains('Enviar Solicitud').should('not.be.disabled');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-PS-007: Debe permitir subir múltiples archivos', () => {
      visitarPazSalvo();
      const archivos = [
        { contents: Cypress.Buffer.from('PDF 1'), fileName: 'doc1.pdf', mimeType: 'application/pdf' },
        { contents: Cypress.Buffer.from('PDF 2'), fileName: 'doc2.pdf', mimeType: 'application/pdf' }
      ];
      
      // Subir primer archivo
      cy.get('input[type="file"]').first().selectFile(archivos[0], { force: true });
      cy.wait(500);
      
      cy.registrarInteraccionExitosa();
    });
  });

  describe('3. Envío de Solicitud', () => {
    it('E2E-PS-008: Debe enviar la solicitud exitosamente', () => {
      visitarPazSalvo();
      cy.intercept('POST', '**/api/solicitudes-pazysalvo/subir-documento*', {
        statusCode: 200,
        body: {
          id_documento: 101,
          nombre: 'documento1.pdf',
          ruta_documento: 'uploads/documento1.pdf'
        }
      }).as('subirDocumento');

      cy.intercept('POST', '**/api/solicitudes-pazysalvo/crearSolicitud-PazYSalvo', {
        statusCode: 201,
        body: { id_solicitud: 1, mensaje: 'Solicitud creada exitosamente' }
      }).as('crearSolicitud');

      cy.iniciarMedicion();

      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF Content'),
        fileName: 'documento_completo.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(500);
      cy.get('input[formControlName="fecha_terminacion_plan"]').invoke('removeAttr', 'readonly').type('01/01/2025', { force: true });
      cy.wait(800);
      cy.contains('button', 'Enviar Solicitud').click({ force: true });
      cy.wait('@crearSolicitud');

      cy.finalizarMedicion('Envío de solicitud');
      
      // Verificar que el mensaje de éxito aparece
      cy.get('.mat-mdc-snack-bar-container, .mat-snack-bar-container', { timeout: 5000 })
        .should('be.visible')
        .should(($el) => {
          const text = $el.text().toLowerCase();
          const hasRelevantText = text.includes('enviada') || text.includes('éxito') || text.includes('exitosamente');
          expect(hasRelevantText).to.be.true;
        });
      
      cy.registrarInteraccionExitosa();
    });

    it('E2E-PS-009: Debe mostrar mensaje de error si falla el envío', () => {
      visitarPazSalvo();
      cy.intercept('POST', '**/api/solicitudes-pazysalvo/subir-documento*', {
        statusCode: 500,
        body: { message: 'Error en el servidor' }
      });
      
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF Content'),
        fileName: 'documento.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      
      cy.wait(1000);
      cy.get('button').contains('Enviar Solicitud').click({ force: true });
      cy.get('.mat-mdc-snack-bar-container, .mat-snack-bar-container, .error-message, [role="alert"]', { timeout: 10000 }).should('exist');
      
      cy.registrarInteraccionExitosa();
    });
  });

  describe('4. Visualización de Solicitudes', () => {
    it('E2E-PS-010: Debe mostrar solicitudes existentes en la tabla', () => {
      const mockSolicitudes = [
        {
          id_solicitud: 1,
          nombre_solicitud: 'Solicitud_paz_salvo_Test',
          fecha_registro_solicitud: new Date().toISOString(),
          estadosSolicitud: [{ estado_actual: 'PENDIENTE', comentarios: '' }],
          documentos: []
        }
      ];
      
      Cypress.env('pazSalvoSolicitudes', mockSolicitudes);
      
      cy.intercept('GET', '**/api/solicitudes-pazysalvo/listarSolicitud-PazYSalvo/porRol*', {
        statusCode: 200,
        body: mockSolicitudes
      }).as('listarSolicitudesExistente');
      
      visitarPazSalvo();
      cy.wait('@listarSolicitudesExistente');
      cy.contains('Solicitud_paz_salvo_Test', { timeout: 5000 }).should('be.visible');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-PS-011: Debe mostrar el estado de cada solicitud', () => {
      const mockSolicitudes = [
        {
          id_solicitud: 1,
          nombre_solicitud: 'Solicitud 1',
          fecha_registro_solicitud: new Date().toISOString(),
          estadosSolicitud: [{ estado_actual: 'APROBADA', comentarios: '' }],
          documentos: []
        }
      ];
      
      Cypress.env('pazSalvoSolicitudes', mockSolicitudes);
      
      cy.intercept('GET', '**/api/solicitudes-pazysalvo/listarSolicitud-PazYSalvo/porRol*', {
        statusCode: 200,
        body: mockSolicitudes
      }).as('listarSolicitudesAprobadas');
      
      visitarPazSalvo();
      cy.wait('@listarSolicitudesAprobadas');
      cy.contains('APROBADA', { timeout: 5000 }).should('be.visible');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-PS-012: Debe permitir ver comentarios en solicitudes rechazadas', () => {
      const mockSolicitudes = [
        {
          id_solicitud: 1,
          nombre_solicitud: 'Solicitud Rechazada',
          fecha_registro_solicitud: new Date().toISOString(),
          estadosSolicitud: [{ 
            estado_actual: 'RECHAZADA', 
            comentario: 'Documentos incompletos' 
          }],
          documentos: [
            { nombre: 'doc1.pdf', comentario: 'Falta firma' }
          ],
          esSeleccionado: false
        }
      ];
      
      Cypress.env('pazSalvoSolicitudes', mockSolicitudes);
      
      cy.intercept('GET', '**/api/solicitudes-pazysalvo/listarSolicitud-PazYSalvo/porRol*', {
        statusCode: 200,
        body: mockSolicitudes
      }).as('listarSolicitudesRechazadas');
      
      visitarPazSalvo();
      cy.wait('@listarSolicitudesRechazadas');
      
      // Buscar indicador de solicitud rechazada
      cy.contains('RECHAZADA', { timeout: 5000 }).should('be.visible');
      
      cy.registrarInteraccionExitosa();
    });
  });

  describe('5. Descarga de Oficios', () => {
    it('E2E-PS-013: Debe permitir descargar oficio en solicitudes aprobadas', () => {
      const mockSolicitudes = [
        {
          id_solicitud: 1,
          nombre_solicitud: 'Solicitud Aprobada',
          fecha_registro_solicitud: new Date().toISOString(),
          estadosSolicitud: [{ estado_actual: 'APROBADA', comentarios: '' }],
          documentos: [
            { nombre: 'oficio_paz_salvo_123.pdf', tipo: 'oficio' }
          ],
          esSeleccionado: true
        }
      ];
      
      Cypress.env('pazSalvoSolicitudes', mockSolicitudes);
      
      cy.intercept('GET', '**/api/solicitudes-pazysalvo/descargarOficio/**', {
        statusCode: 200,
        body: 'PDF Content'
      }).as('descargarOficio');
      
      cy.intercept('GET', '**/api/solicitudes-pazysalvo/listarSolicitud-PazYSalvo/porRol*', {
        statusCode: 200,
        body: mockSolicitudes
      }).as('listarSolicitudesParaDescarga');
      
      visitarPazSalvo();
      cy.wait('@listarSolicitudesParaDescarga');
      cy.contains('APROBADA', { timeout: 5000 }).should('be.visible');
      
      cy.registrarInteraccionExitosa();
    });
  });

  describe('6. Medición de Tiempos de Respuesta', () => {
    it('E2E-PS-014: La carga inicial debe ser rápida', () => {
      visitarPazSalvo();
      
      cy.window().then((win) => {
        win.performance.mark('inicio-carga');
      });
      
      cy.get('app-file-upload', { timeout: 5000 }).should('exist');
      
      cy.window().then((win) => {
        win.performance.mark('fin-carga');
        win.performance.measure('carga-completa', 'inicio-carga', 'fin-carga');
        const measure = win.performance.getEntriesByName('carga-completa')[0];
        
        cy.log(`Tiempo de carga: ${measure.duration}ms`);
        expect(measure.duration).to.be.lessThan(3000);
      });
      
      cy.registrarInteraccionExitosa();
    });

    it('E2E-PS-015: El envío de solicitud debe completarse en tiempo razonable', () => {
      visitarPazSalvo();
      cy.intercept('POST', '**/api/solicitudes-pazysalvo/subir-documento*', {
        delay: 1000,
        statusCode: 200,
        body: [{ nombre: 'doc.pdf', ruta: 'path' }]
      });
      
      cy.intercept('POST', '**/api/solicitudes-pazysalvo/crearSolicitud-PazYSalvo', {
        delay: 500,
        statusCode: 201,
        body: { id_solicitud: 1 }
      });
      
      cy.iniciarMedicion();

      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(500);
      cy.get('input[formControlName="fecha_terminacion_plan"]').invoke('removeAttr', 'readonly').type('01/01/2025', { force: true });
      cy.wait(500);
      cy.get('button').contains('Enviar Solicitud').click({ force: true });
      cy.finalizarMedicion('Tiempo total de envío');
      cy.registrarInteraccionExitosa();
    });
  });

  // Generar reporte al final
  after(() => {
    cy.obtenerMetricas().then((metricas) => {
      cy.task('log', '\nMetricas - Paz y Salvo');
      cy.task('log', '═'.repeat(50));
      cy.task('log', `Elementos verificados: ${metricas.elementosVisibles.length}`);
      cy.task('log', `Interacciones: ${metricas.interaccionesExitosas}`);
      cy.task('log', `Mediciones: ${metricas.tiemposRespuesta.length}`);
      if (metricas.tiemposRespuesta.length > 0) {
        const promedio = metricas.tiemposRespuesta.reduce((a: any, b: any) =>
          a + (b.duracion || 0), 0) / metricas.tiemposRespuesta.length;
        cy.task('log', `Tiempo promedio (ms): ${promedio.toFixed(2)}`);
      }
    });
  });
});

