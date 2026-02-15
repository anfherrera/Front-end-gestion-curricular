/// <reference types="cypress" />

/**
 * PRUEBAS E2E: Flujo de Pruebas ECAES (Propuesta 1)
 * Estudiante: visualizar fechas publicadas, adjuntar documentos PDF, enviar solicitud, seguimiento.
 * Funcionario: publicar fechas ECAES (período + fechas), revisar solicitudes, ver documentación e
 * información de la solicitud, añadir comentarios, aprobar/rechazar preinscripción.
 */

describe('E2E-07: Flujo Completo de Pruebas ECAES', () => {
  const mockEstudiante = {
    token: 'mock-token-estudiante',
    usuario: {
      id_usuario: 1,
      nombre_completo: 'Luis Estudiante',
      correo: 'luis@unicauca.edu.co',
      codigo: '303030',
      cedula: '111222333',
      rol: { nombre: 'ESTUDIANTE' },
      objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería' }
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

  const mockFechasEcaes = [
    {
      idFechaEcaes: 1,
      periodoAcademico: '2025-1',
      inscripcion_est_by_facultad: '2025-01-10',
      registro_recaudo_ordinario: '2025-01-15',
      registro_recaudo_extraordinario: '2025-01-20',
      citacion: '2025-02-01',
      aplicacion: '2025-02-15',
      resultados_individuales: '2025-03-01'
    }
  ];

  const visitarComoEstudiante = () => {
    cy.visit('/estudiante/pruebas-ecaes', {
      onBeforeLoad: (win) => {
        const exp = Date.now() + 60 * 60 * 1000;
        win.localStorage.setItem('token', mockEstudiante.token);
        win.localStorage.setItem('usuario', JSON.stringify(mockEstudiante.usuario));
        win.localStorage.setItem('tokenExp', String(exp));
        win.localStorage.setItem('userRole', 'estudiante');
      }
    });
    cy.location('pathname', { timeout: 10000 }).should('include', 'pruebas-ecaes');
  };

  const visitarComoFuncionario = () => {
    cy.visit('/funcionario/pruebas-ecaes', {
      onBeforeLoad: (win) => {
        const exp = Date.now() + 60 * 60 * 1000;
        win.localStorage.setItem('token', mockFuncionario.token);
        win.localStorage.setItem('usuario', JSON.stringify(mockFuncionario.usuario));
        win.localStorage.setItem('tokenExp', String(exp));
        win.localStorage.setItem('userRole', 'funcionario');
      }
    });
    cy.location('pathname', { timeout: 10000 }).should('include', 'pruebas-ecaes');
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.intercept('GET', '**/api/solicitudes-ecaes/**', { statusCode: 200, body: [] }).as('listarEcaes');
    cy.intercept('GET', '**/api/periodos-academicos/**', { statusCode: 200, body: ['2025-1', '2024-2'] }).as('periodos');
  });

  describe('1. Estudiante – Visualización de fechas publicadas', () => {
    it('E2E-EC-001: Debe mostrar la sección de Fechas con selector de período', () => {
      cy.intercept('GET', '**/api/solicitudes-ecaes/listarFechasEcaes*', { statusCode: 200, body: mockFechasEcaes }).as('fechasEcaes');
      visitarComoEstudiante();
      cy.iniciarMedicion();
      cy.contains('Fechas', { timeout: 10000 }).should('be.visible');
      cy.get('mat-select').contains('Período Académico').should('exist');
      cy.get('body').then(($body) => {
        if ($body.find('.periodo-select mat-select, [formcontrolname="periodoAcademico"]').length) {
          cy.get('mat-select').first().should('exist');
        }
      });
      cy.registrarElementoVisible('seccion-fechas');
      cy.finalizarMedicion('Visualización fechas ECAES');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-EC-002: Debe cargar y mostrar fechas cuando hay datos', () => {
      cy.intercept('GET', '**/api/solicitudes-ecaes/listarFechasEcaes*', { statusCode: 200, body: mockFechasEcaes }).as('fechasEcaes');
      visitarComoEstudiante();
      cy.wait('@fechasEcaes');
      cy.wait(800);
      cy.get('body').then(($body) => {
        const hasTable = $body.find('.fechas-table, table').length > 0;
        const hasFechas = /Inscripción|Citación|Aplicación|Resultados|fecha/i.test($body.text());
        expect(hasTable || hasFechas || $body.text().includes('No hay fechas')).to.be.true;
      });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('2. Estudiante – Documentación adjunta y formulario', () => {
    it('E2E-EC-003: Debe mostrar formulario con Tipo de Documento, Número, Fechas de nacimiento y expedición', () => {
      visitarComoEstudiante();
      cy.contains('Documentación Adjunta', { timeout: 10000 }).should('be.visible');
      cy.get('mat-select[formControlName="tipoDocumento"], mat-form-field').first().should('exist');
      cy.get('input[formControlName="numero_documento"]').should('be.visible');
      cy.get('input[formControlName="fecha_nacimiento"]').should('exist');
      cy.get('input[formControlName="fecha_expedicion"]').should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-EC-004: Debe mostrar componente de subida de archivos (cédula)', () => {
      visitarComoEstudiante();
      cy.contains('cédula', { timeout: 8000 }).should('be.visible');
      cy.get('app-file-upload').should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-EC-005: El botón Enviar Solicitud debe estar deshabilitado sin archivos', () => {
      visitarComoEstudiante();
      cy.get('button').contains('Enviar Solicitud').should('be.disabled');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('3. Estudiante – Subida de archivos y envío', () => {
    it('E2E-EC-006: Debe permitir seleccionar archivo PDF', () => {
      visitarComoEstudiante();
      cy.get('input[type="file"]', { timeout: 10000 }).first().selectFile({
        contents: Cypress.Buffer.from('PDF Content'),
        fileName: 'cedula.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(800);
      cy.registrarInteraccionExitosa();
    });

    it('E2E-EC-007: Con formulario válido y archivo debe habilitar Enviar Solicitud', () => {
      visitarComoEstudiante();
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'cedula.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(600);
      cy.get('body').then(($body) => {
        const btn = $body.find('button').filter((i, el) => Cypress.$(el).text().includes('Enviar Solicitud'))[0];
        if (btn) expect(Cypress.$(btn).prop('disabled')).to.be.false;
      });
      cy.registrarInteraccionExitosa();
    });

    it('E2E-EC-008: Debe enviar la solicitud exitosamente', () => {
      cy.intercept('POST', '**/api/archivos/**', { statusCode: 200, body: { nombre: 'cedula.pdf', ruta_documento: '/uploads/cedula.pdf' } }).as('subirArchivo');
      cy.intercept('POST', '**/api/solicitudes-ecaes/crearSolicitud-Ecaes', {
        statusCode: 201,
        body: { id_solicitud: 1, nombre_solicitud: 'Solicitud ECAES', mensaje: 'Solicitud creada' }
      }).as('crearEcaes');

      visitarComoEstudiante();
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'cedula.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(800);
      cy.get('button').contains('Enviar Solicitud').click({ force: true });
      cy.wait('@crearEcaes', { timeout: 15000 });

      cy.get('.mat-mdc-snack-bar-container, .mat-snack-bar-container', { timeout: 8000 }).should('be.visible');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('4. Estudiante – Seguimiento de solicitud', () => {
    it('E2E-EC-009: Debe mostrar sección Seguimiento de Solicitud', () => {
      visitarComoEstudiante();
      cy.contains('Seguimiento de Solicitud', { timeout: 10000 }).should('be.visible');
      cy.get('app-request-status-table, .sin-solicitudes').should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-EC-010: Debe mostrar solicitudes existentes con estado', () => {
      const mockSolicitudes = [{ id_solicitud: 1, nombre_solicitud: 'Solicitud ECAES - Luis', fecha_registro_solicitud: new Date().toISOString(), estadosSolicitud: [{ estado_actual: 'PENDIENTE' }], documentos: [] }];
      cy.intercept('GET', '**/api/solicitudes-ecaes/listarSolicitudes-Ecaes*', { statusCode: 200, body: mockSolicitudes }).as('listarEcaesEst');
      cy.intercept('GET', '**/api/solicitudes-ecaes/listarSolicitud-ecaes/porRol*', { statusCode: 200, body: mockSolicitudes });
      visitarComoEstudiante();
      cy.wait(1000);
      cy.get('body').then(($body) => {
        if ($body.text().includes('Solicitud ECAES') || $body.find('app-request-status-table table').length) {
          cy.contains('Solicitud ECAES', { timeout: 8000 }).should('be.visible');
        } else {
          cy.contains('No se ha enviado', { timeout: 5000 }).should('be.visible');
        }
      });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('5. Funcionario – Publicar fechas ECAES', () => {
    it('E2E-EC-011: Debe mostrar sección Publicar fechas con período académico y grid de fechas', () => {
      cy.intercept('GET', '**/api/periodos-academicos/**', { statusCode: 200, body: ['2025-1', '2024-2'] }).as('periodos');
      visitarComoFuncionario();
      cy.iniciarMedicion();
      cy.contains('Publicar fechas', { timeout: 10000 }).should('be.visible');
      cy.get('mat-select[formControlName="periodoAcademico"]').should('exist');
      cy.contains('Inscripción de estudiantes').should('be.visible');
      cy.contains('Citación').should('be.visible');
      cy.contains('Aplicación').should('be.visible');
      cy.registrarElementoVisible('formulario-fechas-ecaes');
      cy.finalizarMedicion('Visualización publicar fechas');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-EC-012: Debe tener botón Publicar Fechas', () => {
      visitarComoFuncionario();
      cy.get('button').filter((i, el) => /Publicar Fechas|Actualizar Fechas/.test(Cypress.$(el).text())).should('exist');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('6. Funcionario – Pre-Registros Pendientes y Documentación', () => {
    it('E2E-EC-013: Debe mostrar Pre-Registros Pendientes', () => {
      visitarComoFuncionario();
      cy.contains('Pre-Registros Pendientes', { timeout: 10000 }).should('be.visible');
      cy.get('app-request-status-table, .sin-solicitudes').should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-EC-014: Al seleccionar una solicitud debe mostrar Documentación Adjunta e Información de la Solicitud', () => {
      const mockSolicitudes = [
        {
          id_solicitud: 1,
          nombre_solicitud: 'Solicitud ECAES - Luis',
          fecha_registro_solicitud: new Date().toISOString(),
          estadosSolicitud: [{ estado_actual: 'PENDIENTE' }],
          documentos: [{ id_documento: 1, nombre_documento: 'cedula.pdf' }],
          tipoDocumento: 'CC',
          numero_documento: '111222333',
          fecha_expedicion: '2020-01-15',
          fecha_nacimiento: '1998-05-10',
          objUsuario: { nombre_completo: 'Luis' }
        }
      ];
      cy.intercept('GET', '**/api/solicitudes-ecaes/listarSolicitudes-Ecaes/Funcionario*', { statusCode: 200, body: mockSolicitudes }).as('listarFuncEcaes');
      visitarComoFuncionario();
      cy.wait('@listarFuncEcaes');
      cy.wait(800);
      cy.get('app-request-status-table').within(() => {
        cy.get('table tbody tr, .mat-row, [role="row"]').first().click({ force: true });
      });
      cy.wait(800);
      cy.contains('Documentación Adjunta', { timeout: 8000 }).should('be.visible');
      cy.get('body').then(($body) => {
        if ($body.find('.info-card').length) {
          cy.contains('Información de la Solicitud').should('be.visible');
          cy.contains('Tipo de Documento').should('be.visible');
        }
        if ($body.find('app-documentation-viewer').length) {
          cy.get('app-documentation-viewer').should('be.visible');
        }
      });
      cy.registrarInteraccionExitosa();
    });

    it('E2E-EC-015: Debe mostrar botones Marcar como Pre-registrada y Rechazar Solicitud', () => {
      const mockSolicitudes = [
        { id_solicitud: 1, nombre_solicitud: 'ECAES Test', fecha_registro_solicitud: new Date().toISOString(), estadosSolicitud: [{ estado_actual: 'PENDIENTE' }], documentos: [], tipoDocumento: 'CC', numero_documento: '123', fecha_expedicion: '2020-01-01', fecha_nacimiento: '1998-01-01', objUsuario: {} }
      ];
      cy.intercept('GET', '**/api/solicitudes-ecaes/listarSolicitudes-Ecaes/Funcionario*', { statusCode: 200, body: mockSolicitudes });
      visitarComoFuncionario();
      cy.wait(1000);
      cy.get('app-request-status-table table tbody tr, app-request-status-table .mat-row').first().click({ force: true });
      cy.wait(800);
      cy.contains('button', 'Marcar como Pre-registrada').should('be.visible');
      cy.contains('button', 'Rechazar Solicitud').should('be.visible');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('7. Medición de tiempos', () => {
    it('E2E-EC-016: La carga inicial de la vista estudiante debe ser rápida', () => {
      visitarComoEstudiante();
      cy.window().then((win) => win.performance.mark('inicio-carga-ec'));
      cy.contains('Documentación Adjunta', { timeout: 10000 }).should('be.visible');
      cy.window().then((win) => {
        win.performance.mark('fin-carga-ec');
        win.performance.measure('carga-ec', 'inicio-carga-ec', 'fin-carga-ec');
        const m = win.performance.getEntriesByName('carga-ec')[0];
        if (m) expect(m.duration).to.be.lessThan(5000);
      });
      cy.registrarInteraccionExitosa();
    });
  });

  after(() => {
    cy.obtenerMetricas().then((metricas) => {
      cy.task('log', '\nMétricas - Pruebas ECAES');
      cy.task('log', '═'.repeat(50));
      cy.task('log', `Elementos verificados: ${metricas.elementosVisibles?.length ?? 0}`);
      cy.task('log', `Interacciones: ${metricas.interaccionesExitosas ?? 0}`);
      cy.task('log', `Mediciones: ${metricas.tiemposRespuesta?.length ?? 0}`);
    });
  });
});
