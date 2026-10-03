export function initHeader(header,{onOpen=()=>{},onClose=()=>{}}={}){
  const toggle=header.querySelector('.header-menu-toggle');
  const menu=header.querySelector('.header-mobile-menu');
  const close=header.querySelector('.header-menu-close');
  const desktop=matchMedia('(min-width:1100px)');
  let active=false;
  function openMenu(){
    if(menu.open||desktop.matches)return;
    menu.showModal();
    active=true;
    toggle.setAttribute('aria-expanded','true');
    onOpen();
    close.focus({preventScroll:true});
  }
  function closeMenu(){if(menu.open){menu.close();closed();}}
  function closed(){
    if(menu.open||!active)return;
    active=false;
    toggle.setAttribute('aria-expanded','false');
    onClose();
    if(!desktop.matches)toggle.focus({preventScroll:true});
    else header.querySelector('.brand').focus({preventScroll:true});
  }
  function resized(event){if(event.matches)closeMenu();}
  function cancelled(event){event.preventDefault();closeMenu();}
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
  desktop.addEventListener('change',resized);
  return ()=>{
    closeMenu();
    toggle.removeEventListener('click',openMenu);
    close.removeEventListener('click',closeMenu);
    menu.removeEventListener('close',closed);
    menu.removeEventListener('cancel',cancelled);
    menu.removeEventListener('keydown',keepFocus);
    desktop.removeEventListener('change',resized);
  };
}
