import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { PreinscripcionDialogComponent } from '../../../../shared/components/preinscripcion-dialog/preinscripcion-dialog.component';
import { CursosIntersemestralesService } from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ApiEndpoints } from '../../../../core/utils/api-endpoints';

@Component({
  selector: 'app-cursos-preinscripcion',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, CursoListComponent, ...MATERIAL_IMPORTS],
  templateUrl: './cursos-preinscripcion.component.html',
  styleUrls: ['./cursos-preinscripcion.component.css']
})
export class CursosPreinscripcionComponent implements OnInit {
  cursos: Curso[] = [];
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
    console.log('🌐 URL del endpoint:', `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/preinscripcion`);
    
    // Cargar cursos específicos para preinscripción
    this.cursosService.getCursosPreinscripcion().subscribe({
      next: (cursosPreinscripcion) => {
        console.log('✅ RESPUESTA DEL BACKEND - Cursos para preinscripción recibidos:', cursosPreinscripcion);
        console.log('📊 Cantidad de cursos recibidos:', cursosPreinscripcion.length);
        
        // Los cursos ya vienen filtrados del backend, no necesitamos filtrar
        this.cursos = cursosPreinscripcion;
        console.log('📋 Cursos listos para preinscripción:', this.cursos);
        console.log('📊 Cantidad de cursos finales:', this.cursos.length);
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ ERROR EN LLAMADA AL BACKEND:', err);
        console.log('🔄 Intentando fallback a cursos legacy...');
        // Fallback a cursos legacy
        this.loadCursosLegacy();
      }
    });
  }

  private loadCursosLegacy() {
    console.log('🔄 FALLBACK: Cargando cursos legacy...');
    console.log('🌐 URL del endpoint legacy:', `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/preinscripcion`);
    
    this.cursosService.getCursosPreinscripcion().subscribe({
      next: (data) => {
        console.log('✅ FALLBACK: Cursos legacy recibidos:', data);
        console.log('📊 Cantidad de cursos legacy:', data.length);
        this.cursos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ FALLBACK: Error cargando cursos legacy:', err);
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


  onAccionCurso(event: { accion: string; curso: Curso }) {
    if (!this.usuario?.id_usuario) {
      this.snackBar.open('Error: Usuario no autenticado', 'Cerrar', { duration: 3000 });
      return;
    }

    // Buscar el curso en la lista actual
    const cursoEncontrado = this.cursos.find(c => c.codigo === event.curso.codigo);
    if (!cursoEncontrado) {
      console.error('❌ Curso no encontrado:', {
        codigoBuscado: event.curso.codigo,
        cursosDisponibles: this.cursos.map(c => ({ codigo: c.codigo, nombre: c.nombre }))
      });
      this.snackBar.open('Error: Curso no encontrado', 'Cerrar', { duration: 3000 });
      return;
    }

    if (event.accion === 'preinscribir') {
      this.abrirDialogoPreinscripcion(cursoEncontrado);
    }
  }

  private abrirDialogoPreinscripcion(curso: Curso) {
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
