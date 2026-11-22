import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RolDTOPeticion, RolDTORespuesta } from '../models/rol.interface';
import { environment } from '@env/environment';

/** Rutas de /roles según la convención del backend (EST-7): el verbo HTTP indica la acción. */
@Injectable({
  providedIn: 'root',
})
export class RolesAdminService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/roles`;

  listarRoles(): Observable<RolDTORespuesta[]> {
    return this.http.get<RolDTORespuesta[]>(this.apiUrl);
  }

  buscarRolPorId(id: number): Observable<RolDTORespuesta> {
    return this.http.get<RolDTORespuesta>(`${this.apiUrl}/${id}`);
  }

  buscarPorNombre(nombre: string): Observable<RolDTORespuesta> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<RolDTORespuesta>(this.apiUrl, { params });
  }

  crearRol(rol: RolDTOPeticion): Observable<RolDTORespuesta> {
    return this.http.post<RolDTORespuesta>(this.apiUrl, rol);
  }

  /** El backend toma el id de la ruta. */
  actualizarRol(rol: RolDTOPeticion): Observable<RolDTORespuesta> {
    return this.http.put<RolDTORespuesta>(`${this.apiUrl}/${rol.id_rol}`, rol);
  }

  eliminarRol(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }
}
