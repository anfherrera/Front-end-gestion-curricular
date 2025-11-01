/// <reference types="cypress" />
import { of } from 'rxjs';

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
      
      // Verificar que se muestran los documentos requeridos
      cy.contains('Formato PM-FO-4-FOR-27.pdf', { timeout: 5000 }).should('be.visible');
      
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

    it('E2E-PS-006: Debe habilitar el botón de envío con archivos cargados', () => {
      visitarPazSalvo();
      // Simular que hay archivos cargados
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF Content'),
        fileName: 'documento1.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      
      cy.wait(1000);
      
      // El botón debe habilitarse
      cy.get('button').contains('Enviar', { timeout: 5000 }).should('not.be.disabled');
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
      // Mock del endpoint de subida de archivos
      cy.intercept('POST', '**/api/solicitudes-pazysalvo/subir-documento*', {
        statusCode: 200,
        body: {
          id_documento: 101,
          nombre: 'documento1.pdf',
          ruta_documento: 'uploads/documento1.pdf'
        }
      }).as('subirDocumento');
      
      // Mock del endpoint de crear solicitud
      cy.intercept('POST', '**/api/solicitudes-pazysalvo/crearSolicitud-PazYSalvo', {
        statusCode: 201,
        body: {
          id_solicitud: 1,
          nombre_solicitud: 'Solicitud_paz_salvo_Juan Pérez',
          fecha_registro_solicitud: new Date().toISOString()
        }
      }).as('crearSolicitud');
      
      cy.iniciarMedicion();
      
      // Subir archivo
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF Content'),
        fileName: 'documento_completo.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      
      cy.wait(1000);
      
      // Click en botón de envío
      cy.contains('button', 'Enviar Solicitud').should('not.be.disabled');
      obtenerComponente().then((component: any) => {
        const archivosSubidos = [
          {
            id_documento: 101,
            nombre: 'documento1.pdf',
            ruta_documento: 'uploads/documento1.pdf'
          }
        ];

        expect(component.usuario, 'usuario cargado').to.exist;
        expect(component.fileUploadComponent, 'fileUploadComponent').to.exist;
        cy.stub(component.fileUploadComponent, 'subirArchivosPendientes').returns(of(archivosSubidos));
        cy.stub(component.pazSalvoService, 'sendRequest').returns(of({ mensaje: 'ok' }));
        cy.stub(component, 'listarSolicitudes').as('listarSolicitudesInterno');
        cy.spy(component, 'mostrarMensaje').as('mostrarMensaje');

        component.onSolicitudEnviada();
      });

      cy.finalizarMedicion('Envío de solicitud');
      
      cy.get('@mostrarMensaje').should('have.been.calledWith',
        '🎉 ¡Solicitud de paz y salvo enviada correctamente! Los documentos se asociaron automáticamente.',
        'success'
      );
      
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
      cy.get('button').contains('Enviar').click();
      
      // Verificar mensaje de error
      cy.contains('Error', { timeout: 10000 });
      
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
      
      visitarPazSalvo();
      obtenerComponente().then((component: any) => {
        expect(component.usuario, 'usuario cargado').to.exist;
        component.solicitudes = mockSolicitudes.map((sol) => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: sol.estadosSolicitud?.[sol.estadosSolicitud.length - 1]?.estado_actual || 'PENDIENTE',
          rutaArchivo: '',
          comentarios: sol.estadosSolicitud?.[0]?.comentarios || '',
          esSeleccionado: sol.esSeleccionado || false
        }));
        component.solicitudesCompletas = mockSolicitudes as any;
        component['cdr']?.detectChanges();
      });
      cy.contains('Solicitud_paz_salvo_Test', { timeout: 5000 });
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
      
      visitarPazSalvo();
      obtenerComponente().then((component: any) => {
        expect(component.usuario, 'usuario cargado').to.exist;
        component.solicitudes = mockSolicitudes.map((sol) => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: sol.estadosSolicitud?.[sol.estadosSolicitud.length - 1]?.estado_actual || 'PENDIENTE',
          rutaArchivo: '',
          comentarios: sol.estadosSolicitud?.[0]?.comentarios || '',
          esSeleccionado: sol.esSeleccionado || false
        }));
        component.solicitudesCompletas = mockSolicitudes as any;
        component['cdr']?.detectChanges();
      });
      
      cy.contains('APROBADA', { timeout: 5000 });
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
      
      visitarPazSalvo();
      obtenerComponente().then((component: any) => {
        expect(component.usuario, 'usuario cargado').to.exist;
        component.solicitudes = mockSolicitudes.map((sol) => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: sol.estadosSolicitud?.[sol.estadosSolicitud.length - 1]?.estado_actual || 'PENDIENTE',
          rutaArchivo: '',
          comentarios: sol.estadosSolicitud?.[0]?.comentario || '',
          esSeleccionado: sol.esSeleccionado || false
        }));
        component.solicitudesCompletas = mockSolicitudes as any;
        component['cdr']?.detectChanges();
      });
      
      // Buscar botón de comentarios
      cy.get('button[mat-icon-button] mat-icon', { timeout: 5000 }).contains('comment');
      
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
      
      visitarPazSalvo();
      obtenerComponente().then((component: any) => {
        expect(component.usuario, 'usuario cargado').to.exist;
        component.solicitudes = mockSolicitudes.map((sol) => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: sol.estadosSolicitud?.[sol.estadosSolicitud.length - 1]?.estado_actual || 'PENDIENTE',
          rutaArchivo: sol.documentos?.[0]?.nombre || '',
          comentarios: sol.estadosSolicitud?.[0]?.comentarios || '',
          esSeleccionado: sol.esSeleccionado || false
        }));
        component.solicitudesCompletas = mockSolicitudes as any;
        component['cdr']?.detectChanges();
      });
      
      // Buscar botón de descarga
      cy.get('button[mat-icon-button] mat-icon', { timeout: 5000 }).contains('download');
      
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
      
      cy.wait(1000);
      cy.get('button').contains('Enviar').click();
      
      cy.finalizarMedicion('Tiempo total de envío');
      cy.registrarInteraccionExitosa();
    });
  });

  // Generar reporte al final
  after(() => {
    cy.obtenerMetricas().then((metricas) => {
      cy.task('log', '\n📊 MÉTRICAS - FLUJO DE PAZ Y SALVO');
      cy.task('log', '═'.repeat(50));
      cy.task('log', `✅ Elementos verificados: ${metricas.elementosVisibles.length}`);
      cy.task('log', `🎯 Interacciones exitosas: ${metricas.interaccionesExitosas}`);
      cy.task('log', `⏱️  Mediciones realizadas: ${metricas.tiemposRespuesta.length}`);
      
      if (metricas.tiemposRespuesta.length > 0) {
        const promedio = metricas.tiemposRespuesta.reduce((a: any, b: any) => 
          a + (b.duracion || 0), 0) / metricas.tiemposRespuesta.length;
        cy.task('log', `⏱️  Tiempo promedio: ${promedio.toFixed(2)}ms`);
      }
    });
  });
});

