export const EXAMPLES = [
  {id: 'correo', label: 'Correo', icon: 'email', type: 'EMAIL', beforeTitle: 'Otra solicitud por correo',
    before: 'Leer el mensaje, buscar el contexto y decidir quién debe atenderlo.',
    action: 'Clasifica y prioriza', afterTitle: 'Una solicitud con prioridad',
    after: 'Tema, contexto y siguiente paso preparados para el equipo.',
    details: ['Solicitud clasificada', 'Prioridad propuesta', 'Responsable identificado'],
    review: 'Tu equipo confirma la prioridad.'},
  {id: 'documento', label: 'Documento', icon: 'document', type: 'DOCUMENTO', beforeTitle: 'Datos dentro de un archivo',
    before: 'Abrir el documento y copiar a mano la información que hace falta.',
    action: 'Extrae y estructura', afterTitle: 'Información lista para utilizar',
    after: 'Los datos relevantes, organizados para continuar el proceso.',
    details: ['Datos extraídos', 'Información estructurada', 'Campos pendientes señalados'],
    review: 'Tu equipo valida los datos.'},
  {id: 'incidencia', label: 'Incidencia', icon: 'ticket', type: 'INCIDENCIA', beforeTitle: 'La misma duda, otra vez',
    before: 'Buscar casos anteriores y volver a preparar una respuesta desde cero.',
    action: 'Busca y prepara', afterTitle: 'Una respuesta con contexto',
    after: 'Antecedentes y una propuesta para que soporte pueda actuar.',
    details: ['Casos relacionados', 'Respuesta propuesta', 'Contexto para soporte'],
    review: 'Tu equipo revisa y decide.'},
];

export function applyRoutingAppearance(piece, card, state) {
  const opacity = state.backgroundOpacity;
  for (const material of piece.materials()) {
    const transparent = opacity < 1;
    if (material.transparent !== transparent) {material.transparent = transparent; material.needsUpdate = true;}
    material.opacity = opacity;
  }
  if (state.ordered === 1) piece.mesh.visible = opacity > .001;
  piece.mesh.castShadow = opacity > .5;
}
