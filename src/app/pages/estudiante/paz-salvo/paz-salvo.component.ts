import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { FileUploadComponent } from '../../../shared/components/file-upload-dialog/file-upload-dialog.component';
import { RequiredDocsComponent } from '../../../shared/components/required-docs/required-docs.component';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud, Archivo } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';

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
    FileUploadComponent,
    RequiredDocsComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent implements OnInit {
  solicitudes: Solicitud[] = [];
  archivosActuales: Archivo[] = [];
  resetFileUpload = false;

  SolicitudStatusEnum = SolicitudStatusEnum;

  readonly documentosRequeridos = [
    { label: 'Formato PM-FO-4-FOR-27.pdf', obligatorio: true },
    { label: 'Autorización para publicar.pdf', obligatorio: true },
    { label: 'Resultado pruebas SaberPro.pdf', obligatorio: false },
    { label: 'Formato de hoja de vida académica.pdf', obligatorio: true },
    { label: 'Comprobante de pago de derechos de sustentación.pdf', obligatorio: true },
    { label: 'Documento final del trabajo de grado.pdf', obligatorio: true }
  ];

  readonly archivosExclusivos = ['Formato TI-G.pdf', 'Formato PP-H.pdf'];

  private readonly studentId = 1; // Opcional: puedes obtener dinámicamente del AuthService

  constructor(
    private snackBar: MatSnackBar,
    private pazSalvoService: PazSalvoService
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudesAsync();
  }

  get ultimaSolicitud(): Solicitud | undefined {
    return this.solicitudes[this.solicitudes.length - 1];
  }

  get textoBoton(): string {
    if (!this.ultimaSolicitud) return 'Enviar Solicitud';

    switch (this.ultimaSolicitud.estado) {
      case SolicitudStatusEnum.ENVIADA:
      case SolicitudStatusEnum.EN_REVISION_SECRETARIA:
      case SolicitudStatusEnum.EN_REVISION_FUNCIONARIO:
      case SolicitudStatusEnum.EN_REVISION_COORDINADOR:
        return 'Actualizar Solicitud';
      default:
        return 'Enviar Solicitud';
    }
  }

  // ================================
  // 🔹 Carga de solicitudes
  // ================================
 private async cargarSolicitudesAsync(): Promise<void> {
  try {
    const solicitudes = await this.pazSalvoService.getStudentRequests(this.studentId).toPromise();
    this.solicitudes = solicitudes ?? []; // ✅ Si viene undefined, asigna un array vacío

    if (this.ultimaSolicitud?.archivos) {
      this.archivosActuales = this.ultimaSolicitud.archivos.map(a => ({
        ...a,
        nombre: a.nombre.trim()
      }));
    }
  } catch (err: any) {
    this.snackBar.open(`Error al cargar solicitudes: ${err?.message || err}`, 'Cerrar', { duration: 3000 });
  }
}


  // ================================
  // 🔹 Cambio de archivos
  // ================================
  async onArchivosChange(archivos: Archivo[]): Promise<void> {
    const uploadedFiles: Archivo[] = [];

    for (const archivo of archivos) {
      if (archivo.file) {
        try {
          const uploaded = await this.pazSalvoService.uploadFile(this.studentId, archivo.file).toPromise();
          if (uploaded) uploadedFiles.push({ ...uploaded, nombre: uploaded.nombre.trim() });
        } catch (err) {
          this.snackBar.open(`Error subiendo archivo ${archivo.nombre}`, 'Cerrar', { duration: 3000 });
        }
      } else {
        uploadedFiles.push({ ...archivo, nombre: archivo.nombre.trim() });
      }
    }

    this.archivosActuales = uploadedFiles;
  }

  // ================================
  // 🔹 Enviar solicitud
  // ================================
  async onSolicitudEnviada(): Promise<void> {
    if (!this.puedeEnviar()) return;

    try {
      await this.pazSalvoService.sendRequest(this.studentId, this.archivosActuales).toPromise();
      this.snackBar.open('Solicitud enviada correctamente', 'Cerrar', { duration: 3000 });
      this.resetFileUpload = true;
      setTimeout(() => (this.resetFileUpload = false), 100);
      await this.cargarSolicitudesAsync();
    } catch (err: any) {
      this.snackBar.open(`Error al enviar solicitud: ${err?.message || err}`, 'Cerrar', { duration: 3000 });
    }
  }

  // ================================
  // 🔹 Validaciones
  // ================================
  puedeEnviar(): boolean {
    return this.validarObligatorios() && this.validarExclusivos() && this.validarPermitidos();
  }

  private validarObligatorios(): boolean {
    return this.documentosRequeridos
      .filter(d => d.obligatorio)
      .every(d => this.archivosActuales.some(a => a.nombre === d.label));
  }

  private validarExclusivos(): boolean {
    const exclusivosSubidos = this.archivosActuales.filter(a =>
      this.archivosExclusivos.includes(a.nombre)
    );
    return exclusivosSubidos.length <= 1;
  }

  private validarPermitidos(): boolean {
    const nombresPermitidos = [
      ...this.documentosRequeridos.map(d => d.label),
      ...this.archivosExclusivos
    ];
    return this.archivosActuales.every(a => nombresPermitidos.includes(a.nombre));
  }

  trackByLabel(index: number, item: { label: string }): string {
    return item.label;
  }
}
