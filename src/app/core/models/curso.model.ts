// src/app/shared/components/curso-list/curso-list.component.ts
export interface Curso {
  codigo: string;       // id del curso como string
  nombre: string;       // objMateria.nombre
  docente: string;      // objDocente.nombre
  cupos: number;        // cupo_estimado
  estado: 'Disponible' | 'Cerrado' | 'En espera'; // calculado según estado del curso
}
