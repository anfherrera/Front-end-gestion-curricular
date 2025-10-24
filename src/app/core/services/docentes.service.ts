import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocenteDTOPeticion, DocenteDTORespuesta } from '../models/docente.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocentesService {
  private apiUrl = `${environment.apiUrl}/docentes`;

  constructor(private http: HttpClient) {}

  listarDocentes(): Observable<DocenteDTORespuesta[]> {
    return this.http.get<DocenteDTORespuesta[]>(`${this.apiUrl}/listarDocentes`);
  }

  buscarDocentePorId(id: number): Observable<DocenteDTORespuesta> {
    return this.http.get<DocenteDTORespuesta>(`${this.apiUrl}/buscarDocentePorId/${id}`);
  }

  buscarPorCodigo(codigo: string): Observable<DocenteDTORespuesta> {
    const params = new HttpParams().set('codigo', codigo);
    return this.http.get<DocenteDTORespuesta>(`${this.apiUrl}/buscarPorCodigo`, { params });
  }

  buscarPorNombre(nombre: string): Observable<DocenteDTORespuesta[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<DocenteDTORespuesta[]>(`${this.apiUrl}/buscarPorNombre`, { params });
  }

  crearDocente(docente: DocenteDTOPeticion): Observable<DocenteDTORespuesta> {
    return this.http.post<DocenteDTORespuesta>(`${this.apiUrl}/crearDocente`, docente);
  }

  actualizarDocente(docente: DocenteDTOPeticion): Observable<DocenteDTORespuesta> {
    return this.http.put<DocenteDTORespuesta>(`${this.apiUrl}/actualizarDocente`, docente);
  }

  eliminarDocente(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/eliminarDocente/${id}`);
  }
}

