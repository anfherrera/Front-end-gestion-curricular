import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursoListComponent, Curso } from '../../../../shared/components/curso-list/curso-list.component';
import { PeriodoSelectorComponent } from '../../../../shared/components/periodo-selector/periodo-selector.component';
import { CursosIntersemestralesService, CursoOfertadoVerano, CreatePreinscripcionDTO } from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificacionesService } from '../../../../core/services/notificaciones.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-cursos-ofertados',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, CursoListComponent, PeriodoSelectorComponent, ...MATERIAL_IMPORTS],
  templateUrl: './cursos-ofertados.component.html',
  styleUrls: ['./cursos-ofertados.component.css']
})
export class CursosOfertadosComponent implements OnInit {
  cursos: Curso[] = [];
  cursosVerano: CursoOfertadoVerano[] = [];
  cursosVeranoOriginales: CursoOfertadoVerano[] = []; // ✨ NUEVO: Para guardar todos los cursos antes de filtrar
  cargando = true;
  usuario: any = null;
  periodoSeleccionado = ''; // ✨ NUEVO: Período seleccionado para filtrar
  
  // 🆕 Variables para manejar parámetros de navegación
  cursoIdDestino?: number;
  cursoNombreDestino?: string;
  accionDestino?: string;
  mostrarMensajeInscripcion = false;

  constructor(
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService,
    private notificacionesService: NotificacionesService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('🎯 CURSOS OFERTADOS COMPONENT CARGADO');
    this.usuario = this.authService.getUsuario();
    
    // 🆕 Verificar parámetros de consulta para navegación desde seguimiento
    this.route.queryParams.subscribe(params => {
      if (params['cursoId'] && params['accion'] === 'inscripcion') {
        this.cursoIdDestino = +params['cursoId'];
        this.cursoNombreDestino = params['cursoNombre'];
        this.accionDestino = params['accion'];
        this.mostrarMensajeInscripcion = true;
        
        console.log('🎯 Navegación desde seguimiento:', {
          cursoId: this.cursoIdDestino,
          cursoNombre: this.cursoNombreDestino,
          accion: this.accionDestino
        });
      }
    });
    
    this.loadCursos();
  }

  loadCursos() {
    this.cargando = true;
    console.log('🔄 Cargando cursos de verano...');
    
    // Cargar cursos de verano disponibles
    this.cursosService.getCursosDisponibles().subscribe({
      next: (cursosVerano) => {
        console.log('✅ Cursos de verano recibidos:', cursosVerano);
        this.cursosVeranoOriginales = cursosVerano; // ✨ NUEVO: Guardar originales
        this.aplicarFiltroPeriodo(); // ✨ NUEVO: Aplicar filtro si hay período seleccionado
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando cursos de verano', err);
        // Fallback a cursos legacy si hay error
        this.loadCursosLegacy();
      }
    });
  }

  // ✨ NUEVO: Manejar cambio de período
  onPeriodoChange(periodo: string): void {
    console.log('📅 Período seleccionado:', periodo);
    this.periodoSeleccionado = periodo;
    
    if (!periodo) {
      // Si no hay período seleccionado, cargar todos los cursos
      this.loadCursos();
    } else {
      // Cargar cursos filtrados por período
      this.cargando = true;
      this.cursosService.getCursosPorPeriodo(periodo).subscribe({
        next: (cursosVerano) => {
          console.log(`✅ Cursos del período ${periodo} recibidos:`, cursosVerano);
          this.cursosVerano = cursosVerano;
          this.cursos = this.mapCursosToLegacy(cursosVerano);
          this.cargando = false;
        },
        error: (err) => {
          console.error(`❌ Error cargando cursos del período ${periodo}:`, err);
          this.cargando = false;
        }
      });
    }
  }

  // ✨ NUEVO: Aplicar filtro de período a los cursos cargados
  private aplicarFiltroPeriodo(): void {
    if (!this.periodoSeleccionado) {
      // Sin filtro, mostrar todos
      this.cursosVerano = this.cursosVeranoOriginales;
    } else {
      // Filtrar por período
      this.cursosVerano = this.cursosVeranoOriginales.filter(
        curso => this.obtenerPeriodoCurso(curso) === this.periodoSeleccionado
      );
    }
    this.cursos = this.mapCursosToLegacy(this.cursosVerano);
    console.log('📋 Cursos después de filtro:', this.cursos);
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
      docente: this.obtenerNombreDocente(curso),
      cupos: curso.cupo_estimado || curso.cupo_disponible,
      creditos: curso.objMateria.creditos,
      espacio: curso.espacio_asignado || 'Por asignar',
      estado: this.mapEstadoCurso(curso.estado || 'Borrador'),
      // ✨ NUEVO: Mapear período y fechas
      periodo: this.obtenerPeriodoCurso(curso),
      periodoAcademico: this.obtenerPeriodoCurso(curso),
      fecha_inicio: curso.fecha_inicio,
      fecha_fin: curso.fecha_fin
    }));
  }

  // Obtener nombre del docente de forma segura
  private obtenerNombreDocente(curso: CursoOfertadoVerano): string {
    if (!curso.objDocente) {
      return 'Sin asignar';
    }
    
    // Priorizar nombre_docente (estructura del backend)
    if ((curso.objDocente as any).nombre_docente) {
      return (curso.objDocente as any).nombre_docente;
    }
    
    // Fallback a nombre y apellido (estructura legacy)
    if (curso.objDocente.nombre && curso.objDocente.apellido) {
      return `${curso.objDocente.nombre} ${curso.objDocente.apellido}`;
    }
    
    if (curso.objDocente.nombre) {
      return curso.objDocente.nombre;
    }
    
    return 'Sin nombre';
  }

  private obtenerPeriodoCurso(curso: CursoOfertadoVerano): string | undefined {
    return curso.periodo || curso.periodoAcademico;
  }

  private mapEstadoCurso(estado: string): 'Disponible' | 'Cerrado' | 'En espera' | 'Preinscripción' | 'Inscripción' | 'Publicado' | 'Abierto' | 'Borrador' {
    // Mostrar el estado real del backend sin mapear
    switch (estado) {
      case 'Publicado':
        return 'Publicado';  // Pueden solicitar curso nuevo
      case 'Preinscripción':
        return 'Preinscripción';  // Pueden preinscribirse
      case 'Inscripción':
        return 'Inscripción';  // Pueden inscribirse
      case 'Cerrado':
        return 'Cerrado';  // Solo consulta
      case 'Abierto':
        return 'Abierto';  // Estado real del backend
      case 'Borrador':
        return 'Borrador';  // Estado real del backend
      case 'Disponible':
        return 'Disponible';  // Visible pero sin acciones específicas
      default:
        return estado as any;  // Devolver el estado real del backend
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
    if (curso.estado !== 'Preinscripción') {
      this.snackBar.open('Este curso no está en período de preinscripción', 'Cerrar', { duration: 3000 });
      return;
    }

    const payload: CreatePreinscripcionDTO = {
      idUsuario: this.usuario.id_usuario,
      idCurso: curso.id_curso,
      nombreSolicitud: `Preinscripción - ${curso.nombre_curso}`,
      condicion: 'Primera_Vez' // Valor por defecto para preinscripciones directas
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
    if (curso.estado !== 'Inscripción') {
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
      case 'Preinscripción':
        acciones.push('preinscribir');
        break;
      case 'Inscripción':
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

  // 🆕 Método para cerrar el mensaje de inscripción
  cerrarMensajeInscripcion() {
    this.mostrarMensajeInscripcion = false;
    this.cursoIdDestino = undefined;
    this.cursoNombreDestino = undefined;
    this.accionDestino = undefined;
  }
}
