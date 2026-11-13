/**
 * Estados de una solicitud tal como los envía el backend (`estado_actual`).
 * Los textos para mostrar están en ESTADOS_SOLICITUD_LABELS; para comparar un
 * valor que puede venir en otro formato ("Aprobada", "en revisión por secretaría")
 * usar `normalizarEstado` de core/utils/estado-solicitud.util.
 */
export enum EstadosSolicitud {
  ENVIADA = 'ENVIADA',
  EN_REVISION_SECRETARIA = 'EN_REVISION_SECRETARIA',
  EN_REVISION_FUNCIONARIO = 'EN_REVISION_FUNCIONARIO',
  EN_REVISION_COORDINADOR = 'EN_REVISION_COORDINADOR',
  APROBADA_FUNCIONARIO = 'APROBADA_FUNCIONARIO',
  APROBADA_COORDINADOR = 'APROBADA_COORDINADOR',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  PRE_REGISTRADO = 'PRE_REGISTRADO'
}

export const ESTADOS_SOLICITUD_LABELS: Record<EstadosSolicitud, string> = {
  [EstadosSolicitud.ENVIADA]: 'Enviada',
  [EstadosSolicitud.EN_REVISION_SECRETARIA]: 'En revisión por Secretaría',
  [EstadosSolicitud.EN_REVISION_FUNCIONARIO]: 'En revisión por Funcionario',
  [EstadosSolicitud.EN_REVISION_COORDINADOR]: 'En revisión por Coordinador',
  [EstadosSolicitud.APROBADA_FUNCIONARIO]: 'Aprobada por Funcionario',
  [EstadosSolicitud.APROBADA_COORDINADOR]: 'Aprobada por Coordinador',
  [EstadosSolicitud.APROBADA]: 'Aprobada',
  [EstadosSolicitud.RECHAZADA]: 'Rechazada',
  [EstadosSolicitud.PRE_REGISTRADO]: 'Pre-registrado'
};
