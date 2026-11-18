import { RolDTORespuesta } from './rol.interface';
import { ProgramaDTORespuesta } from './programa.interface';

/** Cuerpo de `crearUsuario` y `actualizarUsuario` (igual que `UsuarioDTOPeticion` del backend). */
export interface UsuarioDTOPeticion {
  id_usuario?: number;        // Solo al actualizar
  codigo: string;
  cedula: string;             // 5-20 dígitos
  nombre_completo: string;
  correo: string;             // Correo @unicauca.edu.co
  password?: string;          // Opcional al actualizar
  estado_usuario: boolean;
  id_rol: number;
  id_programa: number;
}

/** Respuesta de los endpoints de `/usuarios` (igual que `UsuarioDTORespuesta` del backend). */
export interface UsuarioDTORespuesta {
  id_usuario: number;
  codigo: string;
  cedula: string;
  nombre_completo: string;
  correo: string;
  estado_usuario: boolean;
  rol: RolDTORespuesta | null;
  objPrograma: ProgramaDTORespuesta | null;
}
