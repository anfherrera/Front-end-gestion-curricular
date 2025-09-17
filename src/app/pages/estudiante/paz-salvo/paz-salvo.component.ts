import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { FileUploadComponent } from '../../../shared/components/file-upload-dialog/file-upload-dialog.component';

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
    FileUploadComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent implements OnInit {
  solicitudes: Solicitud[] = [];
  archivosActuales: Archivo[] = [];
  resetFileUpload = false;
  studentId = 1;

  documentosRequeridos = [
    { label: 'Formato PM-FO-4-FOR-27.pdf', obligatorio: true },
    { label: 'Autorización para publicar.pdf', obligatorio: true },
    { label: 'Resultado pruebas SaberPro.pdf', obligatorio: false },
    { label: 'Formato de hoja de vida académica.pdf', obligatorio: true },
    { label: 'Comprobante de pago de derechos de sustentación.pdf', obligatorio: true },
    { label: 'Documento final del trabajo de grado.pdf', obligatorio: true }
  ];

  archivosExclusivos = ['Formato TI-G.pdf', 'Formato PP-H.pdf'];

  constructor(
    private snackBar: MatSnackBar,
    private pazSalvoService: PazSalvoService
  ) {}

  ngOnInit() {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.pazSalvoService.getStudentRequests(this.studentId).subscribe(solicitudes => {
      this.solicitudes = solicitudes;
      const ultima = solicitudes.at(-1);
      if (ultima?.archivos) {
        this.archivosActuales = ultima.archivos;
      }
    });
  }

  onArchivosChange(archivos: Archivo[]) {
    this.archivosActuales = archivos.filter(a => a.file);
  }

  onSolicitudEnviada() {
    if (!this.puedeEnviar()) return;

    this.pazSalvoService.sendRequest(this.studentId, this.archivosActuales).subscribe({
      next: () => {
        this.snackBar.open('Solicitud enviada correctamente', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.resetFileUpload = true;
        setTimeout(() => this.resetFileUpload = false, 100);
      },
      error: (err) => this.snackBar.open(err, 'Cerrar', { duration: 3000 })
    });
  }

  puedeEnviar(): boolean {
    const todosObligatorios = this.documentosRequeridos
      .filter(d => d.obligatorio)
      .every(d => this.archivosActuales.some(a => a.nombre.trim() === d.label));

    const exclusivosSubidos = this.archivosActuales.filter(a =>
      this.archivosExclusivos.includes(a.nombre.trim())
    );
    const tieneUnSoloExclusivo = exclusivosSubidos.length <= 1;

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
