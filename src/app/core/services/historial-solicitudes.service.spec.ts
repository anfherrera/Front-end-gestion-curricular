import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { DetalleSolicitud, HistorialSolicitudesService } from './historial-solicitudes.service';

describe('HistorialSolicitudesService (rutas de EST-7, paso 5, y BUG-49)', () => {
  let service: HistorialSolicitudesService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/solicitudes/historial`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(HistorialSolicitudesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('pide el historial en JSON sin formato', () => {
    service.obtenerHistorialCompleto({ periodoAcademico: '2025-1' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('periodoAcademico')).toBe('2025-1');
    expect(req.request.params.has('formato')).toBeFalse();
    req.flush({ solicitudes: [], total: 0 });
  });

  it('exporta el PDF con formato=pdf y los filtros, aunque no haya filtros', () => {
    service.exportarHistorialPDF().subscribe();
    const sinFiltros = httpMock.expectOne((r) => r.url === base);
    expect(sinFiltros.request.method).toBe('GET');
    expect(sinFiltros.request.urlWithParams).toBe(`${base}?formato=pdf`);
    expect(sinFiltros.request.responseType).toBe('blob');
    sinFiltros.flush(new Blob());

    service.exportarHistorialPDF({ estadoActual: 'APROBADA' }).subscribe();
    const conFiltro = httpMock.expectOne((r) => r.url === base);
    expect(conFiltro.request.urlWithParams).toBe(`${base}?formato=pdf&estadoActual=APROBADA`);
    conFiltro.flush(new Blob());
  });

  describe('detalle de una solicitud (BUG-49)', () => {
    const porId = `${environment.apiUrl}/solicitudes/7`;

    it('pide GET /api/solicitudes/{id} y arma el detalle con los estados en orden', () => {
      let detalle: DetalleSolicitud | undefined;
      service.obtenerDetalleSolicitud(7).subscribe((d) => (detalle = d));
      const req = httpMock.expectOne(porId);
      expect(req.request.method).toBe('GET');
      req.flush({
        id_solicitud: 7,
        nombre_solicitud: 'Solicitud de Paz y Salvo',
        periodo_academico: '2025-1',
        fecha_registro_solicitud: '2025-03-01T10:00:00.000+00:00',
        fecha_ceremonia: null,
        estadosSolicitud: [
          {
            id_estado: 2,
            estado_actual: 'APROBADA',
            fecha_registro_estado: '2025-03-05T10:00:00.000+00:00',
            comentario: 'ok',
          },
          {
            id_estado: 1,
            estado_actual: 'ENVIADA',
            fecha_registro_estado: '2025-03-01T10:00:00.000+00:00',
            comentario: null,
          },
          { id_estado: 3, estado_actual: 'SIN_FECHA', fecha_registro_estado: null, comentario: null },
        ],
        objUsuario: {
          id_usuario: 4,
          nombre_completo: 'Ana Pérez',
          codigo: '1001',
          correo: 'ana@x.co',
          cedula: null,
          rol: null,
        },
        documentos: [{ id_documento: 9, nombre: 'carta.pdf', ruta_documento: '/r/carta.pdf', esValido: true }],
        categoria: null,
        tipo_solicitud: null,
      });

      expect(detalle).toEqual({
        id_solicitud: 7,
        nombre_solicitud: 'Solicitud de Paz y Salvo',
        periodo_academico: '2025-1',
        fecha_registro_solicitud: '2025-03-01T10:00:00.000+00:00',
        fecha_ceremonia: null,
        tipo_solicitud_display: 'Paz y Salvo',
        estado_actual: 'APROBADA',
        fecha_ultimo_estado: '2025-03-05T10:00:00.000+00:00',
        usuario: { id_usuario: 4, nombre_completo: 'Ana Pérez', codigo: '1001', correo: 'ana@x.co', cedula: null },
        historial_estados: [
          { id_estado: 3, estado_actual: 'SIN_FECHA', fecha_registro_estado: null, comentario: null },
          {
            id_estado: 1,
            estado_actual: 'ENVIADA',
            fecha_registro_estado: '2025-03-01T10:00:00.000+00:00',
            comentario: null,
          },
          {
            id_estado: 2,
            estado_actual: 'APROBADA',
            fecha_registro_estado: '2025-03-05T10:00:00.000+00:00',
            comentario: 'ok',
          },
        ],
        total_estados: 3,
        documentos: [{ id_documento: 9, nombre_documento: 'carta.pdf', ruta_documento: '/r/carta.pdf' }],
        total_documentos: 1,
      });
    });

    it('sin estados, usuario ni documentos da "Sin estado" y totales en cero', () => {
      let detalle: DetalleSolicitud | undefined;
      service.obtenerDetalleSolicitud(7).subscribe((d) => (detalle = d));
      httpMock.expectOne(porId).flush({
        id_solicitud: 7,
        nombre_solicitud: null,
        periodo_academico: null,
        fecha_registro_solicitud: null,
        estadosSolicitud: [],
        objUsuario: null,
        documentos: null,
      });
      expect(detalle?.estado_actual).toBe('Sin estado');
      expect(detalle?.fecha_ultimo_estado).toBeNull();
      expect(detalle?.usuario).toBeNull();
      expect(detalle?.tipo_solicitud_display).toBe('N/A');
      expect(detalle?.total_estados).toBe(0);
      expect(detalle?.total_documentos).toBe(0);
    });

    it('propaga el error del backend', () => {
      let status = 0;
      service.obtenerDetalleSolicitud(7).subscribe({ error: (e) => (status = e.status) });
      httpMock.expectOne(porId).flush({ error: 'no' }, { status: 404, statusText: 'Not Found' });
      expect(status).toBe(404);
    });
  });
});
