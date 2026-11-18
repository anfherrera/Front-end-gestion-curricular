import { UsuarioSesion } from '../models/usuario-sesion.model';
import { UsuarioDTOPeticion } from '../models/usuario.interface';

/**
 * `objUsuario` de las solicitudes del estudiante, armado con el usuario de la sesión.
 * El backend toma al solicitante del token; estos datos solo tienen que pasar su validación.
 */
export function usuarioParaSolicitud(usuario: UsuarioSesion): UsuarioDTOPeticion {
  return {
    id_usuario: usuario.id_usuario,
    nombre_completo: usuario.nombre_completo,
    codigo: usuario.codigo ?? '',
    cedula: usuario.cedula || usuario.codigo || '',
    correo: usuario.correo ?? '',
    estado_usuario: usuario.estado_usuario ?? true,
    id_rol: usuario.rol?.id_rol ?? 1,
    id_programa: usuario.objPrograma?.id_programa ?? 1
  };
}
