import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [CommonModule, MatToolbarModule, MatIconModule, MatButtonModule]
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  userName: string = '';
  userEmail: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();
    if (usuario) {
      this.userName = usuario.nombre_completo;
      this.userEmail = usuario.correo;
    }
  }

  // Método opcional para logout desde el header
  logout(): void {
    this.authService.logout();
  }

  // Emitir evento para abrir/cerrar sidebar
  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
