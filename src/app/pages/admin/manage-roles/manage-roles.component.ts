import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { RolesAdminService } from '@core/services/roles-admin.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { RolDTORespuesta } from '@core/models/rol.interface';
import { FormRolDialogComponent } from './form-rol-dialog/form-rol-dialog.component';
import { corregirEncodingObjeto } from '@core/utils/encoding.utils';
import { confirmar } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { filter } from 'rxjs';
import { SnackbarService } from '@core/services/snackbar.service';

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
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule
  ],
  templateUrl: './manage-roles.component.html',
  styleUrls: ['./manage-roles.component.css']
})
export class ManageRolesComponent implements OnInit {
  private rolesService = inject(RolesAdminService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  roles: RolDTORespuesta[] = [];
  displayedColumns: string[] = ['id_rol', 'nombre', 'acciones'];
  loading = false;
  searchTerm = '';

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
      error: () => {
        this.snackbar.error('Error al cargar la lista de roles');
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
      error: () => {
        this.snackbar.error('No se encontró el rol');
        this.loading = false;
      }
    });
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarRoles();
  }

  eliminarRol(rol: RolDTORespuesta): void {
    confirmar(this.dialog, {
      titulo: 'Eliminar rol', textoConfirmar: 'Eliminar', peligro: true,
      mensaje: `¿Está seguro de eliminar el rol "${rol.nombre}"?\n\nEsta acción no se puede deshacer.`
    }).pipe(filter(Boolean)).subscribe(() => {
      this.loading = true;

      this.rolesService.eliminarRol(rol.id_rol).subscribe({
        next: () => {
          this.loading = false;
          this.snackbar.exito('Rol eliminado exitosamente');
          this.cargarRoles();
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
        
          // Extraer mensaje de error usando el servicio
          const mensaje = this.errorHandler.extraerMensajeError(error);
        
          // Determinar el tipo de error
          if (this.errorHandler.esErrorDependencias(error) || error.status === 400) {
            // Error de dependencias (400) - Rol tiene usuarios asociados
            this.snackbar.advertencia(`${mensaje}`);
          } else if (error.status === 404) {
            // No encontrado
            this.snackbar.error('Rol no encontrado');
          } else {
            // Otros errores
            this.snackbar.error(`${mensaje}`);
          }
        }
      });
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
