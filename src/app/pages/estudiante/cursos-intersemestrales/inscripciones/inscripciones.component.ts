import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursosIntersemestralesService, Inscripcion, SolicitudCursoVerano } from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ArchivosService } from '../../../../core/services/archivos.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-inscripciones',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, ...MATERIAL_IMPORTS],
  templateUrl: './inscripciones.component.html',
  styleUrls: ['./inscripciones.component.css']
})
export class InscripcionesComponent implements OnInit {
  inscripciones: Inscripcion[] = [];
  solicitudes: SolicitudCursoVerano[] = [];
  cargando = true;
  usuario: any = null;

  // Inyección usando inject() para componentes standalone
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService,
    private archivosService: ArchivosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    console.log('📋 INSCRIPCIONES COMPONENT CARGADO');
  }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.loadInscripciones();
    this.loadSolicitudes();
  }

  loadInscripciones() {
    console.log('🔄 Cargando inscripciones...');
    this.cursosService.getInscripciones().subscribe({
      next: data => {
        this.inscripciones = data;
        console.log('✅ Inscripciones cargadas:', data);
        this.cargando = false;
      },
      error: err => {
        console.error('❌ Error cargando inscripciones', err);
        this.cargando = false;
      }
    });
  }

  loadSolicitudes() {
    if (!this.usuario?.id_usuario) {
      console.log('❌ No hay usuario logueado');
      return;
    }

    console.log('🔄 Cargando solicitudes del usuario:', this.usuario.id_usuario);
    this.cursosService.getSolicitudesUsuario(this.usuario.id_usuario).subscribe({
      next: data => {
        this.solicitudes = data;
        console.log('✅ Solicitudes cargadas:', data);
      },
      error: err => {
        console.error('❌ Error cargando solicitudes', err);
      }
    });
  }

  onCancelarInscripcion(inscripcion: Inscripcion) {
    if (!confirm(`¿Deseas cancelar la inscripción al curso ID ${inscripcion.cursoId}?`)) return;

    this.cursosService.cancelarInscripcion(inscripcion.id).subscribe({
      next: () => {
        this.snackBar.open('Inscripción cancelada correctamente', 'Cerrar', { duration: 3000 });
        this.loadInscripciones();
      },
      error: err => {
        console.error('Error cancelando inscripción', err);
        this.snackBar.open('Error al cancelar la inscripción', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSubirArchivoPago(inscripcion: Inscripcion) {
    console.log('📁 Abriendo dialog para subir archivo de pago para inscripción:', inscripcion.id);
    
    // Crear input file temporal
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.subirArchivoPago(inscripcion, file);
      }
    };
    input.click();
  }

  subirArchivoPago(inscripcion: Inscripcion, file: File) {
    console.log('📤 Subiendo archivo de pago:', file.name);
    
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.snackBar.open('Solo se permiten archivos PDF, JPG, JPEG o PNG', 'Cerrar', { duration: 3000 });
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.snackBar.open('El archivo no puede ser mayor a 5MB', 'Cerrar', { duration: 3000 });
      return;
    }

    // Subir archivo
    this.archivosService.subirPDF(file).subscribe({
      next: (archivoSubido) => {
        console.log('✅ Archivo subido exitosamente:', archivoSubido);
        console.log('📋 Inscripción antes de actualizar:', inscripcion);
        
        // Actualizar la inscripción con el archivo
        this.actualizarInscripcionConArchivo(inscripcion, archivoSubido);
        
        console.log('📋 Inscripciones después de actualizar:', this.inscripciones);
        
        this.snackBar.open('Archivo de pago subido correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('❌ Error subiendo archivo:', err);
        this.snackBar.open('Error al subir el archivo de pago', 'Cerrar', { duration: 3000 });
      }
    });
  }

  actualizarInscripcionConArchivo(inscripcion: Inscripcion, archivo: any) {
    console.log('🔄 Actualizando inscripción con archivo:', inscripcion.id, archivo);
    
    // Buscar la inscripción en el array
    const index = this.inscripciones.findIndex(i => i.id === inscripcion.id);
    console.log('📍 Índice encontrado:', index);
    
    if (index !== -1) {
      // Crear una copia del array para forzar la detección de cambios
      const nuevasInscripciones = [...this.inscripciones];
      
      // Actualizar la inscripción específica
      nuevasInscripciones[index] = {
        ...nuevasInscripciones[index],
        archivoPago: {
          id: archivo.id_documento,
          nombre: archivo.nombre_documento || archivo.nombre,
          url: archivo.ruta_documento,
          fecha: archivo.fecha_documento || new Date().toISOString()
        }
      };
      
      // Reemplazar el array completo
      this.inscripciones = nuevasInscripciones;
      
      // Forzar la detección de cambios
      this.cdr.detectChanges();
      
      console.log('✅ Inscripción actualizada:', nuevasInscripciones[index]);
    } else {
      console.error('❌ No se encontró la inscripción con ID:', inscripcion.id);
    }
  }

}
