import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiEndpoints } from '../utils/api-endpoints';
import { Curso as CursoList } from '../../shared/components/curso-list/curso-list.component';

// ================== MODELOS ==================
export interface Solicitud {
  id: number;
  fecha: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export interface Inscripcion {
  id: number;
  cursoId: number;
  estudianteId: number;
  fecha: string;
  estado: 'inscrito' | 'cancelado';
}

export interface CursoBackend {
  id: number;
  nombre: string;
  cupos: number;
  docente: string;
  tipo: 'ofertado' | 'preinscripcion' | 'inscrito';
}

// ================== DTOs ==================
export interface CreateSolicitudDTO {
  fecha: string;
  estado: 'pendiente';
}

export interface UpdateSolicitudDTO {
  fecha?: string;
  estado?: 'pendiente' | 'aprobada' | 'rechazada';
}

export interface CreateInscripcionDTO {
  cursoId: number;
  estudianteId: number;
  fecha: string;
  estado: 'inscrito' | 'cancelado';
}

// ================== SERVICIO ==================
@Injectable({ providedIn: 'root' })
export class CursosIntersemestralesService {
  constructor(private http: HttpClient) {}

  // ====== SOLICITUDES ======
  getSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE);
  }

  getSolicitudEstudiante(estudianteId: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(
      `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/estudiante/${estudianteId}`
    );
  }

  crearSolicitud(payload: CreateSolicitudDTO): Observable<Solicitud> {
    return this.http.post<Solicitud>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE, payload);
  }

  actualizarSolicitud(id: number, payload: UpdateSolicitudDTO): Observable<Solicitud> {
    return this.http.put<Solicitud>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BY_ID(id.toString()), payload);
  }

  eliminarSolicitud(id: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BY_ID(id.toString()));
  }

  aprobarSolicitud(id: number): Observable<Solicitud> {
    return this.http.put<Solicitud>(ApiEndpoints.CURSOS_INTERSEMESTRALES.APROBAR(id.toString()), {});
  }

  rechazarSolicitud(id: number, motivo?: string): Observable<Solicitud> {
    return this.http.put<Solicitud>(
      ApiEndpoints.CURSOS_INTERSEMESTRALES.RECHAZAR(id.toString()),
      { motivo }
    );
  }

  // ====== INSCRIPCIONES ======
  getInscripciones(): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones`);
  }

  crearInscripcion(payload: CreateInscripcionDTO): Observable<Inscripcion> {
    return this.http.post<Inscripcion>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones`, payload);
  }

  cancelarInscripcion(id: number): Observable<void> {
    return this.http.delete<void>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones/${id}`);
  }

  // ====== CURSOS (adaptados a CursoListComponent) ======
  private mapCurso(c: CursoBackend): CursoList {
    let estado: 'Disponible' | 'Cerrado' | 'En espera' = 'En espera';
    switch (c.tipo) {
      case 'ofertado':
      case 'preinscripcion':
        estado = 'Disponible';
        break;
      case 'inscrito':
        estado = 'En espera'; // se puede mostrar "En espera" para cursos ya inscritos
        break;
    }
    return {
      codigo: c.id.toString(),
      nombre: c.nombre,
      docente: c.docente,
      cupos: c.cupos,
      estado
    };
  }

  getCursosOfertados(): Observable<CursoList[]> {
    return this.http
      .get<CursoBackend[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/ofertados`)
      .pipe(map(cursos => cursos.map(this.mapCurso)));
  }

  getCursosPreinscripcion(): Observable<CursoList[]> {
    return this.http
      .get<CursoBackend[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/preinscripcion`)
      .pipe(map(cursos => cursos.map(this.mapCurso)));
  }

  getCursosInscritos(): Observable<CursoList[]> {
    return this.http
      .get<CursoBackend[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/inscritos`)
      .pipe(map(cursos => cursos.map(this.mapCurso)));
  }

  // ====== DOCUMENTOS ======
  getDocumentos(solicitudId: number): Observable<any[]> {
    return this.http.get<any[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.DOCUMENTOS(solicitudId.toString()));
  }

  uploadDocumento(solicitudId: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<any>(
      ApiEndpoints.CURSOS_INTERSEMESTRALES.UPLOAD_DOCUMENT(solicitudId.toString()),
      formData
    );
  }
}
