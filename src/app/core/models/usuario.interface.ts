export interface UsuarioDTOPeticion {
  id_usuario?: number;        // Opcional al crear, requerido al actualizar
  codigo: string;             // Código único (ej: EST001, DOC001)
  cedula: string;             // Obligatorio, 5-20 caracteres, solo números
  nombre_completo: string;    
  correo: string;             // Email institucional
  password?: string;          // Opcional en actualización
  estado_usuario: number;     // 1 = Activo, 0 = Inactivo
  objRol: {
    id_rol: number;           // ID del rol
  };
  objPrograma: {
    id_programa: number;      // ID del programa
  };
}

export interface UsuarioDTORespuesta {
  id_usuario: number;
  codigo: string;
  cedula: string; // Obligatorio
  nombre_completo: string;
  correo: string;
  estado_usuario: number;
  objRol: {
    id_rol: number;
    nombre: string;
  };
  objPrograma: {
    id_programa: number;
    nombre_programa: string;
  };
}

