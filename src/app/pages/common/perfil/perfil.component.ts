import { Component, OnInit, inject } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '@core/services/auth.service';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';

@Component({
  selector: 'app-perfil',
  imports: [
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
  private authService = inject(AuthService);

  usuario: UsuarioSesion | null = null;
  userRole = 'Usuario';

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
    const nombres = this.usuario?.nombre_completo?.trim().split(/\s+/) ?? [];
    if (!nombres[0]) return 'U';
    if (nombres.length >= 2) {
      return (nombres[0][0] + nombres[1][0]).toUpperCase();
    }
    return nombres[0].substring(0, 2).toUpperCase();
  }

  getNombreCompleto(): string {
    return this.usuario?.nombre_completo || 'Usuario';
  }

  getEmail(): string {
    return this.usuario?.correo || 'No disponible';
  }

  getCodigo(): string {
    return this.usuario?.codigo || 'No disponible';
  }

  getPrograma(): string {
    return this.usuario?.objPrograma?.nombre_programa || 'No disponible';
  }
}

