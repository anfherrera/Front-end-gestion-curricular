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
  cursosOriginales: CursoOfertadoVerano[] = []; // Para mantener datos originales del backend
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
    console.log('🔄 Cargando cursos reales de la base de datos...');
    console.log('🌐 Endpoint de datos reales:', ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.DISPONIBLES);
    
    // Cargar cursos reales del backend (solo cursos en preinscripción)
    this.cursosService.getCursosPorEstado('Preinscripción').subscribe({
      next: (cursosReales) => {
        console.log('✅ CURSOS REALES DE LA BASE DE DATOS:', cursosReales);
        console.log(`📊 Total de cursos encontrados: ${cursosReales.length}`);
        
        // Mostrar información de los cursos reales
        if (cursosReales.length > 0) {
          console.log('🔍 Cursos disponibles:', cursosReales.map(c => ({ 
            codigo: c.codigo_curso, 
            nombre: c.nombre_curso, 
            estado: c.estado 
          })));
        } else {
          console.log('ℹ️ No hay cursos disponibles en la base de datos');
        }
        
        // Usar todos los cursos reales (sin filtros)
        this.cursosOriginales = cursosReales;
        
        // Mapear a formato para la tabla
        this.cursos = this.cursosOriginales.map(curso => ({
          codigo: curso.codigo_curso || curso.id_curso?.toString() || 'N/A',
          nombre: curso.nombre_curso || 'Sin nombre',
          docente: curso.objDocente ? `${curso.objDocente.nombre || ''} ${curso.objDocente.apellido || ''}`.trim() : 'Sin asignar',
          cupos: curso.cupo_disponible || curso.cupo_estimado || 0,
          creditos: curso.objMateria?.creditos || 0,
          espacio: curso.espacio_asignado || 'Por asignar',
          estado: curso.estado
        }));
        
        console.log('📋 Cursos mapeados para tabla:', this.cursos);
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ ERROR cargando cursos reales:', err);
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



  onAccionCurso(event: { accion: string; curso: Curso }) {
    if (!this.usuario?.id_usuario) {
      this.snackBar.open('Error: Usuario no autenticado', 'Cerrar', { duration: 3000 });
      return;
    }

    // Buscar el curso original en la lista de cursos originales del backend
    const cursoOriginal = this.cursosOriginales.find(c => 
      c.codigo_curso === event.curso.codigo || 
      c.id_curso?.toString() === event.curso.codigo
    );
    
    if (!cursoOriginal) {
      console.error('❌ Curso original no encontrado:', {
        codigoBuscado: event.curso.codigo,
        cursosOriginalesDisponibles: this.cursosOriginales.map(c => ({ 
          codigo: c.codigo_curso, 
          id: c.id_curso, 
          nombre: c.nombre_curso 
        }))
      });
      this.snackBar.open('Error: Curso no encontrado', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('🔍 Curso original encontrado para diálogo:', cursoOriginal);

    if (event.accion === 'preinscribir') {
      this.abrirDialogoPreinscripcion(cursoOriginal);
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
