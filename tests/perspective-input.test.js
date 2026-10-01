import test from 'node:test';
import assert from 'node:assert/strict';
import {createPerspectiveInput} from '../src/perspective-input.js';

function setup({secure=true,touch=true,available=true}={}){
 const win=new EventTarget(),document=new EventTarget(),orientation=new EventTarget(),changes=[];
 let reduced=false,permissionCalls=0;
 Object.assign(orientation,{angle:0});Object.assign(document,{hidden:false});
 Object.assign(win,{document,screen:{orientation},navigator:{maxTouchPoints:touch?1:0},isSecureContext:secure,innerWidth:400,innerHeight:800,PointerEvent:class{},matchMedia:()=>({matches:touch})});
 if(available)win.DeviceOrientationEvent=class{static requestPermission(){permissionCalls++;throw new Error('Permission must never be requested')}};
 const input=createPerspectiveInput(win,{onChange:p=>changes.push(p),isReduced:()=>reduced});
 const emit=(target,type,values={})=>target.dispatchEvent(Object.assign(new Event(type),values));
 return {win,document,orientation,input,changes,emit,sensor:(beta,gamma)=>emit(win,'deviceorientation',{beta,gamma}),setReduced:value=>{reduced=value;input.reset()},permissionCalls:()=>permissionCalls};
}

test('orientation works with already accessible data and never calls the permission API',()=>{
 const h=setup();h.sensor(null,null);assert.equal(h.input.getState().source,'none');
 h.sensor(65,5);assert.deepEqual(h.changes.at(-1),{x:0,y:0});
 h.sensor(68.5,8.5);assert.deepEqual(h.changes.at(-1),{x:.5,y:-.5});assert.equal(h.input.getResponseRate(),16);
 h.sensor(110,50);assert.deepEqual(h.changes.at(-1),{x:2.8,y:-2.8});
 assert.equal(h.permissionCalls(),0);h.input.dispose();
});

test('unsupported, insecure or non-touch devices quietly keep the mouse available',()=>{
 for(const options of [{available:false},{secure:false},{touch:false}]){
  const h=setup(options);h.sensor(50,0);h.sensor(70,20);
  assert.equal(h.input.getState().source,'none');assert.equal(h.input.getState().listeningForOrientation,false);
  h.emit(h.win,'pointermove',{clientX:300,clientY:200,pointerType:'mouse'});
  assert.deepEqual(h.changes.at(-1),{x:.5,y:.5});assert.equal(h.input.getResponseRate(),5);assert.equal(h.permissionCalls(),0);h.input.dispose();
 }
 const withheld=setup();assert.deepEqual(withheld.input.getState().pointer,{x:0,y:0});assert.equal(withheld.permissionCalls(),0);withheld.input.dispose();
});

test('landscape rotation recalibrates, maps screen axes and handles the beta wrap',()=>{
 const h=setup();h.sensor(65,0);h.sensor(75,10);
 h.orientation.angle=90;h.emit(h.orientation,'change');assert.deepEqual(h.changes.at(-1),{x:0,y:0});
 h.sensor(65,0);h.sensor(68.5,0);assert.ok(Math.abs(h.changes.at(-1).x-.5)<1e-10);assert.ok(Math.abs(h.changes.at(-1).y)<1e-10);
 h.orientation.angle=0;h.emit(h.orientation,'change');h.sensor(179,0);h.sensor(-179,0);
 assert.equal(h.changes.at(-1).y,-.25);h.input.dispose();
});

test('reduced motion and hidden pages ignore sensors and recalibrate on return',()=>{
 const h=setup();h.sensor(65,0);h.sensor(75,10);h.setReduced(true);h.sensor(90,20);
 assert.deepEqual(h.changes.at(-1),{x:0,y:0});h.setReduced(false);h.sensor(90,20);assert.deepEqual(h.changes.at(-1),{x:0,y:0});
 h.document.hidden=true;h.emit(h.document,'visibilitychange');h.sensor(100,30);assert.equal(h.input.getState().source,'none');
 h.document.hidden=false;h.emit(h.document,'visibilitychange');h.sensor(100,30);assert.deepEqual(h.changes.at(-1),{x:0,y:0});h.input.dispose();
});

test('touch gestures do not hijack perspective and disposal removes every listener',()=>{
 const h=setup();h.sensor(65,0);h.sensor(76.5,11.5);
 const tilt={...h.changes.at(-1)};h.emit(h.win,'pointermove',{clientX:0,clientY:0,pointerType:'touch'});h.emit(h.win,'pointerout',{pointerType:'touch',relatedTarget:null});assert.deepEqual(h.changes.at(-1),tilt);
 h.input.dispose();const count=h.changes.length;h.sensor(85,20);h.emit(h.win,'pointermove',{clientX:100,clientY:100,pointerType:'mouse'});h.emit(h.win,'blur');h.emit(h.document,'visibilitychange');assert.equal(h.changes.length,count);
});
