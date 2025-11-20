import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ProgramasService } from '../../../../core/services/programas.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { ProgramaDTORespuesta } from '../../../../core/models/programa.interface';
import { corregirEncodingObjeto } from '../../../../core/utils/encoding.utils';

@Component({
  selector: 'app-lista-programas',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './lista-programas.component.html',
  styleUrls: ['./lista-programas.component.css']
})
export class ListaProgramasComponent implements OnInit {
  programas: ProgramaDTORespuesta[] = [];
  displayedColumns: string[] = ['id_programa', 'codigo', 'nombre_programa', 'acciones'];
  loading = false;
  searchTerm = '';

  constructor(
    private programasService: ProgramasService,
    private errorHandler: ErrorHandlerService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProgramas();
  }

  cargarProgramas(): void {
    this.loading = true;
    
    this.programasService.listarProgramas().subscribe({
      next: (data) => {
        this.programas = corregirEncodingObjeto(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar programas:', err);
        this.snackBar.open('Error al cargar la lista de programas', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  buscarPorNombre(): void {
    if (!this.searchTerm.trim()) {
      this.cargarProgramas();
      return;
    }

    this.loading = true;
    this.programasService.buscarPorNombre(this.searchTerm).subscribe({
      next: (data) => {
        this.programas = corregirEncodingObjeto(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error en búsqueda:', err);
        this.snackBar.open('Error al buscar programas', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarProgramas();
  }

  eliminarPrograma(programa: ProgramaDTORespuesta): void {
    if (!confirm(`¿Está seguro de eliminar el programa "${programa.nombre_programa}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    this.loading = true;

    this.programasService.eliminarPrograma(programa.id_programa).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Programa eliminado exitosamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.cargarProgramas();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        console.error('Error al eliminar programa:', error);
        
        // Extraer mensaje de error usando el servicio
        const mensaje = this.errorHandler.extraerMensajeError(error);
        
        // Determinar el tipo de error
        if (this.errorHandler.esErrorDependencias(error) || error.status === 400) {
          // Error de dependencias (400) - Programa tiene usuarios asociados
          this.snackBar.open(`${mensaje}`, 'Cerrar', { 
            duration: 6000,
            panelClass: ['snackbar-warning']
          });
        } else if (error.status === 404) {
          // No encontrado
          this.snackBar.open('Programa no encontrado', 'Cerrar', { 
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        } else {
          // Otros errores
          this.snackBar.open(`${mensaje}`, 'Cerrar', { 
            duration: 4000,
            panelClass: ['snackbar-error']
          });
        }
      }
    });
  }

  editarPrograma(programa: ProgramaDTORespuesta): void {
    this.router.navigate(['/admin/programas/editar', programa.id_programa]);
  }

  crearPrograma(): void {
    this.router.navigate(['/admin/programas/crear']);
  }
}

