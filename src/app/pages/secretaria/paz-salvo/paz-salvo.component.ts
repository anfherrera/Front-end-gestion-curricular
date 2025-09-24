// src/app/pages/secretaria/paz-salvo/secretaria-paz-salvo.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud, SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentGeneratorComponent } from '../../../shared/components/document-generator/document-generator.component';

@Component({
  selector: 'app-secretaria-paz-salvo',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RequestStatusTableComponent,
    DocumentGeneratorComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css'] // ✅ corregido
})
export class SecretariaPazSalvoComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;
  @ViewChild('documentGenerator') documentGenerator!: DocumentGeneratorComponent;
  
  solicitudes: Solicitud[] = [];
  selectedSolicitud: Solicitud | null = null;
  archivoPDF: File | null = null;
  archivoSubido = false;

  constructor(
    private pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  // 📌 Cargar solicitudes pendientes (solo las que pasaron por coordinador)
  cargarSolicitudes(): void {
    this.pazSalvoService.getPendingRequests().subscribe({
      next: (data) => {
        console.log('📡 Solicitudes recibidas del backend (secretaria):', data);
        
        // Mapear a formato de solicitudes para la tabla
        this.solicitudes = data.map(solicitud => ({
          id: solicitud.id_solicitud,
          nombre: solicitud.nombre_solicitud,
          fecha: solicitud.fecha_registro_solicitud,
          estado: solicitud.estadosSolicitud?.[solicitud.estadosSolicitud.length - 1]?.estado_actual as SolicitudStatusEnum || SolicitudStatusEnum.ENVIADA,
          comentarios: solicitud.estadosSolicitud?.[solicitud.estadosSolicitud.length - 1]?.comentario || '',
          archivos: solicitud.documentos?.map((doc: DocumentoHomologacion) => ({
            id_documento: doc.id_documento,
            nombre: doc.nombre,
            ruta_documento: doc.ruta_documento,
            fecha: doc.fecha_documento,
            esValido: doc.esValido,
            comentario: doc.comentario
          })) || []
        }));
        
        console.log('✅ Solicitudes mapeadas (secretaria):', this.solicitudes);
      },
      error: (err) => {
        console.error('❌ Error al cargar solicitudes (secretaria):', err);
        this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSolicitudSeleccionada(solicitudId: number | null): void {
    if (solicitudId === null) {
      this.selectedSolicitud = null;
      return;
    }
    this.selectedSolicitud = this.solicitudes.find(s => s.id === solicitudId) || null;
    console.log('📋 Solicitud seleccionada (secretaria):', this.selectedSolicitud);
  }

  // 📌 Generar oficio/resolución
  onGenerarDocumento(datos: any): void {
    if (!this.selectedSolicitud) return;

    // Generar el documento
    this.pazSalvoService.generateOfficio(this.selectedSolicitud.id).subscribe({
      next: (url) => {
        this.snackBar.open('Documento generado correctamente', 'Cerrar', { duration: 3000 });
        // Actualizar estado a APROBADA
        this.pazSalvoService.approveDefinitively(this.selectedSolicitud!.id).subscribe({
          next: () => {
            this.snackBar.open('Paz y Salvo aprobado definitivamente', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
            this.selectedSolicitud = null;
            this.requestStatusTable?.resetSelection();
          }
        });
      },
      error: () => this.snackBar.open('Error al generar documento', 'Cerrar', { duration: 3000 })
    });
  }

  // 📌 Manejar selección de archivo PDF
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.archivoPDF = file;
      this.archivoSubido = false;
    } else {
      this.snackBar.open('Por favor seleccione un archivo PDF válido', 'Cerrar', { duration: 3000 });
    }
  }

  // 📌 Subir archivo PDF
  subirPDF(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) return;

    this.pazSalvoService.subirArchivoPDF(this.archivoPDF, this.selectedSolicitud.id).subscribe({
      next: () => {
        this.snackBar.open('PDF subido correctamente', 'Cerrar', { duration: 3000 });
        this.archivoSubido = true;
      },
      error: (err) => {
        this.snackBar.open(`Error al subir PDF: ${err.error?.message || err.message}`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  // 📌 Enviar PDF al estudiante
  enviarPDFAlEstudiante(): void {
    if (!this.archivoSubido) {
      this.snackBar.open('Primero debe subir el archivo PDF', 'Cerrar', { duration: 3000 });
      return;
    }

    this.snackBar.open('PDF enviado al estudiante correctamente', 'Cerrar', { duration: 3000 });
    this.cargarSolicitudes();
    this.selectedSolicitud = null;
    this.requestStatusTable?.resetSelection();
    this.archivoPDF = null;
    this.archivoSubido = false;
  }
}
