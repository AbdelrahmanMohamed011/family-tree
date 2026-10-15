(() => {
 'use strict';
 const data=window.FAMILY,model=window.familyModel,$=id=>document.getElementById(id);
 let current={view:'home'},lastFocus=null;
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
 function link(text,href,cls){const a=el('a',text,cls);a.href=href;return a;}
 function heart(){const m=el('span',null,'marriage');m.setAttribute('aria-hidden','true');m.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 21S2 14.6 2 7.5C2 2.7 8.1 1.4 12 6c3.9-4.6 10-3.3 10 1.5C22 14.6 12 21 12 21Z"/></svg>';return m;}
 function person(id){const p=model.people.get(id),b=el('button',null,'person');b.type='button';b.dataset.person=id;b.setAttribute('aria-label','عرض بيانات '+p.name);const title=el('span',p.name,'person-name');if(p.star)title.append(el('span','★','star'));b.append(title);if(p.memorial||p.note)b.append(el('span',p.memorial||p.note,'sub'));b.onclick=()=>showPerson(id);return b;}
 function fillPair(node,ids,children=false,root=false){node.replaceChildren();node.className='pair'+(ids.length===1?' single':'')+(children?' has-children':'')+(root?' root-pair':'');ids.forEach((id,i)=>{if(i)node.append(heart());node.append(person(id));});}
 function showPerson(id){
  const p=model.people.get(id);if(!p)return;lastFocus=document.activeElement;
  $('person-title').textContent=p.name+(p.star?' ★':'');$('person-branch').textContent=p.branch?'من فرع '+model.branches.get(p.branch).name:'هنا بدأت الحكاية';
  $('person-note').textContent=p.memorial||p.note||'';
  $('person-details').replaceChildren();for(const [key,value] of model.details(p))$('person-details').append(el('dt',key),el('dd',value));
  $('done-person').textContent=current.view==='birthdays'?'رجوع لأعياد الميلاد':'رجوع للشجرة';const d=$('person-dialog');if(!d.open){if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');}
 }
 function closePerson(){const d=$('person-dialog');if(d.open){if(typeof d.close==='function')d.close();else d.removeAttribute('open');}}
 $('close-person').onclick=$('done-person').onclick=closePerson;
 $('person-dialog').addEventListener('close',()=>{if(lastFocus&&lastFocus.isConnected)lastFocus.focus();});
 $('person-dialog').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect();if(e.target===e.currentTarget&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))closePerson();});
 function renderFamily(branch,member){
  const b=model.branches.get(branch),h=model.householdFor(member),primary=model.people.get(member);
  $('family-title').textContent='أسرة '+primary.name;
  $('children-count').hidden=!h.children.length;$('children-count').textContent='الأبناء: '+h.children.length.toLocaleString('ar-EG');
  fillPair($('couple'),[member,...h.parents.filter(id=>id!==member)],h.children.length>0);
  $('descendants').replaceChildren();
  if(h.children.length){const tree=el('div',null,'desc-tree'),grid=el('div',null,'grandchildren');grid.style.setProperty('--count',h.children.length);for(const id of h.children){const wrap=el('div',null,'grandchild-wrap');wrap.append(person(id));grid.append(wrap);}tree.append(grid);$('descendants').append(tree);}
  const shared=model.sharedBranch(member,branch),note=$('shared-family');note.replaceChildren();note.hidden=!shared;
  if(shared){note.append(el('span','أسرة مشتركة مع فرع '+shared.branch.name),link('عرضها في فرع '+shared.branch.name,'#/branch/'+shared.branch.id+'/'+shared.person.id));}
 }
 function renderBranch(route){
  const b=model.branches.get(route.branch);$('branch-title').textContent='فرع '+b.name;$('branch-intro-text').textContent='أهلنا وأولادنا… حكاية واحدة بتكبر.';
  fillPair($('branch-roots'),[b.id,b.partner],true,true);$('children-heading').textContent='أبناء '+b.name;
  const nav=$('children-nav');nav.replaceChildren();nav.style.setProperty('--count',b.children.length);nav.dataset.count=String(b.children.length);
  for(const id of b.children){const p=model.people.get(id),words=p.name.split(' '),a=link(null,'#/branch/'+b.id+'/'+id,'child-option');a.dataset.member=id;a.setAttribute('aria-current',String(id===route.child));a.append(el('strong',words[0]),el('small',words.slice(1).join(' ')));nav.append(a);}
  renderFamily(b.id,route.child);
 }
 function birthdayOptions(){return {query:$('birthday-search').value,month:$('birthday-month').value,includeDeceased:!!$('birthday-include-deceased').checked};}
 let birthdayDateKey='';
 function birthdayWhen(days){return days===0?'النهارده 🎉':days===1?'بكرة':'باقي '+model.year(days)+' يوم';}
 function renderBirthdays(){
  const result=model.birthdays(birthdayOptions()),today=result.today;birthdayDateKey=JSON.stringify(today);
  $('birthday-today').textContent='النهارده '+model.year(today.day)+' '+model.months[today.month-1]+' '+model.year(today.year)+' · بتوقيت مصر';
  $('birthday-count').textContent=result.found.length?model.year(result.found.length)+' مناسبة · بالترتيب من الأقرب':'مفيش مناسبات مطابقة للبحث أو الشهر المختار.';
  $('clear-birthday-search').hidden=!$('birthday-search').value;
  const list=$('birthday-list');list.replaceChildren();
  for(const item of result.found){
   const p=item.person,card=el('article',null,'birthday-card'+(item.days===0?' is-today':''));card.dataset.person=p.id;
   const date=el('div',null,'birthday-date');date.append(el('strong',model.year(p.birthDay)),el('span',model.months[p.birthMonth-1]));
   const info=el('div',null,'birthday-info'),button=el('button',p.name,'birthday-name');button.type='button';button.setAttribute('aria-label','عرض بيانات '+p.name);button.onclick=()=>showPerson(p.id);
   info.append(button,el('small',model.context(p)));
   if(p.deceased)info.append(el('span','ذكرى الميلاد · '+(p.memorial||'رحمه الله'),'birthday-age'));
   else if(item.age!==null)info.append(el('span',(item.days===0?'بيتمّ ':'هيتمّ ')+model.year(item.age)+' سنة','birthday-age'));
   card.append(date,info,el('span',p.deceased?(item.days===0?'ذكرى ميلاده النهارده':birthdayWhen(item.days)):birthdayWhen(item.days),'birthday-countdown'));list.append(card);
  }
  $('birthday-missing').hidden=!result.missing.length;
  $('birthday-missing-title').textContent='تواريخ لسه ناقصة ('+model.year(result.missing.length)+')';
  $('birthday-missing-list').replaceChildren();for(const p of result.missing){const b=el('button',p.name+' · '+model.context(p),'missing-person');b.type='button';b.onclick=()=>showPerson(p.id);$('birthday-missing-list').append(b);}
 }
 function preparePrint(){if(current.view==='birthdays'){$('print-area').innerHTML=window.familyPrint.birthdays(model.birthdays(birthdayOptions()));return;}const ids=current.view==='branch'?[current.branch]:['root',...data.branches.map(b=>b.id)];$('print-area').innerHTML=ids.map(id=>'<section class="print-page">'+window.familyPrint.svg(id,{showShared:current.view==='branch'})+'</section>').join('');}
 function renderWholeTree(){const container=$('all-trees');container.replaceChildren();fillPair($('tree-roots'),['K','KS'],false,true);for(const b of data.branches){const section=el('section',null,'tree-sheet'),head=el('div',null,'tree-sheet-head');head.append(el('h2','فرع '+b.name),link('افتح الفرع','#/branch/'+b.id));section.append(head,el('p','اسحب الشجرة يمين وشمال لقراءة الأسماء.','tree-scroll-hint'));const drawing=el('div',null,'svg-scroll');drawing.tabIndex=0;drawing.setAttribute('aria-label','شجرة فرع '+b.name);drawing.innerHTML=window.familyPrint.svg(b.id,{showShared:false});section.append(drawing);container.append(section);}}
 function applyRoute(initial=false){
  const previous=current;current=model.parseRoute(location.hash);closePerson();
  for(const view of ['home','branch','tree','birthdays'])$(view+'-view').hidden=current.view!==view;
  $('navigation').hidden=current.view==='home';$('global-search-section').hidden=current.view==='birthdays';$('branch-select').value=current.branch||'';
  $('print-button').textContent=current.view==='birthdays'?'طباعة القائمة':current.view==='branch'?'طباعة الفرع':'طباعة العائلة';
  if(current.view==='branch')renderBranch(current);else if(current.view==='tree')renderWholeTree();else if(current.view==='birthdays')renderBirthdays();
  document.title=current.view==='birthdays'?'عيلتنا — أعياد الميلاد':current.view==='branch'?'عيلتنا — فرع '+model.branches.get(current.branch).name:current.view==='tree'?'عيلتنا — العائلة كاملة':'عيلتنا — عائلة خيرات وفتحي';
  preparePrint();
  if(!initial){$('family-search').value='';renderSearch();const target=current.view==='branch'&&previous.view==='branch'&&previous.branch===current.branch?$('family-title'):$(current.view==='home'?'home-title':current.view==='tree'?'tree-title':current.view==='birthdays'?'birthdays-title':'branch-title');target.focus({preventScroll:true});if(!current.person)target.scrollIntoView({behavior:'auto',block:'start'});}
  if(current.person)showPerson(current.person);
 }
 function renderSearch(){
  const query=$('family-search').value,results=model.search(query),box=$('search-results');box.replaceChildren();$('clear-search').hidden=!query;box.hidden=!query.trim();
  if(!query.trim()){$('search-status').textContent='';return;}
  $('search-status').textContent=results.length?results.length.toLocaleString('ar-EG')+' نتيجة'+(results.length>20?' · ظاهر أول ٢٠ اسم، زوّد جزء من الاسم لتحديد النتيجة':''):'مفيش اسم مطابق. جرّب جزء أصغر من الاسم.';
  for(const p of results.slice(0,20)){const a=link(null,model.routeFor(p.id,true),'search-result');a.dataset.person=p.id;a.append(el('strong',p.name+(p.star?' ★':'')),el('small',model.context(p)));a.addEventListener('click',()=>{if(location.hash===model.routeFor(p.id,true))showPerson(p.id);});box.append(a);}
 }
 for(const b of data.branches){const option=el('option',b.name);option.value=b.id;$('branch-select').append(option);const card=link(null,'#/branch/'+b.id,'branch-card');card.dataset.branch=b.id;const meta=el('span',null,'branch-meta'),memorial=model.people.get(b.id).memorial;if(memorial)meta.append(el('small',memorial));meta.append(el('small',b.children.length.toLocaleString('ar-EG')+' من الأبناء'));card.append(el('span','♧','branch-icon'),el('strong',b.name),meta,el('span','افتح الفرع ←','enter-branch'));$('branch-cards').append(card);}
 fillPair($('home-roots'),['K','KS'],true,true);
 $('branch-select').onchange=e=>{if(e.target.value)location.hash='#/branch/'+e.target.value;};
 $('family-search').addEventListener('input',renderSearch);
 $('family-search').addEventListener('keydown',e=>{if(e.key==='Escape'){$('family-search').value='';renderSearch();}if(e.key==='Enter'){const first=$('search-results').querySelector('a');if(first){e.preventDefault();location.hash=first.getAttribute('href');}}});
 $('clear-search').onclick=()=>{$('family-search').value='';renderSearch();$('family-search').focus();};
 $('type-size').onclick=()=>{const large=document.body.classList.toggle('large-type');$('type-size').setAttribute('aria-pressed',String(large));$('type-size').textContent=large?'حجم الخط العادي':'تكبير الخط أ+';};
 $('print-button').onclick=()=>{preparePrint();window.print();};
 window.addEventListener('beforeprint',preparePrint);window.addEventListener('hashchange',()=>applyRoute());
 for(let i=0;i<model.months.length;i++){const option=el('option',model.months[i]);option.value=String(i+1);$('birthday-month').append(option);}
 $('birthday-search').addEventListener('input',renderBirthdays);
 $('birthday-month').addEventListener('change',renderBirthdays);
 $('birthday-include-deceased').addEventListener('change',renderBirthdays);
 $('clear-birthday-search').onclick=()=>{$('birthday-search').value='';renderBirthdays();$('birthday-search').focus();};
 $('birthday-search').addEventListener('keydown',e=>{if(e.key==='Escape')$('clear-birthday-search').onclick();});
 window.addEventListener('focus',()=>{if(current.view==='birthdays')renderBirthdays();});
 window.addEventListener('pageshow',()=>{if(current.view==='birthdays')renderBirthdays();});
 if(window.setInterval)window.setInterval(()=>{if(current.view==='birthdays'&&birthdayDateKey!==JSON.stringify(model.today()))renderBirthdays();},60000);
 applyRoute(true);document.body.classList.add('app-ready');
})();
