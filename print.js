(() => {
 'use strict';
 const data=window.FAMILY,model=window.familyModel,escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function svg(branchId,{showShared=true}={}){
  const overview=branchId==='root',b=overview?{id:'K',partner:'KS',name:'أصل العائلة',children:data.branches.map(branch=>branch.id)}:model.branches.get(branchId),n=b.children.length,width=Math.max(1100,n*354+16),height=overview?800:1340,parts=[];
  const household=id=>overview?{parents:[id,model.branches.get(id).partner],children:[]}:model.householdFor(id);
  const text=(x,y,s,size=25,color='#283e34',bold=false)=>parts.push(`<text x="${x}" y="${y}" text-anchor="middle" direction="rtl" font-family="Arial,Tahoma,sans-serif" font-size="${size}" fill="${color}" font-weight="${bold?700:400}">${escape(s)}</text>`);
  const line=(x1,y1,x2,y2)=>parts.push(`<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="#9fb49a" stroke-width="2.5"/>`);
  function heart(x,y){parts.push(`<path d="M${x} ${y+12} C${x-26} ${y-3} ${x-14} ${y-22} ${x} ${y-10} C${x+14} ${y-22} ${x+26} ${y-3} ${x} ${y+12}Z" fill="#b77770"/>`);}
  function card(id,x,y,w=145,root=false){const p=model.people.get(id);parts.push(`<g data-person="${id}"><rect x="${x-w/2}" y="${y}" width="${w}" height="104" rx="17" fill="${root?'#e5eedf':p.generation===4?'#eff4e9':'#fffaf1'}" stroke="#c8d7be" stroke-width="1.6"/>`);const name=p.name+(p.star?' ★':''),words=name.split(' '),split=name.length>13&&words.length>1;if(split){text(x,y+30,words[0],25,'#283e34',true);text(x,y+58,words.slice(1).join(' '),22,'#283e34',true);}else text(x,y+37,name,25,'#283e34',true);const years=p.birthYear&&p.deathYear?p.birthYear+' – '+p.deathYear:p.birthYear?String(p.birthYear):p.deathYear?'توفي عام '+p.deathYear:'';if(years)text(x,y+(split?80:65),years,18,'#657366');if(p.memorial||p.note)text(x,y+96,p.memorial||p.note,15,'#657366');parts.push('</g>');}
  function pair(ids,x,y,root=false,down=false){if(ids.length===1){card(ids[0],x,y,210,root);return;}const w=root?190:145,offset=root?110:87;line(x-offset+w/2,y+52,x+offset-w/2,y+52);if(down)line(x,y+62,x,y+104);card(ids[0],x+offset,y,w,root);card(ids[1],x-offset,y,w,root);heart(x,y+52);}
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="شجرة فرع ${escape(b.name)}"><rect width="100%" height="100%" fill="#fffaf1"/>`);
  text(width/2,43,overview?'عائلة خيرات وفتحي':'عائلة خيرات وفتحي · فرع '+b.name,32,'#283e34',true);text(width/2,74,overview?'هنا بدأت الحكاية':'خيرات عبدالله وفتحي كامل',20,'#657366');
  pair([b.id,b.partner],width/2,108,true,true);line(width/2,212,width/2,268);
  const gap=354,first=width/2+(n-1)*gap/2,centers=b.children.map((_,i)=>first-i*gap),anchors=b.children.map((id,i)=>centers[i]+(household(id).parents.length>1?87:0));line(Math.min(...anchors),268,Math.max(...anchors),268);
  b.children.forEach((id,i)=>{const h=household(id),x=centers[i],ids=[id,...h.parents.filter(p=>p!==id)];line(anchors[i],268,anchors[i],328);pair(ids,x,328,false,!!h.children.length);
   if(h.children.length){line(x,432,x,489);line(x,489,x+146,489);line(x+146,489,x+146,536+(h.children.length-1)*140+52);h.children.forEach((kid,j)=>{const y=536+j*140;line(x+146,y+52,x+107,y+52);card(kid,x,y,214);});}
   const shared=model.sharedBranch(id,b.id);if(showShared&&shared)text(x,1240,'أسرة مشتركة مع فرع '+shared.branch.name,18,'#657366');
  });
  if(overview)text(width/2,560,'أبناء كل فرع وأحفاده في الصفحات التالية',25,'#657366');
  text(width/2,height-37,'كل اسم… جزء من حكايتنا.',24,'#657366');parts.push('</svg>');return parts.join('\n');
 }
 function birthdays({found,today}){
  const rows=found.map(({person:p,days})=>'<tr><td>'+escape(p.name)+'</td><td>'+escape(model.context(p))+'</td><td>'+escape(model.birthDate(p))+'</td><td>'+escape(p.deceased?'ذكرى الميلاد':days===0?'النهارده':days===1?'بكرة':'باقي '+model.year(days)+' يوم')+'</td></tr>').join('');
  return '<section class="birthday-print"><h1>أعياد ميلاد العيلة</h1><p>الأقرب الأول · '+escape(model.year(today.day)+' '+model.months[today.month-1]+' '+model.year(today.year))+' · بتوقيت مصر</p><table><thead><tr><th>الاسم</th><th>الأسرة</th><th>تاريخ الميلاد</th><th>المناسبة</th></tr></thead><tbody>'+rows+'</tbody></table></section>';
 }
 window.familyPrint={svg,birthdays};
})();
