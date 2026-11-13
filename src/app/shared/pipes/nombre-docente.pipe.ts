import { Pipe, PipeTransform } from '@angular/core';
import { CursoOfertadoVerano } from '../../core/models/cursos-intersemestrales.model';
import { nombreDocente } from '../../core/utils/cursos-verano.utils';

/** `{{ curso | nombreDocente }}` → nombre del docente, "Sin asignar" o "Sin nombre". */
@Pipe({ name: 'nombreDocente', standalone: true })
export class NombreDocentePipe implements PipeTransform {
  transform(curso: Pick<CursoOfertadoVerano, 'objDocente'> | null | undefined): string {
    return nombreDocente(curso);
  }
}
