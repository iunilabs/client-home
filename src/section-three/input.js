import {createCityPerspective} from '../section-two/city-perspective.js';
import {clamp, mix} from './motion.js';

export function createSceneInput({capture, reducedQuery, button, onChange}) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const gyro = createCityPerspective();
  const target = {x: 0, y: 0}, pointer = {x: 0, y: 0};
  let hovering = false;
  let active = false; const listeners = [];
  function listen(target, type, listener, options) {target.addEventListener(type, listener, options); listeners.push(() => target.removeEventListener(type, listener, options));}
  const needsPermission = !fine.matches && typeof window.DeviceOrientationEvent?.requestPermission === 'function';
  button.hidden = !needsPermission || capture || reducedQuery.matches;
  listen(button, 'click', async () => {
    try {
      const permission = await window.DeviceOrientationEvent.requestPermission();
      if (permission === 'granted') button.hidden = true;
      else { button.textContent = 'Inclinación no disponible'; button.disabled = true; }
    } catch { button.textContent = 'Inclinación no disponible'; button.disabled = true; }
    onChange();
  });
  listen(window, 'pointermove', event => {
    if (!active || event.pointerType === 'touch' || !fine.matches) return;
    target.x = clamp(event.clientX / innerWidth * 2 - 1, -1, 1);
    target.y = clamp(1 - event.clientY / innerHeight * 2, -1, 1); hovering = true; onChange();
  }, {passive: true});
  listen(document.documentElement, 'pointerleave', () => { target.x = target.y = 0; hovering = false; onChange(); });
  listen(window, 'blur', () => { target.x = target.y = 0; hovering = false; onChange(); });
  return {
    setActive(value) {active = value; if (!value) {target.x = target.y = 0; hovering = false;}},
    update(dt, now) {
      const disabled = capture || reducedQuery.matches;
      const blend = 1 - Math.exp(-dt * 5);
      pointer.x = disabled ? 0 : mix(pointer.x, target.x, blend); pointer.y = disabled ? 0 : mix(pointer.y, target.y, blend);
      const orientation = gyro.update(now, {active: active && !document.hidden && !capture, reduced: reducedQuery.matches, paused: false});
      const sensorX = orientation.hasReading ? orientation.y / 2 : 0;
      const sensorY = orientation.hasReading ? orientation.x / 2 : 0;
      return {x: clamp(pointer.x + sensorX, -1, 1), y: clamp(pointer.y + sensorY, -1, 1), pointer: {...pointer}, hovering: hovering && fine.matches && !disabled, orientation};
    },
    dispose() {listeners.forEach(remove => remove()); gyro.dispose();},
  };
}
