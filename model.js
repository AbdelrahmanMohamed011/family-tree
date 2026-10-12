(() => {
 'use strict';
 const data=window.FAMILY,people=new Map(data.people.map(p=>[p.id,p])),branches=new Map(data.branches.map(b=>[b.id,b]));
 const normalize=s=>String(s||'').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').trim().toLowerCase().replace(/\s+/g,' ');
 const householdFor=id=>data.households[data.personHousehold[id]];
 const model={people,branches,normalize,householdFor,
  year:v=>v==null?'لم تُضف بعد':Number(v).toLocaleString('ar-EG',{useGrouping:false}),
  details(p){const rows=[];if(!p.external&&p.generation!==1)rows.push(['الأب',p.father||'لم يُضف الاسم بعد'],['الأم',p.mother||'لم يُضف الاسم بعد']);if(p.spouse)rows.push(['الزوج / الزوجة',p.spouse]);rows.push(['سنة الميلاد',this.year(p.birthYear)]);if(p.deceased)rows.push(['سنة الوفاة',this.year(p.deathYear)]);return rows;},
  homeMember(id,branch){const h=householdFor(id);return h&&h.parents.find(pid=>branches.get(branch).children.includes(pid));},
  routeFor(id,showPerson=false){const p=people.get(id);if(!p)return '#/';if(p.generation===1)return showPerson?'#/person/'+id:'#/';const b=p.branch;const member=this.homeMember(id,b)||branches.get(b).children[0];return '#/branch/'+b+'/'+member+(showPerson?'/person/'+id:'');},
  parseRoute(hash){const parts=hash.replace(/^#\/?/,'').split('/');if(parts[0]==='tree')return {view:'tree'};if(parts[0]==='person'&&people.has(parts[1])&&people.get(parts[1]).generation===1)return {view:'home',person:parts[1]};if(parts[0]!=='branch'||!branches.has(parts[1]))return {view:'home'};const b=branches.get(parts[1]);const child=b.children.includes(parts[2])?parts[2]:b.children[0];const person=parts[3]==='person'&&people.has(parts[4])?parts[4]:null;return {view:'branch',branch:b.id,child,person};},
  search(query){const tokens=normalize(query).split(' ').filter(Boolean);if(!tokens.length)return [];return data.people.filter(p=>tokens.every(t=>normalize(p.name).includes(t)));},
  context(p){if(!p.branch)return 'أصل العائلة';const b=branches.get(p.branch),h=householdFor(p.id);const member=h?this.homeMember(p.id,p.branch):null;return 'فرع '+b.name+(member?' · أسرة '+people.get(member).name:'');},
  sharedBranch(member,branch){const h=householdFor(member);if(!h)return null;const partner=h.parents.find(id=>id!==member);const p=people.get(partner);return p&&!p.external&&p.branch!==branch?{person:p,branch:branches.get(p.branch)}:null;}
 };
 window.familyModel=model;
})();
