import test from 'node:test';
import assert from 'node:assert/strict';
import {cityOceanGuide} from '../src/section-two/city-shore.js';

function coastPhoto() {
  const width=80,height=60,data=new Uint8ClampedArray(width*height*4);
  function paint(x,y,sea) {data.set(sea===true?[70,120,180,255]:sea==='sand'?[214,198,175,255]:[170,170,170,255],(y*width+x)*4)}
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) paint(x,y,x>=(y<20?50:y<40?35:55));
  return {width,height,data,paint};
}
const channel=(guide,photo,x,y,c)=>guide[(y*photo.width+x)*4+c];

test('wave phase follows the actual bay rather than the rough search contour',()=>{
  const photo=coastPhoto(), guide=cityOceanGuide(photo,Array(photo.height).fill(40));
  const top=channel(guide,photo,54,10,1),bay=channel(guide,photo,39,30,1);
  assert.equal(top,bay);assert.ok(top>0&&top<128);
  assert.equal(channel(guide,photo,39,10,0),0);
  assert.equal(channel(guide,photo,39,30,0),255);
});

test('shore distance follows a connected headland and excludes isolated blue windows',()=>{
  const photo=coastPhoto();
  for(let y=30;y<34;y++) for(let x=35;x<60;x++) photo.paint(x,y,false);
  for(let y=10;y<14;y++) for(let x=44;x<47;x++) photo.paint(x,y,true);
  const guide=cityOceanGuide(photo,Array(photo.height).fill(45));
  assert.equal(channel(guide,photo,45,11,0),0);
  assert.equal(channel(guide,photo,59,31,0),0);
  assert.ok(channel(guide,photo,63,31,1)<80);
  assert.ok(channel(guide,photo,63,25,1)>channel(guide,photo,63,31,1));
});

test('breaking waves are admitted on sand and removed along rocky stretches',()=>{
  const photo=coastPhoto();
  for(let y=0;y<photo.height;y++) for(let x=0;x<(y<20?50:y<40?35:55);x++) photo.paint(x,y,y>=20&&y<40?false:'sand');
  const guide=cityOceanGuide(photo,Array(photo.height).fill(40));
  assert.equal(channel(guide,photo,54,10,2),255);
  assert.equal(channel(guide,photo,39,30,2),0);
  assert.equal(channel(guide,photo,39,30,0),255);
});

test('an enclosed boat stays static and does not become a new foam shoreline',()=>{
  const photo=coastPhoto();
  for(let y=8;y<13;y++) for(let x=60;x<66;x++) photo.paint(x,y,false);
  const guide=cityOceanGuide(photo,Array(photo.height).fill(45));
  assert.equal(channel(guide,photo,62,10,0),0);
  assert.ok(channel(guide,photo,62,13,1)>150);
  assert.ok(channel(guide,photo,62,7,1)>150);
});

test('a portrait row outside the ocean cannot animate a blue building',()=>{
  const photo=coastPhoto(), rough=Array(photo.height).fill(photo.width+1);
  const guide=cityOceanGuide(photo,rough);
  for(let index=0;index<guide.length;index+=4) assert.equal(guide[index],0);
});
