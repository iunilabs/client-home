import {initHeader} from '../header.js';
import {initContactForm} from '../contact.js';

const disposeHeader=initHeader(document.querySelector('.header'));
const form=document.querySelector('[data-contact-form]');
const disposeContact=initContactForm(form);
if(form){
  const topics={consultoria:'Consultoría',ia:'IA y automatización',formacion:'Formación'};
  const topic=topics[new URLSearchParams(location.search).get('tema')];
  if(topic)form.elements['your-subject'].value=topic;
}

const filters=document.querySelector('[data-course-filters]');
if(filters){
  const cards=[...document.querySelectorAll('[data-course-area]')];
  const result=document.querySelector('[data-course-result]');
  filters.addEventListener('click',event=>{
    const button=event.target.closest('button[data-filter]');if(!button)return;
    for(const filter of filters.querySelectorAll('button'))filter.setAttribute('aria-pressed',String(filter===button));
    for(const card of cards)card.hidden=button.dataset.filter!=='todos'&&card.dataset.courseArea!==button.dataset.filter;
    result.textContent=`${cards.filter(card=>!card.hidden).length} programas · ${button.textContent}`;
  });
}

// Only below-the-fold elements fade in, once. Content remains visible without JS.
let observer;
if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){
  observer=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}
  },{threshold:0,rootMargin:'0px 0px 40px 0px'});
  for(const element of document.querySelectorAll('[data-reveal]')){
    if(element.getBoundingClientRect().top>innerHeight){element.classList.add('reveal-ready');observer.observe(element)}
  }
}
addEventListener('pagehide',event=>{if(event.persisted)return;disposeHeader?.();disposeContact?.();observer?.disconnect()});
