import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { RolesAdminService } from '../../../core/services/roles-admin.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { RolDTORespuesta, RolDTOPeticion } from '../../../core/models/rol.interface';
import { FormRolDialogComponent } from './form-rol-dialog/form-rol-dialog.component';
import { corregirEncodingObjeto } from '../../../core/utils/encoding.utils';

@Component({
  selector: 'app-manage-roles',
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
    MatDialogModule
  ],
  templateUrl: './manage-roles.component.html',
  styleUrls: ['./manage-roles.component.css']
})
export class ManageRolesComponent implements OnInit {
  roles: RolDTORespuesta[] = [];
  displayedColumns: string[] = ['id_rol', 'nombre', 'acciones'];
  loading = false;
  searchTerm = '';

  constructor(
    private rolesService: RolesAdminService,
    private errorHandler: ErrorHandlerService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.loading = true;
    
    this.rolesService.listarRoles().subscribe({
      next: (data) => {
        this.roles = corregirEncodingObjeto(data);
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open('Error al cargar la lista de roles', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  buscarPorNombre(): void {
    if (!this.searchTerm.trim()) {
      this.cargarRoles();
      return;
    }

    this.loading = true;
    this.rolesService.buscarPorNombre(this.searchTerm).subscribe({
      next: (data) => {
        this.roles = data ? [data] : [];
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open('No se encontró el rol', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarRoles();
  }

  eliminarRol(rol: RolDTORespuesta): void {
    if (!confirm(`¿Está seguro de eliminar el rol "${rol.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    this.loading = true;

    this.rolesService.eliminarRol(rol.id_rol).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Rol eliminado exitosamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.cargarRoles();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        
        // Extraer mensaje de error usando el servicio
        const mensaje = this.errorHandler.extraerMensajeError(error);
        
        // Determinar el tipo de error
        if (this.errorHandler.esErrorDependencias(error) || error.status === 400) {
          // Error de dependencias (400) - Rol tiene usuarios asociados
          this.snackBar.open(`${mensaje}`, 'Cerrar', { 
            duration: 6000,
            panelClass: ['snackbar-warning']
          });
        } else if (error.status === 404) {
          // No encontrado
          this.snackBar.open('Rol no encontrado', 'Cerrar', { 
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

  editarRol(rol: RolDTORespuesta): void {
    const dialogRef = this.dialog.open(FormRolDialogComponent, {
      width: '500px',
      data: { rol, isEditMode: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarRoles();
      }
    });
  }

  crearRol(): void {
    const dialogRef = this.dialog.open(FormRolDialogComponent, {
      width: '500px',
      data: { rol: null, isEditMode: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarRoles();
      }
    });
  }
}
