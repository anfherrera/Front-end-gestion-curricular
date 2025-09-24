import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { FileUploadComponent } from '../../../shared/components/file-upload-dialog/file-upload-dialog.component';
import { RequiredDocsComponent } from '../../../shared/components/required-docs/required-docs.component';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud, Archivo, SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
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
    MatDialogModule,
    RequestStatusTableComponent,
    FileUploadComponent,
    RequiredDocsComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent implements OnInit {
  @ViewChild(FileUploadComponent) fileUploadComponent!: FileUploadComponent

  solicitudes: Solicitud[] = [];
  solicitudesCompletas: SolicitudHomologacionDTORespuesta[] = [];
  archivosActuales: Archivo[] = [];
  resetFileUpload = false;
  usuario: any = null;

  SolicitudStatusEnum = SolicitudStatusEnum;

  readonly documentosRequeridos = [
    { label: 'Formato PM-FO-4-FOR-27.pdf', obligatorio: true },
    { label: 'Autorización para publicar.pdf', obligatorio: true },
    { label: 'Formato de hoja de vida académica.pdf', obligatorio: true },
    { label: 'Comprobante de pago de derechos de sustentación.pdf', obligatorio: true },
    { label: 'Documento final del trabajo de grado.pdf', obligatorio: true }
  ];

  readonly archivosExclusivos = ['Formato TI-G.pdf', 'Formato PP-H.pdf'];
  readonly archivosOpcionales = ['Resultado pruebas SaberPro.pdf'];

  private readonly studentId = 1; // Opcional: puedes obtener dinámicamente del AuthService

  constructor(
    private pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Recuperamos usuario del localStorage
    const usuarioLS = localStorage.getItem('usuario');
    if (usuarioLS) {
      this.usuario = JSON.parse(usuarioLS);
      console.log('👤 Usuario cargado desde localStorage:', this.usuario);
    } else {
      console.warn('⚠️ No se encontró usuario en localStorage');
    }
    
    this.listarSolicitudes();
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

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const config = {
      duration: 3000,
      panelClass: [`snackbar-${tipo}`]
    };

    this.snackBar.open(mensaje, 'Cerrar', config);
  }

  // ================================
  // 🔹 Carga de solicitudes
  // ================================
  listarSolicitudes() {
    if (!this.usuario) {
      console.error("❌ Usuario no encontrado en localStorage.");
      return;
    }

    console.log('🔍 Usuario encontrado:', this.usuario);
    console.log('🔍 Rol:', this.usuario.rol.nombre);
    console.log('🔍 ID Usuario:', this.usuario.id_usuario);

    this.pazSalvoService.getStudentRequests(this.usuario.id_usuario).subscribe({
      next: (data) => {
        console.log('📡 Respuesta del backend (raw):', data);
        console.log('📡 Tipo de respuesta:', typeof data);
        console.log('📡 Es array:', Array.isArray(data));
        console.log('📡 Longitud:', data?.length);

        if (!data || !Array.isArray(data)) {
          console.warn('⚠️ La respuesta no es un array válido');
          this.solicitudes = [];
          this.solicitudesCompletas = [];
          return;
        }

        // Guardar las solicitudes completas
        this.solicitudesCompletas = data;

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

        // Cargar archivos de la última solicitud si existe
        if (this.ultimaSolicitud?.archivos) {
          this.archivosActuales = this.ultimaSolicitud.archivos.map(a => ({
            ...a,
            nombre: a.nombre.trim()
          }));
        }

        console.log('✅ Solicitudes cargadas:', this.solicitudes);
      },
      error: (err) => {
        console.error('❌ Error al cargar solicitudes:', err);
        this.mostrarMensaje(`Error al cargar solicitudes: ${err?.message || err}`, 'error');
      }
    });
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
        if (uploaded) {
          uploadedFiles.push({
            ...uploaded,
            nombre: uploaded.nombre?.trim() || archivo.nombre,
            fecha: uploaded.fecha ?? new Date().toISOString(), // 🔹 asegura string
            file: undefined, // ya no necesitamos el File temporal
          });
        }
      } catch (err) {
        this.snackBar.open(`Error subiendo archivo ${archivo.nombre}`, 'Cerrar', { duration: 3000 });
        // Mantener el archivo local aunque falle
        uploadedFiles.push({
          ...archivo,
          nombre: archivo.nombre.trim(),
          fecha: archivo.fecha ?? new Date().toISOString(),
        });
      }
    } else {
      uploadedFiles.push({
        ...archivo,
        nombre: archivo.nombre.trim(),
        fecha: archivo.fecha ?? new Date().toISOString(),
      });
    }
  }

  this.archivosActuales = uploadedFiles;
}


  // ================================
  // 🔹 Enviar solicitud
  // ================================
  onSolicitudEnviada() {
    if (!this.usuario) {
      console.error('❌ No se puede enviar solicitud: usuario no encontrado.');
      return;
    }

    if (!this.fileUploadComponent) {
      console.error('❌ No se puede acceder al componente de archivos.');
      return;
    }

    console.log('📤 Iniciando proceso de envío de solicitud...');

    // Paso 1: Subir archivos al backend
    this.fileUploadComponent.subirArchivosPendientes().subscribe({
      next: (archivosSubidos) => {
        console.log('✅ Archivos subidos correctamente:', archivosSubidos);

        // Paso 2: Crear la solicitud con los archivos ya subidos
        const solicitud = {
          nombre_solicitud: `Solicitud_paz_salvo_${this.usuario.nombre_completo}`,
          fecha_registro_solicitud: new Date().toISOString(),
          objUsuario: {
            id_usuario: this.usuario.id_usuario,
            nombre_completo: this.usuario.nombre_completo,
            codigo: this.usuario.codigo,
            correo: this.usuario.correo,
            objPrograma: this.usuario.objPrograma
          },
          archivos: archivosSubidos
        };

        console.log('📋 Creando solicitud con archivos:', solicitud);

        this.pazSalvoService.sendRequest(this.usuario.id_usuario, archivosSubidos).subscribe({
          next: (resp) => {
            console.log('✅ Solicitud creada en backend:', resp);
            this.listarSolicitudes();

            // Resetear el file upload
            this.resetFileUpload = true;
            setTimeout(() => this.resetFileUpload = false, 0);

            this.mostrarMensaje('🎉 ¡Solicitud de paz y salvo enviada correctamente!', 'success');
          },
          error: (err) => {
            console.error('❌ Error al crear solicitud:', err);
            if (err.status === 400) {
              this.mostrarMensaje('⚠️ Error de validación: revisa los datos de la solicitud', 'warning');
            } else {
              this.mostrarMensaje('❌ Error al enviar solicitud: ' + (err?.message || 'Error desconocido'), 'error');
            }
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al subir archivos:', err);
        this.mostrarMensaje('❌ Error al subir archivos: ' + (err?.message || 'Error desconocido'), 'error');
      }
    });
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
      ...this.archivosExclusivos,
      ...this.archivosOpcionales
    ];
    return this.archivosActuales.every(a => nombresPermitidos.includes(a.nombre));
  }

  trackByLabel(index: number, item: { label: string }): string {
    return item.label;
  }
}
