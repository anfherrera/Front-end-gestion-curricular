import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { ArchivosService, PdfSubido } from './archivos.service';

describe('ArchivosService', () => {
  let service: ArchivosService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/archivos`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ArchivosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sube el PDF con el id de la inscripción (y sus alias) y el tipo de solicitud', () => {
    const archivo = new File(['%PDF'], 'comprobante.pdf', { type: 'application/pdf' });
    const respuesta: PdfSubido = { id: 9, nombre: 'comprobante.pdf', ruta: 'cursos/comprobante.pdf' };
    let subido: PdfSubido | undefined;
    service.subirPDF(archivo, 113, 'CURSO_VERANO').subscribe((r) => (subido = r));

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    const datos = req.request.body as FormData;
    expect((datos.get('file') as File).name).toBe('comprobante.pdf');
    expect(datos.get('inscripcionId')).toBe('113');
    expect(datos.get('solicitudId')).toBe('113');
    expect(datos.get('idSolicitud')).toBe('113');
    expect(datos.get('tipoSolicitud')).toBe('CURSO_VERANO');
    req.flush(respuesta);
    expect(subido).toEqual(respuesta);
  });

  it('sin inscripción ni tipo solo envía el archivo', () => {
    service.subirPDF(new File(['x'], 'a.pdf')).subscribe();
    const req = httpMock.expectOne(base);
    const datos = req.request.body as FormData;
    expect(datos.has('file')).toBeTrue();
    expect(datos.has('inscripcionId')).toBeFalse();
    expect(datos.has('tipoSolicitud')).toBeFalse();
    req.flush({});
  });

  it('descarga el PDF por nombre (codificado) y por inscripción como blob', () => {
    service.descargarPDF('oficio 1.pdf').subscribe();
    const porNombre = httpMock.expectOne(`${base}?nombre=oficio%201.pdf`);
    expect(porNombre.request.responseType).toBe('blob');
    porNombre.flush(new Blob());
  });
});
