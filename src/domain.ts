export type Module = 'hse' | 'vehicles' | 'quality';

export interface DemoDocument {
  id: string;
  title: string;
  module: Module;
  workId: string;
  period: string;
  status: string;
  owner: string;
  updatedAt: string;
  vehicle?: string;
  provider?: string;
  signatureInternal?: boolean;
  signatureExternal?: boolean;
  notes?: string;
  attachmentId?: string;
}

export interface Work {
  id: string;
  name: string;
  location: string;
  description: string;
}

export const moduleLabels: Record<Module, string> = {
  hse: 'Permisos HSE',
  vehicles: 'Reportes de vehículos',
  quality: 'Calidad y firmas',
};

export const statusOptions: Record<Module, string[]> = {
  hse: ['Borrador', 'En revisión', 'Aprobado'],
  vehicles: ['Pendiente de revisión', 'Listo para enviar', 'Enviado'],
  quality: ['Borrador', 'Pendiente de firma', 'Firmado', 'Enviado'],
};

export const works: Work[] = [
  {
    id: 'w-campo',
    name: 'Mantenimiento Neuquén',
    location: 'Neuquén, Argentina',
    description: 'Obra actual de ejemplo · mantenimiento y apoyo en campo · equipo de 4 personas.',
  },
  {
    id: 'w-montaje',
    name: 'Montaje Añelo',
    location: 'Añelo, Neuquén',
    description: 'Archivo de demostración · frente de montaje finalizado. Nombre y registros ficticios.',
  },
  {
    id: 'w-taller',
    name: 'Adecuación de taller',
    location: 'Cipolletti, Río Negro',
    description: 'Archivo de demostración · intervención finalizada. Nombre y registros ficticios.',
  },
];

// Excepto Alexis, los nombres y todos los registros son ejemplos ficticios.
export const initialDocuments: DemoDocument[] = [
  {
    id: 'hse-001', title: 'Permiso de trabajo en caliente', module: 'hse',
    workId: 'w-campo', period: '2026-10-29', status: 'En revisión',
    owner: 'Lucía Torres', updatedAt: '2026-10-29',
    notes: 'Ejemplo para revisar con el responsable HSE. Incluye tarea, sector y documentación adjunta. La autorización está simulada.',
  },
  {
    id: 'hse-002', title: 'Permiso de ingreso a frente de obra', module: 'hse',
    workId: 'w-campo', period: '2026-10-29', status: 'Borrador',
    owner: 'Bruno Rivas', updatedAt: '2026-10-28',
    notes: 'Borrador de demostración pendiente de completar. Campos y circuito sujetos a validación del encargado HSE.',
  },
  {
    id: 'hse-003', title: 'Permiso de trabajo — cierre de montaje', module: 'hse',
    workId: 'w-montaje', period: '2026-09-25', status: 'Aprobado',
    owner: 'Lucía Torres', updatedAt: '2026-09-25',
    notes: 'Registro de archivo ficticio. Aprobación de demostración, sin validez para autorizar tareas reales.',
  },
  {
    id: 'gps-001', title: 'Recorridos AB 123 CD · semana 43', module: 'vehicles',
    workId: 'w-campo', period: '19–25 oct 2026', status: 'Pendiente de revisión',
    owner: 'Alexis', updatedAt: '2026-10-27', vehicle: 'AB 123 CD', provider: 'Microtrack',
    notes: 'Reporte semanal de ejemplo pendiente de revisar. La plataforma no está conectada a Microtrack; el documento y la patente son ficticios.',
  },
  {
    id: 'gps-002', title: 'Recorridos AF 456 GH · octubre', module: 'vehicles',
    workId: 'w-campo', period: '2026-10', status: 'Listo para enviar',
    owner: 'Alexis', updatedAt: '2026-10-28', vehicle: 'AF 456 GH', provider: 'RSV',
    notes: 'Ejemplo de reporte mensual organizado para su entrega. No existe conexión con RSV ni envío automático en esta demo.',
  },
  {
    id: 'gps-003', title: 'Recorridos AC 789 JK · septiembre', module: 'vehicles',
    workId: 'w-montaje', period: '2026-09', status: 'Enviado',
    owner: 'Bruno Rivas', updatedAt: '2026-10-02', vehicle: 'AC 789 JK', provider: 'Full Control',
    notes: 'Archivo de demostración. Estado de envío simulado; no se enviaron archivos a terceros ni se conectó con Full Control.',
  },
  {
    id: 'gps-004', title: 'Recorridos AB 123 CD · cierre de taller', module: 'vehicles',
    workId: 'w-taller', period: '2026-09', status: 'Enviado',
    owner: 'Alexis', updatedAt: '2026-10-01', vehicle: 'AB 123 CD', provider: 'Otro proveedor',
    notes: 'Ejemplo de archivo histórico de un proveedor adicional, con envío simulado.',
  },
  {
    id: 'cal-001', title: 'Parte de calidad · semana 43', module: 'quality',
    workId: 'w-campo', period: '19–25 oct 2026', status: 'Pendiente de firma',
    owner: 'Alexis', updatedAt: '2026-10-28', signatureInternal: true, signatureExternal: false,
    notes: 'Ejemplo con conformidad interna registrada y firma de contraparte pendiente. Ambas firmas son simuladas; falta validar quiénes firman en el proceso real.',
  },
  {
    id: 'cal-002', title: 'Informe mensual de calidad · octubre', module: 'quality',
    workId: 'w-campo', period: '2026-10', status: 'Borrador',
    owner: 'Paula Medina', updatedAt: '2026-10-29', signatureInternal: false, signatureExternal: false,
    notes: 'Documento ficticio en preparación. Falta incorporar los últimos partes y enviar a revisión.',
  },
  {
    id: 'cal-003', title: 'Control de recepción de materiales', module: 'quality',
    workId: 'w-campo', period: '2026-10-26', status: 'Firmado',
    owner: 'Paula Medina', updatedAt: '2026-10-27', signatureInternal: true, signatureExternal: true,
    notes: 'Documento de demostración con las dos conformidades simuladas, disponible para encontrar y descargar.',
  },
  {
    id: 'cal-004', title: 'Informe de calidad · cierre de montaje', module: 'quality',
    workId: 'w-montaje', period: '2026-09', status: 'Enviado',
    owner: 'Alexis', updatedAt: '2026-10-02', signatureInternal: true, signatureExternal: true,
    notes: 'Archivo ficticio. Firmas y envío representados como simulación del circuito documental.',
  },
  {
    id: 'cal-005', title: 'Acta de conformidad · adecuación de taller', module: 'quality',
    workId: 'w-taller', period: '2026-09', status: 'Firmado',
    owner: 'Bruno Rivas', updatedAt: '2026-09-30', signatureInternal: true, signatureExternal: true,
    notes: 'Documento de archivo de demostración. Las dos conformidades son estados simulados.',
  },
];
