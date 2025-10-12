import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud, Archivo, SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentationViewerComponent } from '../../../shared/components/documentation-viewer/documentation-viewer.component';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { ComentarioDialogComponent, ComentarioDialogData } from '../../../shared/components/comentario-dialog/comentario-dialog.component';

@Component({
  selector: 'app-paz-salvo',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    RequestStatusTableComponent,
    DocumentationViewerComponent,
    CardContainerComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;

  solicitudes: Solicitud[] = [];
  selectedSolicitud: Solicitud | null = null;

  constructor(
    public pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    console.log('🔍 [DEBUG] Iniciando carga de solicitudes...');
    
    this.pazSalvoService.getPendingRequests().subscribe({
      next: (data) => {
        console.log('📡 [DEBUG] Solicitudes recibidas del backend:', data);
        console.log('📡 [DEBUG] Cantidad de solicitudes recibidas:', data.length);

        // Mapear a formato de solicitudes para la tabla
        this.solicitudes = data.map(solicitud => {
          const archivos = solicitud.documentos?.map((doc: DocumentoHomologacion) => ({
            id_documento: doc.id_documento,
            nombre: doc.nombre,
            ruta_documento: doc.ruta_documento,
            fecha: doc.fecha_documento,
            esValido: doc.esValido,
            comentario: doc.comentario
          })) || [];
          
          console.log('🔍 [DEBUG] Solicitud ID:', solicitud.id_solicitud, 'Archivos iniciales:', archivos);
          
          return {
            id: solicitud.id_solicitud,
            nombre: solicitud.nombre_solicitud,
            fecha: solicitud.fecha_registro_solicitud,
            estado: solicitud.estadosSolicitud?.[solicitud.estadosSolicitud.length - 1]?.estado_actual as SolicitudStatusEnum || SolicitudStatusEnum.ENVIADA,
            comentarios: solicitud.estadosSolicitud?.[solicitud.estadosSolicitud.length - 1]?.comentario || '',
            archivos: archivos
          };
        });

        console.log('✅ [DEBUG] Solicitudes mapeadas:', this.solicitudes);
        console.log('✅ [DEBUG] Total solicitudes mapeadas:', this.solicitudes.length);
      },
      error: (err) => {
        console.error('❌ [DEBUG] Error al cargar solicitudes:', err);
        this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSolicitudSeleccionada(solicitudId: number | null): void {
    console.log('🔍 [DEBUG] onSolicitudSeleccionada llamado con ID:', solicitudId);
    
    if (solicitudId === null) {
      console.log('🔍 [DEBUG] ID es null, limpiando selección');
      this.selectedSolicitud = null;
      return;
    }
    
    this.selectedSolicitud = this.solicitudes.find(s => s.id === solicitudId) || null;
    console.log('📋 [DEBUG] Solicitud encontrada:', this.selectedSolicitud);
    console.log('📋 [DEBUG] Archivos iniciales en solicitud:', this.selectedSolicitud?.archivos);
    
    // Cargar documentos usando el nuevo endpoint
    if (this.selectedSolicitud) {
      console.log('🔍 [DEBUG] Llamando a cargarDocumentos con ID:', this.selectedSolicitud.id);
      this.cargarDocumentos(this.selectedSolicitud.id);
    } else {
      console.log('❌ [DEBUG] No se encontró la solicitud con ID:', solicitudId);
    }
  }

  /**
   * 🆕 Cargar documentos usando el nuevo endpoint
   */
  cargarDocumentos(idSolicitud: number): void {
    console.log('🔍 [DEBUG] Iniciando carga de documentos para solicitud:', idSolicitud);
    
    const endpoint = `/api/solicitudes-pazysalvo/obtenerDocumentos/${idSolicitud}`;
    console.log('🔍 [DEBUG] Endpoint para funcionario:', endpoint);
    
    // Hacer petición directa para verificar si el endpoint funciona
    this.http.get<any[]>(`http://localhost:5000${endpoint}`).subscribe({
      next: (documentos: any[]) => {
        console.log('✅ [DEBUG] Petición directa exitosa - Documentos recibidos:', documentos);
        console.log('✅ [DEBUG] Cantidad de documentos (petición directa):', documentos.length);
        
        // Verificar si el backend devolvió un array vacío
        if (documentos.length === 0) {
          console.log('⚠️ [DEBUG] El backend devolvió un array vacío - posible problema en el backend');
          this.snackBar.open('No se encontraron documentos para esta solicitud. Verifique con el administrador.', 'Cerrar', { duration: 5000 });
        }
        
        // Actualizar los documentos de la solicitud seleccionada
        if (this.selectedSolicitud) {
          this.selectedSolicitud.archivos = documentos.map(doc => ({
            id_documento: doc.id,
            nombre: doc.nombreArchivo || doc.nombre,
            ruta_documento: doc.ruta,
            fecha: doc.fecha,
            esValido: doc.esValido,
            comentario: doc.comentario
          }));
          
          console.log('✅ [DEBUG] Documentos asignados al componente:', this.selectedSolicitud.archivos);
          console.log('✅ [DEBUG] Cantidad de archivos en solicitud:', this.selectedSolicitud.archivos.length);
          
          // Forzar detección de cambios usando setTimeout para evitar bucles
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 0);
        }
      },
      error: (error) => {
        console.error('❌ [DEBUG] Error en petición directa:', error);
        console.error('❌ [DEBUG] Error completo:', JSON.stringify(error));
        
        // Intentar con el servicio como fallback
        console.log('🔄 [DEBUG] Intentando con el servicio como fallback...');
        this.pazSalvoService.obtenerDocumentos(idSolicitud).subscribe({
          next: (documentos: any[]) => {
            console.log('✅ [DEBUG] Servicio fallback exitoso - Documentos:', documentos);
            
            if (this.selectedSolicitud) {
              this.selectedSolicitud.archivos = documentos.map(doc => ({
                id_documento: doc.id,
                nombre: doc.nombreArchivo || doc.nombre,
                ruta_documento: doc.ruta,
                fecha: doc.fecha,
                esValido: doc.esValido,
                comentario: doc.comentario
              }));
              
              setTimeout(() => {
                this.cdr.detectChanges();
              }, 0);
            }
          },
          error: (serviceError) => {
            console.error('❌ [DEBUG] Error también en el servicio:', serviceError);
            
            if (this.selectedSolicitud) {
              this.selectedSolicitud.archivos = [];
              setTimeout(() => {
                this.cdr.detectChanges();
              }, 0);
            }
            
            this.snackBar.open('Error al cargar documentos', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  get archivosDelEstudiante(): any[] {
    if (!this.selectedSolicitud?.archivos) {
      return [];
    }

    // Convertir Archivo[] a formato compatible con DocumentationViewerComponent
    return this.selectedSolicitud.archivos.map(archivo => ({
      ...archivo,
      fecha_documento: archivo.fecha, // Mapear fecha a fecha_documento
      id_documento: archivo.id_documento || 0
    }));
  }

  /**
   * Manejar cuando se agrega un comentario desde el DocumentationViewerComponent
   */
  onComentarioAgregado(event: {documento: any, comentario: string}): void {
    if (event.documento.id_documento) {
      this.pazSalvoService.agregarComentario(event.documento.id_documento, event.comentario).subscribe({
        next: () => {
          this.snackBar.open('Comentario añadido correctamente', 'Cerrar', { duration: 3000 });
          // Recargar la solicitud para actualizar los comentarios
          this.cargarSolicitudes();
        },
        error: (error) => {
          console.error('Error al añadir comentario:', error);
          this.snackBar.open('Error al añadir comentario', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }


  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    // Solo aprobar la solicitud (sin actualizar documentos para evitar error 500)
    this.pazSalvoService.approveRequest(this.selectedSolicitud.id).subscribe({
      next: () => {
        this.snackBar.open('Solicitud aprobada exitosamente ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.selectedSolicitud = null;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => {
        console.error('Error al aprobar solicitud:', err);
        this.snackBar.open('Error al aprobar solicitud', 'Cerrar', { duration: 3000 });
      }
    });
  }

  terminarValidacionSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.pazSalvoService.completeValidation(this.selectedSolicitud.id).subscribe({
      next: () => {
        this.snackBar.open('Solicitud enviada a revisión del coordinador ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.selectedSolicitud = null;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => {
        console.error('Error al enviar a revisión:', err);
        this.snackBar.open('Error al enviar solicitud a revisión', 'Cerrar', { duration: 3000 });
      }
    });
  }

  rechazarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    const dialogRef = this.dialog.open(RechazoDialogComponent, {
      width: '450px',
      data: <RechazoDialogData>{
        titulo: 'Rechazar solicitud',
        descripcion: 'Indique el motivo de rechazo de toda la solicitud:',
        placeholder: 'Motivo de rechazo'
      }
    });

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (motivo) {
        this.pazSalvoService.rejectRequest(this.selectedSolicitud!.id, motivo).subscribe({
          next: () => {
            this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
            this.selectedSolicitud = null;
            this.requestStatusTable?.resetSelection();
          },
          error: (err) => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

}
