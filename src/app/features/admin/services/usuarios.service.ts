import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioDTOPeticion, UsuarioDTORespuesta } from '@core/models/usuario.interface';
import { ApiEndpoints } from '@core/utils/api-endpoints';

/** Rutas de /usuarios según la convención del backend (EST-7). El login sigue en /usuarios/login. */
@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private http = inject(HttpClient);

  private apiUrl = `${ApiEndpoints.BASE_URL}/usuarios`;

  listarUsuarios(): Observable<UsuarioDTORespuesta[]> {
    return this.http.get<UsuarioDTORespuesta[]>(this.apiUrl);
  }

  buscarUsuarioPorId(id: number): Observable<UsuarioDTORespuesta> {
    return this.http.get<UsuarioDTORespuesta>(`${this.apiUrl}/${id}`);
  }

  crearUsuario(usuario: UsuarioDTOPeticion): Observable<UsuarioDTORespuesta> {
    return this.http.post<UsuarioDTORespuesta>(this.apiUrl, usuario);
  }

  /** El backend toma el id de la ruta, y con él decide si se puede modificar. */
  actualizarUsuario(usuario: UsuarioDTOPeticion): Observable<UsuarioDTORespuesta> {
    return this.http.put<UsuarioDTORespuesta>(`${this.apiUrl}/${usuario.id_usuario}`, usuario);
  }

  eliminarUsuario(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cambia el estado de un usuario (activo/inactivo)
   * @param id ID del usuario
   * @returns Observable con el usuario actualizado
   */
  cambiarEstadoUsuario(id: number): Observable<UsuarioDTORespuesta> {
    return this.http.put<UsuarioDTORespuesta>(`${this.apiUrl}/${id}/estado`, {});
  }
}
