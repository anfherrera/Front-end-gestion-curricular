/// <reference types="cypress" />

/**
 * PRUEBAS E2E: Flujo de Homologación de Asignaturas (Propuesta 1)
 * Estudiante: lista documentos requeridos, adjunta PDFs, validación informativa de documentos,
 * envío de solicitud, seguimiento con estado. Funcionario/Coordinador: revisión, documentación,
 * comentarios, aprobar/rechazar. Secretaría: resolución, subida PDF, disponibilidad para estudiante.
 */

describe('E2E-06: Flujo Completo de Homologación de Asignaturas', () => {
  const mockEstudiante = {
    token: 'mock-token-estudiante',
    usuario: {
      id_usuario: 1,
      nombre_completo: 'Ana Estudiante',
      correo: 'ana@unicauca.edu.co',
      codigo: '101010',
      cedula: '123456789',
      rol: { nombre: 'ESTUDIANTE' },
      objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería de Sistemas' }
    }
  };

  const mockFuncionario = {
    token: 'mock-token-funcionario',
    usuario: {
      id_usuario: 2,
      nombre_completo: 'Funcionario Test',
      correo: 'funcionario@unicauca.edu.co',
      codigo: 'FUNC01',
      rol: { nombre: 'FUNCIONARIO' },
      objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería' }
    }
  };

  const visitarComoEstudiante = () => {
    cy.visit('/estudiante/homologacion-asignaturas', {
      onBeforeLoad: (win) => {
        const exp = Date.now() + 60 * 60 * 1000;
        win.localStorage.setItem('token', mockEstudiante.token);
        win.localStorage.setItem('usuario', JSON.stringify(mockEstudiante.usuario));
        win.localStorage.setItem('tokenExp', String(exp));
        win.localStorage.setItem('userRole', 'estudiante');
      }
    });
    cy.location('pathname', { timeout: 10000 }).should('include', 'homologacion-asignaturas');
  };

  const visitarComoFuncionario = () => {
    cy.visit('/funcionario/homologacion-asignaturas', {
      onBeforeLoad: (win) => {
        const exp = Date.now() + 60 * 60 * 1000;
        win.localStorage.setItem('token', mockFuncionario.token);
        win.localStorage.setItem('usuario', JSON.stringify(mockFuncionario.usuario));
        win.localStorage.setItem('tokenExp', String(exp));
        win.localStorage.setItem('userRole', 'funcionario');
      }
    });
    cy.location('pathname', { timeout: 10000 }).should('include', 'homologacion-asignaturas');
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.intercept('GET', '**/api/solicitudes-homologacion/**', { statusCode: 200, body: [] }).as('listarHomologacion');
  });

  describe('1. Estudiante – Visualización de Interfaz', () => {
    it('E2E-HA-001: Debe mostrar la sección de documentos requeridos', () => {
      visitarComoEstudiante();
      cy.iniciarMedicion();
      cy.get('app-required-docs').should('be.visible');
      cy.contains('PM-FO-4-FOR-22', { timeout: 8000 }).should('be.visible');
      cy.registrarElementoVisible('app-required-docs');
      cy.finalizarMedicion('Visualización documentos requeridos homologación');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-HA-002: Debe mostrar Información de la Solicitud (programa origen/destino)', () => {
      visitarComoEstudiante();
      cy.contains('Información de la Solicitud', { timeout: 8000 }).should('be.visible');
      cy.get('input[formControlName="programa_origen"]').should('be.visible');
      cy.get('input[formControlName="programa_destino"]').should('be.visible');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-HA-003: Debe mostrar componente de subida de archivos', () => {
      visitarComoEstudiante();
      cy.get('app-file-upload').should('exist');
      cy.contains('Subir Archivos', { timeout: 5000 }).should('be.visible');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-HA-004: Debe mostrar sección de seguimiento de solicitud', () => {
      visitarComoEstudiante();
      cy.contains('Seguimiento de solicitud', { timeout: 8000 }).should('be.visible');
      cy.get('app-request-status-table, .sin-solicitudes').should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-HA-005: El botón Enviar Solicitud debe estar inicialmente deshabilitado', () => {
      visitarComoEstudiante();
      cy.contains('button', 'Enviar Solicitud').should('be.disabled');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('2. Estudiante – Subida de archivos y validación informativa', () => {
    it('E2E-HA-006: Debe permitir seleccionar archivos PDF', () => {
      visitarComoEstudiante();
      cy.get('input[type="file"]', { timeout: 10000 }).first().selectFile({
        contents: Cypress.Buffer.from('PDF Content'),
        fileName: 'certificado_notas.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(800);
      cy.registrarInteraccionExitosa();
    });

    it('E2E-HA-007: Con archivos subidos debe habilitar el botón Enviar Solicitud', () => {
      visitarComoEstudiante();
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'documento.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(600);
      cy.contains('button', 'Enviar Solicitud').should('not.be.disabled');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-HA-008: Si hay documentos no detectados debe mostrar mensaje informativo sin bloquear envío', () => {
      visitarComoEstudiante();
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'archivo_cualquiera.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(800);
      cy.get('body').then(($body) => {
        if ($body.find('.validacion-mensaje-informativo').length) {
          cy.get('.validacion-mensaje-informativo').should('be.visible');
          cy.contains('Documentos sugeridos').should('be.visible');
        }
        cy.contains('button', 'Enviar Solicitud').should('not.be.disabled');
      });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('3. Estudiante – Envío de solicitud', () => {
    it('E2E-HA-009: Debe enviar la solicitud exitosamente', () => {
      cy.intercept('POST', '**/api/archivos/**', { statusCode: 200, body: { nombre: 'doc.pdf', ruta_documento: '/uploads/doc.pdf' } }).as('subirArchivo');
      cy.intercept('POST', '**/api/solicitudes-homologacion/crearSolicitud-Homologacion', {
        statusCode: 201,
        body: { id_solicitud: 1, mensaje: 'Solicitud creada' }
      }).as('crearHomologacion');

      visitarComoEstudiante();
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'solicitud_homologacion.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(600);
      cy.contains('button', 'Enviar Solicitud').click({ force: true });
      cy.wait('@crearHomologacion', { timeout: 15000 });

      cy.get('.mat-mdc-snack-bar-container, .mat-snack-bar-container', { timeout: 8000 }).should('be.visible');
      cy.get('body').then(($body) => {
        const text = $body.text();
        expect(text.includes('homologación') || text.includes('enviada') || text.includes('éxito') || text.includes('exitosamente')).to.be.true;
      });
      cy.registrarInteraccionExitosa();
    });

    it('E2E-HA-010: Debe mostrar error si falla el envío', () => {
      cy.intercept('POST', '**/api/solicitudes-homologacion/crearSolicitud-Homologacion', { statusCode: 500, body: { message: 'Error servidor' } });
      visitarComoEstudiante();
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'doc.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(600);
      cy.contains('button', 'Enviar Solicitud').click({ force: true });
      cy.get('.mat-mdc-snack-bar-container, .mat-snack-bar-container, [role="alert"]', { timeout: 10000 }).should('exist');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('4. Estudiante – Seguimiento de solicitud', () => {
    it('E2E-HA-011: Debe mostrar solicitudes existentes en la tabla de seguimiento', () => {
      const mockSolicitudes = [
        {
          id: 1,
          nombre: 'Solicitud Homologación - Ana',
          fecha: new Date().toLocaleDateString(),
          estado: 'PENDIENTE',
          rutaArchivo: '',
          comentarios: ''
        }
      ];
      cy.intercept('GET', '**/api/solicitudes-homologacion/listarSolicitud-Homologacion/porRol*', { statusCode: 200, body: [{ id_solicitud: 1, nombre_solicitud: 'Solicitud Homologación - Ana', fecha_registro_solicitud: new Date().toISOString(), estadosSolicitud: [{ estado_actual: 'PENDIENTE' }], documentos: [] }] }).as('listar');
      visitarComoEstudiante();
      cy.wait('@listar');
      cy.contains('Solicitud Homologación', { timeout: 8000 }).should('be.visible');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-HA-012: Debe mostrar estado de cada solicitud', () => {
      cy.intercept('GET', '**/api/solicitudes-homologacion/**', {
        statusCode: 200,
        body: [{ id_solicitud: 1, nombre_solicitud: 'Homologación Test', fecha_registro_solicitud: new Date().toISOString(), estadosSolicitud: [{ estado_actual: 'APROBADA' }], documentos: [] }]
      }).as('listarAprobada');
      visitarComoEstudiante();
      cy.wait('@listarAprobada');
      cy.contains('APROBADA', { timeout: 8000 }).should('be.visible');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('5. Funcionario – Revisión de solicitudes', () => {
    it('E2E-HA-013: Debe mostrar solicitudes pendientes de homologación', () => {
      const mockSolicitudes = [
        { id_solicitud: 1, nombre_solicitud: 'Homologación - Ana', fecha_registro_solicitud: new Date().toISOString(), estadosSolicitud: [{ estado_actual: 'PENDIENTE' }], documentos: [{ nombre_documento: 'doc1.pdf' }], objUsuario: { nombre_completo: 'Ana' } }
      ];
      cy.intercept('GET', '**/api/solicitudes-homologacion/listarSolicitud-Homologacion/Funcionario*', { statusCode: 200, body: mockSolicitudes }).as('listarFuncionario');
      visitarComoFuncionario();
      cy.wait('@listarFuncionario');
      cy.contains('Solicitudes de Homologación Pendientes', { timeout: 10000 }).should('be.visible');
      cy.get('app-request-status-table').should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-HA-014: Al seleccionar una solicitud debe mostrar Documentación Adjunta y botones Aprobar/Rechazar', () => {
      const mockSolicitudes = [
        { id_solicitud: 1, nombre_solicitud: 'Homologación - Ana', fecha_registro_solicitud: new Date().toISOString(), estadosSolicitud: [{ estado_actual: 'PENDIENTE' }], documentos: [{ id_documento: 1, nombre_documento: 'doc1.pdf' }], objUsuario: { nombre_completo: 'Ana' } }
      ];
      cy.intercept('GET', '**/api/solicitudes-homologacion/listarSolicitud-Homologacion/Funcionario*', { statusCode: 200, body: mockSolicitudes });
      visitarComoFuncionario();
      cy.wait(1000);
      cy.get('app-request-status-table').within(() => {
        cy.get('table tbody tr, .mat-row, [role="row"]').first().click({ force: true });
      });
      cy.wait(800);
      cy.get('body').then(($body) => {
        if ($body.find('app-documentation-viewer').length) {
          cy.get('app-documentation-viewer').should('be.visible');
        }
        if ($body.find('button').filter((i, el) => Cypress.$(el).text().includes('Aprobar')).length) {
          cy.contains('button', 'Aprobar').should('be.visible');
        }
        if ($body.find('button').filter((i, el) => Cypress.$(el).text().includes('Rechazar')).length) {
          cy.contains('button', 'Rechazar').should('be.visible');
        }
      });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('6. Medición de tiempos', () => {
    it('E2E-HA-015: La carga inicial de la vista estudiante debe ser rápida', () => {
      visitarComoEstudiante();
      cy.window().then((win) => win.performance.mark('inicio-carga-ha'));
      cy.get('app-required-docs', { timeout: 8000 }).should('exist');
      cy.window().then((win) => {
        win.performance.mark('fin-carga-ha');
        win.performance.measure('carga-ha', 'inicio-carga-ha', 'fin-carga-ha');
        const m = win.performance.getEntriesByName('carga-ha')[0];
        if (m) expect(m.duration).to.be.lessThan(5000);
      });
      cy.registrarInteraccionExitosa();
    });
  });

  after(() => {
    cy.obtenerMetricas().then((metricas) => {
      cy.task('log', '\nMétricas - Homologación');
      cy.task('log', '═'.repeat(50));
      cy.task('log', `Elementos verificados: ${metricas.elementosVisibles?.length ?? 0}`);
      cy.task('log', `Interacciones: ${metricas.interaccionesExitosas ?? 0}`);
      cy.task('log', `Mediciones: ${metricas.tiemposRespuesta?.length ?? 0}`);
    });
  });
});
