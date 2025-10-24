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
import { RouterModule } from '@angular/router';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { corregirEncodingObjeto } from '../../../core/utils/encoding.utils';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.css'
})
export class ManageUsersComponent implements OnInit {
  usuarios: any[] = [];
  displayedColumns: string[] = ['id_usuario', 'nombre_completo', 'correo', 'rol', 'estado', 'acciones'];
  loading = false;
  searchTerm = '';

  constructor(
    private usuariosService: UsuariosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    
    this.usuariosService.listarUsuarios().subscribe({
      next: (data: any) => {
        // Corregir encoding de caracteres especiales (tildes, ñ, etc.)
        this.usuarios = corregirEncodingObjeto(data);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar usuarios:', err);
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  buscar(): void {
    if (!this.searchTerm.trim()) {
      this.cargarUsuarios();
      return;
    }

    this.loading = true;
    const usuariosFiltrados = this.usuarios.filter(u => 
      u.nombre_completo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      u.correo.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    
    this.usuarios = usuariosFiltrados;
    this.loading = false;
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarUsuarios();
  }

  cambiarEstado(usuario: any): void {
    const nuevoEstado = usuario.estado_usuario ? 0 : 1;
    const mensaje = nuevoEstado === 1 ? 'habilitar' : 'deshabilitar';
    
    if (!confirm(`¿Está seguro de ${mensaje} al usuario "${usuario.nombre_completo}"?`)) {
      return;
    }

    this.usuariosService.actualizarEstado(usuario.id_usuario, nuevoEstado).subscribe({
      next: () => {
        this.snackBar.open(`Usuario ${mensaje}do exitosamente`, 'Cerrar', { duration: 3000 });
        this.cargarUsuarios();
      },
      error: (err: any) => {
        console.error('Error al cambiar estado:', err);
        this.snackBar.open('Error al cambiar el estado del usuario', 'Cerrar', { duration: 3000 });
      }
    });
  }

  eliminarUsuario(usuario: any): void {
    if (!confirm(`¿Está seguro de ELIMINAR al usuario "${usuario.nombre_completo}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.usuariosService.eliminarUsuario(usuario.id_usuario).subscribe({
      next: () => {
        this.snackBar.open('Usuario eliminado exitosamente', 'Cerrar', { duration: 3000 });
        this.cargarUsuarios();
      },
      error: (err: any) => {
        console.error('Error al eliminar:', err);
        this.snackBar.open('Error al eliminar el usuario', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getRolChipColor(rol: string): string {
    const rolLower = rol?.toLowerCase() || '';
    if (rolLower.includes('admin')) return 'warn';
    if (rolLower.includes('coordinador')) return 'accent';
    if (rolLower.includes('funcionario')) return 'primary';
    return '';
  }
}
