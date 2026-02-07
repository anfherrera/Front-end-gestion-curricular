import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { FormProcesoDialogComponent } from './form-proceso-dialog/form-proceso-dialog.component';
import { snackbarConfig } from '../../../core/design-system/design-tokens';

@Component({
  selector: 'app-manage-processes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './manage-processes.component.html',
  styleUrl: './manage-processes.component.css'
})
export class ManageProcessesComponent implements OnInit {
  procesos: any[] = [];
  displayedColumns: string[] = ['id_proceso', 'nombre_proceso', 'descripcion', 'estado', 'acciones'];
  loading = false;
  searchTerm = '';

  constructor(
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarProcesos();
  }

  cargarProcesos(): void {
    this.loading = true;
    
    this.apiService.get('procesos/listarProcesos').subscribe({
      next: (data: any) => {
        this.procesos = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.snackBar.open('Error al cargar procesos', 'Cerrar', snackbarConfig(['error-snackbar']));
        this.loading = false;
      }
    });
  }

  buscar(): void {
    if (!this.searchTerm.trim()) {
      this.cargarProcesos();
      return;
    }

    this.loading = true;
    const procesosFiltrados = this.procesos.filter(p => 
      p.nombre_proceso.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    
    this.procesos = procesosFiltrados;
    this.loading = false;
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarProcesos();
  }

  cambiarEstado(proceso: any): void {
    const nuevoEstado = !proceso.estado_proceso;
    const mensaje = nuevoEstado ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Está seguro de ${mensaje} el proceso "${proceso.nombre_proceso}"?`)) {
      return;
    }

    this.apiService.put(`procesos/actualizarEstado/${proceso.id_proceso}`, { estado_proceso: nuevoEstado }).subscribe({
      next: () => {
        this.snackBar.open(`Proceso ${mensaje}do exitosamente`, 'Cerrar', snackbarConfig(['success-snackbar']));
        this.cargarProcesos();
      },
      error: (err: any) => {
        this.snackBar.open('Error al cambiar el estado del proceso', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  editarProceso(proceso: any): void {
    const dialogRef = this.dialog.open(FormProcesoDialogComponent, {
      width: '600px',
      data: { proceso, isEditMode: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarProcesos();
      }
    });
  }

  crearProceso(): void {
    const dialogRef = this.dialog.open(FormProcesoDialogComponent, {
      width: '600px',
      data: { proceso: null, isEditMode: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarProcesos();
      }
    });
  }

  eliminarProceso(proceso: any): void {
    if (!confirm(`¿Está seguro de ELIMINAR el proceso "${proceso.nombre_proceso}"?`)) {
      return;
    }

    this.apiService.delete(`procesos/eliminarProceso/${proceso.id_proceso}`).subscribe({
      next: () => {
        this.snackBar.open('Proceso eliminado exitosamente', 'Cerrar', snackbarConfig(['success-snackbar']));
        this.cargarProcesos();
      },
      error: (err: any) => {
        this.snackBar.open('Error al eliminar el proceso', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }
}
