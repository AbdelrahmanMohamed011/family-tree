/* Pan and zoom for the full-family poster. Zooming changes the SVG viewBox rather than
   scaling pixels, so names stay sharp at every level on phones and large screens. */
(() => {
 'use strict';
 function mount(stage,svg,{onPerson}={}){
  const vb=svg.viewBox.baseVal,W=vb.width,H=vb.height;svg.removeAttribute('width');svg.removeAttribute('height');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  let view={x:0,y:0,w:W},pointers=new Map(),gesture=null,moved=0,raf=0,isFit=true;
  const size=()=>({cw:stage.clientWidth||1,ch:stage.clientHeight||1});
  const aspect=()=>{const {cw,ch}=size();return ch/cw;};
  const minW=()=>W/14,maxW=()=>Math.max(W,H/aspect())*1.15;
  function clamp(v){
   const w=Math.min(maxW(),Math.max(minW(),v.w)),h=w*aspect();
   const x=w>=W?(W-w)/2:Math.min(W-w,Math.max(0,v.x)),y=h>=H?(H-h)/2:Math.min(H-h,Math.max(0,v.y));
   return {x,y,w};
  }
  function apply(){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{svg.setAttribute('viewBox',`${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${(view.w*aspect()).toFixed(1)}`);stage.dataset.zoomed=String(view.w<W*.98);});}
  function set(v,animate=false,fitting=false){
   isFit=fitting;const target=clamp(v);
   if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){view=target;apply();return;}
   const from={...view},t0=performance.now(),dur=420;
   const step=now=>{const t=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-t,3);view={x:from.x+(target.x-from.x)*e,y:from.y+(target.y-from.y)*e,w:from.w+(target.w-from.w)*e};svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.w*aspect()}`);stage.dataset.zoomed=String(view.w<W*.98);if(t<1)requestAnimationFrame(step);};
   requestAnimationFrame(step);
  }
  const fitWidth=()=>Math.max(W,H/aspect());
  function fit(animate=true){const w=fitWidth();set({x:(W-w)/2,y:(H-w*aspect())/2,w},animate,true);}
  function point(clientX,clientY){const r=stage.getBoundingClientRect();return {x:view.x+(clientX-r.left)/r.width*view.w,y:view.y+(clientY-r.top)/r.height*view.w*aspect(),rx:(clientX-r.left)/r.width,ry:(clientY-r.top)/r.height};}
  function zoomAt(factor,clientX,clientY,animate=false){
   const r=stage.getBoundingClientRect(),cx=clientX??r.left+r.width/2,cy=clientY??r.top+r.height/2,p=point(cx,cy);
   const w=Math.min(maxW(),Math.max(minW(),view.w/factor));
   set({x:p.x-p.rx*w,y:p.y-p.ry*w*aspect(),w},animate);
  }
  function focus(id,{zoom=true}={}){
   const node=svg.querySelector(`[data-person="${CSS.escape(id)}"]`);if(!node)return false;
   const box=node.getBBox(),w=zoom?Math.max(minW(),Math.min(W,box.width*(stage.clientWidth<600?3.2:7))):view.w;
   set({x:box.x+box.width/2-w/2,y:box.y+box.height/2-w*aspect()/2,w},true);
   svg.querySelectorAll('.is-found').forEach(n=>n.classList.remove('is-found'));node.classList.add('is-found');
   setTimeout(()=>node.classList.remove('is-found'),4200);return true;
  }
  stage.addEventListener('pointerdown',e=>{
   if(e.pointerType==='mouse'&&e.button!==0)return;
   pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pointers.size===1){gesture={type:'pan',start:{...view},x:e.clientX,y:e.clientY};moved=0;}
   else if(pointers.size===2){const [a,b]=[...pointers.values()];gesture={type:'pinch',start:{...view},dist:Math.hypot(a.x-b.x,a.y-b.y),mid:point((a.x+b.x)/2,(a.y+b.y)/2)};moved=99;}
  });
  stage.addEventListener('pointermove',e=>{
   if(!pointers.has(e.pointerId)||!gesture)return;
   pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   const r=stage.getBoundingClientRect();
   if(gesture.type==='pan'&&pointers.size===1){
    const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;moved=Math.max(moved,Math.hypot(dx,dy));
    if(moved>4){if(!stage.hasPointerCapture?.(e.pointerId))stage.setPointerCapture?.(e.pointerId);stage.classList.add('is-dragging');}
    if(moved>4)isFit=false;view=clamp({x:gesture.start.x-dx/r.width*gesture.start.w,y:gesture.start.y-dy/r.height*gesture.start.w*aspect(),w:gesture.start.w});apply();
   }else if(gesture.type==='pinch'&&pointers.size===2){
    const [a,b]=[...pointers.values()],dist=Math.hypot(a.x-b.x,a.y-b.y)||1,w=Math.min(maxW(),Math.max(minW(),gesture.start.w*gesture.dist/dist));
    const mx=((a.x+b.x)/2-r.left)/r.width,my=((a.y+b.y)/2-r.top)/r.height;
    isFit=false;view=clamp({x:gesture.mid.x-mx*w,y:gesture.mid.y-my*w*aspect(),w});apply();
   }
  });
  const end=e=>{pointers.delete(e.pointerId);stage.classList.remove('is-dragging');if(pointers.size===1){const [p]=[...pointers.values()];gesture={type:'pan',start:{...view},x:p.x,y:p.y};}else if(!pointers.size)gesture=null;};
  stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',end);
  stage.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();zoomAt(Math.exp(-e.deltaY*.0045),e.clientX,e.clientY);},{passive:false});
  stage.addEventListener('dblclick',e=>{e.preventDefault();zoomAt(e.shiftKey?.5:2.2,e.clientX,e.clientY,true);});
  // A tap opens the person; a drag or pinch never does.
  svg.addEventListener('click',e=>{const target=e.target.closest('[data-person]');if(!target||moved>6)return;e.preventDefault();onPerson?.(target.dataset.person);});
  svg.querySelectorAll('[data-person]').forEach(node=>{const title=node.querySelector('title');node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label','عرض بيانات '+(title?title.textContent:''));node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onPerson?.(node.dataset.person);}});node.addEventListener('focus',()=>{if(!stage.matches(':focus-within'))return;const b=node.getBBox();if(b.x<view.x||b.x+b.width>view.x+view.w||b.y<view.y||b.y+b.height>view.y+view.w*aspect())set({x:b.x+b.width/2-view.w/2,y:b.y+b.height/2-view.w*aspect()/2,w:view.w},true);});});
  stage.addEventListener('keydown',e=>{
   if(e.target!==stage)return;const s=view.w*.12,keys={ArrowLeft:[-s,0],ArrowRight:[s,0],ArrowUp:[0,-s],ArrowDown:[0,s]};
   if(keys[e.key]){e.preventDefault();set({x:view.x+keys[e.key][0],y:view.y+keys[e.key][1],w:view.w});}
   else if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(1.5,undefined,undefined,true);}
   else if(e.key==='-'){e.preventDefault();zoomAt(1/1.5,undefined,undefined,true);}
   else if(e.key==='0'){e.preventDefault();fit();}
  });
  let lastSize='';const ro=new ResizeObserver(()=>{const s=stage.clientWidth+'x'+stage.clientHeight;if(s===lastSize)return;const first=!lastSize;lastSize=s;if(first||isFit)fit(false);else set(view);});ro.observe(stage);
  stage.append(svg);fit(false);
  return {zoomIn:()=>zoomAt(1.6,undefined,undefined,true),zoomOut:()=>zoomAt(1/1.6,undefined,undefined,true),fit,focus,destroy:()=>ro.disconnect()};
 }
 window.familyViewer={mount};
})();
