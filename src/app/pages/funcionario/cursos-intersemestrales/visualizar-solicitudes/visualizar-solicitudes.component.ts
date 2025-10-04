import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursosIntersemestralesService, SolicitudCursoVerano, Materia, UsuarioSolicitud } from '../../../../core/services/cursos-intersemestrales.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';

@Component({
  selector: 'app-visualizar-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardContainerComponent,
    ...MATERIAL_IMPORTS
  ],
  templateUrl: './visualizar-solicitudes.component.html',
  styleUrls: ['./visualizar-solicitudes.component.css']
})
export class VisualizarSolicitudesComponent implements OnInit {
  solicitudes: SolicitudCursoVerano[] = [];
  solicitudesFiltradas: SolicitudCursoVerano[] = [];
  materias: Materia[] = [];
  cargando = true;
  
  filtroForm: FormGroup;

  constructor(
    private cursosService: CursosIntersemestralesService,
    private fb: FormBuilder
  ) {
    console.log('📋 VISUALIZAR SOLICITUDES COMPONENT CARGADO');
    
    this.filtroForm = this.fb.group({
      materia: ['todos']
    });
  }

  ngOnInit(): void {
    this.cargarMaterias();
    this.cargarSolicitudes();
    
    // Suscribirse a cambios en los filtros
    this.filtroForm.valueChanges.subscribe(() => {
      this.aplicarFiltros();
    });
  }

  cargarMaterias() {
    console.log('🔄 Cargando materias desde el backend...');
    this.cursosService.getTodasLasMaterias().subscribe({
      next: (materias: Materia[]) => {
        this.materias = materias;
        console.log('✅ Materias cargadas desde backend:', materias);
      },
      error: (err: any) => {
        console.error('❌ Error cargando materias del backend', err);
        // Datos de prueba si falla el backend
        this.materias = [
          { id_materia: 1, codigo: 'PROG', nombre: 'Programación', creditos: 4, descripcion: 'Programación (PROG) - 4 créditos' },
          { id_materia: 2, codigo: 'BD', nombre: 'Bases de Datos', creditos: 3, descripcion: 'Bases de Datos (BD) - 3 créditos' },
          { id_materia: 3, codigo: 'MAT', nombre: 'Matemáticas', creditos: 3, descripcion: 'Matemáticas (MAT) - 3 créditos' },
          { id_materia: 4, codigo: 'WEB', nombre: 'Desarrollo Web', creditos: 4, descripcion: 'Desarrollo Web (WEB) - 4 créditos' },
          { id_materia: 5, codigo: 'IA', nombre: 'Inteligencia Artificial', creditos: 4, descripcion: 'Inteligencia Artificial (IA) - 4 créditos' },
          { id_materia: 6, codigo: 'RED', nombre: 'Redes de Computadores', creditos: 3, descripcion: 'Redes de Computadores (RED) - 3 créditos' }
        ];
      }
    });
  }

  cargarSolicitudes() {
    this.cargando = true;
    console.log('🔄 Cargando todas las solicitudes desde el backend...');
    
    this.cursosService.getTodasLasSolicitudes().subscribe({
      next: (solicitudes: SolicitudCursoVerano[]) => {
        this.solicitudes = solicitudes;
        console.log('✅ Solicitudes cargadas desde backend:', solicitudes);
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('❌ Error cargando solicitudes del backend:', err);
        console.log('📝 Usando datos de prueba hasta que el backend implemente el endpoint');
        this.cargando = false;
        // Datos de prueba si falla el backend
        this.solicitudes = this.getSolicitudesPrueba();
        this.aplicarFiltros();
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

  aplicarFiltros() {
    const filtros = this.filtroForm.value;
    let filtradas = [...this.solicitudes];

    // Filtrar por materia
    if (filtros.materia !== 'todos') {
      filtradas = filtradas.filter(s => 
        s.objCursoOfertadoVerano?.objMateria?.id_materia === parseInt(filtros.materia)
      );
    }

    this.solicitudesFiltradas = filtradas;
    console.log('🔍 Filtros aplicados:', filtros, 'Resultados:', filtradas.length);
  }


  getCondicionTexto(condicion: string): string {
    switch (condicion) {
      case 'Primera_Vez': return 'Primera Vez';
      case 'Repeticion': return 'Repetición';
      case 'Homologacion': return 'Homologación';
      default: return condicion;
    }
  }
}
