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
  readonly studentId = 1;

  SolicitudStatusEnum = SolicitudStatusEnum; // ✅ exponemos el enum al template

  readonly documentosRequeridos: { label: string; obligatorio: boolean }[] = [
    { label: 'Formato PM-FO-4-FOR-27.pdf', obligatorio: true },
    { label: 'Autorización para publicar.pdf', obligatorio: true },
    { label: 'Resultado pruebas SaberPro.pdf', obligatorio: false },
    { label: 'Formato de hoja de vida académica.pdf', obligatorio: true },
    { label: 'Comprobante de pago de derechos de sustentación.pdf', obligatorio: true },
    { label: 'Documento final del trabajo de grado.pdf', obligatorio: true }
  ];

  readonly archivosExclusivos: string[] = [
    'Formato TI-G.pdf',
    'Formato PP-H.pdf'
  ];

  constructor(
    private snackBar: MatSnackBar,
    private pazSalvoService: PazSalvoService
  ) {}

  ngOnInit() {
    this.cargarSolicitudes();
  }

  get ultimaSolicitud(): Solicitud | undefined {
    return this.solicitudes[this.solicitudes.length - 1];
  }

  // 👇 getter para el texto del botón
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

  cargarSolicitudes(): void {
    this.pazSalvoService.getStudentRequests(this.studentId).subscribe(solicitudes => {
      this.solicitudes = solicitudes;
      if (this.ultimaSolicitud?.archivos) {
        this.archivosActuales = this.ultimaSolicitud.archivos;
      }
    });
  }

  onArchivosChange(archivos: Archivo[]): void {
    this.archivosActuales = archivos.filter(a => !!a.file);
  }

  onSolicitudEnviada(): void {
    if (!this.puedeEnviar()) return;

    this.pazSalvoService.sendRequest(this.studentId, this.archivosActuales).subscribe({
      next: () => {
        this.snackBar.open('Solicitud enviada correctamente', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.resetFileUpload = true;
        setTimeout(() => (this.resetFileUpload = false), 100);
      },
      error: (err) => this.snackBar.open(err, 'Cerrar', { duration: 3000 })
    });
  }

  puedeEnviar(): boolean {
    return (
      this.validarObligatorios() &&
      this.validarExclusivos() &&
      this.validarPermitidos()
    );
  }

  private validarObligatorios(): boolean {
    return this.documentosRequeridos
      .filter(d => d.obligatorio)
      .every(d => this.archivosActuales.some(a => a.nombre.trim() === d.label));
  }

  private validarExclusivos(): boolean {
    const exclusivosSubidos = this.archivosActuales.filter(a =>
      this.archivosExclusivos.includes(a.nombre.trim())
    );
    return exclusivosSubidos.length <= 1;
  }

  private validarPermitidos(): boolean {
    const nombresPermitidos = [
      ...this.documentosRequeridos.map(d => d.label),
      ...this.archivosExclusivos
    ];
    return this.archivosActuales.every(a =>
      nombresPermitidos.includes(a.nombre.trim())
    );
  }

  trackByLabel(index: number, item: { label: string }): string {
    return item.label;
  }
}
