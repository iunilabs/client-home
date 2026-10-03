import {smooth} from '../section-three/motion.js';
import {routeFor,routingPose,applyRoutingAppearance} from './routing-model.js';
import './task-routing.css';

// A single scroll cursor drives the papers, routes and outcome counters.
function resultFor(piece){
  const route=routeFor(piece.kind);
  if(route===0)return piece.kind==='email'?'Solicitud clasificada y priorizada':'Tarea agrupada con su contexto';
  if(route===1)return piece.kind==='document'?'Datos extraídos y preparados':piece.kind==='test'?'Pruebas ejecutadas · resultado disponible':'Resumen preparado para revisión';
  return ['qa','deploy','ticket'].includes(piece.kind)?'A Tecnología · con contexto':piece.kind==='approval'?'A Finanzas · pendiente de validación':'A Operaciones · con responsable';
}
export function createTaskRouting(journey){
  if(!journey.hasAttribute('data-task-routing'))return null;
  const stage=journey.querySelector('.paper-stage'), panels=[...journey.querySelectorAll('[data-route]')];
  const action=journey.querySelector('[data-routing-action]'), paths=[...journey.querySelectorAll('[data-route-line]')];
  let key='',previousProgress=0;
  return {
    status(state){return state.ordered<1?'Preparando el flujo':state.pending?'La IA organiza y reparte':'Trabajo organizado y encaminado';},
    update(state,pieces){
      const reveal=smooth(.18,.3,state.progress).toFixed(4);
      if(stage.style.getPropertyValue('--routing-reveal')!==reveal)stage.style.setProperty('--routing-reveal',reveal);
      if(state.progress===0&&previousProgress>0)for(const piece of pieces)for(const material of piece.materials()){material.opacity=1;material.transparent=false;material.needsUpdate=true;piece.mesh.castShadow=true;}
      previousProgress=state.progress;
      const active=state.activeIndex===null?null:pieces.find(p=>p.workflowIndex===state.activeIndex);
      const activeRoute=active?routeFor(active.kind):-1;
      const nextKey=`${state.completed}/${activeRoute}/${state.ordered===1}`;
      if(key===nextKey)return;
      key=nextKey;
      const counts=[0,0,0],last=[null,null,null];
      for(const piece of pieces)if(piece.workflowIndex<state.completed){const route=routeFor(piece.kind);counts[route]++;if(!last[route]||piece.workflowIndex>last[route].workflowIndex)last[route]=piece;}
      panels.forEach((panel,i)=>{panel.querySelector('[data-route-count]').textContent=counts[i];panel.classList.toggle('is-active',activeRoute===i);const example=panel.querySelector('[data-route-example]');example.textContent=last[i]?resultFor(last[i]):['Solicitudes clasificadas','Datos preparados','Con responsable y contexto'][i];});
      paths.forEach(path=>path.classList.toggle('is-active',+path.dataset.routeLine===activeRoute));
      action.textContent=state.ordered<1?'Entiende y reparte':activeRoute<0?'Flujo completado':['Clasifica y prioriza','Prepara el resultado','Asigna al equipo'][activeRoute];
    },
    pose(card,piece){return routingPose(card,piece.kind,innerWidth,innerHeight);},
    appearance:applyRoutingAppearance
  };
}
