import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { DocumentData, DocumentRequest } from '../models/documento.model';

/**
 * Pide al backend el oficio en Word que secretaría descarga, revisa y sube luego en PDF.
 * Paz y salvo tiene su propio endpoint; homologación y reingreso usan /documentos/generar.
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentGeneratorService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  generarDocumento(request: DocumentRequest): Observable<Blob> {
    if (request.tipoDocumento === 'OFICIO_PAZ_SALVO') {
      const formData = new FormData();
      formData.append('numeroDocumento', request.datosDocumento.numeroDocumento);
      formData.append('fechaDocumento', fechaParaBackend(request.datosDocumento.fechaDocumento));
      // El título y el director del trabajo de grado los toma el backend de la solicitud
      if (request.datosSolicitud?.cedula) {
        formData.append('cedulaEstudiante', request.datosSolicitud.cedula);
      }
      if (request.datosDocumento.observaciones) {
        formData.append('observaciones', request.datosDocumento.observaciones);
      }
      return this.http.post(`${this.api}/solicitudes-pazysalvo/generar-documento/${request.idSolicitud}`, formData, { responseType: 'blob' });
    }

    return this.http.post(`${this.api}/documentos/generar`, request, { responseType: 'blob' });
  }
}

/**
 * Fecha como YYYY-MM-DD sin pasar por UTC (toISOString la correría un día en Colombia).
 * Vacía si no hay fecha: el backend usa entonces la actual.
 */
export function fechaParaBackend(fecha: DocumentData['fechaDocumento']): string {
  if (fecha === null || fecha === undefined) return '';
  if (fecha instanceof Date) {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
  const texto = String(fecha).trim();
  if (texto === '' || texto === 'null' || texto === 'undefined') return '';
  return texto.split('T')[0];
}
