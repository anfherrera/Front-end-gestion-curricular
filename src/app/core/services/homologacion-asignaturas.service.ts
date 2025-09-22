// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class HomologacionAsignaturasService {

//   private apiUrl = 'http://localhost:5000/api/solicitudes-homologacion';

//   constructor(private http: HttpClient) {}

//   // 🔹 Crear solicitud dinámicamente pasando el usuario
//   crearSolicitudHomologacion(usuario: any): Observable<any> {
//     const solicitud = {
//       nombre_solicitud: 'Solicitud Homologacion',
//       fecha_registro_solicitud: new Date().toISOString(),
//       esSeleccionado: true,
//       estado_actual: {
//         id_estado: 1,
//         estado_actual: 'Pendiente',
//         fecha_registro_estado: new Date().toISOString()
//       },
//       objUsuario: usuario,   // 👈 Se pasa dinámicamente el usuario
//       documentos: []
//     };

//     return this.http.post(`${this.apiUrl}/crearSolicitud-Homologacion`, solicitud);
//   }

//   // 🔹 Listar solicitudes de homologación
//   listarSolicitudesHomologacion(): Observable<any[]> {
//     return this.http.get<any[]>(`${this.apiUrl}/listarSolicitud-Homologacion`);
//   }
// }

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Solicitud, SolicitudHomologacionDTORespuesta } from '../models/procesos.model';

@Injectable({
  providedIn: 'root'
})
export class HomologacionAsignaturasService {
  private apiUrl = 'http://localhost:5000/api/solicitudes-homologacion';

  constructor(private http: HttpClient) {}

  // private getAuthHeaders(): HttpHeaders {
  //   const token = localStorage.getItem('token');
  //   return new HttpHeaders({
  //     Authorization: token ? `Bearer ${token}` : ''
  //   });
  // }
  private getAuthHeaders(isFile: boolean = false): HttpHeaders {
    const token = localStorage.getItem('token');
    console.log('🔑 Token encontrado:', token ? 'Sí' : 'No');
    console.log('🔑 Token completo:', token);

    const headers = new HttpHeaders({
      ...(isFile ? {} : { 'Content-Type': 'application/json' }),
      Authorization: token ? `Bearer ${token}` : ''
    });

    console.log('🔑 Headers creados:', headers);
    return headers;
  }

  crearSolicitud(solicitud: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/crearSolicitud-Homologacion`,
      solicitud,
      { headers: this.getAuthHeaders() }
    );
  }

  listarSolicitudes(idUsuario: number): Observable<any> {
    return this.http.get(
      //`${this.apiUrl}/listarPorRol/${idUsuario}`,
      `${this.apiUrl}/listarSolicitud-Homologacion`,
      { headers: this.getAuthHeaders() }
    );
  }

  listarSolicitudesPorRol(rol: string, idUsuario?: number): Observable<Solicitud[]> {
    let params: any = { rol: rol };
    if (idUsuario) {
      params.idUsuario = idUsuario;
    }

    const url = `${this.apiUrl}/listarSolicitud-Homologacion/porRol`;
    console.log('🌐 URL del endpoint:', url);
    console.log('📤 Parámetros enviados:', params);
    console.log('🔑 Headers:', this.getAuthHeaders());

    return this.http.get<Solicitud[]>(url, {
      params: params,
      headers: this.getAuthHeaders()
    });
  }

  // ================================
  // Métodos para Funcionario
  // ================================
  
  /**
   * Obtener solicitudes pendientes para funcionario (con último estado "Enviada")
   */
  getPendingRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-Homologacion/Funcionario`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Aprobar solicitud de homologación
   */
  approveRequest(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'Aprobado'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Rechazar solicitud de homologación
   */
  rejectRequest(requestId: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'Rechazado'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Completar validación de solicitud
   */
  completeValidation(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'En Revisión'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Descargar archivo PDF por nombre
   */
  descargarArchivo(nombreArchivo: string): Observable<Blob> {
    // URL directa al backend (CORS configurado)
    const url = `http://localhost:5000/api/archivos/descargar/pdf?filename=${encodeURIComponent(nombreArchivo)}`;
    console.log('🔗 URL de descarga:', url);
    console.log('📁 Nombre del archivo:', nombreArchivo);
    
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }



//============
/**
  //  * Obtener una solicitud por ID
  //  */
  // obtenerSolicitudPorId(idSolicitud: number): Observable<any> {
  //   return this.http.get(
  //     `${this.apiUrl}/obtenerSolicitud/${idSolicitud}`,
  //     { headers: this.getAuthHeaders() }
  //   );
  // }

  // /**
  //  * Subir un archivo asociado a una solicitud
  //  */
  // subirArchivo(idSolicitud: number, archivo: File): Observable<any> {
  //   const formData = new FormData();
  //   formData.append('file', archivo);

  //   return this.http.post(
  //     `${this.apiUrl}/subirArchivo/${idSolicitud}`,
  //     formData,
  //     { headers: this.getAuthHeaders(true) }
  //   );
  // }

  // /**
  //  * Descargar archivo asociado a una solicitud
  //  */
  // descargarArchivo(idSolicitud: number): Observable<Blob> {
  //   return this.http.get(
  //     `${this.apiUrl}/descargarArchivo/${idSolicitud}`,
  //     { headers: this.getAuthHeaders(), responseType: 'blob' }
  //   );
  // }
//============

}
