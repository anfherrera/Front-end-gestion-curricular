import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CursosIntersemestralesService } from './cursos-intersemestrales.service';

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
      color: '#6c757d',
      icon: 'draft',
      descripcion: 'Curso en edición, no visible para estudiantes'
    },
    {
      value: 'Abierto',
      label: 'Abierto',
      color: '#ffc107',
      icon: 'lock_open',
      descripcion: 'Curso configurado, listo para publicar'
    },
    {
      value: 'Publicado',
      label: 'Publicado',
      color: '#17a2b8',
      icon: 'public',
      descripcion: 'Curso visible para estudiantes, pueden solicitar curso nuevo'
    },
    {
      value: 'Preinscripción',
      label: 'Preinscripción',
      color: '#28a745',
      icon: 'playlist_add',
      descripcion: 'Período de preinscripciones abierto'
    },
    {
      value: 'Inscripción',
      label: 'Inscripción',
      color: '#fd7e14',
      icon: 'how_to_reg',
      descripcion: 'Período de inscripciones abierto'
    },
    {
      value: 'Cerrado',
      label: 'Cerrado',
      color: '#dc3545',
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
   * Consulta permisos del backend (fallback si hay diferencia)
   */
  getPermisosDelBackend(estado: string, rol: string): Observable<string[]> {
    return this.cursosService.getPermisosEstado(estado, rol);
  }

  /**
   * Valida si un botón debe estar habilitado según el estado y rol
   */
  validarBotonHabilitado(estado: string, rol: string, operacion: string): boolean {
    return this.tienePermiso(estado, rol, operacion);
  }

  /**
   * Obtiene estados filtrados para un rol específico
   */
  getEstadosParaRol(rol: string): EstadoCurso[] {
    if (rol === 'ESTUDIANTE') {
      // Estudiantes solo ven estados donde pueden realizar acciones
      return this.estadosDisponibles.filter(estado => 
        this.tienePermiso(estado.value, rol, 'ver') && 
        (this.tienePermiso(estado.value, rol, 'preinscribirse') || 
         this.tienePermiso(estado.value, rol, 'inscribirse') ||
         this.tienePermiso(estado.value, rol, 'solicitar_curso_nuevo'))
      );
    }
    
    // Funcionarios y coordinadores ven todos los estados
    return this.estadosDisponibles;
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
   * Valida si un curso puede ser editado completamente
   */
  puedeEditarCompleto(estado: string, rol: string): boolean {
    return this.tienePermiso(estado, rol, 'editar_completo');
  }

  /**
   * Valida si un curso puede ser editado parcialmente
   */
  puedeEditarParcial(estado: string, rol: string): boolean {
    return this.tienePermiso(estado, rol, 'editar_parcial');
  }

  /**
   * Valida si se puede cambiar el estado de un curso
   */
  puedeCambiarEstado(estado: string, rol: string): boolean {
    return this.tienePermiso(estado, rol, 'cambiar_estado');
  }

  /**
   * Valida si un curso puede ser eliminado
   */
  puedeEliminar(estado: string, rol: string): boolean {
    return this.tienePermiso(estado, rol, 'eliminar');
  }

  /**
   * Obtiene la descripción de un estado
   */
  getDescripcionEstado(estado: string): string {
    const estadoInfo = this.getEstadoPorValor(estado);
    return estadoInfo?.descripcion || 'Estado no definido';
  }
}
