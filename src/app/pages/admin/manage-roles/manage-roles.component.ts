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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { RolesAdminService } from '../../../core/services/roles-admin.service';
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
        console.error('Error al cargar roles:', err);
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
        console.error('Error en búsqueda:', err);
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
    if (!confirm(`¿Está seguro de eliminar el rol "${rol.nombre}"?`)) {
      return;
    }

    this.rolesService.eliminarRol(rol.id_rol).subscribe({
      next: () => {
        this.snackBar.open('Rol eliminado exitosamente', 'Cerrar', { duration: 3000 });
        this.cargarRoles();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        this.snackBar.open('Error al eliminar el rol', 'Cerrar', { duration: 3000 });
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
