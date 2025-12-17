import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Archivo } from '../models/procesos.model';
import { ApiEndpoints } from '../utils/api-endpoints';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArchivosService {
  private apiUrl = `${environment.apiUrl}/archivos`;

  constructor(private http: HttpClient) {}

  /**
   * Subir archivo PDF
   * @param file - Archivo PDF a subir
   * @param inscripcionId - ID de la inscripción (opcional pero recomendado para organización)
   * @param tipoSolicitud - Tipo de solicitud (opcional, se infiere de inscripcionId si no se proporciona)
   */
  subirPDF(file: File, inscripcionId?: number, tipoSolicitud?: string): Observable<Archivo> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (inscripcionId) {
      formData.append('inscripcionId', inscripcionId.toString());
      // También enviar como alias para compatibilidad
      formData.append('solicitudId', inscripcionId.toString());
      formData.append('idSolicitud', inscripcionId.toString());
    }

    // Opcional: Ser explícito sobre el tipo de solicitud
    if (tipoSolicitud) {
      formData.append('tipoSolicitud', tipoSolicitud);
    }

    // El JWT interceptor agrega automáticamente el token Authorization
    // No es necesario establecer headers manualmente aquí
    return this.http.post<Archivo>(ApiEndpoints.ARCHIVOS.SUBIR_PDF, formData);
  }

  /**
   * Descargar archivo PDF por nombre de archivo
   */
  descargarPDF(nombreArchivo: string): Observable<Blob> {
    const url = ApiEndpoints.ARCHIVOS.DESCARGAR_PDF(nombreArchivo);
    return this.http.get(url, {
      responseType: 'blob'
    });
  }

  /**
   * Descargar archivo PDF por ID de inscripción
   */
  descargarPDFPorInscripcion(inscripcionId: number): Observable<Blob> {
    const url = ApiEndpoints.ARCHIVOS.DESCARGAR_PDF_POR_INSCRIPCION(inscripcionId);
    return this.http.get(url, {
      responseType: 'blob'
    });
  }
}
