import { Component, OnChanges, SimpleChanges, inject, input, model, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Archivo } from '@core/models/procesos.model';
import { ArchivosService } from '@core/services/archivos.service';
import { PazSalvoService } from '@core/services/paz-salvo.service';
import { Observable, of, forkJoin } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { SnackbarService } from '@core/services/snackbar.service';

/** Lo que devuelve el backend al subir un archivo (cada servicio usa nombres algo distintos). */
type RespuestaSubida = Partial<Archivo> & { nombreArchivo?: string; titulo?: string; ruta?: string };

const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10MB

@Component({
  selector: 'app-file-upload',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './file-upload-dialog.component.html',
  styleUrls: ['./file-upload-dialog.component.css']
})
export class FileUploadComponent implements OnChanges {
  private archivosService = inject(ArchivosService);
  private pazSalvoService = inject(PazSalvoService);
  private snackbar = inject(SnackbarService);

  /** Archivos elegidos; se usa con `[archivos]` y `(archivosChange)` (o `[(archivos)]`). */
  readonly archivos = model<Archivo[]>([]);
  readonly reset = input(false);                  // Para reiniciar desde el padre
  readonly archivosExclusivos = input<string[]>([]); // Archivos que son mutuamente exclusivos
  readonly proceso = input('general');    // Tipo de proceso: 'general', 'paz-salvo', etc.

  readonly cargando = signal(false);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reset'] && changes['reset'].currentValue) {
      // En el siguiente tick para evitar NG0100 (ExpressionChangedAfterItHasBeenCheckedError):
      // el padre no debe ver [archivos] pasar a [] en el mismo ciclo de detección.
      setTimeout(() => this.archivos.set([]), 0);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const nuevos = [...this.archivos()];
    const exclusivos = this.archivosExclusivos();

    Array.from(input.files).forEach(file => {
      // Validaciones
      if (file.type !== 'application/pdf') {
        this.snackbar.advertencia('Solo se permiten archivos PDF');
        return;
      }

      if (file.size > TAMANO_MAXIMO) {
        this.snackbar.advertencia(`El archivo "${file.name}" es demasiado grande. Tamaño máximo: 10MB. Tamaño actual: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
      }

      // Validar archivos duplicados
      if (nuevos.some(archivo => archivo.nombre === file.name)) {
        this.snackbar.advertencia(`El archivo "${file.name}" ya ha sido seleccionado. No se permiten archivos duplicados.`);
        return;
      }

      // Validar archivos exclusivos
      if (exclusivos.length > 0 && exclusivos.some(exclusivo => file.name.includes(exclusivo))) {
        const archivoExclusivoExistente = nuevos.find(archivo =>
          exclusivos.some(exclusivo => archivo.nombre.includes(exclusivo))
        );
        if (archivoExclusivoExistente) {
          this.snackbar.advertencia(`Ya has seleccionado "${archivoExclusivoExistente.nombre}". Solo puedes subir uno de los siguientes archivos: ${exclusivos.join(' o ')}`);
          return;
        }
      }

      // Solo agregar el archivo localmente, sin subirlo al backend
      nuevos.push({
        file,                            // mantener referencia del archivo
        nombre: file.name,
        fecha: new Date().toISOString(), // fecha de selección
        estado: 'pendiente',
        esValido: true                   // asumir válido hasta que se suba
      });
    });

    this.archivos.set(nuevos);
    input.value = ''; // limpiar input
  }

  removeFile(index: number) {
    this.archivos.update(archivos => archivos.filter((_, i) => i !== index));
  }

  /**
   * Sube todos los archivos pendientes al backend
   * @returns Observable que emite cuando todos los archivos han sido subidos
   */
  subirArchivosPendientes(): Observable<Archivo[]> {
    const archivosPendientes = this.archivos().filter(archivo => archivo.file && !archivo.id_documento);

    if (archivosPendientes.length === 0) {
      return of(this.archivos()); // Si no hay archivos pendientes, retornar los existentes
    }

    this.cargando.set(true);

    const subidas$ = archivosPendientes.map(archivo => {
      const file = archivo.file!;
      return this.subir(file).pipe(
        // Actualizar el archivo local con la información del backend
        tap({
          next: subido => this.reemplazar(file, actual => ({
            ...actual,
            ...subido,
            nombre: subido?.nombre || subido?.nombreArchivo || subido?.titulo || actual.nombre,
            file, // mantener referencia local
            estado: 'aprobado',
            esValido: true,
            url: subido?.ruta_documento || subido?.ruta || subido?.url || actual.url
          })),
          error: () => this.reemplazar(file, actual => ({ ...actual, estado: 'error', esValido: false }))
        })
      );
    });

    return forkJoin(subidas$).pipe(
      map(() => this.archivos()),
      finalize(() => this.cargando.set(false))
    );
  }

  /**
   * Resetear el estado de carga (método público para casos de emergencia)
   */
  resetearEstadoCarga() {
    this.cargando.set(false);
  }

  /** Usa el servicio de subida que corresponde al proceso. */
  private subir(file: File): Observable<RespuestaSubida> {
    return this.proceso() === 'paz-salvo'
      ? this.pazSalvoService.subirDocumento(file)
      : this.archivosService.subirPDF(file);
  }

  private reemplazar(file: File, cambio: (archivo: Archivo) => Archivo): void {
    this.archivos.update(archivos => archivos.map(a => a.file === file ? cambio(a) : a));
  }
}
