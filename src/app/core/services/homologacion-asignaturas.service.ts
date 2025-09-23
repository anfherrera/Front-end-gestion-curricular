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

  listarSolicitudesPorRol(rol: string, idUsuario?: number): Observable<SolicitudHomologacionDTORespuesta[]> {
    let params: any = { rol: rol };
    if (idUsuario) {
      params.idUsuario = idUsuario;
    }

    const url = `${this.apiUrl}/listarSolicitud-Homologacion/porRol`;
    console.log('🌐 URL del endpoint:', url);
    console.log('📤 Parámetros enviados:', params);
    console.log('🔑 Headers:', this.getAuthHeaders());

    return this.http.get<SolicitudHomologacionDTORespuesta[]>(url, {
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
   * Obtener solicitudes para coordinador
   */
  getCoordinadorRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-Homologacion/Coordinador`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Obtener solicitudes para secretaría (solo las aprobadas por coordinador)
   */
  getSecretariaRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-Homologacion/Secretaria`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Aprobar solicitud de homologación como funcionario
   */
  approveRequest(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'APROBADA_FUNCIONARIO'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Rechazar solicitud de homologación
   */
  rejectRequest(requestId: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'RECHAZADA',
      comentario: reason
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Completar validación de solicitud
   */
  completeValidation(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'EN_REVISION_COORDINADOR'
    }, { headers: this.getAuthHeaders() });
  }

  // ================================
  // Métodos para Coordinador
  // ================================

  /**
   * Aprobar solicitud como coordinador
   */
  approveAsCoordinador(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'APROBADA_COORDINADOR'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Aprobar definitivamente la solicitud
   */
  approveDefinitively(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'APROBADA'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Rechazar solicitud como coordinador
   */
  rejectAsCoordinador(requestId: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'RECHAZADA',
      comentario: reason
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

  /**
   * Añadir comentario a un documento
   */
  agregarComentario(idDocumento: number, comentario: string): Observable<any> {
    const url = `http://localhost:5000/api/documentos/añadirComentario`;
    const body = {
      idDocumento: idDocumento,
      comentario: comentario
    };
    
    console.log('💬 Añadiendo comentario:', body);
    
    return this.http.put(url, body, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Obtener comentarios de un documento
   */
  obtenerComentariosDocumento(idDocumento: number): Observable<any> {
    const url = `http://localhost:5000/api/documentos/${idDocumento}/comentarios`;
    
    return this.http.get(url, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Obtener solicitud completa con documentos y comentarios
   */
  obtenerSolicitudCompleta(idSolicitud: number): Observable<SolicitudHomologacionDTORespuesta> {
    const url = `${this.apiUrl}/obtenerSolicitud/${idSolicitud}`;
    
    return this.http.get<SolicitudHomologacionDTORespuesta>(url, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Actualizar estado de documentos de una solicitud
   */
  actualizarEstadoDocumentos(idSolicitud: number, documentos: any[]): Observable<any> {
    const url = `${this.apiUrl}/actualizarEstadoDocumentos`;
    
    return this.http.put(url, {
      idSolicitud: idSolicitud,
      documentos: documentos
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Generar oficio/resolución para una solicitud
   */
  generarOficio(idSolicitud: number, contenido: string): Observable<any> {
    const url = `${this.apiUrl}/generarOficio`;
    
    return this.http.post(url, {
      idSolicitud: idSolicitud,
      contenido: contenido,
      tipo: 'OFICIO_HOMOLOGACION'
    }, { headers: this.getAuthHeaders() });
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
