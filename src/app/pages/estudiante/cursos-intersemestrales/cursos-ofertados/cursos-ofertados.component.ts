import { Component, DestroyRef, OnInit, inject } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { CursoListComponent, Curso } from '../components/curso-list/curso-list.component';
import { PeriodoFiltroSelectorComponent } from '@shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { CursoOfertadoVerano } from '@core/models/cursos-intersemestrales.model';
import { MATERIAL_IMPORTS } from '@shared/components/material.imports';
import { estadoCurso, nombreDocente, periodoCurso } from '@core/utils/cursos-verano.utils';

/** Cursos ofertados (solo consulta). Si el período actual no tiene cursos, muestra los de todos los períodos. */
@Component({
  selector: 'app-cursos-ofertados',
  imports: [CardContainerComponent, CursoListComponent, PeriodoFiltroSelectorComponent, ...MATERIAL_IMPORTS],
  templateUrl: './cursos-ofertados.component.html',
  styleUrls: ['./cursos-ofertados.component.css']
})
export class CursosOfertadosComponent implements OnInit {
  private cursosService = inject(CursosIntersemestralesService);

  cursos: Curso[] = [];
  cargando = true;
  periodoSeleccionado = '';
  mostrarTodosLosCursos = false;

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadCursos();
  }

  loadCursos(): void {
    this.cargando = true;
    const todos = this.periodoSeleccionado === 'todos' || this.mostrarTodosLosCursos;
    const periodo = !todos && this.periodoSeleccionado.trim() ? this.periodoSeleccionado : undefined;

    // El servicio devuelve [] si falla
    this.cursosService.getCursosDisponibles(periodo, undefined, todos)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cursos => {
        if (cursos.length === 0 && !this.periodoSeleccionado && !todos) {
          this.mostrarTodosLosCursos = true;
          this.loadCursos();
          return;
        }
        this.cursos = cursos.map(aFila);
        this.cargando = false;
      });
  }

  onPeriodoChange(periodo: string): void {
    this.periodoSeleccionado = periodo;
    this.mostrarTodosLosCursos = periodo === 'todos';
    this.loadCursos();
  }
}

function aFila(curso: CursoOfertadoVerano): Curso {
  return {
    codigo: curso.codigo_curso || curso.id_curso.toString(),
    nombre: curso.nombre_curso,
    docente: nombreDocente(curso),
    cupos: curso.cupo_estimado || curso.cupo_disponible,
    creditos: curso.objMateria.creditos,
    espacio: curso.espacio_asignado || 'Por asignar',
    estado: estadoCurso(curso) as Curso['estado'],
    periodo: periodoCurso(curso),
    periodoAcademico: periodoCurso(curso),
    fecha_inicio: curso.fecha_inicio,
    fecha_fin: curso.fecha_fin
  };
}
