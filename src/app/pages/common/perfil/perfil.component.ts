import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../core/services/auth.service';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatChipsModule,
    CardContainerComponent
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  usuario: any = null;
  userRole: string = 'Usuario';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.userRole = this.getRoleDisplayName();
  }

  getRoleDisplayName(): string {
    const role = this.authService.getRole();
    switch (role?.toLowerCase()) {
      case 'admin': return 'Administrador';
      case 'funcionario': return 'Funcionario';
      case 'coordinador': return 'Coordinador';
      case 'secretario':
      case 'secretaria': return 'Secretaria';
      case 'estudiante': return 'Estudiante';
      case 'docente': return 'Docente';
      default: return 'Usuario';
    }
  }

  getUserInitials(): string {
    if (!this.usuario?.nombre) return 'U';
    const names = this.usuario.nombre.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return this.usuario.nombre.substring(0, 2).toUpperCase();
  }

  getNombreCompleto(): string {
    if (!this.usuario) return 'Usuario';
    if (this.usuario.nombre_completo) return this.usuario.nombre_completo;
    if (this.usuario.nombre && this.usuario.apellido) {
      return `${this.usuario.nombre} ${this.usuario.apellido}`;
    }
    return this.usuario.nombre || 'Usuario';
  }

  getEmail(): string {
    return this.usuario?.email || this.usuario?.correo || 'No disponible';
  }

  getCodigo(): string {
    return this.usuario?.codigo || this.usuario?.codigo_usuario || this.usuario?.codigo_estudiante || 'No disponible';
  }

  getTelefono(): string {
    return this.usuario?.telefono || 'No disponible';
  }

  getPrograma(): string {
    if (this.usuario?.objPrograma?.nombre_programa) {
      return this.usuario.objPrograma.nombre_programa;
    }
    if (this.usuario?.programa) {
      return this.usuario.programa;
    }
    return 'No disponible';
  }
}

