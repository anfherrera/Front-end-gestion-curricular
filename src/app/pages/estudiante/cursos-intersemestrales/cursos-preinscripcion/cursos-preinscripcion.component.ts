import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { CursoListComponent, Curso } from '../components/curso-list/curso-list.component';
import { PreinscripcionDialogComponent } from '../components/preinscripcion-dialog/preinscripcion-dialog.component';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { CursoOfertadoVerano } from '@core/models/cursos-intersemestrales.model';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';
import { AuthService } from '@core/services/auth.service';
import { MATERIAL_IMPORTS } from '@shared/components/material.imports';
import { estadoCurso, nombreDocente } from '@core/utils/cursos-verano.utils';
import { SnackbarService } from '@core/services/snackbar.service';

/** Cursos en preinscripción: el estudiante elige uno y se preinscribe desde un diálogo. */
@Component({
  selector: 'app-cursos-preinscripcion',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, CursoListComponent, ...MATERIAL_IMPORTS],
  templateUrl: './cursos-preinscripcion.component.html',
  styleUrls: ['./cursos-preinscripcion.component.css']
})
export class CursosPreinscripcionComponent implements OnInit {
  cursos: Curso[] = [];
  /** Respuesta del backend, para abrir el diálogo con el curso completo. */
  cursosOriginales: CursoOfertadoVerano[] = [];
  cargando = true;
  usuario: UsuarioSesion | null = null;

  private destroyRef = inject(DestroyRef);

  constructor(
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService,
    private snackbar: SnackbarService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.loadCursos();
  }

  loadCursos(): void {
    this.cargando = true;
    this.cursosService.getCursosPorEstado('Preinscripción')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cursos) => {
          this.cursosOriginales = cursos;
          this.cursos = cursos.map(curso => ({
            codigo: curso.codigo_curso || curso.id_curso?.toString() || 'N/A',
            nombre: curso.nombre_curso || 'Sin nombre',
            docente: nombreDocente(curso),
            cupos: curso.cupo_disponible || curso.cupo_estimado || 0,
            creditos: curso.objMateria?.creditos || 0,
            espacio: curso.espacio_asignado || 'Por asignar',
            estado: estadoCurso(curso) as Curso['estado']
          }));
          this.cargando = false;
        },
        error: () => {
          this.cargando = false;
        }
      });
  }

  onAccionCurso(event: { accion: string; curso: Curso }): void {
    if (!this.usuario?.id_usuario) {
      this.snackbar.error('Error: Usuario no autenticado');
      return;
    }

    const cursoOriginal = this.cursosOriginales.find(c =>
      c.codigo_curso === event.curso.codigo || c.id_curso?.toString() === event.curso.codigo
    );
    if (!cursoOriginal) {
      this.snackbar.error('Error: Curso no encontrado');
      return;
    }

    if (event.accion === 'preinscribir') {
      this.abrirDialogoPreinscripcion(cursoOriginal);
    }
  }

  private abrirDialogoPreinscripcion(curso: CursoOfertadoVerano): void {
    this.dialog.open(PreinscripcionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { curso },
      disableClose: true
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result === true) {
          this.loadCursos();
        }
      });
  }
}
