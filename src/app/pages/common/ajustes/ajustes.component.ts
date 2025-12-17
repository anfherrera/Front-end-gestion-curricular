import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    CardContainerComponent
  ],
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.css']
})
export class AjustesComponent implements OnInit {
  ajustesForm: FormGroup;
  usuario: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.ajustesForm = this.fb.group({
      // Notificaciones
      notificacionesEmail: [true],
      notificacionesSistema: [true],
      notificacionesUrgentes: [true],
      
      // Preferencias de visualización
      itemsPorPagina: [10],
      temaOscuro: [false],
      
      // Privacidad
      mostrarEmail: [true],
      mostrarTelefono: [false]
    });
  }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.cargarAjustesGuardados();
  }

  cargarAjustesGuardados(): void {
    // Cargar ajustes guardados del localStorage
    const ajustesGuardados = localStorage.getItem('ajustes_usuario');
    if (ajustesGuardados) {
      try {
        const ajustes = JSON.parse(ajustesGuardados);
        this.ajustesForm.patchValue(ajustes);
      } catch (error) {
      }
    }
  }

  guardarAjustes(): void {
    const ajustes = this.ajustesForm.value;
    localStorage.setItem('ajustes_usuario', JSON.stringify(ajustes));
    
    this.snackBar.open('Ajustes guardados exitosamente', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  resetearAjustes(): void {
    if (confirm('¿Estás seguro de que deseas restaurar los ajustes por defecto?')) {
      this.ajustesForm.reset({
        notificacionesEmail: true,
        notificacionesSistema: true,
        notificacionesUrgentes: true,
        itemsPorPagina: 10,
        temaOscuro: false,
        mostrarEmail: true,
        mostrarTelefono: false
      });
      localStorage.removeItem('ajustes_usuario');
      
      this.snackBar.open('Ajustes restaurados a los valores por defecto', 'Cerrar', {
        duration: 3000
      });
    }
  }

  cambiarContrasena(): void {
    this.snackBar.open('Funcionalidad de cambio de contraseña próximamente', 'Cerrar', {
      duration: 3000
    });
  }

  exportarDatos(): void {
    this.snackBar.open('Funcionalidad de exportación de datos próximamente', 'Cerrar', {
      duration: 3000
    });
  }
}
