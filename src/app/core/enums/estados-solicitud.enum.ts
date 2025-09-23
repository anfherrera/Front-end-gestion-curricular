export enum EstadosSolicitud {
  ENVIADA = 'ENVIADA',
  APROBADA_FUNCIONARIO = 'APROBADA_FUNCIONARIO',
  APROBADA_COORDINADOR = 'APROBADA_COORDINADOR',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA'
}

export const ESTADOS_SOLICITUD_LABELS = {
  [EstadosSolicitud.ENVIADA]: 'Enviada',
  [EstadosSolicitud.APROBADA_FUNCIONARIO]: 'Aprobada por Funcionario',
  [EstadosSolicitud.APROBADA_COORDINADOR]: 'Aprobada por Coordinador',
  [EstadosSolicitud.APROBADA]: 'Aprobada',
  [EstadosSolicitud.RECHAZADA]: 'Rechazada'
};

export const ESTADOS_SOLICITUD_COLORS = {
  [EstadosSolicitud.ENVIADA]: 'primary',
  [EstadosSolicitud.APROBADA_FUNCIONARIO]: 'accent',
  [EstadosSolicitud.APROBADA_COORDINADOR]: 'accent',
  [EstadosSolicitud.APROBADA]: 'primary',
  [EstadosSolicitud.RECHAZADA]: 'warn'
};
