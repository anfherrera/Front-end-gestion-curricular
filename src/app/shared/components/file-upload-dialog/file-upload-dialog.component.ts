import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Archivo } from '../../../core/models/procesos.model';
import { ArchivosService } from '../../../core/services/archivos.service';
import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Observable, of, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './file-upload-dialog.component.html',
  styleUrls: ['./file-upload-dialog.component.css']
})
export class FileUploadComponent implements OnChanges {
  @Input() archivos: Archivo[] = [];
  @Input() reset = false;                  // Para reiniciar desde el padre
  @Input() archivosExclusivos: string[] = []; // Archivos que son mutuamente exclusivos
  @Input() proceso: string = 'general';    // Tipo de proceso: 'general', 'paz-salvo', etc.
  @Output() archivosChange = new EventEmitter<Archivo[]>();

  cargando: boolean = false;

  constructor(
    private archivosService: ArchivosService,
    private pazSalvoService: PazSalvoService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reset'] && changes['reset'].currentValue) {
      this.archivos = [];
      this.notificarCambio();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => {
      // Validaciones
      if (file.type !== 'application/pdf') {
        alert('⚠️ Solo se permiten archivos PDF');
        return;
      }

      // Validar tamaño máximo (10MB)
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxFileSize) {
        alert(`⚠️ El archivo "${file.name}" es demasiado grande. Tamaño máximo: 10MB. Tamaño actual: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
      }

      // Validar archivos duplicados
      const archivoDuplicado = this.archivos.find(archivo => archivo.nombre === file.name);
      if (archivoDuplicado) {
        alert(`⚠️ El archivo "${file.name}" ya ha sido seleccionado. No se permiten archivos duplicados.`);
        return;
      }

      // Validar archivos exclusivos
      if (this.archivosExclusivos.length > 0) {
        const esArchivoExclusivo = this.archivosExclusivos.some(archivoExclusivo => 
          file.name.includes(archivoExclusivo)
        );
        
        if (esArchivoExclusivo) {
          // Verificar si ya existe otro archivo exclusivo
          const archivoExclusivoExistente = this.archivos.find(archivo => 
            this.archivosExclusivos.some(archivoExclusivo => 
              archivo.nombre.includes(archivoExclusivo)
            )
          );
          
          if (archivoExclusivoExistente) {
            alert(`⚠️ Ya has seleccionado "${archivoExclusivoExistente.nombre}". Solo puedes subir uno de los siguientes archivos: ${this.archivosExclusivos.join(' o ')}`);
            return;
          }
        }
      }

      // Solo agregar el archivo localmente, sin subirlo al backend
      const archivoLocal: Archivo = {
        file: file,                    // mantener referencia del archivo
        nombre: file.name,             // nombre del archivo
        fecha: new Date().toISOString(), // fecha de selección
        estado: 'pendiente',           // estado inicial
        esValido: true                 // asumir válido hasta que se suba
      };

      this.archivos.push(archivoLocal);
    });

    this.notificarCambio();
    input.value = ''; // limpiar input
  }

  removeFile(index: number) {
    this.archivos.splice(index, 1);
    this.notificarCambio();
  }

  /**
   * Sube todos los archivos pendientes al backend
   * @returns Observable que emite cuando todos los archivos han sido subidos
   */
  subirArchivosPendientes(): Observable<Archivo[]> {
    const archivosPendientes = this.archivos.filter(archivo => archivo.file && !archivo.id_documento);

    if (archivosPendientes.length === 0) {
      return of(this.archivos); // Si no hay archivos pendientes, retornar los existentes
    }

    this.cargando = true;

    // Subir archivos uno por uno usando el servicio correcto según el proceso
    const subidas$ = archivosPendientes.map(archivo => {
      let subida$: Observable<any>;
      
      // Usar el servicio correcto según el proceso
      if (this.proceso === 'paz-salvo') {
        console.log('🔄 Usando servicio Paz y Salvo para subir:', archivo.nombre);
        subida$ = this.pazSalvoService.subirDocumento(archivo.file!);
      } else {
        console.log('🔄 Usando servicio genérico para subir:', archivo.nombre);
        subida$ = this.archivosService.subirPDF(archivo.file!);
      }

      return subida$.pipe(
        map(archivoSubido => {
          // Actualizar el archivo local con la información del backend
          const index = this.archivos.findIndex(a => a.file === archivo.file);
          if (index !== -1) {
            this.archivos[index] = {
              ...archivoSubido,
              file: archivo.file, // mantener referencia local
              estado: 'aprobado',
              url: archivoSubido.ruta_documento || archivoSubido.nombre
            };
          }
          return this.archivos[index];
        }),
        tap({
          error: (error) => {
            console.error(`❌ Error al subir archivo ${archivo.nombre}:`, error);
            // Marcar el archivo como con error
            const index = this.archivos.findIndex(a => a.file === archivo.file);
            if (index !== -1) {
              this.archivos[index].estado = 'error';
              this.archivos[index].esValido = false;
            }
          }
        })
      );
    });

    return forkJoin(subidas$).pipe(
      tap({
        next: () => {
          this.cargando = false;
          this.notificarCambio();
        },
        error: (error) => {
          console.error('❌ Error al subir archivos:', error);
          this.cargando = false;
          this.notificarCambio();
        }
      }),
      map(() => this.archivos),
      tap({
        error: (error) => {
          // Asegurar que siempre se resetee el estado de carga
          this.cargando = false;
          this.notificarCambio();
        }
      })
    );
  }

  private notificarCambio() {
    this.archivosChange.emit(this.archivos);
  }

  /**
   * Resetear el estado de carga (método público para casos de emergencia)
   */
  resetearEstadoCarga() {
    this.cargando = false;
    this.notificarCambio();
  }
}
