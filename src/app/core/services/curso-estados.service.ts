import { Injectable } from '@angular/core';

export interface EstadoCurso {
  value: string;
  label: string;
  icon: string;
  descripcion: string;
}

const sinTildes = (texto: string | undefined): string => (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Fases de un curso intersemestral: texto, icono y etiqueta de cada una. */
@Injectable({
  providedIn: 'root',
})
export class CursoEstadosService {
  readonly estadosDisponibles: EstadoCurso[] = [
    {
      value: 'Borrador',
      label: 'Borrador',
      icon: 'edit',
      descripcion: 'Curso en edición, no visible para estudiantes',
    },
    {
      value: 'Abierto',
      label: 'Abierto',
      icon: 'lock_open',
      descripcion: 'Curso configurado, listo para publicar',
    },
    {
      value: 'Publicado',
      label: 'Publicado',
      icon: 'visibility',
      descripcion: 'Curso visible para estudiantes, pueden solicitar curso nuevo',
    },
    {
      value: 'Preinscripción',
      label: 'Preinscripción',
      icon: 'assignment',
      descripcion: 'Período de preinscripciones abierto',
    },
    {
      value: 'Inscripción',
      label: 'Inscripción',
      icon: 'person_add',
      descripcion: 'Período de inscripciones abierto',
    },
    {
      value: 'Cerrado',
      label: 'Cerrado',
      icon: 'lock',
      descripcion: 'Curso finalizado, solo consulta',
    },
  ];

  /**
   * Obtiene todos los estados disponibles
   */
  getEstadosDisponibles(): EstadoCurso[] {
    return this.estadosDisponibles;
  }

  /**
   * Obtiene un estado específico por su valor
   */
  getEstadoPorValor(valor: string | undefined): EstadoCurso | undefined {
    // El backend a veces manda los estados sin tilde ("Preinscripcion")
    const buscado = sinTildes(valor);
    return this.estadosDisponibles.find((estado) => sinTildes(estado.value) === buscado);
  }

  /**
   * Clase global de etiqueta (src/styles/componentes.css) para un estado de curso.
   * Son fases, no resultados: solo los periodos abiertos a estudiantes van en verde (activo)
   * y ninguno usa el color de error.
   */
  getClaseEstado(estado: string | undefined): string {
    switch (estado && this.getEstadoPorValor(estado)?.value) {
      case 'Abierto':
        return 'estado-proceso';
      case 'Publicado':
        return 'estado-enviada';
      case 'Preinscripción':
      case 'Inscripción':
        return 'estado-aprobada';
      default:
        return 'estado-default';
    }
  }

  /**
   * Obtiene el ícono de un estado
   */
  getIconoEstado(estado: string | undefined): string {
    const estadoInfo = this.getEstadoPorValor(estado);
    return estadoInfo?.icon || 'help_outline';
  }
}
