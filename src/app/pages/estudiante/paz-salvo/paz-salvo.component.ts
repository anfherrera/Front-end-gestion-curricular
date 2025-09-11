import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { FileUploadComponent } from '../../../shared/components/file-upload-dialog/file-upload-dialog.component';
import { Solicitud, Archivo } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/models/solicitud-status.enum';

export interface Documento {
  label: string;
  obligatorio: boolean;
}

@Component({
  selector: 'app-paz-salvo',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    RequestStatusTableComponent,
    FileUploadComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent {
  solicitudes: Solicitud[] = [];
  archivosActuales: Archivo[] = [];

  documentosRequeridos: Documento[] = [
    { label: 'Formato PM-FO-4-FOR-27.pdf', obligatorio: true },
    { label: 'Autorización para publicar.pdf', obligatorio: true },
    { label: 'Resultado pruebas SaberPro.pdf', obligatorio: false },
    { label: 'Formato de hoja de vida académica.pdf', obligatorio: true },
    { label: 'Comprobante de pago de derechos de sustentación.pdf', obligatorio: true },
    { label: 'Documento final del trabajo de grado.pdf', obligatorio: true }
  ];

  archivosExclusivos: string[] = ['Formato TI-G.pdf', 'Formato PP-H.pdf'];

  constructor(private snackBar: MatSnackBar) {}

  // Cuando cambian los archivos desde el componente hijo
  onArchivosChange(archivos: Archivo[]) {
    this.archivosActuales = archivos;
  }

  // Enviar solicitud
  onSolicitudEnviada() {
    if (!this.puedeEnviar()) return;

    this.solicitudes.push({
      id: Date.now(),
      nombre: 'Solicitud paz y salvo',
      fecha: new Date().toLocaleDateString(),
      estado: SolicitudStatusEnum.ENVIADA,
      oficioUrl: '',
      archivos: [...this.archivosActuales]
    });

    // Limpiar archivos seleccionados
    this.archivosActuales = [];
    this.snackBar.open('Solicitud enviada correctamente 🚀', 'Cerrar', { duration: 3000 });
  }

  // Validación de archivos para habilitar botón
  puedeEnviar(): boolean {
    // 1. Todos los obligatorios subidos
    const todosObligatorios = this.documentosRequeridos
      .filter(d => d.obligatorio)
      .every(d => this.archivosActuales.some(a => a.nombre.trim() === d.label));

    // 2. Exactamente uno de los archivos exclusivos subido
    const exclusivosSubidos = this.archivosActuales.filter(a =>
      this.archivosExclusivos.includes(a.nombre.trim())
    );

    return todosObligatorios && exclusivosSubidos.length === 1;
  }
}
