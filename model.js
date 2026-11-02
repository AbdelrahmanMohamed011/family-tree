(() => {
 'use strict';
 const data=window.FAMILY,people=new Map(data.people.map(p=>[p.id,p])),branches=new Map(data.branches.map(b=>[b.id,b]));
 const normalize=s=>String(s||'').normalize('NFKC').replace(/[ً-ٰٟـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').trim().toLowerCase().replace(/\s+/g,' ');
 const householdFor=id=>data.households[data.personHousehold[id]];
 const ordinals=['','الأولى','الثانية','الثالثة','الرابعة','الخامسة','السادسة','السابعة','الثامنة'];
 const model={people,branches,normalize,householdFor,
  areSpouses(a,b){return (people.get(a)?.spouseIds||[]).includes(b);},
  otherSpouses(id){return householdFor(id)?.otherSpouses||[];},
  year:v=>v==null?'لم تُضف بعد':Number(v).toLocaleString('ar-EG',{useGrouping:false}),
  months:['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
  birthDate(p){return [p.birthDay?this.year(p.birthDay):null,p.birthMonth?this.months[p.birthMonth-1]:null,p.birthYear?this.year(p.birthYear):null].filter(Boolean).join(' ')||'لم تُضف بعد';},
  deathDate(p){return this.birthDate({birthYear:p.deathYear,birthMonth:p.deathMonth,birthDay:p.deathDay});},
  details(p){const rows=[];if(!p.external&&p.generation!==1)rows.push(['الأب',p.father||'لم يُضف الاسم بعد'],['الأم',p.mother||'لم يُضف الاسم بعد']);if(p.spouseIds.length)rows.push(['الزوج / الزوجة',p.spouseIds.map(id=>{const s=people.get(id);return s.name+(p.spouseIds.length>1&&s.deceased?' ('+s.memorial+')':'');}).join(' · ')]);rows.push([p.birthMonth||p.birthDay?'تاريخ الميلاد':'سنة الميلاد',this.birthDate(p)]);if(p.deceased)rows.push([p.deathMonth||p.deathDay?'تاريخ الوفاة':'سنة الوفاة',this.deathDate(p)]);return rows;},
  today(now=new Date()){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(now);const part=type=>Number(parts.find(p=>p.type===type).value);return {year:part('year'),month:part('month'),day:part('day')};},
  nextBirthday(p,today=this.today()){
   if(!Number.isInteger(p.birthMonth)||!Number.isInteger(p.birthDay)||p.birthMonth<1||p.birthMonth>12||p.birthDay<1)return null;
   const check=new Date(Date.UTC(p.birthYear||2000,p.birthMonth-1,p.birthDay));if(check.getUTCMonth()!==p.birthMonth-1||check.getUTCDate()!==p.birthDay)return null;
   const start=Date.UTC(today.year,today.month-1,today.day);
   // A February 29 date remains February 29; do not silently move it to another day.
   for(let year=Math.max(today.year,p.birthYear||today.year);year<=Math.max(today.year,p.birthYear||today.year)+8;year++){
    const next=new Date(Date.UTC(year,p.birthMonth-1,p.birthDay)),stamp=next.getTime();
    if(next.getUTCMonth()===p.birthMonth-1&&stamp>=start)return {person:p,year,days:Math.round((stamp-start)/86400000),age:!p.deceased&&p.birthYear?year-p.birthYear:null};
   }return null;
  },
  birthdays({query='',month='',includeDeceased=false,today=this.today()}={}){
   const tokens=normalize(query).split(' ').filter(Boolean),found=[],missing=[];
   for(const p of data.people){if((p.deceased&&!includeDeceased)||!tokens.every(t=>normalize(p.name).includes(t)))continue;const next=this.nextBirthday(p,today);if(!next){missing.push(p);continue;}if(!month||p.birthMonth===Number(month))found.push(next);}
   found.sort((a,b)=>a.days-b.days||a.person.name.localeCompare(b.person.name,'ar')||a.person.id.localeCompare(b.person.id));
   return {found,missing,today};
  },
  homeMember(id,branch){const h=householdFor(id);return h&&h.parents.find(pid=>branches.get(branch).children.includes(pid));},
  routeFor(id,showPerson=false){const p=people.get(id);if(!p)return '#/';if(p.generation===1)return showPerson?'#/person/'+id:'#/';const b=p.branch;const member=this.homeMember(id,b)||branches.get(b).children[0];return '#/branch/'+b+'/'+member+(showPerson?'/person/'+id:'');},
  parseRoute(hash){const parts=hash.replace(/^#\/?/,'').split('/').map(v=>{try{return decodeURIComponent(v);}catch{return v;}});if(parts[0]==='birthdays')return {view:'birthdays'};if(parts[0]==='tree')return {view:'tree',focus:people.has(parts[1])?parts[1]:null};if(parts[0]==='kin')return {view:'kin',a:people.has(parts[1])?parts[1]:null,b:people.has(parts[2])?parts[2]:null};if(parts[0]==='person'&&people.has(parts[1])&&people.get(parts[1]).generation===1)return {view:'home',person:parts[1]};if(parts[0]!=='branch'||!branches.has(parts[1]))return {view:'home'};const b=branches.get(parts[1]);const child=b.children.includes(parts[2])?parts[2]:b.children[0];const h=householdFor(child),allowed=[b.id,b.partner,...h.parents,...h.children,...h.otherSpouses];const person=parts[3]==='person'&&allowed.includes(parts[4])?parts[4]:null;return {view:'branch',branch:b.id,child,person};},
  search(query){const tokens=normalize(query).split(' ').filter(Boolean);if(!tokens.length)return [];return data.people.filter(p=>tokens.every(t=>normalize(p.name).includes(t)));},
  context(p){if(!p.branch)return 'أصل العائلة';const b=branches.get(p.branch),h=householdFor(p.id);const member=h?this.homeMember(p.id,p.branch):null;return 'فرع '+b.name+(member?' · أسرة '+people.get(member).name:'');},
  sharedBranch(member,branch){const h=householdFor(member);if(!h)return null;const partner=h.parents.find(id=>id!==member);const p=people.get(partner);return p&&!p.external&&p.branch!==branch?{person:p,branch:branches.get(p.branch)}:null;},

  // Family relations come from households and branches only; nothing is inferred from names.
  parentsOf(id){const p=people.get(id);if(!p||p.generation===1||p.external)return [];if(p.generation===2)return ['K','KS'];if(p.generation===3)return [p.branch,branches.get(p.branch).partner];const h=Object.values(data.households).find(h=>h.children.includes(id));return h?[...h.parents]:[];},
  childrenOf(id){const p=people.get(id);if(!p)return [];if(p.generation===1)return data.branches.map(b=>b.id);if(p.generation===2){const b=data.branches.find(b=>b.id===id||b.partner===id);return b?[...b.children]:[];}const h=Object.values(data.households).find(h=>h.parents.includes(id));return h?[...h.children]:[];},
  spousesOf(id){return [...(people.get(id)?.spouseIds||[])];},
  // Parents of the same children who are not recorded as married (Lolo and Amr): linked, never shown as a marriage.
  coparentsOf(id){const h=Object.values(data.households).find(h=>h.parents.includes(id));return h&&h.children.length?h.parents.filter(x=>x!==id&&!this.areSpouses(id,x)):[];},
  siblingsOf(id){const parents=this.parentsOf(id);return parents.length?this.childrenOf(parents[0]).filter(c=>c!==id):[];},
  lineage(id){const chain=[];let current=people.get(id);while(current&&!current.external&&current.generation>1){chain.unshift(current.id);const up=this.parentsOf(current.id).map(x=>people.get(x)).find(x=>x&&!x.external);current=up;}return chain.length?['K',...chain]:[];},
  // Age at death is only shown when the death month is known; a year alone can be off by one.
  age(p,today=this.today()){if(!p.birthYear||(p.deceased&&!(p.deathYear&&p.deathMonth)))return null;const end=p.deceased?{year:p.deathYear,month:p.deathMonth,day:p.deathDay}:today;let years=end.year-p.birthYear;if(p.birthMonth&&end.month&&(end.month<p.birthMonth||(end.month===p.birthMonth&&p.birthDay&&end.day&&end.day<p.birthDay)))years--;return years;},
  arCount(n,plural,singleAcc,single,dual){const r=n%100,v=n.toLocaleString('ar-EG');if(n===1)return single+' واحد';if(n===2&&dual)return dual;if(r>=3&&r<=10)return v+' '+plural;if(r>=11)return v+' '+singleAcc;return v+' '+single;},

  // Shortest family path between two people. Blood links cost 1, marriages a little more,
  // so a blood relation is preferred when both exist. Degrees follow the civil-law count.
  // A blood stretch must climb to a common ancestor and then descend: going down to a
  // shared child and back up would make a married couple look like close blood relatives.
  kinship(a,b,{bloodOnly=false}={}){
   if(!people.has(a)||!people.has(b))return null;
   if(a===b)return {kind:'same',path:[{id:a}],segments:[[{id:a}]],degree:0,marriages:0};
   const edges=(id,phase)=>[...(phase==='up'?this.parentsOf(id).map(to=>({to,via:'parent',phase:'up',cost:1})):[]),...this.childrenOf(id).map(to=>({to,via:'child',phase:'down',cost:1})),...(bloodOnly?[]:[...this.spousesOf(id).map(to=>({to,via:'spouse',phase:'up',cost:1.6})),...this.coparentsOf(id).map(to=>({to,via:'coparent',phase:'up',cost:1.6}))])];
   const start=a+'|up',dist=new Map([[start,0]]),prev=new Map(),open=new Set([start]);let end=null;
   while(open.size){let key=null;for(const x of open)if(key===null||dist.get(x)<dist.get(key))key=x;open.delete(key);const [id,phase]=key.split('|');if(id===b){end=key;break;}
    for(const e of edges(id,phase)){const next=e.to+'|'+e.phase,d=dist.get(key)+e.cost;if(!dist.has(next)||d<dist.get(next)-1e-9){dist.set(next,d);prev.set(next,{from:key,via:e.via});open.add(next);}}}
   if(!end)return null;
   const path=[{id:b}];for(let key=end;key!==start;){const step=prev.get(key);path[0].via=step.via;path.unshift({id:step.from.split('|')[0]});key=step.from;}
   const segments=[];let seg=[path[0]];for(let i=1;i<path.length;i++){if(path[i].via==='spouse'||path[i].via==='coparent'){segments.push(seg);seg=[path[i]];}else seg.push(path[i]);}segments.push(seg);
   const marriages=segments.length-1,blood=segments.filter(s=>s.length>1);
   const degree=blood.reduce((n,s)=>n+s.length-1,0);
   const link=segments[1]?.[0]?.via,kind=marriages===0?'blood':marriages===1&&!blood.length?(link==='spouse'?'spouses':'coparents'):marriages===1&&link==='spouse'?'affinity':'extended';
   return {kind,path,segments,degree,marriages};
  },
  ordinal(n){return ordinals[n]||n.toLocaleString('ar-EG');},
  describeSegment(seg){
   // seg: consecutive blood steps. Climb first, then descend: that is the shape of a shortest blood path.
   const name=id=>people.get(id).name,vias=seg.slice(1).map(s=>s.via),ups=vias.findIndex(v=>v!=='parent');const up=ups<0?vias.length:ups,down=vias.length-up;
   if(vias.slice(up).some(v=>v!=='child'))return null;
   const rel=n=>['','من أبناء','من أحفاد','من أبناء أحفاد'][n]||'من نسل';
   const first=seg[0].id,last=seg[seg.length-1].id;
   if(down===0)return name(first)+' '+rel(up)+' '+name(last);
   if(up===0)return name(last)+' '+rel(down)+' '+name(first);
   const s1=seg[up-1].id,s2=seg[up+1].id,parts=[name(s1)+' و'+name(s2)+' إخوة'];
   if(up>1)parts.push(name(first)+' '+rel(up-1)+' '+name(s1));
   if(down>1)parts.push(name(last)+' '+rel(down-1)+' '+name(s2));
   return parts.join('، و');
  },
  explain(result){
   if(!result)return null;
   const name=id=>people.get(id).name,sentences=[];
   result.segments.forEach((seg,i)=>{if(i>0)sentences.push(name(result.segments[i-1][result.segments[i-1].length-1].id)+' و'+name(seg[0].id)+(seg[0].via==='coparent'?' عندهم أبناء مشتركين':' متجوزين'));if(seg.length>1)sentences.push(this.describeSegment(seg));});
   const title=result.kind==='same'?'نفس الشخص':result.kind==='spouses'?'زوجين':result.kind==='coparents'?'والدين لنفس الأبناء':result.kind==='blood'?(result.degree===1?'قرابة مباشرة: والدين وأبناء':result.degree===2&&result.path.length===3&&result.path[1].via==='parent'&&result.path[2].via==='child'?'إخوة':'قرابة دم من الدرجة '+this.ordinal(result.degree)):result.kind==='affinity'?'قرابة نسب (مصاهرة) من الدرجة '+this.ordinal(result.degree):'قرابة عن طريق النسب';
   return {title,sentences:sentences.filter(Boolean)};
  }
 };
 window.familyModel=model;
})();
