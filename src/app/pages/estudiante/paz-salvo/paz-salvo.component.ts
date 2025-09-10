import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { FileUploadComponent, Documento } from '../../../shared/components/file-upload-dialog/file-upload-dialog.component';
import { Solicitud, Archivo } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/models/solicitud-status.enum';

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

  documentosRequeridos: Documento[] = [
    { label: 'Formato PM-FO-4-FOR-27', obligatorio: true },
    { label: 'Autorización para publicar', obligatorio: true },
    { label: 'Resultado pruebas SaberPro', obligatorio: false },
    { label: 'Formato de hoja de vida académica', obligatorio: true },
    { label: 'Comprobante de pago de derechos de sustentación', obligatorio: true },
    { label: 'Documento final del trabajo de grado', obligatorio: true }
  ];

  documentosExclusivos: Documento[] = [
    { label: 'Formato TI-G', obligatorio: true },
    { label: 'Formato PP-H', obligatorio: true }
  ];

  constructor(private snackBar: MatSnackBar) {}

  /** Maneja archivos enviados desde FileUploadComponent */
  onSolicitudEnviada(archivos: Archivo[]) {
    this.solicitudes.push({
      id: Date.now(),
      nombre: 'Solicitud paz y salvo',
      fecha: new Date().toLocaleDateString(),
      estado: SolicitudStatusEnum.ENVIADA,
      oficioUrl: '',
      archivos
    });

    this.snackBar.open('Solicitud enviada correctamente 🚀', 'Cerrar', { duration: 3000 });
  }

  // --- Métodos para mostrar iconos de estado ---
  isUploaded(doc: Documento, archivos: Archivo[]): boolean {
    return archivos.some(a => a.nombre.replace(/\.[^/.]+$/, '') === doc.label);
  }

  getDocClass(doc: Documento): string {
    const archivosSubidos = this.solicitudes.flatMap(s => s.archivos || []);
    return this.isUploaded(doc, archivosSubidos) ? 'success' : doc.obligatorio ? 'pending' : 'optional';
  }

  getIconClass(doc: Documento): string {
    return this.getDocClass(doc) === 'success' ? 'icon-success' : 'icon-pending';
  }

  getIcon(doc: Documento): string {
    return this.getDocClass(doc) === 'success' ? 'check_circle' : 'cancel';
  }

  getExclusivoClass(): string {
    const archivosSubidos = this.solicitudes.flatMap(s => s.archivos || []);
    const subido = this.documentosExclusivos.some(d => this.isUploaded(d, archivosSubidos));
    return subido ? 'success' : 'pending';
  }

  get documentosExclusivosText(): string {
    return this.documentosExclusivos.map(d => d.label).join(' o ') + ' (solo uno)';
  }
}
