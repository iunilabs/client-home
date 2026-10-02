// Reuse the public form already configured on Puntoes. Multipart without custom
// content-type avoids preflight; its WordPress REST API accepts the Pages origin.
export const CONTACT_ENDPOINT='https://www.puntoes.es/wp-json/contact-form-7/v1/contact-forms/119/feedback';
const fields=['your-name','your-email','your-subject','your-message'];

export async function sendContact(data,{fetchImpl=fetch,signal}={}){
 const response=await fetchImpl(CONTACT_ENDPOINT,{method:'POST',body:data,headers:{Accept:'application/json'},credentials:'omit',signal});
 if(!response.ok)throw new Error('Contact service unavailable');
 return response.json();
}

export function contactResult(data){
 if(data?.status==='mail_sent')return {state:'success',message:'Gracias. Hemos recibido tu mensaje.'};
 if(data?.status==='validation_failed')return {state:'invalid',message:'Revisa los campos indicados antes de enviar.'};
 return {state:'error',message:'No hemos podido confirmar el envío. Conservamos tu mensaje; puedes volver a intentarlo o escribirnos a puntoes@puntoes.es.'};
}

export function invalidContactFields(data){
 return fields.filter(name=>data?.invalid_fields?.some(error=>error.field===name||error.into?.endsWith(`.${name}`)));
}

export function initContactForm(form,{send=sendContact}={}){
 if(!form)return;
 const fieldset=form.querySelector('fieldset'),button=form.querySelector('[data-contact-button]'),status=form.querySelector('[data-contact-status]');
 let sending=false;
 function show(result){status.dataset.state=result.state;status.textContent=result.message;}
 function setError(field,message=''){
  const error=field.closest('.contact-field').querySelector('.contact-field-error');
  error.textContent=message;error.hidden=!message;field.setAttribute('aria-invalid',String(Boolean(message)));
 }
 form.addEventListener('input',event=>{if(!fields.includes(event.target.name))return;event.target.setCustomValidity('');setError(event.target);});
 form.addEventListener('change',event=>{if(!fields.includes(event.target.name))return;event.target.setCustomValidity('');setError(event.target);});
 form.addEventListener('invalid',event=>{
  if(!fields.includes(event.target.name))return;
  setError(event.target,event.target.validity.typeMismatch?'Introduce un email válido.':event.target.validationMessage&&event.target.validity.customError?'Revisa este campo.':'Completa este campo.');
 },true);
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(sending||!form.reportValidity())return;
  const data=new FormData(form),controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20000);
  sending=true;fieldset.disabled=true;form.setAttribute('aria-busy','true');button.textContent='Enviando…';
  show({state:'sending',message:'Estamos enviando tu mensaje…'});
  let result,invalid=[];
  try{const response=await send(data,{signal:controller.signal});result=contactResult(response);invalid=invalidContactFields(response);}
  catch{result=contactResult(null);}
  finally{clearTimeout(timer);sending=false;fieldset.disabled=false;form.removeAttribute('aria-busy');button.textContent='Hablemos';}
  if(result.state==='success'){
   form.reset();for(const name of fields){const field=form.elements.namedItem(name);field.setCustomValidity('');setError(field);}
  }
  show(result);
  if(result.state==='invalid'&&invalid.length){
   for(const name of invalid){const field=form.elements.namedItem(name);field.setCustomValidity('Revisa este campo.');setError(field,'Revisa este campo.');}
   form.elements.namedItem(invalid[0]).focus();
  }else status.focus();
 });
}
