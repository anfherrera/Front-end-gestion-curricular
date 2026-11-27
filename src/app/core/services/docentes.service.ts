import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocenteDTOPeticion, DocenteDTORespuesta } from '../models/docente.interface';
import { environment } from '@env/environment';

/** Rutas de /docentes según la convención del backend (EST-7): el verbo HTTP indica la acción. */
@Injectable({
  providedIn: 'root',
})
export class DocentesService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/docentes`;

  listarDocentes(): Observable<DocenteDTORespuesta[]> {
    return this.http.get<DocenteDTORespuesta[]>(this.apiUrl);
  }

  buscarDocentePorId(id: number): Observable<DocenteDTORespuesta> {
    return this.http.get<DocenteDTORespuesta>(`${this.apiUrl}/${id}`);
  }

  buscarPorCodigo(codigo: string): Observable<DocenteDTORespuesta> {
    const params = new HttpParams().set('codigo', codigo);
    return this.http.get<DocenteDTORespuesta>(this.apiUrl, { params });
  }

  buscarPorNombre(nombre: string): Observable<DocenteDTORespuesta[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<DocenteDTORespuesta[]>(this.apiUrl, { params });
  }

  crearDocente(docente: DocenteDTOPeticion): Observable<DocenteDTORespuesta> {
    return this.http.post<DocenteDTORespuesta>(this.apiUrl, docente);
  }

  /** El backend toma el id de la ruta. */
  actualizarDocente(docente: DocenteDTOPeticion): Observable<DocenteDTORespuesta> {
    return this.http.put<DocenteDTORespuesta>(`${this.apiUrl}/${docente.id_docente}`, docente);
  }

  eliminarDocente(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }
}
