import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DocumentRequest, DocumentTemplate } from '../../shared/components/document-generator/document-generator.component';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class DocumentGeneratorService {
  private apiUrl = 'http://localhost:5000/api/documentos';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtener plantillas disponibles para un proceso específico
   */
  getTemplates(proceso: string): Observable<DocumentTemplate[]> {
    return this.http.get<DocumentTemplate[]>(`${this.apiUrl}/templates/${proceso}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Generar documento usando plantilla
   */
  generarDocumento(request: DocumentRequest): Observable<Blob> {
    console.log('📄 Generando documento Word...', request);
    console.log('🔍 Tipo de documento:', request.tipoDocumento);

    // ✅ Para PAZ Y SALVO, usar endpoint específico
    if (request.tipoDocumento === 'OFICIO_PAZ_SALVO') {
      console.log('📄 Usando endpoint específico de Paz y Salvo');
      
      const formData = new FormData();
      
      // Campos OBLIGATORIOS
      formData.append('numeroDocumento', request.datosDocumento.numeroDocumento);
      formData.append('fechaDocumento', request.datosDocumento.fechaDocumento.toString());
      
      // Campos OPCIONALES
      if (request.datosSolicitud?.cedula) {
        formData.append('cedulaEstudiante', request.datosSolicitud.cedula);
      }
      if (request.datosSolicitud?.tituloTrabajoGrado) {
        formData.append('tituloTrabajoGrado', request.datosSolicitud.tituloTrabajoGrado);
      }
      if (request.datosSolicitud?.directorTrabajoGrado) {
        formData.append('directorTrabajoGrado', request.datosSolicitud.directorTrabajoGrado);
      }
      if (request.datosDocumento?.observaciones) {
        formData.append('observaciones', request.datosDocumento.observaciones);
      }
      
      const url = `http://localhost:5000/api/solicitudes-pazysalvo/generar-documento/${request.idSolicitud}`;
      console.log('🔗 URL para generar Paz y Salvo:', url);
      
      // Para FormData, no usar Content-Type (el navegador lo establece automáticamente)
      const headers = new HttpHeaders({
        'Authorization': this.getAuthHeaders().get('Authorization') || ''
      });
      
      return this.http.post(url, formData, {
        headers: headers,
        responseType: 'blob'
      });
    }

    // Para homologación y reingreso, usar el backend genérico
    if (request.tipoDocumento === 'OFICIO_HOMOLOGACION' || request.tipoDocumento === 'RESOLUCION_REINGRESO') {
      console.log('📄 Usando backend para generar documento:', request.tipoDocumento);
      return this.http.post(`${this.apiUrl}/generar`, request, {
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      });
    }

    // Para otros tipos, usar el generador del frontend
    console.log('📄 Usando generador del frontend para:', request.tipoDocumento);
    return new Observable(observer => {
      try {
        // Crear documento Word
        const doc = new Document({
          sections: [{
            properties: {},
            children: this.crearContenidoDocumento(request)
          }]
        });

        // Generar el archivo Word
        Packer.toBlob(doc).then(blob => {
          console.log('✅ Documento Word generado exitosamente');

          // Guardar en la base de datos
          this.guardarDocumentoEnBD(request, blob).subscribe({
            next: (response) => {
              console.log('💾 Documento guardado en BD:', response);
              observer.next(blob);
              observer.complete();
            },
            error: (error) => {
              console.error('❌ Error al guardar en BD:', error);
              // Aún así devolver el blob para descarga
              observer.next(blob);
              observer.complete();
            }
          });

        }).catch(error => {
          console.error('❌ Error al generar documento Word:', error);
          observer.error(error);
        });

      } catch (error) {
        console.error('❌ Error al crear documento:', error);
        observer.error(error);
      }
    });
  }

  /**
   * Guardar documento en la base de datos
   */
  private guardarDocumentoEnBD(request: DocumentRequest, blob: Blob): Observable<any> {
    console.log('🔍 Debug - Request completo:', request);
    console.log('🔍 Debug - tipoDocumento:', request.tipoDocumento);

    // Para paz-salvo y reingreso, NO guardamos en el backend (solo descargamos)
    if (request.tipoDocumento === 'OFICIO_PAZ_SALVO' || request.tipoDocumento === 'RESOLUCION_REINGRESO') {
      console.log('📄 ' + request.tipoDocumento + ': No guardando en backend, solo descargando archivo');
      // Retornar un observable que simula éxito
      return new Observable(observer => {
        observer.next({ success: true, message: 'Documento generado para descarga' });
        observer.complete();
      });
    }

    // Solo para homologación (aunque tampoco tiene endpoint, pero por si acaso)
    console.log('📄 Homologación: Intentando guardar en backend...');

    const formData = new FormData();

    // Crear archivo desde blob
    const archivo = new File([blob], this.generarNombreArchivo(request), {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    formData.append('file', archivo);

    // Validar y agregar idSolicitud
    if (request.idSolicitud) {
      formData.append('idSolicitud', request.idSolicitud.toString());
    } else {
      console.warn('⚠️ idSolicitud es undefined, usando valor por defecto');
      formData.append('idSolicitud', '1'); // Valor por defecto
    }

    formData.append('tipoDocumento', request.tipoDocumento);

    // Validar y agregar numeroDocumento
    if (request.datosDocumento?.numeroDocumento) {
      formData.append('numeroDocumento', request.datosDocumento.numeroDocumento);
    } else {
      console.warn('⚠️ numeroDocumento es undefined, usando valor por defecto');
      formData.append('numeroDocumento', '001-2024');
    }

    // Validar y agregar fechaDocumento
    if (request.datosDocumento?.fechaDocumento) {
      formData.append('fechaDocumento', request.datosDocumento.fechaDocumento.toString());
    } else {
      console.warn('⚠️ fechaDocumento es undefined, usando fecha actual');
      formData.append('fechaDocumento', new Date().toISOString().split('T')[0]);
    }

    if (request.datosDocumento?.observaciones) {
      formData.append('observaciones', request.datosDocumento.observaciones);
    }

    console.log('📤 Enviando FormData al backend...');

    // Solo para homologación (aunque no tiene endpoint)
    const endpoint = 'http://localhost:5000/api/solicitudes-homologacion/guardarOficio';
    console.log('🔗 Usando endpoint:', endpoint);

    return this.http.post(endpoint, formData, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Generar nombre de archivo
   */
  private generarNombreArchivo(request: DocumentRequest): string {
    const tipoDocumento = request.tipoDocumento || 'OFICIO';
    const nombreEstudiante = request.datosSolicitud?.nombreEstudiante || 'Estudiante';
    const numeroDocumento = request.datosDocumento?.numeroDocumento || '001-2024';
    const idSolicitud = request.idSolicitud || '1';

    // Limpiar nombre para archivo
    const nombreLimpio = nombreEstudiante.replaceAll(/[^a-zA-Z0-9]/g, '_');

    return `${tipoDocumento}_${nombreLimpio}_${idSolicitud}_${numeroDocumento}.docx`;
  }

  /**
   * Crear el contenido del documento Word
   */
  private crearContenidoDocumento(request: DocumentRequest): Paragraph[] {
    // Verificar el tipo de documento para usar la plantilla correspondiente
    if (request.tipoDocumento === 'OFICIO_PAZ_SALVO') {
      return this.crearContenidoPazSalvo(request);
    } else if (request.tipoDocumento === 'OFICIO_HOMOLOGACION') {
      return this.crearContenidoHomologacion(request);
    } else if (request.tipoDocumento === 'RESOLUCION_REINGRESO') {
      return this.crearContenidoReingreso(request);
    }

    // Plantilla por defecto (homologación)
    return this.crearContenidoHomologacion(request);
  }

  /**
   * Crear contenido específico para Paz y Salvo Académico
   */
  private crearContenidoPazSalvo(request: DocumentRequest): Paragraph[] {
    const contenido: Paragraph[] = [];

    // Número de documento y fecha
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${request.datosDocumento.numeroDocumento || '8.4.3-55.6/408'}`,
            bold: true,
            size: 24
          })
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Popayán, ${this.formatearFecha(request.datosDocumento.fechaDocumento)}`,
            size: 24
          })
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 400 }
      })
    );

    // Destinatario
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Doctora",
            size: 24
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "_________________________ (espacio a modificar)",
            bold: true,
            size: 24
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Secretaria General",
            size: 24
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Universidad del Cauca",
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    );

    // Asunto
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Asunto: Paz y Salvo Académico",
            bold: true,
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Apreciada Doctora.",
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    );

    // Cuerpo del documento
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "El Consejo de la Facultad de Ingeniería Electrónica y Telecomunicaciones reunido",
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `en sección ordinaria del día ${this.formatearFecha(request.datosDocumento.fechaDocumento)} y previa revisión del plan`,
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "de estudios, se permite informar a usted que el (la) estudiante",
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${request.datosSolicitud.nombreEstudiante || 'MANUEL ALEJANDRO VALLEJO TRUJILLO'}, identificado (a) con la cedula de ciudadanía`,
            bold: true,
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `# ${request.datosSolicitud.cedula || '1061807618'} de Popayán, Cauca y código ${request.datosSolicitud.codigoEstudiante || '104614020656'}, puede optar al título`,
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `de ${request.datosSolicitud.titulo || 'INGENIERO DE SISTEMAS'}, por haber cumplido con todos y cada uno de los`,
            bold: true,
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "requisitos exigidos para el efecto.",
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    );

    // Información del trabajo de grado
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "El estudiante terminó el plan de estudios el día _________________________ (espacio a modificar), sustentó el",
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `trabajo de grado denominado "${request.datosSolicitud.tituloTrabajoGrado || 'Asistente virtual basado en ChatGPT para resolver preguntas en un curso en línea introductorio de ciencia de datos'}",`,
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "dirigido por el _________________________ (espacio a modificar).",
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    );

    // Despedida
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Reciba un cordial saludo,",
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    );

    // Firma
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "ALEJANDRO TOLEDO TOVAR",
            bold: true,
            size: 24
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Presidente Consejo de Facultad",
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Copia: Historia académica estudiante",
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    );

    return contenido;
  }

  /**
   * Crear contenido específico para Homologación
   */
  private crearContenidoHomologacion(request: DocumentRequest): Paragraph[] {
    const contenido: Paragraph[] = [];

    // Encabezado
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "UNIVERSIDAD DEL CAUCA",
            bold: true,
            size: 32
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "FACULTAD DE INGENIERÍA ELECTRÓNICA Y TELECOMUNICACIONES",
            bold: true,
            size: 28
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Título del documento
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "OFICIO DE HOMOLOGACIÓN",
            bold: true,
            size: 32
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `No. ${request.datosDocumento.numeroDocumento}`,
            bold: true,
            size: 24
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Fecha: ${request.datosDocumento.fechaDocumento}`,
            size: 24
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Párrafo introductorio
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Por la cual se resuelve la solicitud de homologación de asignaturas",
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "EL COORDINADOR ACADÉMICO DE LA FACULTAD DE INGENIERÍA ELECTRÓNICA Y TELECOMUNICACIONES",
            bold: true,
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "En uso de sus facultades legales y reglamentarias, y",
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    );

    // CONSIDERANDO
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "CONSIDERANDO:",
            bold: true,
            size: 24
          })
        ],
        spacing: { after: 200 }
      })
    );

    // Considerandos
    const considerandos = [
      `Que el estudiante ${request.datosSolicitud.nombreEstudiante} con código ${request.datosSolicitud.codigoEstudiante} del programa de ${request.datosSolicitud.programa} ha presentado solicitud de homologación de asignaturas.`,
      "Que la solicitud ha sido revisada y aprobada por los funcionarios competentes.",
      "Que se cumplen todos los requisitos establecidos en el reglamento estudiantil."
    ];

    considerandos.forEach((texto, index) => {
      contenido.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${texto}`,
              size: 24
            })
          ],
          spacing: { after: 200 }
        })
      );
    });

    // RESUELVE
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "RESUELVE:",
            bold: true,
            size: 24
          })
        ],
        spacing: { before: 400, after: 200 }
      })
    );

    // Artículos
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `ARTÍCULO PRIMERO: Aprobar la homologación de asignaturas solicitada por el estudiante ${request.datosSolicitud.nombreEstudiante} con código ${request.datosSolicitud.codigoEstudiante}.`,
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "ARTÍCULO SEGUNDO: La presente resolución rige a partir de la fecha de su expedición.",
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "ARTÍCULO TERCERO: Comuníquese y cúmplase.",
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    );

    // Fecha y lugar
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Dada en Popayán, a los ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    );

    // Observaciones si existen
    if (request.datosDocumento.observaciones) {
      contenido.push(
        new Paragraph({
          children: [
            new TextRun({
              text: request.datosDocumento.observaciones,
              size: 24
            })
          ],
          spacing: { after: 400 }
        })
      );
    }

    // Firma
    contenido.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "_________________________",
            size: 24
          })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "COORDINADOR ACADÉMICO",
            bold: true,
            size: 24
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "FACULTAD DE INGENIERÍA ELECTRÓNICA Y TELECOMUNICACIONES",
            size: 24
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "UNIVERSIDAD DEL CAUCA",
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    );

    return contenido;
  }

  /**
   * Crear contenido específico para Reingreso
   */
  private crearContenidoReingreso(request: DocumentRequest): Paragraph[] {
    // Por ahora, usar la plantilla de homologación como base
    // Se puede personalizar más adelante si es necesario
    return this.crearContenidoHomologacion(request);
  }

  /**
   * Formatear fecha para el documento
   */
  private formatearFecha(fecha: string | Date): string {
    if (!fecha) return '';

    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Generar oficio de homologación (método específico)
   */
  generarOficioHomologacion(datos: any): Observable<Blob> {
    const request: DocumentRequest = {
      idSolicitud: datos.idSolicitud,
      tipoDocumento: 'OFICIO_HOMOLOGACION',
      datosDocumento: {
        numeroDocumento: datos.numeroResolucion,
        fechaDocumento: datos.fechaResolucion,
        observaciones: datos.observaciones || ''
      },
      datosSolicitud: {
        idSolicitud: datos.idSolicitud,
        nombreEstudiante: datos.nombreEstudiante,
        codigoEstudiante: datos.codigoEstudiante,
        programa: datos.programa,
        fechaSolicitud: datos.fechaSolicitud,
        estado: datos.estado
      }
    };

    return this.generarDocumento(request);
  }

  /**
   * Generar paz y salvo (método específico)
   */
  generarPazSalvo(datos: any): Observable<Blob> {
    const request: DocumentRequest = {
      idSolicitud: datos.idSolicitud,
      tipoDocumento: 'OFICIO_PAZ_SALVO',
      datosDocumento: {
        numeroDocumento: datos.numeroDocumento,
        fechaDocumento: datos.fechaDocumento,
        observaciones: datos.observaciones || ''
      },
      datosSolicitud: {
        idSolicitud: datos.idSolicitud,
        nombreEstudiante: datos.nombreEstudiante,
        codigoEstudiante: datos.codigoEstudiante,
        programa: datos.programa,
        fechaSolicitud: datos.fechaSolicitud,
        estado: datos.estado,
        // Campos específicos para paz y salvo
        cedula: datos.cedula,
        titulo: datos.titulo,
        tituloTrabajoGrado: datos.tituloTrabajoGrado
      }
    };

    return this.generarDocumento(request);
  }

  /**
   * Generar resolución de reingreso (método específico)
   */
  generarResolucionReingreso(datos: any): Observable<Blob> {
    const request: DocumentRequest = {
      idSolicitud: datos.idSolicitud,
      tipoDocumento: 'RESOLUCION_REINGRESO',
      datosDocumento: {
        numeroDocumento: datos.numeroResolucion,
        fechaDocumento: datos.fechaResolucion,
        observaciones: datos.observaciones || ''
      },
      datosSolicitud: {
        idSolicitud: datos.idSolicitud,
        nombreEstudiante: datos.nombreEstudiante,
        codigoEstudiante: datos.codigoEstudiante,
        programa: datos.programa,
        fechaSolicitud: datos.fechaSolicitud,
        estado: datos.estado
      }
    };

    return this.generarDocumento(request);
  }

  /**
   * Descargar archivo generado
   */
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    // Usar file-saver para descargar el archivo Word
    saveAs(blob, nombreArchivo);
  }

  /**
   * Obtener plantillas predefinidas (para uso local)
   */
  getTemplatesPredefinidos(): { [key: string]: DocumentTemplate[] } {
    return {
      homologacion: [
        {
          id: 'OFICIO_HOMOLOGACION',
          nombre: 'Oficio de Homologación',
          descripcion: 'Documento oficial que aprueba la homologación de asignaturas',
          camposRequeridos: ['numeroDocumento', 'fechaDocumento'],
          camposOpcionales: ['observaciones']
        }
      ],
      'paz-salvo': [
        {
          id: 'OFICIO_PAZ_SALVO',
          nombre: 'Paz y Salvo Académico',
          descripcion: 'Documento que certifica que el estudiante puede optar al título por haber cumplido todos los requisitos',
          camposRequeridos: ['numeroDocumento', 'fechaDocumento', 'nombreEstudiante', 'codigoEstudiante', 'cedula', 'titulo'],
          camposOpcionales: ['observaciones', 'tituloTrabajoGrado']
        }
      ],
      reingreso: [
        {
          id: 'RESOLUCION_REINGRESO',
          nombre: 'Resolución de Reingreso',
          descripcion: 'Documento que autoriza el reingreso del estudiante al programa',
          camposRequeridos: ['numeroDocumento', 'fechaDocumento'],
          camposOpcionales: ['observaciones', 'motivoReingreso']
        }
      ]
    };
  }
}
