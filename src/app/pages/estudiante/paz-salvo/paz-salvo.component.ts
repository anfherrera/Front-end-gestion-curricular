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
  resetFileUpload = false; // Para resetear hijo

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

  // Manejo de archivos subidos
  onArchivosChange(archivos: Archivo[]) {
    const exclusivosSubidos = archivos.filter(a =>
      this.archivosExclusivos.includes(a.nombre.trim())
    );

    if (exclusivosSubidos.length > 1) {
      alert(`Solo puedes subir uno de los archivos exclusivos: ${this.archivosExclusivos.join(' o ')}`);
      // Mantener solo los archivos que no sean los nuevos exclusivos
      archivos = this.archivosActuales.concat(
        exclusivosSubidos.slice(-1) // conservar solo el último
      );
    }

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

    // Limpiar archivos en padre y avisar al hijo
    this.archivosActuales = [];
    this.resetFileUpload = true;
    setTimeout(() => this.resetFileUpload = false);

    this.snackBar.open('Solicitud enviada correctamente', 'Cerrar', { duration: 3000 });
  }

  // Validación de envío
  puedeEnviar(): boolean {
    // Todos los obligatorios
    const todosObligatorios = this.documentosRequeridos
      .filter(d => d.obligatorio)
      .every(d => this.archivosActuales.some(a => a.nombre.trim() === d.label));

    // Exactamente un archivo exclusivo
    const exclusivosSubidos = this.archivosActuales.filter(a =>
      this.archivosExclusivos.includes(a.nombre.trim())
    );
    const tieneUnSoloExclusivo = exclusivosSubidos.length === 1;

    // Solo archivos permitidos
    const nombresPermitidos = [
      ...this.documentosRequeridos.map(d => d.label),
      ...this.archivosExclusivos
    ];
    const soloArchivosPermitidos = this.archivosActuales.every(a =>
      nombresPermitidos.includes(a.nombre.trim())
    );

    return todosObligatorios && tieneUnSoloExclusivo && soloArchivosPermitidos;
  }
}
