import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CONTACT_ENDPOINT,sendContact,contactResult,invalidContactFields} from '../src/contact.js';

test('contact uses the existing public endpoint and multipart without credentials or preflight headers',async()=>{
 const body=new FormData();body.set('your-name','Test');
 const controller=new AbortController();let request;
 const result=await sendContact(body,{signal:controller.signal,fetchImpl:async(url,options)=>{request={url,...options};return {ok:true,json:async()=>({status:'mail_sent'})};}});
 assert.equal(request.url,CONTACT_ENDPOINT);assert.equal(request.method,'POST');assert.equal(request.body,body);
 assert.equal(request.credentials,'omit');assert.equal(request.signal,controller.signal);assert.deepEqual(request.headers,{Accept:'application/json'});
 assert.equal(contactResult(result).state,'success');
});
test('HTTP and network failures reject instead of claiming delivery',async()=>{
 await assert.rejects(sendContact(new FormData(),{fetchImpl:async()=>({ok:false})}));
 await assert.rejects(sendContact(new FormData(),{fetchImpl:async()=>{throw new Error('offline');}}));
});
test('only confirmed mail_sent is success, including unknown or aborted server responses',()=>{
 for(const status of ['mail_failed','spam','aborted','success',undefined])assert.equal(contactResult({status}).state,'error');
 assert.equal(contactResult(null).state,'error');assert.equal(contactResult({status:'validation_failed'}).state,'invalid');
});
test('validation supports the current CF7 selectors and newer field names without trusting arbitrary selectors',()=>{
 assert.deepEqual(invalidContactFields({invalid_fields:[{into:'span.wpcf7-form-control-wrap.your-email'},{field:'your-subject'},{field:'unrelated'},{into:'body'}]}),['your-email','your-subject']);
 assert.deepEqual(invalidContactFields({}),[]);
});
