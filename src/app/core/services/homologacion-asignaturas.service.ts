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

@Injectable({
  providedIn: 'root'
})
export class HomologacionAsignaturasService {
  private apiUrl = 'http://localhost:5000/api/solicitudes-homologacion';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  crearSolicitud(solicitud: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/crearSolicitud-Homologacion`,
      solicitud,
      { headers: this.getAuthHeaders() }
    );
  }

  listarSolicitudes(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/listarSolicitud-Homologacion`,
      { headers: this.getAuthHeaders() }
    );
  }
}
