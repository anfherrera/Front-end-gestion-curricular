import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { PruebasEcaesService, FechaEcaes, SolicitudEcaesRequest, SolicitudEcaesResponse } from '../../../core/services/pruebas-ecaes.service';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { FileUploadComponent } from '../../../shared/components/file-upload-dialog/file-upload-dialog.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { Archivo, Solicitud } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';

@Component({
  selector: 'app-pruebas-ecaes',
  imports: [
    CommonModule,
    MatSelectModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    FormsModule,
    ReactiveFormsModule,
    CardContainerComponent,
    FileUploadComponent,
    RequestStatusTableComponent
  ],
  templateUrl: './pruebas-ecaes.component.html',
  styleUrl: './pruebas-ecaes.component.css'
})
export class PruebasEcaesComponent implements OnInit {

  // Datos de fechas
  fechasEcaes: FechaEcaes[] = [];
  fechasSeleccionadas: FechaEcaes | null = null;
  periodoSeleccionado: string = '';

  // Configuración de la tabla
  displayedColumns: string[] = ['concepto', 'fecha'];
  conceptosFechas = [
    { concepto: 'Inscripción de estudiantes por parte de la Facultad', campo: 'inscripcion_est_by_facultad' },
    { concepto: 'Registro y recaudo ordinario', campo: 'registro_recaudo_ordinario' },
    { concepto: 'Registro y recaudo extraordinario', campo: 'registro_recaudo_extraordinario' },
    { concepto: 'Citación', campo: 'citacion' },
    { concepto: 'Aplicación', campo: 'aplicacion' },
    { concepto: 'Resultados individuales', campo: 'resultados_individuales' }
  ];

  // Formulario de solicitud
  solicitudForm: FormGroup;
  archivos: Archivo[] = [];
  enviandoSolicitud: boolean = false;
  usuario: any = null;

  // Seguimiento de solicitudes
  solicitudes: Solicitud[] = [];
  solicitudesCompletas: SolicitudEcaesResponse[] = [];

  // Opciones de tipo de documento
  tiposDocumento = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PA', label: 'Pasaporte' }
  ];

  constructor(
    private pruebasEcaesService: PruebasEcaesService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.solicitudForm = this.fb.group({
      tipoDocumento: ['CC', Validators.required],
      numero_documento: ['', [Validators.required, Validators.minLength(6)]],
      fecha_expedicion: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Recuperamos usuario del localStorage
    const usuarioLS = localStorage.getItem('usuario');
    if (usuarioLS) {
      this.usuario = JSON.parse(usuarioLS);
      console.log('👤 Usuario cargado desde localStorage:', this.usuario);
    } else {
      console.warn('⚠️ No se encontró usuario en localStorage');
    }

    this.cargarFechasEcaes();
    this.listarSolicitudes();
  }

  cargarFechasEcaes(): void {
    this.pruebasEcaesService.listarFechasEcaes().subscribe({
      next: (fechas) => {
        this.fechasEcaes = fechas;
        if (fechas.length > 0) {
          // Seleccionar el primer período por defecto
          this.periodoSeleccionado = fechas[0].periodoAcademico;
          this.fechasSeleccionadas = fechas[0];
        }
      },
      error: (error) => {
        console.error('Error al cargar fechas ECAES:', error);
        this.snackBar.open('Error al cargar las fechas de ECAES', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onPeriodoChange(): void {
    this.fechasSeleccionadas = this.fechasEcaes.find(fecha =>
      fecha.periodoAcademico === this.periodoSeleccionado
    ) || null;
  }

  getFechaFormateada(fecha: string): string {
    if (!fecha) return '';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getConceptoFecha(campo: string): string {
    if (!this.fechasSeleccionadas) return '';
    return this.getFechaFormateada(this.fechasSeleccionadas[campo as keyof FechaEcaes] as string);
  }

  // ================================
  // Métodos para manejo de archivos
  // ================================

  onArchivosChange(archivos: Archivo[]): void {
    this.archivos = archivos;
  }

  // ================================
  // Métodos para envío de solicitud
  // ================================

  enviarSolicitud(): void {
    if (this.solicitudForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.archivos.length === 0) {
      this.snackBar.open('Debe adjuntar al menos un archivo', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.usuario) {
      console.error('❌ No se puede enviar solicitud: usuario no encontrado.');
      this.snackBar.open('Error: Usuario no encontrado. Inicie sesión nuevamente.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.enviandoSolicitud = true;
    const formValue = this.solicitudForm.value;

    console.log('📤 Iniciando proceso de envío de solicitud...');

    // Paso 1: Subir archivos al backend (simulamos que ya están subidos)
    // En un caso real, aquí subirías los archivos primero
    const archivosSubidos = this.archivos.map(archivo => ({
      nombre: archivo.nombre,
      ruta_documento: archivo.ruta_documento || `uploads/${archivo.nombre}`,
      fecha_documento: new Date().toISOString(),
      esValido: true,
      comentario: 'Documento adjunto para inscripción ECAES',
      tipoDocumentoSolicitudPazYSalvo: 'ECAES'
    }));

    // Paso 2: Crear la solicitud con la estructura correcta
    const solicitud = {
      nombre_solicitud: 'Inscripción a Pruebas ECAES',
      fecha_registro_solicitud: new Date().toISOString(),
      esSeleccionado: true,
      objUsuario: {
        id_usuario: this.usuario.id_usuario,
        nombre_completo: this.usuario.nombre_completo,
        codigo: this.usuario.codigo,
        correo: this.usuario.correo,
        rol: this.usuario.rol,
        estado_usuario: this.usuario.estado_usuario,
        objPrograma: this.usuario.objPrograma
      },
      tipoDocumento: formValue.tipoDocumento,
      numero_documento: formValue.numero_documento,
      fecha_expedicion: formValue.fecha_expedicion.toISOString(),
      fecha_nacimiento: formValue.fecha_nacimiento.toISOString(),
      documentos: archivosSubidos
    };

    console.log('📋 Creando solicitud con archivos:', solicitud);

    this.pruebasEcaesService.crearSolicitudEcaes(solicitud).subscribe({
      next: (response: SolicitudEcaesResponse) => {
        console.log('✅ Solicitud creada en backend:', response);

        // Actualizar el estado a "ENVIADA" (opcional, no bloquea el flujo)
        this.pruebasEcaesService.actualizarEstadoSolicitud(response.id_solicitud, 'ENVIADA').subscribe({
          next: () => {
            console.log('✅ Estado actualizado a ENVIADA');
            this.snackBar.open('Solicitud enviada exitosamente ✅', 'Cerrar', { duration: 3000 });
            this.limpiarFormulario();
            this.listarSolicitudes(); // Recargar la lista de solicitudes
          },
          error: (error) => {
            console.warn('⚠️ Error al actualizar estado (CORS o backend):', error);
            // No mostramos error al usuario, la solicitud se creó correctamente
            this.snackBar.open('Solicitud enviada exitosamente ✅', 'Cerrar', { duration: 3000 });
            this.limpiarFormulario();
            this.listarSolicitudes();
          }
        });
      },
      error: (error) => {
        console.error('Error al enviar solicitud:', error);
        console.error('Error details:', error.error);
        this.snackBar.open(`Error al enviar la solicitud: ${error.error?.message || error.message}`, 'Cerrar', { duration: 5000 });
        this.enviandoSolicitud = false;
      }
    });
  }

  limpiarFormulario(): void {
    this.solicitudForm.reset({
      tipoDocumento: 'CC',
      numero_documento: '',
      fecha_expedicion: '',
      fecha_nacimiento: ''
    });
    this.archivos = [];
    this.enviandoSolicitud = false;
  }

  // ================================
  // Métodos de validación
  // ================================

  esCampoInvalido(campo: string): boolean {
    const control = this.solicitudForm.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  obtenerMensajeError(campo: string): string {
    const control = this.solicitudForm.get(campo);
    if (control?.errors) {
      if (control.errors['required']) return 'Este campo es requerido';
      if (control.errors['minlength']) return 'Mínimo 6 caracteres';
    }
    return '';
  }

  // ================================
  // Métodos para seguimiento de solicitudes
  // ================================

  listarSolicitudes(): void {
    if (!this.usuario) {
      console.error("❌ Usuario no encontrado en localStorage.");
      return;
    }

    console.log('🔍 Usuario encontrado:', this.usuario);
    console.log('🔍 Rol:', this.usuario.rol.nombre);
    console.log('🔍 ID Usuario:', this.usuario.id_usuario);

    this.pruebasEcaesService.listarSolicitudesEcaes().subscribe({
      next: (data) => {
        console.log('📡 Respuesta del backend (raw):', data);
        this.procesarSolicitudes(data);
      },
      error: (err) => {
        console.error('❌ Error al cargar solicitudes:', err);
        this.snackBar.open('Error al cargar las solicitudes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  procesarSolicitudes(data: SolicitudEcaesResponse[]): void {
    if (!data || !Array.isArray(data)) {
      console.warn('⚠️ La respuesta no es un array válido');
      this.solicitudes = [];
      this.solicitudesCompletas = [];
      return;
    }

    // Guardar las solicitudes completas
    this.solicitudesCompletas = data;

    this.solicitudes = data.map((sol: SolicitudEcaesResponse) => {
      console.log('🔍 Procesando solicitud:', sol);

      const estados = sol.estadosSolicitud || [];
      const ultimoEstado = estados.length > 0 ? estados[estados.length - 1] : null;

      const solicitudTransformada: Solicitud = {
        id: sol.id_solicitud,
        nombre: sol.nombre_solicitud,
        fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
        estado: this.mapearEstado(ultimoEstado?.estado_actual || 'Pendiente'),
        oficioUrl: '',
        comentarios: ultimoEstado?.comentario || ''
      };

      console.log('✅ Solicitud transformada:', solicitudTransformada);
      return solicitudTransformada;
    });

    console.log('📋 Solicitudes cargadas (transformadas):', this.solicitudes);
  }

  verComentarios(solicitudId: number): void {
    console.log('Ver comentarios para solicitud:', solicitudId);
    // Implementar lógica para mostrar comentarios
  }

  descargarOficio(id: number, nombreArchivo: string): void {
    console.log('Descargar oficio:', id, nombreArchivo);
    // Implementar lógica para descargar oficio
  }

  // ================================
  // Métodos auxiliares
  // ================================

  private mapearEstado(estadoString: string): SolicitudStatusEnum {
    switch (estadoString.toLowerCase()) {
      case 'enviada':
        return SolicitudStatusEnum.ENVIADA;
      case 'en revisión por secretaría':
      case 'en_revision_secretaria':
        return SolicitudStatusEnum.EN_REVISION_SECRETARIA;
      case 'en revisión por funcionario':
      case 'en_revision_funcionario':
        return SolicitudStatusEnum.EN_REVISION_FUNCIONARIO;
      case 'en revisión por coordinador':
      case 'en_revision_coordinador':
        return SolicitudStatusEnum.EN_REVISION_COORDINADOR;
      case 'aprobada':
        return SolicitudStatusEnum.APROBADA;
      case 'rechazada':
        return SolicitudStatusEnum.RECHAZADA;
      default:
        return SolicitudStatusEnum.ENVIADA; // Estado por defecto
    }
  }
}
