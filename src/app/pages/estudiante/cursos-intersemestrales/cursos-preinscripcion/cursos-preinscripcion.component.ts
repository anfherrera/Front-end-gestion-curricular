import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { PreinscripcionDialogComponent } from '../../../../shared/components/preinscripcion-dialog/preinscripcion-dialog.component';
import { CursosIntersemestralesService, CursoOfertadoVerano } from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

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
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.loadCursos();
  }

  loadCursos() {
    this.cargando = true;
    console.log('🔄 Cargando cursos para preinscripción...');
    
    // Cargar cursos de verano disponibles para preinscripción
    this.cursosService.getCursosDisponibles().subscribe({
      next: (cursosVerano) => {
        console.log('✅ Todos los cursos de verano recibidos:', cursosVerano);
        // Filtrar solo cursos en estado de preinscripción
        this.cursosVerano = cursosVerano.filter(c => c.estado === 'Preinscripcion');
        console.log('📋 Cursos filtrados para preinscripción:', this.cursosVerano);
        this.cursos = this.mapCursosToLegacy(this.cursosVerano);
        console.log('📋 Cursos mapeados para preinscripción:', this.cursos);
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando cursos de preinscripción', err);
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

  private loadDatosPrueba() {
    console.log('📚 Cargando datos de prueba para preinscripción...');
    this.cursos = [
      {
        codigo: 'PRO-201',
        nombre: 'Programación Avanzada',
        docente: 'Dr. Ana Martínez',
        cupos: 15,
        creditos: 4,
        espacio: 'Laboratorio 2',
        estado: 'Disponible'
      },
      {
        codigo: 'BD-202',
        nombre: 'Bases de Datos',
        docente: 'Dr. Roberto Silva',
        cupos: 18,
        creditos: 3,
        espacio: 'Aula 402',
        estado: 'Disponible'
      }
    ];
    this.cargando = false;
    console.log('✅ Datos de prueba para preinscripción cargados:', this.cursos);
  }

  private mapCursosToLegacy(cursosVerano: CursoOfertadoVerano[]): Curso[] {
    return cursosVerano.map(curso => ({
      codigo: curso.codigo_curso || curso.id_curso.toString(),
      nombre: curso.nombre_curso,
      docente: `${curso.objDocente.nombre} ${curso.objDocente.apellido}`,
      cupos: curso.cupo_estimado || curso.cupo_disponible,
      creditos: curso.objMateria.creditos,
      espacio: curso.espacio_asignado || 'Por asignar',
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
      this.abrirDialogoPreinscripcion(cursoVerano);
    }
  }

  private abrirDialogoPreinscripcion(curso: CursoOfertadoVerano) {
    const dialogRef = this.dialog.open(PreinscripcionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { curso: curso },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // La preinscripción fue exitosa, recargar cursos
        this.loadCursos();
      }
    });
  }
}
