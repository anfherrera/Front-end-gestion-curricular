/** Usuario guardado al iniciar sesión (respuesta de /usuarios/login); solo los campos que usa el front. */
export interface UsuarioSesion {
  id_usuario: number;
  nombre_completo: string;
  codigo?: string;
  correo?: string;
  rol?: { id_rol?: number; nombre: string };
  objPrograma?: { id_programa: number; nombre_programa: string };
}
