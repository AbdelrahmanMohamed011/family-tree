/* Olive tree geometry adapted from the user's reference, with canonical family data.
   Deterministic SVG works in the screen, offline copy and vector print output. */
(() => {
 'use strict';
 const data=window.FAMILY,model=window.familyModel;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const C={paper:'#f3efe4',raised:'#fbf9f3',canopy:'#e5e9d7',leaf:'#d5dfbc',edge:'#869b68',ink:'#282a20',muted:'#656654',bark:'#68563f',twig:'#897457',soil:'#e0d6bf',fruit:'#483044',memorial:'#9a5945'};
 const fmt=p=>p.map(v=>v.toFixed(1)).join(' ');
 function spline(points,per=14){const out=[];for(let i=0;i<points.length-1;i++){const p0=points[i-1]||points[i],p1=points[i],p2=points[i+1],p3=points[i+2]||p2;for(let s=0;s<per;s++){const t=s/per,t2=t*t,t3=t2*t;out.push([0,1].map(k=>.5*(2*p1[k]+(p2[k]-p0[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(3*p1[k]-p0[k]-3*p2[k]+p3[k])*t3)));}}out.push(points[points.length-1]);return out;}
 function taper(points,w0,w1){const samples=spline(points),left=[],right=[];samples.forEach((p,i)=>{const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,w=(w0+(w1-w0)*Math.pow(i/(samples.length-1),.75))/2;left.push([p[0]-dy/len*w,p[1]+dx/len*w]);right.push([p[0]+dy/len*w,p[1]-dx/len*w]);});return 'M'+left.map(fmt).join('L')+'L'+right.reverse().map(fmt).join('L')+'Z';}
 function lens(x,y,len,thick,deg){const a=deg*Math.PI/180,u=[Math.cos(a),Math.sin(a)],n=[-u[1],u[0]],p=(along,side)=>[x+u[0]*len*along+n[0]*thick*side,y+u[1]*len*along+n[1]*thick*side];return `M${fmt([x,y])}C${fmt(p(.22,.85))} ${fmt(p(.68,.7))} ${fmt(p(1,0))}C${fmt(p(.68,-.7))} ${fmt(p(.22,-.85))} ${fmt([x,y])}Z`;}
 function svg(branchId,{showShared=true,mobile=false,interactive=false,large=false}={}){
  const overview=branchId==='root',b=overview?{id:'K',partner:'KS',name:'أصل العائلة',children:data.branches.map(v=>v.id)}:model.branches.get(branchId);
  const font=large?1.13:1,W=mobile?360:Math.max(1120,b.children.length*220+100),cx=mobile?W-25:W/2;
  const art=[],nodes=[],regions=[];
  const text=(x,y,value,size=20,color=C.ink,bold=false,display=false,dir='rtl')=>`<text x="${x}" y="${y}" text-anchor="middle" direction="${dir}" font-family="${display?'Aref Ruqaa':'IBM Plex Sans Arabic'},Tahoma,serif" font-size="${size*font}" fill="${color}" font-weight="${bold?700:400}">${esc(value)}</text>`;
  const bark=(points,w0=13,w1=4,color=C.bark)=>art.push(`<path d="${taper(points,w0,w1)}" fill="${color}"/>`);
  const deco=(x,y,angle=-45)=>art.push(`<path d="${lens(x,y,27,9,angle)}" fill="${C.leaf}" stroke="${C.edge}" stroke-width=".8"/>`);
  const olives=(x,y)=>art.push(`<g fill="${C.fruit}"><ellipse cx="${x+6}" cy="${y}" rx="4" ry="6" transform="rotate(15 ${x+6} ${y})"/><ellipse cx="${x-5}" cy="${y+4}" rx="4" ry="6" transform="rotate(-15 ${x-5} ${y+4})"/></g>`);
  const outline=(x,y,w,h)=>`M${x} ${y+h*.5}C${x+w*.13} ${y-h*.13} ${x+w*.75} ${y-h*.09} ${x+w} ${y+h*.5}C${x+w*.75} ${y+h*1.09} ${x+w*.13} ${y+h*1.13} ${x} ${y+h*.5}Z`;
  function person(id,x,y,w,h,{leaf=false,root=false,compact=false}={}){
   const p=model.people.get(id),tag=interactive?'a':'g',attrs=interactive?` href="${esc(model.routeFor(id,true))}" tabindex="0" aria-label="عرض بيانات ${esc(p.name)}"`:'';
   let out=`<${tag} data-person="${id}" class="olive-person${leaf?' olive-leaf':''}"${attrs}><title>${esc(p.name)}${p.note?' · '+esc(p.note):''}</title>`;
   out+=leaf?`<path class="olive-surface" d="${outline(x,y,w,h)}" fill="${C.leaf}" stroke="${C.edge}" stroke-width="1"/>`:`<rect class="olive-surface" x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${root?'#ece8da':C.raised}" stroke="#c9c7b5"/>`;
   const long=!leaf||p.name.length>13,words=p.name.split(' '),lines=long&&words.length>1?[words[0],words.slice(1).join(' ')]:[p.name];
   const size=leaf?17:compact?23:26,top=leaf?(lines.length===2?27:34):(lines.length===2?40:54);
   lines.forEach((v,i)=>{const secondary=!leaf&&i>0;out+=text(x+w/2,y+top+i*(leaf?18:33),v,secondary?14:size,C.ink,!leaf&&!secondary,!leaf&&!secondary);});
   const years=p.birthYear&&p.deathYear?p.birthYear+' – '+p.deathYear:p.birthYear?String(p.birthYear):'';
   if(years)out+=text(x+w/2,y+(leaf?57:lines.length===2?94:83),years,leaf?11:12,C.muted,false,false,'ltr');
   if(!leaf&&(p.memorial||p.note))out+=text(x+w/2,y+h-10,p.memorial||p.note,10,p.memorial?C.memorial:C.muted);
   out+=`</${tag}>`;nodes.push(out);regions.push({id,x,y,w,h});
  }
  function pair(ids,x,y,{root=false}={}){
   const w=root?144:118,h=root?134:124,gap=root?30:20,total=ids.length===1?w:w*2+gap;
   if(ids.length===1){person(ids[0],x-w/2,y,w,h,{root,compact:!root});return;}
   const first=x+gap/2,second=x-gap/2-w;
   person(ids[0],first,y,w,h,{root,compact:!root});person(ids[1],second,y,w,h,{root,compact:!root});
   art.push(`<path d="M${x-gap/2} ${y+52}H${x+gap/2}" fill="none" stroke="${C.twig}" stroke-width="1.4"/>`);
   if(model.areSpouses(ids[0],ids[1]))nodes.push(`<path d="M${x} ${y+59}C${x-16} ${y+49} ${x-8} ${y+38} ${x} ${y+45}C${x+8} ${y+38} ${x+16} ${y+49} ${x} ${y+59}Z" fill="#a56754"/>`);
  }
  const houses=b.children.map(id=>{const h=overview?{parents:[id,model.branches.get(id).partner],children:[]}:model.householdFor(id),parents=[id,...h.parents.filter(p=>p!==id)],rows=mobile?h.children.length:Math.ceil(h.children.length/2);return {id,parents,kids:h.children,rows,top:rows?rows*78+32:58,half:mobile?137:168,y:0,x:0};});
  let rootY,H;
  if(mobile){let top=30;for(const h of houses){h.x=153;h.y=top+h.top;top=h.y+124+80;}rootY=top+15;H=rootY+266;}
  else{
   const step=(W-380)/Math.max(1,houses.length-1);
   houses.forEach((h,i)=>{h.x=W/2+(houses.length-1)*step/2-i*step;h.y=i%2===0?35*Math.pow((h.x-W/2)/(W/2),2):0;});
   const lowerTop=Math.min(...houses.filter((_,i)=>i%2===0).map(h=>h.y-h.top));
   houses.forEach((h,i)=>{if(i%2)h.y=lowerTop-165;});
   const min=Math.min(...houses.map(h=>h.y-h.top)),dy=75-min;
   houses.forEach(h=>h.y+=dy);rootY=Math.max(...houses.map(h=>h.y+124))+185;H=rootY+271;
  }
  // A soft olive canopy; each family grows on a separate, traceable bough.
  if(!mobile)art.push(`<ellipse cx="${W/2}" cy="${(rootY-150)/2}" rx="${W/2-18}" ry="${(rootY-150)/2-15}" fill="${C.canopy}"/>`);
  for(const h of houses)art.push(`<ellipse cx="${h.x}" cy="${h.y+(124-h.top)/2}" rx="${h.half+12}" ry="${(h.top+124)/2+16}" fill="${C.canopy}"/>`);
  const baseX=mobile?210:cx,groundY=rootY+166,trunkTop=mobile?houses[0].y+170:rootY-75;
  art.push(`<path d="M${Math.max(10,baseX-230)} ${groundY+20}Q${baseX} ${groundY-20} ${Math.min(W-10,baseX+230)} ${groundY+20}Z" fill="${C.soil}"/>`);
  bark([[baseX-13,groundY+7],[cx-7,rootY+55],[cx+12,(rootY+trunkTop)/2],[cx,trunkTop]],mobile?27:39,mobile?5:18);
  bark([[baseX+10,groundY+5],[cx+11,rootY+45],[cx-9,(rootY+trunkTop)/2],[cx+5,trunkTop]],mobile?19:27,mobile?3:12,C.twig);
  for(const dir of [-1,-.5,.3,.8])bark([[baseX+dir*10,groundY],[baseX+dir*45,groundY+19],[baseX+dir*(mobile?105:160),groundY+32]],8,1,C.twig);
  if(!mobile){
   for(const dir of [1,-1]){
    const side=houses.filter(h=>(h.x-cx)*dir>1).sort((a,b)=>(a.x-b.x)*dir);
    if(!side.length)continue;const far=side[side.length-1],bottom=far.y+124,shoulder=Math.max(...side.map(h=>h.y+124))+33;
    const farAnchor=far.parents.length>1?far.x+69:far.x;
    const limb=spline([[cx,rootY-65],[cx+(far.x-cx)*.38,rootY-125],[far.x-dir*17,shoulder],[farAnchor,bottom-4]]);
    art.push(`<path d="${taper(limb,22,5)}" fill="${C.bark}"/>`);
    side.slice(0,-1).forEach(h=>{const q=limb.reduce((best,p)=>Math.abs(p[0]-h.x)<Math.abs(best[0]-h.x)?p:best,limb[0]);const anchor=h.parents.length>1?h.x+69:h.x;bark([q,[h.x-dir*12,(q[1]+h.y+124)/2],[anchor,h.y+121]],11,4);});
    const q=limb[Math.floor(limb.length*.48)];deco(q[0],q[1],dir===1?-50:-130);
   }
  }
  houses.forEach((h,i)=>{
   const anchor=h.parents.length>1?h.x+69:h.x;
   if(mobile)bark([[cx,h.y+173],[cx-31,h.y+146],[anchor,h.y+121]],12,4);
   else if(Math.abs(h.x-cx)<=1)bark([[cx,rootY-65],[anchor,h.y+121]],13,4);
   // On the outside branch, attach the ancestry line to the family member only.
   pair(h.parents,h.x,h.y);
   const stemX=mobile?h.x+99:h.x,stemTop=h.y-h.top+14;
   if(h.kids.length){bark([[h.x,h.y+2],[stemX,h.y-12],[stemX,stemTop]],4,1.3,C.twig);}
   else {deco(h.x,h.y-6,-128);deco(h.x+2,h.y-5,-52);}
   h.kids.forEach((id,k)=>{const row=mobile?k:Math.floor(k/2),right=!mobile&&k%2===0,y=h.y-37-row*78-35,w=mobile?212:155,x=mobile?stemX-w-3:right?stemX+3:stemX-w-3;person(id,x,y,w,70,{leaf:true});});
   if(h.kids.length){deco(stemX,stemTop+3,-97);olives(stemX+7,stemTop+15);}
  });
  pair([b.id,b.partner],mobile?180:cx,rootY,{root:true});
  const label=overview?'هنا بدأت الحكاية':'من جذور خيرات وفتحي';
  nodes.push(text(mobile?180:cx,H-36,label,21,C.muted,false,true));
  if(!mobile)nodes.push(text(W/2,46,overview?'عائلة خيرات وفتحي':'فرع '+b.name,25,C.ink,true,true));
  const extras=overview?[]:b.children.flatMap(id=>model.otherSpouses(id).map(spouse=>({id,spouse})));
  const finalH=H+(extras.length?(mobile?extras.length*220+80:255):0);
  if(extras.length){
   art.push(`<rect x="12" y="${H+3}" width="${W-24}" height="${finalH-H-15}" rx="12" fill="#ebe7d9" stroke="#b9bea4"/>`);
   nodes.push(text(W/2,H+34,'زواج آخر · دون أبناء مشتركين',15,C.muted));
   extras.forEach(({id,spouse},i)=>{const x=mobile?W/2:W/2+(extras.length-1)*150-i*300,y=H+88+(mobile?i*220:0);nodes.push(text(x,y-17,'زوجة '+model.people.get(id).name,14,C.muted));person(spouse,x-110,y,220,124,{compact:true});});
  }
  const style=`.olive-person{cursor:${interactive?'pointer':'default'}}.olive-person:focus{outline:none}.olive-person:focus .olive-surface{stroke:#3e652d;stroke-width:3}.olive-person:hover .olive-surface{fill:#c4d5a6}.olive-person text{pointer-events:none}`;
  const result=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${finalH}" viewBox="0 0 ${W} ${finalH}" role="${interactive?'group':'img'}" aria-label="شجرة ${overview?'عائلة خيرات وفتحي':'فرع '+esc(b.name)}" class="olive-tree-svg"><style>${style}</style><rect width="100%" height="100%" fill="${C.paper}"/>${art.join('')}${nodes.join('')}</svg>`;
  return result;
 }
 function birthdays({found,today}){
  const rows=found.map(({person:p,days})=>'<tr><td>'+esc(p.name)+'</td><td>'+esc(model.context(p))+'</td><td>'+esc(model.birthDate(p))+'</td><td>'+esc((p.deceased?'ذكرى الميلاد · ':'')+(days===0?'النهارده':days===1?'بكرة':'باقي '+model.year(days)+' يوم'))+'</td></tr>').join('');
  return '<section class="birthday-print"><h1>أعياد ميلاد العيلة</h1><p>الأقرب الأول · '+esc(model.year(today.day)+' '+model.months[today.month-1]+' '+model.year(today.year))+' · بتوقيت مصر</p><table><thead><tr><th>الاسم</th><th>الأسرة</th><th>تاريخ الميلاد</th><th>المناسبة</th></tr></thead><tbody>'+(rows||'<tr><td colspan="4">مفيش مناسبات مطابقة للبحث أو الشهر المختار.</td></tr>')+'</tbody></table></section>';
 }
 window.familyPrint={svg,birthdays};
})();
