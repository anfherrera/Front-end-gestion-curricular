import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { CursosIntersemestralesService, CursoOfertadoVerano, CreatePreinscripcionDTO } from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificacionesService } from '../../../../core/services/notificaciones.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-cursos-ofertados',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, CursoListComponent, ...MATERIAL_IMPORTS],
  templateUrl: './cursos-ofertados.component.html',
  styleUrls: ['./cursos-ofertados.component.css']
})
export class CursosOfertadosComponent implements OnInit {
  cursos: Curso[] = [];
  cursosVerano: CursoOfertadoVerano[] = [];
  cargando = true;
  usuario: any = null;

  constructor(
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService,
    private notificacionesService: NotificacionesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('🎯 CURSOS OFERTADOS COMPONENT CARGADO');
    this.usuario = this.authService.getUsuario();
    this.loadCursos();
  }

  loadCursos() {
    this.cargando = true;
    console.log('🔄 Cargando cursos de verano...');
    
    // Cargar cursos de verano disponibles
    this.cursosService.getCursosDisponibles().subscribe({
      next: (cursosVerano) => {
        console.log('✅ Cursos de verano recibidos:', cursosVerano);
        this.cursosVerano = cursosVerano;
        this.cursos = this.mapCursosToLegacy(cursosVerano);
        console.log('📋 Cursos mapeados:', this.cursos);
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando cursos de verano', err);
        // Fallback a cursos legacy si hay error
        this.loadCursosLegacy();
      }
    });
  }

  private loadCursosLegacy() {
    this.cursosService.getCursosOfertados().subscribe({
      next: (data) => {
        this.cursos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando cursos ofertados', err);
        this.cargando = false;
      }
    });
  }

  private loadDatosPrueba() {
    console.log('📚 Cargando datos de prueba...');
    this.cursos = [
      {
        codigo: 'MAT-101',
        nombre: 'Matemáticas Básicas',
        docente: 'Dr. Juan Pérez',
        cupos: 30,
        creditos: 3,
        espacio: 'Aula 201',
        estado: 'Disponible'
      },
      {
        codigo: 'FIS-102',
        nombre: 'Física General',
        docente: 'Dra. María García',
        cupos: 25,
        creditos: 4,
        espacio: 'Laboratorio 1',
        estado: 'Disponible'
      },
      {
        codigo: 'QUI-103',
        nombre: 'Química Orgánica',
        docente: 'Dr. Carlos López',
        cupos: 20,
        creditos: 3,
        espacio: 'Aula 305',
        estado: 'Disponible'
      }
    ];
    this.cargando = false;
    console.log('✅ Datos de prueba cargados:', this.cursos);
  }

  private mapCursosToLegacy(cursosVerano: CursoOfertadoVerano[]): Curso[] {
    return cursosVerano.map(curso => ({
      codigo: curso.codigo_curso || curso.id_curso.toString(),
      nombre: curso.nombre_curso,
      docente: `${curso.objDocente.nombre} ${curso.objDocente.apellido}`,
      cupos: curso.cupo_estimado || curso.cupo_disponible,
      creditos: curso.objMateria.creditos,
      espacio: curso.espacio_asignado || 'Por asignar',
      estado: this.mapEstadoCurso(curso.estado)
    }));
  }

  private mapEstadoCurso(estado: string): 'Disponible' | 'Cerrado' | 'En espera' {
    switch (estado) {
      case 'Abierto':
      case 'Publicado':
      case 'Preinscripcion':
      case 'Inscripcion':
      case 'Disponible':  // ← AGREGAR ESTE CASE
        return 'Disponible';
      case 'Cerrado':
        return 'Cerrado';
      default:
        return 'En espera';
    }
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
    } else if (event.accion === 'inscribir') {
      this.realizarInscripcion(cursoVerano);
    }
  }

  private realizarPreinscripcion(curso: CursoOfertadoVerano) {
    if (curso.estado !== 'Preinscripcion') {
      this.snackBar.open('Este curso no está en período de preinscripción', 'Cerrar', { duration: 3000 });
      return;
    }

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

  private realizarInscripcion(curso: CursoOfertadoVerano) {
    if (curso.estado !== 'Inscripcion') {
      this.snackBar.open('Este curso no está en período de inscripción', 'Cerrar', { duration: 3000 });
      return;
    }

    const payload = {
      idUsuario: this.usuario.id_usuario,
      idCurso: curso.id_curso,
      nombreSolicitud: `Inscripción - ${curso.nombre_curso}`
    };

    this.cursosService.crearInscripcion(payload).subscribe({
      next: (solicitud) => {
        this.snackBar.open(
          `Inscripción exitosa en ${curso.nombre_curso}`, 
          'Cerrar', 
          { duration: 5000 }
        );
        this.loadCursos(); // Recargar para actualizar cupos
      },
      error: (error) => {
        console.error('Error en inscripción:', error);
        this.snackBar.open(
          'Error al realizar la inscripción. Inténtalo nuevamente.', 
          'Cerrar', 
          { duration: 5000 }
        );
      }
    });
  }

  getAccionesDisponibles(curso: Curso): string[] {
    const cursoVerano = this.cursosVerano.find(c => c.id_curso.toString() === curso.codigo);
    if (!cursoVerano) return [];

    const acciones: string[] = [];
    
    switch (cursoVerano.estado) {
      case 'Preinscripcion':
        acciones.push('preinscribir');
        break;
      case 'Inscripcion':
        acciones.push('inscribir');
        break;
      case 'Abierto':
      case 'Publicado':
        acciones.push('ver');
        break;
      default:
        acciones.push('ver');
    }

    return acciones;
  }
}
