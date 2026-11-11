import { Injectable } from '@angular/core';
import { CursosIntersemestralesService } from './cursos-intersemestrales.service';
import { COLORS } from '../design-system/design-tokens';

export interface EstadoCurso {
  value: string;
  label: string;
  color: string;
  icon: string;
  descripcion: string;
}

export interface PermisosEstado {
  [estado: string]: {
    [rol: string]: string[];
  };
}

export interface TransicionEstado {
  desde: string;
  hacia: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CursoEstadosService {

  // Estados disponibles con sus propiedades
  readonly estadosDisponibles: EstadoCurso[] = [
    {
      value: 'Borrador',
      label: 'Borrador',
      color: COLORS.neutralText,
      icon: 'edit',
      descripcion: 'Curso en edición, no visible para estudiantes'
    },
    {
      value: 'Abierto',
      label: 'Abierto',
      color: COLORS.primary,
      icon: 'lock_open',
      descripcion: 'Curso configurado, listo para publicar'
    },
    {
      value: 'Publicado',
      label: 'Publicado',
      color: COLORS.tertiary,
      icon: 'visibility',
      descripcion: 'Curso visible para estudiantes, pueden solicitar curso nuevo'
    },
    {
      value: 'Preinscripción',
      label: 'Preinscripción',
      color: COLORS.success,
      icon: 'assignment',
      descripcion: 'Período de preinscripciones abierto'
    },
    {
      value: 'Inscripción',
      label: 'Inscripción',
      color: COLORS.primary,
      icon: 'person_add',
      descripcion: 'Período de inscripciones abierto'
    },
    {
      value: 'Cerrado',
      label: 'Cerrado',
      color: COLORS.error,
      icon: 'lock',
      descripcion: 'Curso finalizado, solo consulta'
    }
  ];

  // Transiciones válidas de estado
  readonly transicionesValidas: TransicionEstado[] = [
    { desde: 'Sin_Estado', hacia: ['Borrador'] },
    { desde: 'Borrador', hacia: ['Abierto'] },
    { desde: 'Abierto', hacia: ['Publicado', 'Borrador'] },
    { desde: 'Publicado', hacia: ['Preinscripción', 'Abierto'] },
    { desde: 'Preinscripción', hacia: ['Inscripción', 'Cerrado', 'Publicado'] },
    { desde: 'Inscripción', hacia: ['Cerrado', 'Preinscripción'] },
    { desde: 'Cerrado', hacia: [] }
  ];

  // Matriz de permisos por estado y rol
  readonly permisosPorEstado: PermisosEstado = {
    'Borrador': {
      'FUNCIONARIO': ['ver', 'editar_completo', 'eliminar', 'cambiar_estado'],
      'COORDINADOR': ['ver', 'editar_completo', 'eliminar', 'cambiar_estado'],
      'ESTUDIANTE': []
    },
    'Abierto': {
      'FUNCIONARIO': ['ver', 'editar_parcial', 'cambiar_estado'],
      'COORDINADOR': ['ver', 'editar_parcial', 'cambiar_estado'],
      'ESTUDIANTE': []
    },
    'Publicado': {
      'FUNCIONARIO': ['ver', 'gestionar_solicitudes', 'cambiar_estado'],
      'COORDINADOR': ['ver', 'gestionar_solicitudes', 'cambiar_estado'],
      'ESTUDIANTE': ['ver', 'solicitar_curso_nuevo']
    },
    'Preinscripción': {
      'FUNCIONARIO': ['ver', 'gestionar_preinscripciones', 'cambiar_estado'],
      'COORDINADOR': ['ver', 'gestionar_preinscripciones', 'cambiar_estado'],
      'ESTUDIANTE': ['ver', 'preinscribirse']
    },
    'Inscripción': {
      'FUNCIONARIO': ['ver', 'gestionar_inscripciones', 'cambiar_estado'],
      'COORDINADOR': ['ver', 'gestionar_inscripciones', 'cambiar_estado'],
      'ESTUDIANTE': ['ver', 'inscribirse']
    },
    'Cerrado': {
      'FUNCIONARIO': ['ver', 'consultar'],
      'COORDINADOR': ['ver', 'consultar'],
      'ESTUDIANTE': ['ver', 'consultar']
    }
  };

  constructor(private cursosService: CursosIntersemestralesService) {}

  /**
   * Obtiene todos los estados disponibles
   */
  getEstadosDisponibles(): EstadoCurso[] {
    return this.estadosDisponibles;
  }

  /**
   * Obtiene un estado específico por su valor
   */
  getEstadoPorValor(valor: string): EstadoCurso | undefined {
    return this.estadosDisponibles.find(estado => estado.value === valor);
  }

  /**
   * Obtiene el color de un estado
   */
  getColorEstado(estado: string): string {
    const estadoInfo = this.getEstadoPorValor(estado);
    return estadoInfo?.color || '#6c757d';
  }

  /**
   * Obtiene el ícono de un estado
   */
  getIconoEstado(estado: string): string {
    const estadoInfo = this.getEstadoPorValor(estado);
    return estadoInfo?.icon || 'help_outline';
  }

  /**
   * Valida si una transición de estado es válida
   */
  validarTransicionEstado(estadoActual: string, nuevoEstado: string): boolean {
    const transicion = this.transicionesValidas.find(t => t.desde === estadoActual);
    return transicion ? transicion.hacia.includes(nuevoEstado) : false;
  }

  /**
   * Obtiene los estados a los que se puede transicionar desde el estado actual
   */
  getEstadosPermitidos(estadoActual: string): string[] {
    const transicion = this.transicionesValidas.find(t => t.desde === estadoActual);
    return transicion ? transicion.hacia : [];
  }

  /**
   * Verifica si un rol tiene un permiso específico en un estado
   */
  tienePermiso(estado: string, rol: string, operacion: string): boolean {
    const permisos = this.permisosPorEstado[estado]?.[rol] || [];
    return permisos.includes(operacion);
  }

  /**
   * Obtiene todos los permisos de un rol en un estado específico
   */
  getPermisos(estado: string, rol: string): string[] {
    return this.permisosPorEstado[estado]?.[rol] || [];
  }

  /**
   * Genera mensaje de error para transición inválida
   */
  getMensajeErrorTransicion(estadoActual: string, nuevoEstado: string): string {
    const estadosPermitidos = this.getEstadosPermitidos(estadoActual);
    
    if (estadosPermitidos.length === 0) {
      return `El curso está en estado "${estadoActual}" y no se puede cambiar su estado`;
    }
    
    return `Desde "${estadoActual}" solo se puede cambiar a: ${estadosPermitidos.join(', ')}`;
  }

  /**
   * Genera mensaje de error para operación no permitida
   */
  getMensajeErrorPermiso(estado: string, rol: string, operacion: string): string {
    const permisos = this.getPermisos(estado, rol);
    
    if (permisos.length === 0) {
      return `El rol ${rol} no tiene permisos para realizar operaciones en el estado: ${estado}`;
    }
    
    return `El rol ${rol} no puede realizar la operación "${operacion}" en el estado ${estado}`;
  }

  /**
   * Valida si un curso puede ser eliminado
   */
  puedeEliminar(estado: string, rol: string): boolean {
    return this.tienePermiso(estado, rol, 'eliminar');
  }

}
