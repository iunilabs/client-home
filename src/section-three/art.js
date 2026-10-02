import * as THREE from 'three';

export const CHANNELS = ['email', 'chat', 'ticket', 'document', 'task', 'qa', 'test', 'deploy', 'summary', 'call', 'approval'];
export const INK = '#18334b';
const MUTED = '#738ca0';
const palette = {email: '#268fd0', chat: '#438cb6', ticket: '#c83549', document: '#668fb1', task: '#795bc7', qa: '#c83549', test: '#c83549', deploy: '#268fd0', summary: '#447fa5', call: '#3eaa94', approval: '#795bc7'};
const tint = {email: '#e0f0ff', chat: '#e9f3fc', ticket: '#fce9ed', document: '#e6eff9', task: '#eee8ff', qa: '#fce9ed', test: '#fce9ed', deploy: '#e0f0ff', summary: '#eaf2fa', call: '#e2f5ef', approval: '#eee8ff'};
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
channelContent.email[0] = 'Falta el adjunto final';
channelContent.chat[0] = 'No encuentro la última versión.';
channelContent.ticket[0] = 'Bug reabierto tras validación';
channelContent.task[0] = 'Solicitud de alta pendiente';
Object.assign(channelContent, {
  qa: ['Validación bloqueada', 'Revisión de calidad pendiente', 'Entorno de pruebas sin validar', 'Criterios de aceptación pendientes'],
  test: ['Tests automáticos inestables', 'Pruebas de integración fallidas', 'Regresión sin resolver', 'Cobertura pendiente de revisar'],
  deploy: ['Despliegue aplazado', 'Release pendiente de validación', 'Publicación sin confirmar', 'Entrega bloqueada por riesgos'],
  summary: ['Pendientes de revisión', 'Trabajo pendiente del equipo', 'Elementos por confirmar', 'Resumen del cierre semanal'],
  call: ['Llamada al proveedor', 'Seguimiento por teléfono', 'Confirmar con el cliente', 'Consulta de operaciones'],
  approval: ['Aprobación de presupuesto', 'Firma de contrato pendiente', 'Autorizar el siguiente paso', 'Validación de la dirección'],
});
noteContent[1] = ['¿Puedes pasar los datos de estos', 'documentos al Excel?'];
const letterContent = ['Revisar propuesta', 'Revisión de la operación', 'Comentarios al borrador', 'Confirmación de la solicitud', 'Documentación del proyecto', 'Información para el comité', 'Consulta de seguimiento', 'Detalle de la próxima entrega'];
const cache = new Map();
const rounded = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

function icon(ctx, type, x, y, size, color = palette[type] ?? MUTED) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 48, size / 48);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const path = points => {ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();};
  if (type === 'email') {
    rounded(ctx, 4, 9, 40, 30, 4); ctx.stroke(); path([[5,12],[24,27],[43,12]]);
  } else if (['ticket', 'qa', 'test'].includes(type)) {
    rounded(ctx, 14, 15, 20, 27, 10); ctx.fill();
    ctx.beginPath(); ctx.arc(24,12,7,0,Math.PI*2); ctx.fill();
    path([[20,7],[17,3]]); path([[28,7],[31,3]]);
    for (const y of [20,28,36]) {path([[14,y],[7,y-3]]);path([[34,y],[41,y-3]]);}
    ctx.strokeStyle = '#fff1f3'; path([[24,19],[24,36]]);
  } else if (type === 'document') {
    ctx.beginPath(); ctx.moveTo(10,3);ctx.lineTo(29,3);ctx.lineTo(40,14);ctx.lineTo(40,44);ctx.lineTo(10,44);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#f6fbff';path([[29,4],[29,15],[39,15]]);
    for (const y of [24,31,38]) path([[17,y],[32,y]]);
  } else if (type === 'deploy') {
    ctx.beginPath(); ctx.moveTo(12,38);ctx.bezierCurveTo(-2,37,0,19,13,19);ctx.bezierCurveTo(13,-1,41,2,40,22);ctx.bezierCurveTo(51,24,47,38,38,38);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#ffffff90';path([[21,20],[21,30],[29,30]]);
  } else if (type === 'task' || type === 'approval' || type === 'people') {
    ctx.beginPath();ctx.arc(24,13,7,0,Math.PI*2);ctx.stroke();
    rounded(ctx,12,26,24,15,7);ctx.stroke();
    if (type === 'people') {path([[8,11],[5,14],[8,18]]);path([[5,29],[3,37],[8,37]]);path([[39,12],[43,17],[40,20]]);}
  } else if (type === 'summary') {
    for (const y of [11,22,33]) path([[7,y],[24,y-8],[41,y],[24,y+8],[7,y]]);
  } else if (type === 'call') {
    ctx.beginPath();ctx.moveTo(12,7);ctx.lineTo(20,15);ctx.lineTo(16,21);ctx.quadraticCurveTo(19,30,29,33);ctx.lineTo(35,28);ctx.lineTo(42,36);ctx.quadraticCurveTo(32,49,16,33);ctx.quadraticCurveTo(1,19,12,7);ctx.stroke();
  } else if (type === 'clock') {
    ctx.beginPath();ctx.arc(24,24,18,0,Math.PI*2);ctx.stroke();path([[24,12],[24,25],[33,29]]);
  } else if (type === 'calendar') {
    rounded(ctx,7,10,34,31,4);ctx.stroke();path([[7,20],[41,20]]);path([[16,5],[16,15]]);path([[32,5],[32,15]]);
  } else if (type === 'attach') {
    ctx.beginPath();ctx.moveTo(16,29);ctx.lineTo(29,15);ctx.bezierCurveTo(37,7,45,16,36,25);ctx.lineTo(22,39);ctx.bezierCurveTo(8,52,-2,34,10,22);ctx.lineTo(23,9);ctx.stroke();
  } else if (type === 'branch') {
    for (const [x,y] of [[11,9],[37,13],[11,39]]) {ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.stroke();}
    path([[11,13],[11,35]]);path([[11,29],[28,29],[37,17]]);
  } else if (type === 'settings') {
    ctx.beginPath();ctx.arc(24,24,13,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(24,24,5,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<8;i++){const a=i*Math.PI/4;path([[24+Math.cos(a)*13,24+Math.sin(a)*13],[24+Math.cos(a)*20,24+Math.sin(a)*20]]);}
  } else if (type === 'checks') {path([[3,25],[13,35],[31,13]]);path([[23,35],[41,13]]);}
  else {path([[10,25],[20,35],[39,13]]);}
  ctx.restore();
}
function textBlock(ctx, text, {x, y, width, height, maxSize = 48, minSize = 24,
  weight = 400, family = 'Manrope', color = INK, leading = 1.18, maxLines = 3, align = 'left'}) {
  ctx.save();
  function measure(size) {
    const font = `${weight} ${size}px "${family}", Arial`; ctx.font = font;
    const rows = [];
    for (const paragraph of text.split('\n')) {
      let row = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const next = row ? `${row} ${word}` : word;
        if (row && ctx.measureText(next).width > width) {rows.push(row); row = word;}
        else row = next;
      }
      rows.push(row);
    }
    const metrics = ctx.measureText('Ágj'), ascent = metrics.actualBoundingBoxAscent,
      descent = metrics.actualBoundingBoxDescent, rowHeight = size * leading;
    const usedHeight = ascent + descent + (rows.length - 1) * rowHeight;
    return {font, rows, ascent, usedHeight, rowHeight,
      fits: rows.length <= maxLines && usedHeight <= height && rows.every(row => ctx.measureText(row).width <= width)};
  }
  let low = minSize, high = maxSize, fitted = measure(minSize);
  while (low <= high) {
    const size = Math.floor((low + high) / 2), layout = measure(size);
    if (layout.fits) {fitted = layout; low = size + 1;} else high = size - 1;
  }
  ctx.font = fitted.font; ctx.fillStyle = color; ctx.textAlign = align;
  const left = x + (align === 'right' ? width : align === 'center' ? width / 2 : 0);
  const baseline = y + (height - fitted.usedHeight) / 2 + fitted.ascent;
  fitted.rows.forEach((row, index) => ctx.fillText(row, left, baseline + index * fitted.rowHeight));
  ctx.restore();
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
function box(ctx, x, y, width, height, radius, fill, stroke = null) {
  rounded(ctx, x, y, width, height, radius); ctx.fillStyle = fill; ctx.fill();
  if (stroke) {ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();}
}
function tile(ctx, kind, x = 64, y = 56, size = 112) {
  box(ctx, x, y, size, size, size * .22, tint[kind]);
  icon(ctx, kind, x + size * .20, y + size * .20, size * .60);
}
function dots(ctx, y = 83, resolved = false) {
  if (resolved) {
    box(ctx, 907, y - 30, 60, 60, 30, '#cce9d9');
    icon(ctx, 'checks', 919, y - 18, 36, '#237856');
    return;
  }
  ctx.fillStyle = '#456d8a';
  for (const x of [919, 937, 955]) {ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();}
}
function avatar(ctx, initials, x, y, size = 78) {
  box(ctx, x, y, size, size, size / 2, '#e1edf6', '#f8fcff');
  textBlock(ctx, initials, {x, y: y + 5, width: size, height: size - 10, maxSize: size * .38, minSize: 24, weight: 600, color: '#527998', align: 'center', maxLines: 1});
}
function badge(ctx, text, x, y, width = 210, tone = 'red') {
  const colors = tone === 'green' ? ['#dcefe4','#237856'] : tone === 'blue' ? ['#e0efff','#317bbb'] : tone === 'purple' ? ['#eee7ff','#7756bf'] : ['#fbe3e8','#b63349'];
  box(ctx, x, y, width, 64, 16, colors[0]);
  textBlock(ctx, text, {x: x + 16, y: y + 7, width: width - 32, height: 48, maxSize: 36, minSize: 26, weight: 500, color: colors[1], maxLines: 1});
}
function divider(ctx, y = 466) {
  ctx.strokeStyle = '#dce7f0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(64,y); ctx.lineTo(960,y); ctx.stroke();
}
function footer(ctx, text, symbol = 'clock', right = '') {
  divider(ctx); icon(ctx, symbol, 66, 505, 48, MUTED);
  textBlock(ctx, text, {x: 137, y: 496, width: right ? 590 : 807, height: 65, maxSize: 36, minSize: 29, color: MUTED, maxLines: 1});
  if (right) textBlock(ctx, right, {x: 752, y: 505, width: 200, height: 48, maxSize: 30, minSize: 25, color: MUTED, align: 'right', maxLines: 1});
}
function attachment(ctx, filename, x, y, width, height, size = 36) {
  box(ctx, x, y, width, height, 22, '#f5f9fd', '#dce8f1');
  icon(ctx, 'attach', x + 20, y + 26, 46, MUTED);
  textBlock(ctx, filename, {x: x + 92, y: y + 12, width: width - 112, height: height * .43, maxSize: size, minSize: 28, color: MUTED, maxLines: 1});
  textBlock(ctx, '2,4 MB', {x: x + 92, y: y + height * .54, width: width - 112, height: height * .30, maxSize: size * .84, minSize: 24, color: MUTED, maxLines: 1});
}
function emailCard(ctx, variant, subject, long = false, resolved = false) {
  tile(ctx, 'email', 64, 56, long ? 144 : 112);
  const left = long ? 244 : 208;
  textBlock(ctx, ['Laura Martínez','Equipo de operaciones','Dirección financiera','Coordinación del proyecto'][variant % 4], {x: left, y: 58, width: 520, height: 68, maxSize: long ? 48 : 44, minSize: 30, weight: 600, maxLines: 1});
  textBlock(ctx, 'para Operaciones', {x: left, y: 133, width: 570, height: 48, maxSize: 36, minSize: 28, color: MUTED, maxLines: 1});
  ctx.strokeStyle = MUTED; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(left + 320, 150); ctx.lineTo(left + 330, 160); ctx.lineTo(left + 340, 150); ctx.stroke();
  textBlock(ctx, '09:24', {x: 790, y: 64, width: 148, height: 46, maxSize: 30, minSize: 26, color: MUTED, align: 'right', maxLines: 1});
  dots(ctx, 164, resolved);
  if (long) {
    textBlock(ctx, subject, {x: 64, y: 259, width: 894, height: 166, maxSize: 84, minSize: 44, weight: 600, maxLines: 2});
    badge(ctx, resolved ? 'Hecho ✓' : 'Pendiente', 64, 450, 218, resolved ? 'green' : 'red');
    textBlock(ctx, 'Hola,', {x: 64, y: 555, width: 894, height: 65, maxSize: 48, minSize: 38, maxLines: 1});
    textBlock(ctx, resolved ? 'La revisión está completada.\nLa versión final ya está disponible.' : ['Adjunto la propuesta para su revisión.\nQuedamos a la espera de los comentarios.','Comparto los cambios para validarlos.\n¿Podemos revisarlo durante esta semana?','Remito el documento actualizado.\nLa última versión incluye las observaciones.','Necesitamos confirmar los siguientes pasos.\nQuedo pendiente de vuestra respuesta.'][variant % 4], {x: 64, y: 642, width: 894, height: 205, maxSize: 50, minSize: 36, maxLines: 4});
    textBlock(ctx, 'Un saludo.', {x: 64, y: 871, width: 894, height: 60, maxSize: 46, minSize: 36, maxLines: 1});
    attachment(ctx, ['Propuesta.pdf','Detalle_operación.pdf','Borrador_v02.pdf','Resumen_solicitud.pdf'][variant % 4], 64, 985, 894, 135, 46);
  } else {
    textBlock(ctx, subject, {x: 64, y: 216, width: 672, height: 94, maxSize: 58, minSize: 34, weight: 600, maxLines: 2});
    badge(ctx, resolved ? 'Hecho ✓' : 'Pendiente', 762, 232, 196, resolved ? 'green' : 'red');
    textBlock(ctx, resolved ? 'Documento revisado y enviado.\nTodo listo para continuar.' : ['¿Puedes enviarlo en cuanto lo tengas?\nLo necesitamos para la reunión de esta tarde.','Necesitamos revisar los cambios.\nQuedo pendiente de vuestra respuesta.','Adjunto la información actualizada.\nFalta confirmar la última versión.'][variant % 3], {x: 64, y: 330, width: 894, height: 120, maxSize: 42, minSize: 30, maxLines: 3});
    attachment(ctx, 'Informe_final_v3.pdf', 64, 485, 636, 104);
  }
}
function messageCard(ctx, variant, subject, content, resolved = false) {
  avatar(ctx, variant % 2 ? 'LM' : 'CR', 64, 60, 100);
  textBlock(ctx, variant % 2 ? 'Laura Martínez' : 'Carlos', {x: 200, y: 60, width: 430, height: 62, maxSize: 48, minSize: 32, weight: 600, maxLines: 1});
  textBlock(ctx, 'Equipo proyecto', {x: 200, y: 132, width: 600, height: 50, maxSize: 36, minSize: 28, color: MUTED, maxLines: 1});
  textBlock(ctx, '11:17', {x: 664, y: 72, width: 172, height: 44, maxSize: 29, minSize: 25, color: MUTED, maxLines: 1}); dots(ctx, 83, resolved);
  box(ctx, 64, 220, 792, 190, 34, '#ffffff');
  textBlock(ctx, !content && variant === 0 ? subject + '\n¿Alguien la tiene?' : subject, {x: 96, y: 236, width: 728, height: 157, maxSize: 48, minSize: 32, maxLines: 3});
  box(ctx, 885, 280, 70, 70, 35, '#f3f8fe');
  ctx.fillStyle = MUTED; for (const x of [906, 920, 934]) {ctx.beginPath(); ctx.arc(x, 315, 3, 0, Math.PI * 2); ctx.fill();}
  box(ctx, 286, 445, 672, 120, 34, resolved ? '#dcefe4' : '#d9edff');
  textBlock(ctx, resolved ? 'Resuelto. Ya puedes continuar.' : 'La estoy revisando, te aviso.', {x: 318, y: 454, width: 603, height: 59, maxSize: 36, minSize: 29, maxLines: 1});
  textBlock(ctx, '11:20', {x: 730, y: 518, width: 142, height: 30, maxSize: 25, minSize: 22, color: '#73a2c1', align: 'right', maxLines: 1});
  icon(ctx, 'checks', 897, 523, 29, resolved ? '#237856' : '#579bc4');
}
function documentCard(ctx, variant, subject, resolved = false) {
  tile(ctx, 'document', 64, 67, 156); dots(ctx, 83, resolved);
  textBlock(ctx, 'Documento', {x: 258, y: 77, width: 608, height: 75, maxSize: 60, minSize: 42, weight: 600, maxLines: 1});
  textBlock(ctx, subject, {x: 258, y: 169, width: 688, height: 65, maxSize: 46, minSize: 28, color: MUTED, maxLines: 1});
  textBlock(ctx, `${(3.1 + variant * .3).toFixed(1).replace('.', ',')} MB`, {x: 258, y: 248, width: 688, height: 55, maxSize: 40, minSize: 32, color: MUTED, maxLines: 1});
  footer(ctx, resolved ? 'Versión final · Archivado' : 'Última versión · Legal', 'clock', resolved ? 'Hecho ✓' : '');
}
function summaryCard(ctx, variant, subject, resolved = false) {
  tile(ctx, 'summary', 64, 46, 80); dots(ctx, 74, resolved);
  textBlock(ctx, subject, {x: 170, y: 54, width: 706, height: 64, maxSize: 48, minSize: 32, weight: 600, maxLines: 1});
  const rows = [['document','Documentación',3],['ticket','Incidencias',5],['approval','Aprobaciones',2]];
  rows.forEach(([kind, label, count], i) => {
    const y = 151 + i * 139;
    box(ctx, 64, y, 894, 118, 25, '#f6faff', '#e1ebf4'); tile(ctx, kind, 84, y + 26, 66);
    textBlock(ctx, label, {x: 179, y: y + 27, width: 562, height: 62, maxSize: 42, minSize: 32, maxLines: 1});
    box(ctx, 780, y + 21, 76, 76, 38, resolved ? '#dcefe4' : tint[kind]);
    textBlock(ctx, resolved ? '✓' : String(count + variant), {x: 780, y: y + 25, width: 76, height: 65, maxSize: 37, minSize: 30, color: resolved ? '#237856' : palette[kind], align: 'center', maxLines: 1});
    ctx.strokeStyle = MUTED; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(903, y + 47); ctx.lineTo(916,y + 59); ctx.lineTo(903,y + 71); ctx.stroke();
  });
}
function workCard(ctx, kind, variant, subject, resolved = false) {
  tile(ctx, kind); dots(ctx, 83, resolved);
  const request = kind === 'task';
  textBlock(ctx, subject, {x: 208, y: 57, width: 664, height: request ? 68 : 93, maxSize: 52, minSize: 32, weight: 600, maxLines: request ? 1 : 2});
  if (request) {
    textBlock(ctx, 'Área usuaria', {x: 208, y: 136, width: 470, height: 51, maxSize: 38, minSize: 30, color: MUTED, maxLines: 1});
    badge(ctx, resolved ? 'Hecho ✓' : 'Pendiente', 750, 184, 208, resolved ? 'green' : 'red');
  } else {
    badge(ctx, resolved ? 'Hecho ✓' : kind === 'test' ? 'Failed' : kind === 'ticket' ? 'Reopened' : ['qa','deploy'].includes(kind) ? 'Blocked' : 'Pendiente', 208, 168, kind === 'test' ? 160 : 218, resolved ? 'green' : 'red');
    if (kind === 'ticket' || kind === 'test') badge(ctx, kind === 'ticket' ? 'Bug' : 'Test', kind === 'ticket' ? 449 : 392, 168, 140, 'blue');
    if (kind === 'ticket') textBlock(ctx, `DEV-${4821 + variant}`, {x: 749, y: 173, width: 208, height: 51, maxSize: 30, minSize: 25, color: MUTED, align: 'right', maxLines: 1});
  }
  const body = {
    ticket: 'El comportamiento no coincide\ncon el esperado en producción.', qa: 'La build aún no está disponible\npara pruebas.', test: 'La pipeline vuelve a fallar\nsin causa clara.', deploy: 'Falta validación final y revisión\nde riesgos.', task: 'Falta validación para continuar.', call: 'Confirmar la fecha de entrega.\nPendiente de respuesta del proveedor.', approval: 'Falta la firma para continuar.\nRequiere aprobación de Dirección.',
  };
  const completedBody = {ticket: 'Incidencia resuelta.\nFuncionamiento verificado en producción.', qa: 'Validación completada.\nLa build está lista para continuar.', test: 'Pruebas superadas.\nLa pipeline termina correctamente.', deploy: 'Validación final completada.\nDespliegue realizado correctamente.', task: 'Solicitud validada.\nYa se puede continuar.', call: 'Fecha de entrega confirmada.\nRespuesta del proveedor registrada.', approval: 'Firma recibida.\nAprobación de Dirección registrada.'};
  textBlock(ctx, resolved ? completedBody[kind] : body[kind], {x: 64, y: 280, width: 894, height: 145, maxSize: 47, minSize: 34, maxLines: 3});
  if (kind === 'ticket' || kind === 'qa' || kind === 'approval') {
    divider(ctx); avatar(ctx, 'MR', 64, 496, 74);
    textBlock(ctx, kind === 'qa' ? 'QA · Marta' : kind === 'approval' ? 'Dirección · Marta Ruiz' : 'Asignado a: Marta Ruiz', {x: 164, y: 504, width: 556, height: 54, maxSize: 36, minSize: 29, color: MUTED, maxLines: 1});
    if (kind === 'ticket') {icon(ctx, 'calendar', 768, 507, 45, MUTED); textBlock(ctx, 'Hoy', {x: 833, y: 503, width: 121, height: 55, maxSize: 34, minSize: 28, color: MUTED, maxLines: 1});}
  } else footer(ctx, kind === 'test' ? `CI-${208 + variant}` : kind === 'deploy' ? 'Release · Hoy' : kind === 'call' ? 'Hoy · 11:30' : 'Solicitado por Laura Martínez', kind === 'test' ? 'branch' : kind === 'deploy' ? 'settings' : kind === 'task' ? 'people' : 'clock', kind === 'task' ? 'Hoy, 09:24' : '');
}
export function surfaceTexture(kind, variant = 0, resolution = 1024, content = null, resolved = false) {
  const key = `${kind}-${variant}-${resolution}-${content?.message ?? ''}-${resolved}`;
  if (cache.has(key)) return cache.get(key);
  const w = 1024, h = kind === 'letter' ? 1180 : kind === 'note' ? 1080 : 630;
  const c = document.createElement('canvas'); c.width = resolution; c.height = Math.round(h * resolution / w);
  const ctx = c.getContext('2d'); ctx.scale(resolution / w, resolution / w);
  const bg = ctx.createLinearGradient(0, 0, w, h);
  if (kind === 'note') {bg.addColorStop(0, '#faf8f0'); bg.addColorStop(.7, '#f9f6ed'); bg.addColorStop(1, '#efeade');}
  else {bg.addColorStop(0, '#fcfdff'); bg.addColorStop(1, resolved ? '#e8f5ee' : '#f0f7ff');}
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  if (kind !== 'note') {rounded(ctx, 5, 5, w - 10, h - 10, Math.min(w, h) * .07); ctx.strokeStyle = resolved ? '#b2d9c3' : '#ffffff'; ctx.lineWidth = 4; ctx.stroke();}
  grain(ctx, c.width, c.height, kind === 'note' ? 3 : 1.5, 408 + variant);
  let subject;
  if (kind === 'note') {
    const phrases = noteContent[variant] ?? ['Revisar', `el punto ${variant + 1}.`]; subject = phrases.join(' ');
    textBlock(ctx, subject, {x: 100, y: 157, width: 824, height: 500, maxSize: 119, minSize: 72, family: 'Paper Hand', weight: 500, leading: 1.05, maxLines: 4});
    ctx.strokeStyle = '#2c4963'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(112,733); ctx.quadraticCurveTo(241,709,368,707); ctx.stroke();
    textBlock(ctx, resolved ? 'Hecho ✓' : variant === 1 ? 'Como cada mes.' : ['Sigue pendiente.','Por confirmar.','Lo necesitamos hoy.'][variant % 3], {x: 108, y: 800, width: 813, height: 120, maxSize: 76, minSize: 52, family: 'Paper Hand', color: resolved ? '#237856' : '#5c768d', maxLines: 1});
  } else if (kind === 'letter') {
    subject = letterContent[variant] ?? `Revisión del expediente ${variant + 1}`; emailCard(ctx, variant, subject, true, resolved);
  } else {
    subject = content?.message ?? channelContent[kind]?.[variant] ?? `${kind} ${variant + 1}`;
    const doneTitles = {qa: 'Validación completada', test: 'Pruebas superadas', deploy: 'Despliegue completado', summary: 'Revisión completada'};
    const title = resolved ? doneTitles[kind] ?? (variant === 0 && kind === 'ticket' ? 'Bug resuelto tras validación' : variant === 0 && kind === 'task' ? 'Solicitud de alta aprobada' : variant === 0 && kind === 'email' ? 'Adjunto final enviado' : subject) : subject;
    if (kind === 'email') emailCard(ctx, variant, title, false, resolved);
    else if (kind === 'chat') messageCard(ctx, variant, subject, content, resolved);
    else if (kind === 'document') documentCard(ctx, variant, subject, resolved);
    else if (kind === 'summary') summaryCard(ctx, variant, title, resolved);
    else workCard(ctx, kind, variant, title, resolved);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.subject = subject; t.userData.kind = kind; cache.set(key, t); return t;
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
