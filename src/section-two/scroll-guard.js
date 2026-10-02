import {createWheelBurst, wheelEventTime} from './mobile-tour-input.js';

// overflow:hidden stops compositor scrolling as well as new scroll input. It
// still allows the instant anchor write. Restore it before a fresh exit starts.
// The separately owned entrance publishes this text interval. Its midpoint
// remains readable on short screens and does not skip ahead to the map.
export function cityEntryPoint(geometry, portrait = false) {
  return !portrait && Number.isFinite(geometry.copyStart) ? (geometry.copyStart + geometry.start) / 2 : null;
}

export function cityMapPoint(geometry, progress, portrait) {
  const start = portrait ? geometry.revealed : Math.min(geometry.end, geometry.fadeEnd);
  return start + Math.max(0, Math.min(1, progress)) * (geometry.end - start);
}

// Commit the pending chapter's native maximum before a gesture starts. The
// compositor can then stop at Puntoes even while the main thread is busy.
// The later section keeps its offsets inside the clipped main box, so explicit
// destinations still resolve normally after restoring the full document.
export function createMobileScrollBoundary(main, next, footer, root, onChange = () => {}) {
  let saved = null, shape = null;
  const properties = [[main, ['position', 'overflow-x', 'overflow-y']], [next, ['position', 'top', 'left', 'right']], [footer, ['display']], [root, ['overscroll-behavior-y']]];
  return {
    get closed() {return Boolean(saved)},
    set(closed, geometry) {
      if (!closed) {
        if (!saved) return;
        for (const [element, entries] of saved) for (const [property, value, priority] of entries) {
          if (value) element.style.setProperty(property, value, priority);
          else element.style.removeProperty(property);
        }
        saved = null; shape = null; onChange(); return;
      }
      const nextShape = geometry ? `${geometry.revealed}:${geometry.viewport}` : shape;
      if (saved && shape === nextShape) return;
      const first = !saved;
      if (!saved) saved = properties.map(([element, names]) => [element, names.map(property =>
        [property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)])]);
      shape = nextShape;
      if (first) {
        // Main ends at the city through normal flow. Section 3 still starts
        // exactly at that end, but cannot extend the root's native range.
        main.style.setProperty('position', 'relative');
        main.style.setProperty('overflow-x', 'clip'); main.style.setProperty('overflow-y', 'clip');
        next.style.setProperty('position', 'absolute'); next.style.setProperty('top', '100%');
        next.style.setProperty('left', '0'); next.style.setProperty('right', '0');
        footer.style.setProperty('display', 'none'); root.style.setProperty('overscroll-behavior-y', 'none');
      }
      onChange();
    },
    dispose() {this.set(false)},
  };
}

export function createDocumentScrollLock(root) {
  let saved = null;
  return {
    set(locked) {
      if (locked && !saved) {
        saved = {value: root.style.getPropertyValue('overflow'), priority: root.style.getPropertyPriority('overflow')};
        root.style.setProperty('overflow', 'hidden');
      } else if (!locked && saved) {
        if (saved.value) root.style.setProperty('overflow', saved.value, saved.priority);
        else root.style.removeProperty('overflow');
        saved = null;
      }
    },
    get locked() {return Boolean(saved)},
  };
}

export function createEndLatch() {
  let armed = true, held = false, outside = false;
  return {
    getState: () => ({armed, held, outside}),
    capture() {if (!armed) return false; armed = false; held = true; return true},
    release(direction = 1) {held = false; if (direction < 0) outside = true},
    observe(scroll, end) {
      if (scroll > end + 1) outside = true;
      if (outside && scroll < end - 1) {armed = true; outside = false}
      return held;
    },
    reset() {armed = false; held = false; outside = true},
  };
}

export function createDesktopEndGuard({lock, navigate, readTarget = () => scrollY, blocked = () => false}) {
  const latch = createEndLatch(), wheel = createWheelBurst();
  let geometry, enabled = false, touch = null, lastScroll = null, navigating = false;
  const ignore = target => target.closest('input,textarea,select,[contenteditable],dialog[open],[data-lenis-prevent]');
  const stop = event => {if (event.cancelable) event.preventDefault(); event.stopImmediatePropagation()};
  function capture() {
    if (!latch.capture()) return;
    lock.set(true); navigate(geometry.end);
  }
  function onWheel(event) {
    if (!enabled || blocked() || ignore(event.target) || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
    navigating = false; latch.observe(scrollY, geometry.end);
    const now = wheelEventTime(event), delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    const pending = wheel.isPending(now, delta);
    if (latch.getState().held) {
      if (!pending) {latch.release(Math.sign(delta));lock.set(false);wheel.push(delta, now, true);return}
      wheel.push(delta, now, true);stop(event);return;
    }
    wheel.push(delta, now, true);
    if (delta > 0 && latch.getState().armed && Math.max(scrollY, readTarget()) + delta >= geometry.end && scrollY < geometry.end + 1) {
      capture();stop(event);
    }
  }
  function onStart(event) {
    touch = null;
    if (!enabled || blocked() || ignore(event.target) || event.touches.length !== 1) return;
    navigating = false; latch.observe(scrollY, geometry.end);
    const p = event.touches[0];
    touch = {x:p.clientX, y:p.clientY, scroll:scrollY, fresh:latch.getState().held, consumed:false};
    if (touch.fresh) lock.set(false);
  }
  function onMove(event) {
    if (!touch || event.touches.length !== 1) return;
    const p=event.touches[0], dx=touch.x-p.clientX, dy=touch.y-p.clientY;
    if (Math.hypot(dx,dy)<10) return;
    if (Math.abs(dy)<=Math.abs(dx)*1.4) {if(latch.getState().held)lock.set(true);return}
    if (touch.fresh) {latch.release(Math.sign(dy));lock.set(false);touch.fresh=false;return}
    if (touch.consumed) {stop(event);return}
    if (dy>0 && latch.getState().armed && touch.scroll+dy>=geometry.end) {
      capture();touch.consumed=true;stop(event);
    }
  }
  function onEnd() {touch=null;if(enabled && latch.getState().held)lock.set(true)}
  function onKey(event) {
    if (!enabled || blocked() || ignore(event.target)) return;
    const boundary = ['Home','End'].includes(event.key) || event.metaKey && ['ArrowUp','ArrowDown'].includes(event.key);
    if (boundary) {latch.reset();navigating=true;lastScroll=null;lock.set(false);return}
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (!['ArrowDown','PageDown',' ','ArrowUp','PageUp'].includes(event.key) || event.target.closest('a,button')) return;
    navigating=false;latch.observe(scrollY,geometry.end);
    if (latch.getState().held) {
      if (event.repeat) {stop(event);return}
      latch.release(['ArrowUp','PageUp'].includes(event.key)||event.shiftKey&&event.key===' '?-1:1);lock.set(false);return;
    }
    const delta=event.key==='ArrowDown'?40:event.key==='ArrowUp'?-40:event.key==='PageUp'||event.shiftKey&&event.key===' '?-innerHeight:innerHeight;
    if (delta>0 && latch.getState().armed && scrollY+delta>=geometry.end) {capture();stop(event)}
  }
  const events=[['wheel',onWheel],['touchstart',onStart],['touchmove',onMove],['touchend',onEnd],['touchcancel',onEnd],['keydown',onKey]];
  for(const [type,handler] of events)window.addEventListener(type,handler,{capture:true,passive:false});
  return {
    update(value,bounds) {if(enabled !== value){latch.reset();navigating=false;lastScroll=null;lock.set(false)}enabled=value;geometry=bounds},
    reconcile(scroll) {
      if (!enabled || !geometry || blocked() || navigating) return scroll;
      latch.observe(scroll,geometry.end);
      if (latch.getState().armed && lastScroll!==null && lastScroll<geometry.end && scroll>=geometry.end)capture();
      lastScroll=scroll;
      if (!latch.getState().held || touch?.fresh) return scroll;
      lock.set(true);
      if(Math.abs(scroll-geometry.end)>.5)navigate(geometry.end);
      return geometry.end;
    },
    prepareNavigation(){navigating=true;latch.reset();touch=null;lock.set(false);lastScroll=null},
    finishNavigation(){navigating=false;lastScroll=null},
    getState:latch.getState,
    dispose(){for(const [type,handler] of events)window.removeEventListener(type,handler,true)},
  };
}
