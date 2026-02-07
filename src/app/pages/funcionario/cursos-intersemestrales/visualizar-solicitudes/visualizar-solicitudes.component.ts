import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursosIntersemestralesService, SolicitudCursoVerano, Materia, UsuarioSolicitud } from '../../../../core/services/cursos-intersemestrales.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { UtfFixPipe } from '../../../../shared/pipes/utf-fix.pipe';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { descargarBlob } from '../../../../core/utils/download.util';
import { snackbarConfig } from '../../../../core/design-system/design-tokens';
import { PeriodoFiltroSelectorComponent } from '../../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';

@Component({
  selector: 'app-visualizar-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardContainerComponent,
    PeriodoFiltroSelectorComponent,
    ...MATERIAL_IMPORTS,
    MatSnackBarModule,
    UtfFixPipe
  ],
  templateUrl: './visualizar-solicitudes.component.html',
  styleUrls: ['./visualizar-solicitudes.component.css']
})
export class VisualizarSolicitudesComponent implements OnInit {
  solicitudes: any[] = [];
  solicitudesFiltradas: any[] = [];
  materias: Materia[] = [];
  cargando = true;
  exportando = false;
  periodoFiltro: string = 'todos'; // Filtro por período académico
  
  filtroForm: FormGroup;

  constructor(
    private cursosService: CursosIntersemestralesService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    
    this.filtroForm = this.fb.group({
      materia: [0] // Usar 0 como valor por defecto para "Todas las materias"
    });
  }

  ngOnInit(): void {
    this.cargarMaterias();
    this.cargarSolicitudes();
    
    // Suscribirse a cambios en los filtros - recargar desde el backend
    this.filtroForm.valueChanges.subscribe(() => {
      this.cargarSolicitudes(); // Recargar desde el backend con los nuevos filtros
    });
  }

  cargarMaterias() {
    
    this.cursosService.getMateriasFiltro().subscribe({
      next: (materias: any[]) => {
        // Mapear la respuesta del nuevo endpoint al formato esperado
        this.materias = materias.map(materia => ({
          id_materia: materia.id,
          codigo: materia.codigo,
          nombre: materia.nombre,
          creditos: 0, // No viene en la respuesta del filtro
          descripcion: `${materia.nombre} (${materia.codigo})`
        }));
      },
      error: (err: any) => {
        // Fallback: datos básicos si falla el backend
        this.materias = [
          { id_materia: 0, codigo: 'TODAS', nombre: 'Todas las materias', creditos: 0, descripcion: 'Todas las materias' },
          { id_materia: 1, codigo: 'PROG-301', nombre: 'Programación Avanzada', creditos: 0, descripcion: 'Programación Avanzada (PROG-301)' },
          { id_materia: 2, codigo: 'SOF-201', nombre: 'Calidad de Software', creditos: 0, descripcion: 'Calidad de Software (SOF-201)' },
          { id_materia: 3, codigo: 'BD-101', nombre: 'Bases de Datos', creditos: 0, descripcion: 'Bases de Datos (BD-101)' }
        ];
      }
    });
  }

  cargarSolicitudes() {
    this.cargando = true;
    
    // Obtener los filtros actuales
    const filtros = this.filtroForm.value;
    const idMateria = filtros.materia && filtros.materia !== 0 ? filtros.materia : undefined;
    const periodoParam = this.periodoFiltro && this.periodoFiltro !== 'todos' && this.periodoFiltro.trim() !== '' 
      ? this.periodoFiltro.trim() 
      : undefined;
    
    
    // Cargar solicitudes con filtros del backend
    this.cursosService.getSolicitudesVisualizar(idMateria, periodoParam).subscribe({
      next: (solicitudes: any[]) => {
        this.solicitudes = solicitudes;
        this.solicitudesFiltradas = [...solicitudes]; // Las solicitudes ya vienen filtradas del backend
        this.cargando = false;
      },
      error: (err: any) => {
        this.cargando = false;
        this.solicitudes = [];
        this.solicitudesFiltradas = [];
      }
    });
  }

  getSolicitudesPrueba(): SolicitudCursoVerano[] {
    return [
      {
        id_solicitud: 1,
        nombre_solicitud: 'Solicitud de Curso Nuevo - Programación Avanzada',
        fecha_solicitud: new Date('2024-01-15'),
        estado: 'Pendiente',
        condicion: 'Primera_Vez',
        observaciones: 'Estudiante solicita curso de programación avanzada para el verano',
        objUsuario: {
          id_usuario: 1,
          nombre_completo: 'Pepa González',
          rol: { id_rol: 1, nombre: 'Estudiante' },
          codigo: '104612345660',
          correo: 'pepa.gonzalez@unicauca.edu.co',
          estado_usuario: true,
          objPrograma: {
            id_programa: 1,
            nombre_programa: 'Ingeniería Informática'
          }
        },
        objCursoOfertadoVerano: {
          id_curso: 1,
          nombre_curso: 'Programación Avanzada',
          codigo_curso: 'PROG-301',
          descripcion: 'Curso de programación avanzada',
          fecha_inicio: new Date(),
          fecha_fin: new Date(),
          cupo_maximo: 25,
          cupo_disponible: 20,
          cupo_estimado: 25,
          espacio_asignado: 'Lab 301',
          estado: 'Abierto',
          objMateria: { 
            id_materia: 1, 
            codigo: 'PROG',
            nombre: 'Programación',
            creditos: 4,
            descripcion: 'Programación (PROG) - 4 créditos'
          },
          objDocente: { 
            id_usuario: 2, 
            nombre: 'María',
            apellido: 'García',
            email: 'maria.garcia@unicauca.edu.co',
            telefono: '3007654321',
            objRol: { id_rol: 2, nombre_rol: 'Docente' }
          }
        },
        tipoSolicitud: 'PREINSCRIPCION'
      },
      {
        id_solicitud: 2,
        nombre_solicitud: 'Solicitud de Curso Nuevo - Bases de Datos Avanzadas',
        fecha_solicitud: new Date('2024-01-16'),
        estado: 'Pendiente',
        condicion: 'Repeticion',
        observaciones: 'Estudiante necesita reforzar conocimientos en bases de datos',
        objUsuario: {
          id_usuario: 2,
          nombre_completo: 'Carlos López',
          rol: { id_rol: 1, nombre: 'Estudiante' },
          codigo: '104612345661',
          correo: 'carlos.lopez@unicauca.edu.co',
          estado_usuario: true,
          objPrograma: {
            id_programa: 1,
            nombre_programa: 'Ingeniería Informática'
          }
        },
        objCursoOfertadoVerano: {
          id_curso: 2,
          nombre_curso: 'Bases de Datos Avanzadas',
          codigo_curso: 'BD-301',
          descripcion: 'Curso de bases de datos avanzadas',
          fecha_inicio: new Date(),
          fecha_fin: new Date(),
          cupo_maximo: 30,
          cupo_disponible: 25,
          cupo_estimado: 30,
          espacio_asignado: 'Aula 201',
          estado: 'Abierto',
          objMateria: { 
            id_materia: 2, 
            codigo: 'BD',
            nombre: 'Bases de Datos',
            creditos: 3,
            descripcion: 'Bases de Datos (BD) - 3 créditos'
          },
          objDocente: { 
            id_usuario: 3, 
            nombre: 'Ana',
            apellido: 'Martínez',
            email: 'ana.martinez@unicauca.edu.co',
            telefono: '3008765432',
            objRol: { id_rol: 2, nombre_rol: 'Docente' }
          }
        },
        tipoSolicitud: 'PREINSCRIPCION'
      },
      {
        id_solicitud: 3,
        nombre_solicitud: 'Solicitud de Curso Nuevo - Desarrollo Web',
        fecha_solicitud: new Date('2024-01-17'),
        estado: 'Pendiente',
        condicion: 'Primera_Vez',
        observaciones: 'Estudiante interesado en desarrollo web moderno',
        objUsuario: {
          id_usuario: 3,
          nombre_completo: 'María Rodríguez',
          rol: { id_rol: 1, nombre: 'Estudiante' },
          codigo: '104612345662',
          correo: 'maria.rodriguez@unicauca.edu.co',
          estado_usuario: true,
          objPrograma: {
            id_programa: 1,
            nombre_programa: 'Ingeniería Informática'
          }
        },
        objCursoOfertadoVerano: {
          id_curso: 3,
          nombre_curso: 'Desarrollo Web Moderno',
          codigo_curso: 'WEB-301',
          descripcion: 'Curso de desarrollo web con tecnologías modernas',
          fecha_inicio: new Date(),
          fecha_fin: new Date(),
          cupo_maximo: 20,
          cupo_disponible: 15,
          cupo_estimado: 20,
          espacio_asignado: 'Lab 302',
          estado: 'Abierto',
          objMateria: { 
            id_materia: 4, 
            codigo: 'WEB',
            nombre: 'Desarrollo Web',
            creditos: 4,
            descripcion: 'Desarrollo Web (WEB) - 4 créditos'
          },
          objDocente: { 
            id_usuario: 4, 
            nombre: 'Pedro',
            apellido: 'Sánchez',
            email: 'pedro.sanchez@unicauca.edu.co',
            telefono: '3009876543',
            objRol: { id_rol: 2, nombre_rol: 'Docente' }
          }
        },
        tipoSolicitud: 'PREINSCRIPCION'
      }
    ];
  }

  // Manejar cambio de período académico
  onPeriodoChange(periodo: string): void {
    this.periodoFiltro = periodo;
    this.cargarSolicitudes();
  }


  getCondicionTexto(condicion: string): string {
    switch (condicion) {
      case 'Primera_Vez': 
      case 'PRIMERA_VEZ': return 'Primera Vez';
      case 'Repeticion': 
      case 'REPITENCIA':
      case 'REPETECIÓN': return 'Repetición';
      case 'Homologacion': 
      case 'HABILITACION':
      case 'HABILITACIÓN': return 'Habilitación';
      case 'TRASLADO': return 'Traslado';
      case 'Preinscripción': return 'Preinscripción';
      default: return condicion;
    }
  }

  getCondicionClass(condicion: string): string {
    switch (condicion) {
      case 'PRIMERA_VEZ':
      case 'Primera_Vez': return 'condicion-primera-vez';
      case 'HABILITACIÓN':
      case 'HABILITACION':
      case 'Homologacion': return 'condicion-habilitacion';
      case 'REPETECIÓN':
      case 'REPITENCIA':
      case 'Repeticion': return 'condicion-repitencia';
      case 'TRASLADO': return 'condicion-traslado';
      case 'Preinscripción': return 'condicion-preinscripcion';
      default: return 'condicion-default';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'ENVIADA':
        return 'Enviada';
      case 'APROBADO':
        return 'Aprobado';
      case 'RECHAZADO':
        return 'Rechazado';
      case 'PAGO_VALIDADO':
        return 'Pago Validado';
      case 'PAGO_RECHAZADO':
        return 'Pago Rechazado';
      default:
        return estado || 'Sin estado';
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'ENVIADA':
        return 'estado-enviada';
      case 'APROBADO':
      case 'PAGO_VALIDADO':
        return 'estado-aprobado';
      case 'RECHAZADO':
      case 'PAGO_RECHAZADO':
        return 'estado-rechazado';
      default:
        return 'estado-default';
    }
  }

  /**
   * Exporta las solicitudes a Excel
   */
  exportarSolicitudesExcel(): void {
    this.exportando = true;
    
    // Obtener el período para el filtro
    const periodoParam = this.periodoFiltro && this.periodoFiltro !== 'todos' && this.periodoFiltro.trim() !== '' 
      ? this.periodoFiltro.trim() 
      : undefined;
    
    // Obtener el ID de materia si está seleccionada
    const idCurso = this.filtroForm.value.materia && this.filtroForm.value.materia !== 0
      ? this.filtroForm.value.materia
      : undefined;
    
    
    this.cursosService.exportarSolicitudesExcel(periodoParam, idCurso).subscribe({
      next: (response: { blob: Blob; filename?: string }) => {
        // Obtener el nombre del archivo de la respuesta o usar uno por defecto
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = response.filename || `solicitudes_cursos_intersemestrales_${fecha}.xlsx`;
        
        // Descargar el archivo
        descargarBlob(response.blob, nombreArchivo);
        
        this.snackBar.open('Excel descargado exitosamente', 'Cerrar', snackbarConfig(['success-snackbar']));
        
        this.exportando = false;
      },
      error: (error: any) => {
        
        let mensajeError = 'Error al exportar las solicitudes. Por favor, intente nuevamente.';
        if (error.error instanceof Blob) {
          // Si el error es un blob, intentar leerlo como texto
          error.error.text().then((text: string) => {
            try {
              const errorJson = JSON.parse(text);
              mensajeError = errorJson.message || mensajeError;
            } catch {
              // Si no se puede parsear, usar el mensaje por defecto
            }
            this.snackBar.open(`${mensajeError}`, 'Cerrar', snackbarConfig(['error-snackbar']));
          });
        } else {
          mensajeError = error.message || mensajeError;
          this.snackBar.open(`${mensajeError}`, 'Cerrar', snackbarConfig(['error-snackbar']));
        }
        
        this.exportando = false;
      }
    });
  }
}
