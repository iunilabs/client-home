import * as THREE from 'three';

export const CHANNELS = ['email', 'chat', 'ticket', 'document', 'task'];
export const INK = '#164a6b';
const palette = { email: '#169cd3', chat: '#7773b7', ticket: '#518eae', document: '#b9767a', task: '#63958a' };
const noteContent = [
  ['Era urgente.', 'Sigue pendiente.'], ['Cruzar', 'los datos.'], ['Comprobar', 'la firma.'], ['Llamar', 'al proveedor.'], ['Pendiente', 'de respuesta.'], ['Revisar', 'la fecha.'], ['Enviar', 'el resumen.'], ['Buscar', 'el expediente.'], ['Confirmar', 'el contacto.'], ['Validar', 'el detalle.'], ['Archivar', 'el original.'], ['Preparar', 'el anexo.'], ['Revisar', 'los accesos.'], ['Ordenar', 'los adjuntos.'], ['Actualizar', 'la dirección.'], ['Anotar', 'el acuerdo.'],
];
const channelContent = {
  email: ['Confirmar los cambios', 'Respuesta a la consulta', 'Revisión del anexo', 'Fecha de entrega', 'Resumen del comité', 'Actualización de alcance', 'Confirmación de recepción', 'Revisión de condiciones', 'Nueva versión del informe', 'Consulta sobre la factura', 'Validar el envío', 'Calendario de entregas', 'Documento de referencia', 'Observaciones del equipo'],
  chat: ['¿Está listo el informe?', 'Necesitamos el dato de cierre', 'Lo revisamos a las diez', '¿Quién valida este punto?', 'Falta confirmar una cifra', 'Te comparto la actualización', 'La reunión pasa al jueves', 'Tenemos una nueva respuesta', '¿Puedes revisar el anexo?', 'Ya está disponible el archivo', 'La propuesta está en revisión', 'Lo vemos con el equipo'],
  ticket: ['Error en producción', 'Acceso pendiente', 'Validar una conexión', 'Revisar el servicio', 'Fallo en la importación', 'Comprobar la integración', 'Solicitud duplicada', 'Incidencia de permisos', 'Reintentar el proceso', 'Validar la sincronización', 'Revisar la carga de datos', 'Respuesta del sistema'],
  document: ['Contrato_cliente.pdf', 'Informe_trimestral.pdf', 'Acta_comité.pdf', 'Anexo_condiciones.pdf', 'Resumen_operaciones.pdf', 'Presupuesto_2026.pdf', 'Certificado_fiscal.pdf', 'Informe_validación.pdf', 'Plan_proyecto.pdf', 'Protocolo_acceso.pdf', 'Registro_entregas.pdf', 'Ficha_proveedor.pdf'],
  task: ['Aprobar presupuesto', 'Revisar documentación', 'Asignar un responsable', 'Confirmar una entrega', 'Validar la solicitud', 'Preparar la reunión', 'Actualizar el expediente', 'Comprobar los anexos', 'Completar la revisión', 'Solicitar autorización', 'Cerrar la validación', 'Enviar una respuesta'],
};
const letterContent = ['Revisar propuesta', 'Revisión de la operación', 'Comentarios al borrador', 'Confirmación de la solicitud', 'Documentación del proyecto', 'Información para el comité', 'Consulta de seguimiento', 'Detalle de la próxima entrega'];
const cache = new Map();
const rounded = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

function icon(ctx, type, x, y, size) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 48, size / 48);
  ctx.strokeStyle = palette[type]; ctx.fillStyle = palette[type]; ctx.lineWidth = 2.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (type === 'email') {
    rounded(ctx, 3, 9, 42, 30, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 12); ctx.lineTo(24, 27); ctx.lineTo(43, 12); ctx.stroke();
  } else if (type === 'chat') {
    rounded(ctx, 4, 6, 39, 29, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, 35); ctx.lineTo(10, 43); ctx.lineTo(25, 35); ctx.stroke();
    for (const x of [15, 24, 33]) { ctx.beginPath(); ctx.arc(x, 21, 1.4, 0, Math.PI * 2); ctx.fill(); }
  } else if (type === 'ticket') {
    ctx.beginPath(); ctx.moveTo(5, 9); ctx.lineTo(43, 9); ctx.lineTo(43, 18); ctx.bezierCurveTo(33, 18, 33, 29, 43, 29); ctx.lineTo(43, 39); ctx.lineTo(5, 39); ctx.lineTo(5, 29); ctx.bezierCurveTo(15, 29, 15, 18, 5, 18); ctx.closePath(); ctx.stroke();
    ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(29, 13); ctx.lineTo(29, 35); ctx.stroke();
  } else if (type === 'document') {
    ctx.beginPath(); ctx.moveTo(10, 3); ctx.lineTo(29, 3); ctx.lineTo(40, 14); ctx.lineTo(40, 45); ctx.lineTo(10, 45); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(29, 3); ctx.lineTo(29, 15); ctx.lineTo(40, 15); ctx.stroke();
    for (const y of [24, 31, 38]) { ctx.beginPath(); ctx.moveTo(17, y); ctx.lineTo(32, y); ctx.stroke(); }
  } else {
    rounded(ctx, 7, 8, 35, 35, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, 26); ctx.lineTo(22, 33); ctx.lineTo(34, 19); ctx.stroke();
    ctx.fillStyle = '#fafcff'; ctx.fillRect(17, 4, 14, 8); ctx.strokeRect(17, 4, 14, 8);
  }
  ctx.restore();
}
function line(ctx, text, x, y, size = 27, color = INK, weight = 400, family = 'Manrope') {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px "${family}", Arial`; ctx.fillText(text, x, y);
}
function grain(ctx, w, h, amount, seed) {
  const pixels = ctx.getImageData(0, 0, w, h);
  let state = seed;
  for (let i = 0; i < pixels.data.length; i += 4) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const n = ((state / 4294967296) - .5) * amount;
    for (let c = 0; c < 3; c++) pixels.data[i + c] = Math.max(0, Math.min(255, pixels.data[i + c] + n));
  }
  ctx.putImageData(pixels, 0, 0);
}
export function surfaceTexture(kind, variant = 0, resolution = 1024, content = null) {
  const key = `${kind}-${variant}-${resolution}-${content?.message ?? ''}`;
  if (cache.has(key)) return cache.get(key);
  // Draw the typography at native texture size, never enlarge a 1024px bitmap.
  const w = 1024, h = kind === 'letter' ? 1180 : kind === 'note' ? 1080 : 630;
  const c = document.createElement('canvas'); c.width = resolution; c.height = Math.round(h * resolution / w);
  const ctx = c.getContext('2d'); ctx.scale(resolution / w, resolution / w);
  const bg = ctx.createLinearGradient(0, 0, w, h);
  if (kind === 'note') { bg.addColorStop(0, '#ece8d9'); bg.addColorStop(.65, '#f6f3e6'); bg.addColorStop(1, '#e7e1ce'); }
  else { bg.addColorStop(0, '#fffefb'); bg.addColorStop(.6, '#faf9f5'); bg.addColorStop(1, '#f0efe9'); }
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  grain(ctx, c.width, c.height, 4.2, 408 + variant);
  let subject;
  if (kind === 'note') {
    const adhesive = ctx.createLinearGradient(0, 0, 0, 145); adhesive.addColorStop(0, '#89b0c015'); adhesive.addColorStop(1, '#89b0c000');
    ctx.fillStyle = adhesive; ctx.fillRect(0, 0, w, 145);
    line(ctx, variant === 0 ? 'BLOQUEADO' : 'PARA REVISAR', 95, 180, 22, '#6b8ba0', 500);
    const phrases = noteContent[variant] ?? ['Revisar', `el punto ${variant + 1}.`]; subject = phrases.join(' ');
    line(ctx, phrases[0], 92, 410, 89, '#35637b', 400, 'DM Serif'); line(ctx, phrases[1], 90, 528, variant === 0 ? 82 : 89, '#35637b', 400, 'DM Serif');
    ctx.strokeStyle = '#658da388'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(97, 583); ctx.bezierCurveTo(250, 569, 435, 589, 660, 577); ctx.stroke();
    line(ctx, variant === 0 ? 'El cliente vuelve a preguntar.' : `Nota ${String(variant + 1).padStart(2, '0')} · Por confirmar`, 97, 764, 29, '#64879b');
    ctx.fillStyle = '#76a7c0'; ctx.beginPath(); ctx.arc(113, 893, 6, 0, Math.PI * 2); ctx.fill();
    line(ctx, `Equipo · 09:${String(14 + variant).padStart(2, '0')}`, 139, 903, 22, '#7392a4');
  } else if (kind === 'letter') {
    icon(ctx, 'email', 90, 102, 88); line(ctx, 'HOY · 09:14', 748, 123, 19, '#91a4b3', 500);
    line(ctx, ['De: Dirección financiera','De: Equipo de operaciones','De: Coordinación de proyecto','De: Área de gestión'][variant % 4], 95, 261, 24, '#6b869a');
    subject = letterContent[variant] ?? `Revisión del expediente ${variant + 1}`; line(ctx, subject, 95, 363, subject.length > 26 ? 39 : 45, INK, 600);
    ctx.strokeStyle = '#ccdce740'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(95, 413); ctx.lineTo(927, 413); ctx.stroke();
    line(ctx, 'Hola,', 95, 506, 29, '#3d5667');
    line(ctx, ['Adjunto la propuesta para su revisión.','Comparto los cambios para validarlos.','Remito el documento actualizado.','Necesitamos confirmar los siguientes pasos.'][variant % 4], 95, 574, 29, '#3d5667');
    line(ctx, ['Quedamos a la espera de los comentarios.','¿Podemos revisarlo durante esta semana?','La última versión incluye las observaciones.','Quedo pendiente de vuestra respuesta.'][variant % 4], 95, 620, 29, '#3d5667');
    line(ctx, 'Un saludo.', 95, 733, 29, '#3d5667');
    rounded(ctx, 93, 915, 490, 80, 12); ctx.fillStyle = '#eaf2f8'; ctx.fill();
    icon(ctx, 'document', 115, 930, 44); line(ctx, ['Propuesta.pdf','Detalle_operación.pdf','Borrador_v02.pdf','Resumen_solicitud.pdf','Proyecto.pdf','Documentación.pdf','Seguimiento.pdf'][variant % 7], 181, 964, 23, '#5b7b91');
    line(ctx, '1 archivo adjunto', 95, 1043, 18, '#94a8b7');
  } else {
    icon(ctx, kind, 60, 58, 73);
    const titles = { email: 'Correo', chat: 'Mensaje interno', ticket: 'Incidencia', document: 'Documento', task: 'Solicitud' };
    line(ctx, titles[kind], 160, 91, 28, '#446c88', 500);
    line(ctx, ['09:14', '10:26', '09:42'][variant % 3], 864, 90, 18, '#91a9ba');
    subject = content?.message ?? channelContent[kind][variant] ?? `${titles[kind]} ${variant + 1}`;
    const secondary = kind === 'document' ? `${(1.2 + variant * .3).toFixed(1).replace('.', ',')} MB · Versión ${String(variant + 1).padStart(2, '0')}` : ['Pendiente de revisión', 'Compartido con el equipo', 'Esperando confirmación', 'Recibido esta mañana', 'En curso'][variant % 5];
    const text = [subject, secondary];
    if (content) {
      const fontSize = 54, leading = 68;
      ctx.font = `500 ${fontSize}px "Manrope", Arial`;
      const rows = []; let row = '';
      for (const word of subject.split(/\s+/)) {
        const next = row ? `${row} ${word}` : word;
        if (row && ctx.measureText(next).width > 894) {rows.push(row); row = word;}
        else row = next;
      }
      if (row) rows.push(row);
      const firstBaseline = 290 - (rows.length - 1) * leading / 2;
      rows.forEach((text, index) => line(ctx, text, 62, firstBaseline + index * leading, fontSize, INK, 500));
    } else {
      line(ctx, text[0], 62, 252, text[0].length > 27 ? 34 : 40, INK, 500); line(ctx, text[1], 62, 311, 27, '#567082');
    }
    ctx.strokeStyle = '#d8e5ee'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(62, 380); ctx.lineTo(956, 380); ctx.stroke();
    ctx.fillStyle = `${palette[kind]}14`; rounded(ctx, 60, 438, kind === 'document' ? 164 : 205, 61, 10); ctx.fill();
    line(ctx, content?.status ?? (kind === 'document' ? 'PDF' : kind === 'ticket' ? 'Abierta' : 'Pendiente'), 82, 477, content ? 28 : 21, palette[kind], 500);
    line(ctx, 'Equipo', 845, 476, 20, '#91a9ba');
    if (kind === 'chat') { ctx.fillStyle = `${palette[kind]}18`; ctx.beginPath(); ctx.arc(737, 470, 14, 0, Math.PI * 2); ctx.fill(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.subject = subject; cache.set(key, t); return t;
}
export function paperGrain() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 512, 512); grain(ctx, 512, 512, 48, 813);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); return t;
}
export function backdrop() {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const ctx = c.getContext('2d');
  ctx.fillStyle = '#f4f9fd'; ctx.fillRect(0, 0, 1024, 1024);
  const blue = ctx.createRadialGradient(830, 1024, 20, 730, 900, 890); blue.addColorStop(0, '#c3dff0'); blue.addColorStop(.5, '#e4f1fa'); blue.addColorStop(1, '#f8fbff00'); ctx.fillStyle = blue; ctx.fillRect(0, 0, 1024, 1024);
  const white = ctx.createRadialGradient(350, 280, 0, 350, 280, 620); white.addColorStop(0, '#ffffff'); white.addColorStop(.45, '#ffffff'); white.addColorStop(1, '#ffffff00'); ctx.fillStyle = white; ctx.fillRect(0, 0, 1024, 1024);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
