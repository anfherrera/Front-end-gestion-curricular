// core/models/solicitud-status.enum.ts
export enum SolicitudStatusEnum {
  ENVIADA = 'Enviada',
  EN_REVISION_SECRETARIA = 'En revisión por Secretaría',
  EN_REVISION_FUNCIONARIO = 'En revisión por Funcionario',
  EN_REVISION_COORDINADOR = 'En revisión por Coordinador',
  APROBADA = 'Aprobada',
  RECHAZADA = 'Rechazada' // siempre es bueno incluirlo
}
