import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProgramaDTOPeticion, ProgramaDTORespuesta } from '../models/programa.interface';
import { environment } from '@env/environment';

/** Rutas de /programas según la convención del backend (EST-7): el verbo HTTP indica la acción. */
@Injectable({
  providedIn: 'root',
})
export class ProgramasService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/programas`;

  listarProgramas(): Observable<ProgramaDTORespuesta[]> {
    return this.http.get<ProgramaDTORespuesta[]>(this.apiUrl);
  }

  buscarProgramaPorId(id: number): Observable<ProgramaDTORespuesta> {
    return this.http.get<ProgramaDTORespuesta>(`${this.apiUrl}/${id}`);
  }

  buscarPorCodigo(codigo: string): Observable<ProgramaDTORespuesta> {
    const params = new HttpParams().set('codigo', codigo);
    return this.http.get<ProgramaDTORespuesta>(this.apiUrl, { params });
  }

  buscarPorNombre(nombre: string): Observable<ProgramaDTORespuesta[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<ProgramaDTORespuesta[]>(this.apiUrl, { params });
  }

  crearPrograma(programa: ProgramaDTOPeticion): Observable<ProgramaDTORespuesta> {
    return this.http.post<ProgramaDTORespuesta>(this.apiUrl, programa);
  }

  /** El backend toma el id de la ruta. */
  actualizarPrograma(programa: ProgramaDTOPeticion): Observable<ProgramaDTORespuesta> {
    return this.http.put<ProgramaDTORespuesta>(`${this.apiUrl}/${programa.id_programa}`, programa);
  }

  eliminarPrograma(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }
}
