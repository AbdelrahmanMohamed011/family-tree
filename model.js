(() => {
 'use strict';
 const data=window.FAMILY,people=new Map(data.people.map(p=>[p.id,p])),branches=new Map(data.branches.map(b=>[b.id,b]));
 const normalize=s=>String(s||'').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').trim().toLowerCase().replace(/\s+/g,' ');
 const householdFor=id=>data.households[data.personHousehold[id]];
 const model={people,branches,normalize,householdFor,
  year:v=>v==null?'لم تُضف بعد':Number(v).toLocaleString('ar-EG',{useGrouping:false}),
  months:['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
  birthDate(p){return [p.birthDay?this.year(p.birthDay):null,p.birthMonth?this.months[p.birthMonth-1]:null,p.birthYear?this.year(p.birthYear):null].filter(Boolean).join(' ')||'لم تُضف بعد';},
  deathDate(p){return this.birthDate({birthYear:p.deathYear,birthMonth:p.deathMonth,birthDay:p.deathDay});},
  details(p){const rows=[];if(!p.external&&p.generation!==1)rows.push(['الأب',p.father||'لم يُضف الاسم بعد'],['الأم',p.mother||'لم يُضف الاسم بعد']);if(p.spouse)rows.push(['الزوج / الزوجة',p.spouse]);rows.push([p.birthMonth||p.birthDay?'تاريخ الميلاد':'سنة الميلاد',this.birthDate(p)]);if(p.deceased)rows.push([p.deathMonth||p.deathDay?'تاريخ الوفاة':'سنة الوفاة',this.deathDate(p)]);return rows;},
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
  parseRoute(hash){const parts=hash.replace(/^#\/?/,'').split('/');if(parts[0]==='birthdays')return {view:'birthdays'};if(parts[0]==='tree')return {view:'tree'};if(parts[0]==='person'&&people.has(parts[1])&&people.get(parts[1]).generation===1)return {view:'home',person:parts[1]};if(parts[0]!=='branch'||!branches.has(parts[1]))return {view:'home'};const b=branches.get(parts[1]);const child=b.children.includes(parts[2])?parts[2]:b.children[0];const h=householdFor(child),allowed=[b.id,b.partner,...h.parents,...h.children];const person=parts[3]==='person'&&allowed.includes(parts[4])?parts[4]:null;return {view:'branch',branch:b.id,child,person};},
  search(query){const tokens=normalize(query).split(' ').filter(Boolean);if(!tokens.length)return [];return data.people.filter(p=>tokens.every(t=>normalize(p.name).includes(t)));},
  context(p){if(!p.branch)return 'أصل العائلة';const b=branches.get(p.branch),h=householdFor(p.id);const member=h?this.homeMember(p.id,p.branch):null;return 'فرع '+b.name+(member?' · أسرة '+people.get(member).name:'');},
  sharedBranch(member,branch){const h=householdFor(member);if(!h)return null;const partner=h.parents.find(id=>id!==member);const p=people.get(partner);return p&&!p.external&&p.branch!==branch?{person:p,branch:branches.get(p.branch)}:null;}
 };
 window.familyModel=model;
})();
