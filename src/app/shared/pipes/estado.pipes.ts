import { Pipe, PipeTransform } from '@angular/core';
import { estadoClase, estadoColor, estadoIcono, estadoLabel } from '@core/utils/estado-solicitud.util';

/** `{{ estado | estadoLabel }}` → "Aprobada por Funcionario" */
@Pipe({ name: 'estadoLabel' })
export class EstadoLabelPipe implements PipeTransform {
  transform(estado: string | null | undefined): string {
    return estadoLabel(estado);
  }
}

/** `[style.color]="estado | estadoColor"` → color institucional en hex */
@Pipe({ name: 'estadoColor' })
export class EstadoColorPipe implements PipeTransform {
  transform(estado: string | null | undefined): string {
    return estadoColor(estado);
  }
}

/** `{{ estado | estadoIcono }}` → nombre del icono de Material */
@Pipe({ name: 'estadoIcono' })
export class EstadoIconoPipe implements PipeTransform {
  transform(estado: string | null | undefined): string {
    return estadoIcono(estado);
  }
}

/** `[class]="estado | estadoClase"` → estado-aprobada, estado-rechazada, estado-enviada, estado-proceso o estado-default */
@Pipe({ name: 'estadoClase' })
export class EstadoClasePipe implements PipeTransform {
  transform(estado: string | null | undefined): string {
    return estadoClase(estado);
  }
}
