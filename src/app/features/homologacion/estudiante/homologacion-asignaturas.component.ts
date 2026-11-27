import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import {
  Archivo,
  SolicitudHomologacionDTOPeticion,
  SolicitudHomologacionDTORespuesta,
} from '@core/models/procesos.model';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';
import { usuarioParaSolicitud } from '@core/utils/usuario-solicitud.util';
import { RequestStatusTableComponent } from '@shared/components/request-status/request-status.component';
import { FileUploadComponent } from '@shared/components/file-upload-dialog/file-upload-dialog.component';
import { Documento, RequiredDocsComponent } from '@shared/components/required-docs/required-docs.component';

import { HomologacionAsignaturasService } from '@features/homologacion/services/homologacion-asignaturas.service';
import { FormatosInstitucionalesService } from '@core/services/formatos-institucionales.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { getPeriodoActual } from '@core/utils/periodo.utils';
import { SolicitudEstudianteBase } from '@features/solicitudes/solicitud-estudiante.base';

@Component({
  selector: 'app-solicitud-homologacion',
  imports: [
    ReactiveFormsModule,
    CardContainerComponent,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FileUploadComponent,
    RequiredDocsComponent,
    RequestStatusTableComponent,
  ],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['../../solicitudes/solicitud-estudiante-comun.css', './homologacion-asignaturas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomologacionAsignaturasComponent extends SolicitudEstudianteBase<SolicitudHomologacionDTORespuesta> {
  private homologacionService = inject(HomologacionAsignaturasService);
  private formatosService = inject(FormatosInstitucionalesService);
  private periodosService = inject(PeriodosAcademicosService);
  private fb = inject(FormBuilder);

  documentosRequeridos: Documento[] = [
    { label: 'PM-FO-4-FOR-22 Solicitud homologación de materias', obligatorio: true, formatoDisponibleUrl: '' },
    { label: 'Certificado de notas', obligatorio: true },
    { label: 'Programa académico de la materia', obligatorio: true },
  ];

  protected override palabrasClaveDocumentos = {
    pmfo4for22: ['pmfo4for22', 'pm-fo-4-for-22', 'solicitud', 'homologacion', 'homologación'],
    certificado: ['certificado', 'notas', 'calificaciones', 'notas academicas'],
    programa: ['programa', 'academico', 'materia', 'asignatura', 'syllabus'],
  };

  protected readonly mensajeExito = '¡Solicitud de homologación enviada correctamente!';

  readonly solicitudForm = this.fb.group({
    programa_origen: ['', [Validators.maxLength(200)]],
    programa_destino: ['', [Validators.maxLength(200)]],
  });

  protected override alIniciar(): void {
    const homologacion = this.formatosService.getHomologacion();
    if (homologacion) {
      this.documentosRequeridos[0].label = homologacion.nombre;
      this.documentosRequeridos[0].formatoDisponibleUrl = homologacion.url;
    }
  }

  protected listar(usuario: UsuarioSesion) {
    return this.homologacionService.listarSolicitudesPorRol('ESTUDIANTE', usuario.id_usuario);
  }

  protected crearSolicitud(usuario: UsuarioSesion, archivos: Archivo[]) {
    const nombre = usuario.nombre_completo?.trim() || 'Usuario';
    const solicitud: SolicitudHomologacionDTOPeticion = {
      nombre_solicitud: `Solicitud Homologación - ${nombre}`,
      fecha_registro_solicitud: new Date().toISOString(),
      periodo_academico: this.periodosService.getPeriodoActualValue()?.valor || getPeriodoActual(),
      fecha_ceremonia: null,
      objUsuario: usuarioParaSolicitud(usuario),
      archivos,
      // Opcionales: vacío se envía como null
      programa_origen: this.solicitudForm.value.programa_origen?.trim() || null,
      programa_destino: this.solicitudForm.value.programa_destino?.trim() || null,
    };
    return this.homologacionService.crearSolicitud(solicitud);
  }

  descargarOficio(idSolicitud: number, nombreArchivo: string): void {
    this.descargarOficioDelProceso(
      this.homologacionService,
      idSolicitud,
      nombreArchivo || `oficio_homologacion_${idSolicitud}.pdf`
    );
  }
}
