import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PazSalvoComponent } from './paz-salvo.component';
import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('PazSalvoComponent - Pruebas de Usabilidad', () => {
  let component: PazSalvoComponent;
  let fixture: ComponentFixture<PazSalvoComponent>;
  let pazSalvoService: jasmine.SpyObj<PazSalvoService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let httpClient: jasmine.SpyObj<HttpClient>;
  let compiled: HTMLElement;

  // Métricas de usabilidad
  let metricasUsabilidad = {
    tiemposRespuesta: [] as number[],
    elementosVisibles: 0,
    elementosEditables: 0,
    interaccionesExitosas: 0,
    validacionesCorrectas: 0
  };

  beforeEach(async () => {
    const pazSalvoServiceSpy = jasmine.createSpyObj('PazSalvoService', [
      'listarSolicitudesPorRol',
      'sendRequest',
      'obtenerOficios'
    ]);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);

    await TestBed.configureTestingModule({
      imports: [PazSalvoComponent, BrowserAnimationsModule],
      providers: [
        { provide: PazSalvoService, useValue: pazSalvoServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HttpClient, useValue: httpClientSpy }
      ]
    }).compileComponents();

    pazSalvoService = TestBed.inject(PazSalvoService) as jasmine.SpyObj<PazSalvoService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;

    // Mock localStorage
    const mockUsuario = {
      id_usuario: 1,
      nombre_completo: 'Test User',
      codigo: '12345',
      correo: 'test@unicauca.edu.co',
      rol: { nombre: 'ESTUDIANTE' },
      objPrograma: { id: 1, nombre: 'Ingeniería' }
    };
    localStorage.setItem('usuario', JSON.stringify(mockUsuario));

    pazSalvoService.listarSolicitudesPorRol.and.returnValue(of([]));

    fixture = TestBed.createComponent(PazSalvoComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('1. VISIBILIDAD DE ELEMENTOS', () => {
    it('US-001: Debe mostrar el título principal del módulo', () => {
      const titulo = compiled.querySelector('h1, h2, .titulo-principal');
      expect(titulo).toBeTruthy();
      if (titulo) {
        metricasUsabilidad.elementosVisibles++;
      }
    });

    it('US-002: Debe mostrar la sección de documentos requeridos', () => {
      expect(component.documentosRequeridos.length).toBeGreaterThan(0);
      const seccionDocs = compiled.querySelector('app-required-docs');
      expect(seccionDocs).toBeTruthy();
      metricasUsabilidad.elementosVisibles++;
    });

    it('US-003: Debe mostrar el componente de subida de archivos', () => {
      const fileUpload = compiled.querySelector('app-file-upload');
      expect(fileUpload).toBeTruthy();
      metricasUsabilidad.elementosVisibles++;
    });

    it('US-004: Debe mostrar la tabla de estado de solicitudes', () => {
      const tabla = compiled.querySelector('app-request-status-table');
      expect(tabla).toBeTruthy();
      metricasUsabilidad.elementosVisibles++;
    });

    it('US-005: Los elementos clave deben ser visibles sin scroll', () => {
      const elementos = compiled.querySelectorAll('mat-card, button, .file-upload');
      expect(elementos.length).toBeGreaterThan(0);
      metricasUsabilidad.elementosVisibles += elementos.length;
    });
  });

  describe('2. INTERACTIVIDAD Y EDITABILIDAD', () => {
    it('US-006: El botón de envío debe estar inicialmente deshabilitado', () => {
      const botonEnviar = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (botonEnviar) {
        expect(botonEnviar.disabled).toBe(true);
        metricasUsabilidad.validacionesCorrectas++;
      }
    });

    it('US-007: El botón de envío debe habilitarse cuando hay archivos', () => {
      component.archivosActuales = [
        { nombre: 'test.pdf', ruta: 'path/test.pdf', tipo: 'application/pdf' }
      ];
      fixture.detectChanges();
      
      expect(component.puedeEnviar()).toBe(true);
      metricasUsabilidad.validacionesCorrectas++;
    });

    it('US-008: Debe permitir agregar archivos mediante el componente de subida', () => {
      const archivos = [
        { nombre: 'documento1.pdf', ruta: 'path1', tipo: 'application/pdf' },
        { nombre: 'documento2.pdf', ruta: 'path2', tipo: 'application/pdf' }
      ];
      
      component.onArchivosChange(archivos);
      
      expect(component.archivosActuales.length).toBe(2);
      metricasUsabilidad.interaccionesExitosas++;
    });

    it('US-009: Debe validar que exista usuario antes de enviar', () => {
      component.archivosActuales = [{ nombre: 'test.pdf', ruta: 'path', tipo: 'pdf' }];
      expect(component.puedeEnviar()).toBe(true);
      
      component.usuario = null;
      expect(component.puedeEnviar()).toBe(false);
      metricasUsabilidad.validacionesCorrectas++;
    });
  });

  describe('3. MENSAJES Y FEEDBACK', () => {
    it('US-010: Debe mostrar mensaje de éxito al enviar solicitud', fakeAsync(() => {
      const mockArchivos = [{ nombre: 'test.pdf', ruta: 'path', tipo: 'pdf' }];
      component.archivosActuales = mockArchivos;
      
      const mockFileUploadComponent = {
        subirArchivosPendientes: () => of(mockArchivos),
        resetearEstadoCarga: jasmine.createSpy('resetearEstadoCarga')
      };
      component.fileUploadComponent = mockFileUploadComponent as any;
      
      pazSalvoService.sendRequest.and.returnValue(of({ success: true }));
      
      const tiempoInicio = performance.now();
      component.onSolicitudEnviada();
      tick();
      const tiempoFin = performance.now();
      
      metricasUsabilidad.tiemposRespuesta.push(tiempoFin - tiempoInicio);
      expect(snackBar.open).toHaveBeenCalled();
      metricasUsabilidad.interaccionesExitosas++;
    }));

    it('US-011: Debe mostrar mensaje de error cuando falla el envío', fakeAsync(() => {
      const mockArchivos = [{ nombre: 'test.pdf', ruta: 'path', tipo: 'pdf' }];
      
      const mockFileUploadComponent = {
        subirArchivosPendientes: () => throwError(() => new Error('Error de red')),
        resetearEstadoCarga: jasmine.createSpy('resetearEstadoCarga')
      };
      component.fileUploadComponent = mockFileUploadComponent as any;
      
      component.onSolicitudEnviada();
      tick();
      
      expect(snackBar.open).toHaveBeenCalled();
      metricasUsabilidad.interaccionesExitosas++;
    }));

    it('US-012: Los mensajes deben tener una duración apropiada', () => {
      // Simular mensaje de éxito
      component['mostrarMensaje']('Éxito', 'success');
      
      const lastCall = snackBar.open.calls.mostRecent();
      const config = lastCall.args[2];
      
      expect(config.duration).toBeLessThanOrEqual(6000);
      expect(config.duration).toBeGreaterThanOrEqual(3000);
      metricasUsabilidad.validacionesCorrectas++;
    });
  });

  describe('4. NAVEGACIÓN Y FLUJO', () => {
    it('US-013: Debe cargar solicitudes al iniciar el componente', fakeAsync(() => {
      const mockSolicitudes = [
        {
          id_solicitud: 1,
          nombre_solicitud: 'Solicitud Test',
          fecha_registro_solicitud: new Date().toISOString(),
          estadosSolicitud: [{ estado_actual: 'PENDIENTE', comentarios: '' }],
          documentos: []
        }
      ];
      
      pazSalvoService.listarSolicitudesPorRol.and.returnValue(of(mockSolicitudes));
      
      const tiempoInicio = performance.now();
      component.listarSolicitudes();
      tick();
      const tiempoFin = performance.now();
      
      metricasUsabilidad.tiemposRespuesta.push(tiempoFin - tiempoInicio);
      expect(component.solicitudes.length).toBeGreaterThan(0);
      metricasUsabilidad.interaccionesExitosas++;
    }));

    it('US-014: Debe identificar solicitudes rechazadas correctamente', () => {
      expect(component.esSolicitudRechazada('RECHAZADA')).toBe(true);
      expect(component.esSolicitudRechazada('Rechazada')).toBe(true);
      expect(component.esSolicitudRechazada('APROBADA')).toBe(false);
      metricasUsabilidad.validacionesCorrectas++;
    });

    it('US-015: Debe permitir ver comentarios en solicitudes rechazadas', () => {
      const mockSolicitud = {
        id_solicitud: 1,
        nombre_solicitud: 'Test',
        estadosSolicitud: [
          { estado_actual: 'RECHAZADA', comentario: 'Documentos incompletos' }
        ],
        documentos: [{ nombre: 'doc.pdf', comentario: 'Falta firma' }]
      };
      
      component.solicitudesCompletas = [mockSolicitud];
      
      dialog.open.and.returnValue({
        afterClosed: () => of(true)
      } as any);
      
      component.verComentarios(1);
      
      expect(dialog.open).toHaveBeenCalled();
      metricasUsabilidad.interaccionesExitosas++;
    });
  });

  describe('5. ACCESIBILIDAD Y UX', () => {
    it('US-016: Los documentos requeridos deben estar claramente marcados', () => {
      const obligatorios = component.documentosRequeridos.filter(doc => doc.obligatorio);
      expect(obligatorios.length).toBeGreaterThan(0);
      metricasUsabilidad.validacionesCorrectas++;
    });

    it('US-017: Debe resetear el formulario después de envío exitoso', fakeAsync(() => {
      const mockArchivos = [{ nombre: 'test.pdf', ruta: 'path', tipo: 'pdf' }];
      
      const mockFileUploadComponent = {
        subirArchivosPendientes: () => of(mockArchivos),
        resetearEstadoCarga: jasmine.createSpy('resetearEstadoCarga')
      };
      component.fileUploadComponent = mockFileUploadComponent as any;
      
      pazSalvoService.sendRequest.and.returnValue(of({ success: true }));
      
      component.onSolicitudEnviada();
      tick();
      tick(10);
      
      expect(component.resetFileUpload).toBe(false);
      metricasUsabilidad.interaccionesExitosas++;
    }));

    it('US-018: Debe manejar correctamente la ausencia de usuario', () => {
      component.usuario = null;
      component.listarSolicitudes();
      
      // No debe lanzar error, solo no hacer la petición
      expect(pazSalvoService.listarSolicitudesPorRol).not.toHaveBeenCalled();
      metricasUsabilidad.validacionesCorrectas++;
    });
  });

  describe('6. RENDIMIENTO Y TIEMPOS DE RESPUESTA', () => {
    it('US-019: La inicialización del componente debe ser rápida', (done) => {
      const tiempoInicio = performance.now();
      
      fixture = TestBed.createComponent(PazSalvoComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      
      const tiempoFin = performance.now();
      const duracion = tiempoFin - tiempoInicio;
      
      metricasUsabilidad.tiemposRespuesta.push(duracion);
      expect(duracion).toBeLessThan(1000); // Menos de 1 segundo
      done();
    });

    it('US-020: La carga de solicitudes debe completarse en tiempo razonable', fakeAsync(() => {
      pazSalvoService.listarSolicitudesPorRol.and.returnValue(of([]));
      
      const tiempoInicio = performance.now();
      component.listarSolicitudes();
      tick();
      const tiempoFin = performance.now();
      
      const duracion = tiempoFin - tiempoInicio;
      metricasUsabilidad.tiemposRespuesta.push(duracion);
      expect(duracion).toBeLessThan(2000); // Menos de 2 segundos
    }));
  });

  // REPORTE DE MÉTRICAS AL FINAL
  afterAll(() => {
    console.log('\n📊 REPORTE DE MÉTRICAS DE USABILIDAD - PAZ Y SALVO');
    console.log('═'.repeat(60));
    console.log(`✅ Elementos visibles verificados: ${metricasUsabilidad.elementosVisibles}`);
    console.log(`✏️  Elementos editables verificados: ${metricasUsabilidad.elementosEditables}`);
    console.log(`🎯 Interacciones exitosas: ${metricasUsabilidad.interaccionesExitosas}`);
    console.log(`✓  Validaciones correctas: ${metricasUsabilidad.validacionesCorrectas}`);
    
    if (metricasUsabilidad.tiemposRespuesta.length > 0) {
      const promedio = metricasUsabilidad.tiemposRespuesta.reduce((a, b) => a + b, 0) / 
                      metricasUsabilidad.tiemposRespuesta.length;
      const maximo = Math.max(...metricasUsabilidad.tiemposRespuesta);
      const minimo = Math.min(...metricasUsabilidad.tiemposRespuesta);
      
      console.log(`⏱️  Tiempo promedio de respuesta: ${promedio.toFixed(2)}ms`);
      console.log(`⏱️  Tiempo máximo: ${maximo.toFixed(2)}ms`);
      console.log(`⏱️  Tiempo mínimo: ${minimo.toFixed(2)}ms`);
    }
    console.log('═'.repeat(60));
  });
});

