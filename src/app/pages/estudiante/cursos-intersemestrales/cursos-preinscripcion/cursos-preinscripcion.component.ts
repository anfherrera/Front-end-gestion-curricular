import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { CursosIntersemestralesService, CreatePreinscripcionDTO, CursoOfertadoVerano } from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-cursos-preinscripcion',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, CursoListComponent, ...MATERIAL_IMPORTS],
  templateUrl: './cursos-preinscripcion.component.html',
  styleUrls: ['./cursos-preinscripcion.component.css']
})
export class CursosPreinscripcionComponent implements OnInit {
  cursos: Curso[] = [];
  cursosVerano: CursoOfertadoVerano[] = [];
  cargando = true;
  usuario: any = null;

  constructor(
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.loadCursos();
  }

  loadCursos() {
    this.cargando = true;
    
    // Cargar cursos de verano disponibles para preinscripción
    this.cursosService.getCursosDisponibles().subscribe({
      next: (cursosVerano) => {
        // Filtrar solo cursos en estado de preinscripción
        this.cursosVerano = cursosVerano.filter(c => c.estado === 'Preinscripcion');
        this.cursos = this.mapCursosToLegacy(this.cursosVerano);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando cursos de preinscripción', err);
        // Fallback a cursos legacy
        this.loadCursosLegacy();
      }
    });
  }

  private loadCursosLegacy() {
    this.cursosService.getCursosPreinscripcion().subscribe({
      next: (data) => {
        this.cursos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando cursos de preinscripción', err);
        this.cargando = false;
      }
    });
  }

  private mapCursosToLegacy(cursosVerano: CursoOfertadoVerano[]): Curso[] {
    return cursosVerano.map(curso => ({
      codigo: curso.id_curso.toString(),
      nombre: curso.nombre_curso,
      docente: `${curso.objDocente.nombre} ${curso.objDocente.apellido}`,
      cupos: curso.cupo_disponible,
      estado: 'Disponible' as const
    }));
  }

  onAccionCurso(event: { accion: string; curso: Curso }) {
    if (!this.usuario?.id_usuario) {
      this.snackBar.open('Error: Usuario no autenticado', 'Cerrar', { duration: 3000 });
      return;
    }

    const cursoVerano = this.cursosVerano.find(c => c.id_curso.toString() === event.curso.codigo);
    if (!cursoVerano) {
      this.snackBar.open('Error: Curso no encontrado', 'Cerrar', { duration: 3000 });
      return;
    }

    if (event.accion === 'preinscribir') {
      this.realizarPreinscripcion(cursoVerano);
    }
  }

  private realizarPreinscripcion(curso: CursoOfertadoVerano) {
    const payload: CreatePreinscripcionDTO = {
      idUsuario: this.usuario.id_usuario,
      idCurso: curso.id_curso,
      nombreSolicitud: `Preinscripción - ${curso.nombre_curso}`
    };

    this.cursosService.crearPreinscripcion(payload).subscribe({
      next: (solicitud) => {
        this.snackBar.open(
          `Preinscripción exitosa en ${curso.nombre_curso}`, 
          'Cerrar', 
          { duration: 5000 }
        );
        this.loadCursos(); // Recargar para actualizar cupos
      },
      error: (error) => {
        console.error('Error en preinscripción:', error);
        this.snackBar.open(
          'Error al realizar la preinscripción. Inténtalo nuevamente.', 
          'Cerrar', 
          { duration: 5000 }
        );
      }
    });
  }
}
