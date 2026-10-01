export function createCityPan(section) {
  const surface = section.querySelector('.city-drag-surface');
  const frame = section.querySelector('.trust-frame');
  const position = {x: 0, y: 0};
  let drag = null, limits = {x: 0, y: 0};
  const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

  surface.addEventListener('pointerdown', event => {
    // Keep the vertical touch gesture available to the page's scroll story.
    if (event.button !== 0 || event.pointerType === 'touch') return;
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY, start: {...position}};
    surface.setPointerCapture(event.pointerId);
    frame.classList.add('is-dragging');
    event.preventDefault();
  });
  surface.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    position.x = clamp(drag.start.x + event.clientX - drag.x, limits.x);
    position.y = clamp(drag.start.y + event.clientY - drag.y, limits.y);
  });
  function release(event) {
    if (drag?.id !== event.pointerId) return;
    drag = null;
    frame.classList.remove('is-dragging');
  }
  surface.addEventListener('pointerup', release);
  surface.addEventListener('pointercancel', release);
  surface.addEventListener('lostpointercapture', release);

  return {
    update(world, zoom, reduced) {
      // Extra image area permits more exploration during the close view.
      // The softened backdrop covers a small margin at the final wide view.
      limits.x = Math.min(innerWidth * .16, Math.max(0, (parseFloat(world.style.width) * zoom - document.documentElement.clientWidth) / 2) + innerWidth * .035);
      limits.y = Math.min(innerHeight * .14, Math.max(0, (parseFloat(world.style.height) * zoom - innerHeight) / 2) + innerHeight * .035);
      position.x = clamp(position.x, limits.x);
      position.y = clamp(position.y, limits.y);
      surface.inert = reduced;
      if (reduced) {position.x = 0; position.y = 0}
      return position;
    },
  };
}
