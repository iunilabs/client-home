export function initHeader(header,{onOpen=()=>{},onClose=()=>{}}={}){
  const toggle=header.querySelector('.header-menu-toggle');
  const menu=header.querySelector('.header-mobile-menu');
  const close=header.querySelector('.header-menu-close');
  const desktop=matchMedia('(min-width:1100px)');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let active=false,closing=false,reveal=null,revision=0;
  function stopReveal(){revision++;reveal?.cancel();reveal=null;}
  function circles(){
    const {left,top,width,height}=toggle.getBoundingClientRect();
    const x=left+width/2,y=top+height/2;
    const radius=Math.ceil(Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y)))+4;
    return {small:`circle(22px at ${x}px ${y}px)`,full:`circle(${radius}px at ${x}px ${y}px)`};
  }
  function openMenu(){
    if(desktop.matches||menu.open&&!closing)return;
    stopReveal();closing=false;menu.classList.remove('is-closing');
    if(!menu.open){
      menu.showModal();active=true;menu.scrollTop=0;
      toggle.setAttribute('aria-expanded','true');
      onOpen();close.focus({preventScroll:true});
    }
    if(!reduced.matches){
      const {small,full}=circles();
      reveal=menu.animate([{clipPath:small},{clipPath:full}],{duration:520,easing:'cubic-bezier(.22,1,.36,1)'});
    }
  }
  function finishClose(){stopReveal();menu.close();closed();}
  function closeMenu({immediate=false}={}){
    if(!menu.open||closing&&!immediate)return;
    const {small,full}=circles(),current=getComputedStyle(menu).clipPath;
    stopReveal();closing=true;menu.classList.add('is-closing');
    if(immediate||reduced.matches){finishClose();return;}
    const ownRevision=revision;
    reveal=menu.animate([{clipPath:current==='none'?full:current},{clipPath:small}],{duration:280,easing:'cubic-bezier(.55,.05,.8,.45)',fill:'forwards'});
    reveal.finished.then(()=>{if(ownRevision===revision&&closing)finishClose();}).catch(()=>{});
  }
  function closed(){
    if(menu.open||!active)return;
    stopReveal();active=false;closing=false;menu.classList.remove('is-closing');
    menu.removeAttribute('aria-busy');
    menu.querySelectorAll('a.is-navigating').forEach(link=>link.classList.remove('is-navigating'));
    toggle.setAttribute('aria-expanded','false');
    onClose();
    if(!desktop.matches)toggle.focus({preventScroll:true});
    else header.querySelector('.brand').focus({preventScroll:true});
  }
  function resized(event){if(event.matches)closeMenu({immediate:true});}
  function cancelled(event){event.preventDefault();closeMenu();}
  function selected(event){
    const link=event.target.closest('a[href]');
    if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download')||link.target&&link.target!=='_self')return;
    const destination=new URL(link.href,location.href);
    const localAnchor=destination.hash&&destination.origin===location.origin&&destination.pathname===location.pathname&&destination.search===location.search;
    if(localAnchor||!['http:','https:'].includes(destination.protocol)){closeMenu({immediate:true});return;}
    // Keep the current screen covered until native document navigation commits.
    menu.querySelectorAll('a.is-navigating').forEach(item=>item.classList.remove('is-navigating'));
    link.classList.add('is-navigating');menu.setAttribute('aria-busy','true');
  }
  function leaving(){closeMenu({immediate:true});}
  function restored(event){if(event.persisted)closeMenu({immediate:true});}
  function keepFocus(event){
    if(event.key!=='Tab')return;
    const controls=[...menu.querySelectorAll('button:not([disabled]),a[href]')];
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
  toggle.hidden=false;
  toggle.addEventListener('click',openMenu);
  close.addEventListener('click',closeMenu);
  menu.addEventListener('close',closed);
  menu.addEventListener('cancel',cancelled);
  menu.addEventListener('keydown',keepFocus);
  menu.addEventListener('click',selected);
  desktop.addEventListener('change',resized);
  addEventListener('pagehide',leaving);
  addEventListener('pageshow',restored);
  return ()=>{
    closeMenu({immediate:true});
    toggle.removeEventListener('click',openMenu);
    close.removeEventListener('click',closeMenu);
    menu.removeEventListener('close',closed);
    menu.removeEventListener('cancel',cancelled);
    menu.removeEventListener('keydown',keepFocus);
    menu.removeEventListener('click',selected);
    desktop.removeEventListener('change',resized);
    removeEventListener('pagehide',leaving);
    removeEventListener('pageshow',restored);
  };
}
