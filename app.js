(() => {
 'use strict';
 const data=window.FAMILY,model=window.familyModel,$=id=>document.getElementById(id);
 let current={view:'home'},lastFocus=null,viewer=null,printReady=false;
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
 function link(text,href,cls){const a=el('a',text,cls);a.href=href;return a;}
 const iconHTML=name=>'<svg class="icon" aria-hidden="true"><use href="#i-'+name+'"/></svg>';
 function iconText(tag,name,text,cls){const e=el(tag,null,cls);e.innerHTML=iconHTML(name);e.append(el('span',text));return e;}
 const num=n=>Number(n).toLocaleString('ar-EG');
 const firstName=p=>p.name.split(' ')[0];
 const whenText=days=>days===0?'النهارده':days===1?'بكرة':days===2?'بعد يومين':days<=10?'بعد '+num(days)+' أيام':'بعد '+num(days)+' يوم';
 const yearsText=n=>n===1?'سنة':n===2?'سنتين':n>=3&&n<=10?num(n)+' سنين':num(n)+' سنة';
 const onPoster=id=>!(window.FAMILY_POSTER||'').length||window.FAMILY_POSTER.includes('data-person="'+id+'"');
 function toast(message){const t=$('toast');t.textContent=message;t.hidden=false;if(window.setTimeout){clearTimeout(toast.timer);toast.timer=window.setTimeout(()=>{t.hidden=true;},2600);}}
 function heart(){const m=el('span',null,'marriage');m.setAttribute('aria-hidden','true');m.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 21S2 14.6 2 7.5C2 2.7 8.1 1.4 12 6c3.9-4.6 10-3.3 10 1.5C22 14.6 12 21 12 21Z"/></svg>';return m;}
 function person(id){const p=model.people.get(id),b=el('button',null,'person');b.type='button';b.dataset.person=id;b.setAttribute('aria-label','عرض بيانات '+p.name);const title=el('span',p.name,'person-name');if(p.star)title.append(el('span','★','star'));b.append(title);if(p.memorial||p.note)b.append(el('span',p.memorial||p.note,'sub'));b.onclick=()=>showPerson(id);return b;}
 function fillPair(node,ids,children=false,root=false){const married=ids.length===2&&model.areSpouses(ids[0],ids[1]);node.replaceChildren();node.className='pair'+(ids.length===1?' single':'')+(ids.length===3?' three':'')+(children?' has-children':'')+(root?' root-pair':'')+(ids.length===2&&!married?' co-parents':'');ids.forEach((id,i)=>{if(i){const connector=model.areSpouses(ids[i-1],id)?heart():el('span',null,'marriage');connector.setAttribute('aria-hidden','true');node.append(connector);}node.append(person(id));});}
 function chip(id,cls='person-chip'){const p=model.people.get(id),b=el('button',p.name+(p.star?' ★':''),cls);b.type='button';b.dataset.chip=id;b.onclick=()=>showPerson(id,{keepFocus:true});return b;}

 // Person sheet: details, how they connect to the founders, and one-tap links to close family.
 function showPerson(id,{keepFocus=false}={}){
  const p=model.people.get(id);if(!p)return;if(!keepFocus||!$('person-dialog').open)lastFocus=document.activeElement;
  $('person-title').textContent=p.name+(p.star?' ★':'');$('person-branch').textContent=p.branch?'من فرع '+model.branches.get(p.branch).name:'هنا بدأت الحكاية';
  $('person-note').textContent=p.memorial||p.note||'';
  const line=model.lineage(id),lineage=$('person-lineage');lineage.replaceChildren();lineage.hidden=line.length<3;
  if(line.length>=3){line.forEach((pid,i)=>{if(i)lineage.append(el('span','←','lineage-sep'));if(pid==='K'){const b=el('button','خيرات وفتحي','lineage-step');b.type='button';b.onclick=()=>showPerson('K',{keepFocus:true});lineage.append(b);}else if(pid===id)lineage.append(el('strong',firstName(p),'lineage-self'));else{const b=el('button',firstName(model.people.get(pid)),'lineage-step');b.type='button';b.onclick=()=>showPerson(pid,{keepFocus:true});lineage.append(b);}});}
  const facts=$('person-facts');facts.replaceChildren();const age=model.age(p),next=model.nextBirthday(p);
  if(age!=null)facts.append(el('li',(p.deceased?'العمر عند الوفاة: ':'العمر: ')+yearsText(age)));
  if(next&&!p.deceased)facts.append(el('li',next.days===0?'النهارده عيد ميلاد':'عيد الميلاد '+whenText(next.days)));
  facts.append(el('li',['','الجيل الأول','الجيل الثاني','الجيل الثالث','الجيل الرابع'][p.generation]||''));
  $('person-details').replaceChildren();for(const [key,value] of model.details(p))$('person-details').append(el('dt',key),el('dd',value));
  const family=$('person-family');family.replaceChildren();
  const groups=[['الوالدين',model.parentsOf(id)],['الزوج / الزوجة',model.spousesOf(id)],['الأبناء',model.childrenOf(id)],['الإخوة',model.siblingsOf(id)]];
  for(const [label,ids] of groups){const list=ids.filter(x=>model.people.has(x));if(!list.length)continue;const g=el('div',null,'family-group');g.append(el('h3',label));const row=el('div',null,'chip-row');for(const x of list)row.append(chip(x));g.append(row);family.append(g);}
  family.hidden=!family.children.length;
  $('person-on-tree').href='#/tree/'+id;$('person-on-tree').hidden=!onPoster(id);$('person-kin').href='#/kin/'+id;
  $('person-share').onclick=()=>sharePerson(p);
  $('done-person').textContent=current.view==='birthdays'?'رجوع لأعياد الميلاد':current.view==='kin'?'رجوع لصلة القرابة':current.view==='tree'?'رجوع للوحة':'رجوع للشجرة';
  const d=$('person-dialog');if(!d.open){if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');}
  if(keepFocus&&typeof d.scrollTo==='function')d.scrollTo(0,0);
 }
 function sharePerson(p){
  const url=(location.origin&&location.origin!=='null'?location.origin+location.pathname:'')+model.routeFor(p.id,true),text=p.name+' · '+model.context(p);
  if(typeof navigator!=='undefined'&&navigator.share&&url.startsWith('http'))navigator.share({title:'عيلتنا — '+p.name,text,url}).catch(()=>{});
  else if(typeof navigator!=='undefined'&&navigator.clipboard&&url)navigator.clipboard.writeText(url).then(()=>toast('اتنسخ الرابط، ابعته لأي حد في العيلة')).catch(()=>toast(url));
  else toast(text);
 }
 function closePerson(){const d=$('person-dialog');if(d.open){if(typeof d.close==='function')d.close();else d.removeAttribute('open');}}
 $('close-person').onclick=$('done-person').onclick=closePerson;
 $('person-dialog').addEventListener('close',()=>{if(lastFocus&&lastFocus.isConnected)lastFocus.focus();});
 $('person-dialog').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect();if(e.target===e.currentTarget&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))closePerson();});

 function renderFamily(branch,member){
  const b=model.branches.get(branch),h=model.householdFor(member),primary=model.people.get(member);
  $('family-title').textContent='أسرة '+primary.name;
  $('family-panel').className='family-panel'+(h.otherSpouses.length?' multi-marriage':'');
  $('children-count').hidden=!h.children.length;$('children-count').textContent='الأبناء: '+h.children.length.toLocaleString('ar-EG');
  const parentIds=[member,...h.parents.filter(id=>id!==member)],shown=parentIds.length===2&&h.otherSpouses.length?[...h.otherSpouses,member,parentIds[1]]:[...parentIds,...h.otherSpouses];
  fillPair($('couple'),shown,h.children.length>0);
  const childAnchor=h.otherSpouses.length?(parentIds.length===1?'75%':'33.333%'):'50%';
  $('couple').style.setProperty('--child-anchor',childAnchor);
  $('descendants').replaceChildren();
  if(h.children.length){const tree=el('div',null,'desc-tree'+(h.otherSpouses.length?' offcenter'+(parentIds.length===2?' is-left':''):'')),grid=el('div',null,'grandchildren');tree.style.setProperty('--child-anchor',childAnchor);grid.style.setProperty('--count',h.children.length);for(const id of h.children){const wrap=el('div',null,'grandchild-wrap');wrap.append(person(id));grid.append(wrap);}tree.append(grid);$('descendants').append(tree);}
  const origin=$('family-origin-note');origin.textContent=h.parents.length===1&&h.children.length?'الأم: '+model.people.get(h.children[0]).mother:'';origin.hidden=!origin.textContent;
  const shared=model.sharedBranch(member,branch),note=$('shared-family');note.replaceChildren();note.hidden=!shared;
  if(shared){note.append(el('span','أسرة مشتركة مع فرع '+shared.branch.name),link('عرضها في فرع '+shared.branch.name,'#/branch/'+shared.branch.id+'/'+shared.person.id));}
 }
 function renderGrove(node,id,shared=true){
  const large=document.body.classList.contains('large-type');
  node.innerHTML='<div class="olive-crown">'+window.familyPrint.svg(id,{showShared:shared,interactive:true,large})+'</div><div class="olive-column">'+window.familyPrint.svg(id,{showShared:shared,interactive:true,mobile:true,large})+'</div>';
  node.onclick=e=>{const target=e.target.closest('[data-person]');if(target&&node.contains(target)){e.preventDefault();showPerson(target.dataset.person);}};
 }
 function renderBranch(route){
  const b=model.branches.get(route.branch);$('branch-title').textContent='فرع '+b.name;$('branch-intro-text').textContent='أهلنا وأولادنا… حكاية واحدة بتكبر.';
  fillPair($('branch-roots'),[b.id,b.partner],true,true);$('children-heading').textContent='أبناء '+b.name;
  const nav=$('children-nav');nav.replaceChildren();nav.style.setProperty('--count',b.children.length);nav.dataset.count=String(b.children.length);
  for(const id of b.children){const p=model.people.get(id),words=p.name.split(' '),a=link(null,'#/branch/'+b.id+'/'+id,'child-option');a.dataset.member=id;a.setAttribute('aria-current',String(id===route.child));a.append(el('strong',words[0]),el('small',words.slice(1).join(' ')));nav.append(a);}
  renderFamily(b.id,route.child);renderGrove($('branch-grove'),b.id);
 }

 // Birthdays: spotlight, month groups, calendar export and a ready WhatsApp wish.
 function birthdayOptions(){return {query:$('birthday-search').value,month:$('birthday-month').value,includeDeceased:!!$('birthday-include-deceased').checked};}
 let birthdayDateKey='';const birthdayButtons=new Map();
 function wishLink(p,compact=false){const a=compact?el('a',null,'wish-link icon-only'):iconText('a','message','ابعت تهنئة','wish-link');a.href='https://wa.me/?text='+encodeURIComponent('كل سنة وأنتم طيبين يا '+firstName(p)+'، عيد ميلاد سعيد! من عيلتنا، عائلة خيرات وفتحي.');a.target='_blank';a.rel='noopener';if(compact){a.innerHTML=iconHTML('message');a.setAttribute('aria-label','ابعت تهنئة لـ'+p.name+' على واتساب');}return a;}
 function refreshBirthdayDate(){
  if(current.view!=='birthdays'||$('person-dialog').open||birthdayDateKey===JSON.stringify(model.today()))return;
  const focused=[...birthdayButtons].find(([,button])=>button===document.activeElement);
  renderBirthdays();if(focused&&birthdayButtons.has(focused[0]))birthdayButtons.get(focused[0]).focus({preventScroll:true});
 }
 function birthdayCard(item){
  const p=item.person,card=el('article',null,'birthday-card'+(item.days===0?' is-today':item.days<=7?' is-soon':''));card.dataset.person=p.id;
  const date=el('div',null,'birthday-date');date.append(el('strong',model.year(p.birthDay)),el('span',model.months[p.birthMonth-1]));
  const info=el('div',null,'birthday-info'),button=el('button',p.name,'birthday-name');button.type='button';button.setAttribute('aria-label','عرض بيانات '+p.name);button.onclick=()=>showPerson(p.id);
  birthdayButtons.set(p.id,button);info.append(button,el('small',model.context(p)));
  if(p.deceased)info.append(el('span','ذكرى الميلاد · '+(p.memorial||'رحمه الله'),'birthday-age'));
  else if(item.age!==null)info.append(el('span','عيد الميلاد الـ'+model.year(item.age),'birthday-age'));
  const side=el('div',null,'birthday-side');side.append(el('span',p.deceased&&item.days===0?'ذكرى الميلاد النهارده':whenText(item.days),'birthday-countdown'));
  if(!p.deceased&&item.days<=7)side.append(wishLink(p,true));
  card.append(date,info,side);return card;
 }
 function renderBirthdays(){
  const result=model.birthdays(birthdayOptions()),today=result.today;birthdayDateKey=JSON.stringify(today);
  $('birthday-today').textContent='النهارده '+model.year(today.day)+' '+model.months[today.month-1]+' '+model.year(today.year)+' · بتوقيت مصر';
  $('birthday-count').textContent=result.found.length?model.year(result.found.length)+' مناسبة · بالترتيب من الأقرب':'مفيش مناسبات مطابقة للبحث أو الشهر المختار.';
  $('clear-birthday-search').hidden=!$('birthday-search').value;
  const upcoming=model.birthdays({today}).found,todays=upcoming.filter(x=>x.days===0),spot=$('birthday-spotlight');spot.replaceChildren();
  if(upcoming.length){
   const items=todays.length?todays:[upcoming[0]];spot.className='birthday-spotlight'+(todays.length?' is-today':'');
   spot.append(el('p',todays.length?'النهارده عيد ميلاد':'أقرب عيد ميلاد '+whenText(items[0].days),'spot-label'));
   for(const item of items){const row=el('div',null,'spot-person'),name=el('button',item.person.name,'spot-name');name.type='button';name.onclick=()=>showPerson(item.person.id);row.append(name,el('small',model.context(item.person)+(item.age!=null?' · عيد الميلاد الـ'+model.year(item.age):'')),wishLink(item.person));spot.append(row);}
  }
  spot.hidden=!upcoming.length;
  const list=$('birthday-list');list.replaceChildren();birthdayButtons.clear();let group=null,groupKey='';
  for(const item of result.found){
   const key=item.year+'-'+item.person.birthMonth;
   if(key!==groupKey){groupKey=key;group=el('section',null,'birthday-month-group');const head=el('h2',model.months[item.person.birthMonth-1]+(item.year!==today.year?' '+model.year(item.year):''),'month-heading');group.append(head);const cards=el('div',null,'birthday-cards');group.append(cards);list.append(group);}
   group.children[1].append(birthdayCard(item));
  }
  $('birthday-missing').hidden=!result.missing.length;
  $('birthday-missing-title').textContent='تواريخ لسه ناقصة ('+model.year(result.missing.length)+')';
  $('birthday-missing-list').replaceChildren();for(const p of result.missing){const b=el('button',p.name+' · '+model.context(p),'missing-person');b.type='button';b.onclick=()=>showPerson(p.id);$('birthday-missing-list').append(b);}
 }
 function birthdaysCalendar(includeDeceased){
  const pad=n=>String(n).padStart(2,'0'),ymd=(y,m,d)=>String(y)+pad(m)+pad(d),escape=s=>String(s).replace(/[\\;,]/g,c=>'\\'+c).replace(/\n/g,'\\n');
  const bytes=ch=>{const c=ch.codePointAt(0);return c<0x80?1:c<0x800?2:c<0x10000?3:4;};
  const fold=line=>{let out='',size=0;for(const ch of line){const n=bytes(ch);if(size+n>74){out+='\r\n ';size=1;}out+=ch;size+=n;}return out;};
  const now=new Date(),stamp=now.getUTCFullYear()+pad(now.getUTCMonth()+1)+pad(now.getUTCDate())+'T'+pad(now.getUTCHours())+pad(now.getUTCMinutes())+'00Z';
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Ailetna//Family birthdays//AR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:أعياد ميلاد عيلتنا','X-WR-TIMEZONE:Africa/Cairo'];
  let count=0;
  for(const p of data.people){
   if((p.deceased&&!includeDeceased)||!model.nextBirthday(p))continue;
   const y=p.birthYear||model.today().year,end=new Date(Date.UTC(y,p.birthMonth-1,p.birthDay+1));count++;
   lines.push('BEGIN:VEVENT','UID:birthday-'+p.id+'@khairat-fathi-family','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+ymd(y,p.birthMonth,p.birthDay),'DTEND;VALUE=DATE:'+ymd(end.getUTCFullYear(),end.getUTCMonth()+1,end.getUTCDate()),'RRULE:FREQ=YEARLY','SUMMARY:'+escape((p.deceased?'ذكرى ميلاد ':'عيد ميلاد ')+p.name),'DESCRIPTION:'+escape(model.context(p)),'TRANSP:TRANSPARENT','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+escape('النهارده عيد ميلاد '+p.name),'TRIGGER;RELATED=START:PT9H','END:VALARM','END:VEVENT');
  }
  lines.push('END:VCALENDAR');return {text:lines.map(fold).join('\r\n')+'\r\n',count};
 }
 function exportBirthdays(){
  const {text,count}=birthdaysCalendar(!!$('birthday-include-deceased').checked);
  if(typeof Blob==='undefined'||typeof URL==='undefined')return text;
  const url=URL.createObjectURL(new Blob([text],{type:'text/calendar;charset=utf-8'})),a=el('a');a.href=url;a.download='أعياد-ميلاد-عيلتنا.ics';document.body.append(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),4000);toast('اتجهّز ملف التقويم فيه '+model.arCount(count,'مناسبات','مناسبة','مناسبة','مناسبتين')+'. افتحه عشان تضيفهم لتقويمك.');return text;
 }

 // Printing is prepared on demand: it needs the poster plus five branch drawings.
 function preparePrint(){
  printReady=true;
  if(current.view==='birthdays'){$('print-area').innerHTML=window.familyPrint.birthdays(model.birthdays(birthdayOptions()));return;}
  if(current.view==='branch'){$('print-area').innerHTML='<section class="print-page">'+window.familyPrint.svg(current.branch,{showShared:true})+'</section>';return;}
  const poster=window.FAMILY_POSTER?'<section class="print-page poster-page">'+window.FAMILY_POSTER+'</section>':'<section class="print-page">'+window.familyPrint.svg('root',{showShared:false})+'</section>';
  $('print-area').innerHTML=poster+data.branches.map(b=>'<section class="print-page">'+window.familyPrint.svg(b.id,{showShared:false})+'</section>').join('');
 }

 // The full-family poster: the exact drawing that is printed, with pan, zoom and find.
 function canMountPoster(){return !!(window.FAMILY_POSTER&&window.familyViewer&&typeof document.createElement('template').content!=='undefined'&&typeof window.ResizeObserver==='function');}
 function mountPoster(){
  if(viewer||!canMountPoster())return;
  const tpl=document.createElement('template');tpl.innerHTML=window.FAMILY_POSTER;const svg=tpl.content.firstElementChild;
  viewer=window.familyViewer.mount($('poster-stage'),svg,{onPerson:id=>showPerson(id)});
  $('zoom-in').onclick=()=>viewer.zoomIn();$('zoom-out').onclick=()=>viewer.zoomOut();$('zoom-fit').onclick=()=>viewer.fit();
 }
 function renderPosterFind(){
  const input=$('poster-find'),box=$('poster-find-results'),results=model.search(input.value).slice(0,8);box.replaceChildren();box.hidden=!input.value.trim();
  if(!input.value.trim())return;
  if(!results.length){box.append(el('p','مفيش اسم مطابق.','search-empty'));return;}
  for(const p of results){const b=el('button',null,'search-result');b.type='button';b.append(el('strong',p.name),el('small',onPoster(p.id)?model.context(p):model.context(p)+' · مش ظاهرة في اللوحة'));b.onclick=()=>{box.hidden=true;input.value=p.name;if(viewer&&onPoster(p.id))viewer.focus(p.id);else showPerson(p.id);};box.append(b);}
 }
 function renderWholeTree(){
  const container=$('all-trees');container.replaceChildren();fillPair($('tree-roots'),['K','KS'],false,true);
  for(const b of data.branches){
   const section=el('details',null,'tree-sheet'),head=el('summary',null,'tree-sheet-head');head.append(el('h3','فرع '+b.name),el('span',model.arCount(b.children.length,'أبناء','ابنًا','ابن','ابنين'),'tree-sheet-meta'));
   const drawing=el('div',null,'svg-scroll');drawing.tabIndex=0;drawing.setAttribute('aria-label','شجرة فرع '+b.name);
   section.append(head,drawing,link('افتح صفحة الفرع','#/branch/'+b.id,'text-link tree-sheet-link'));
   section.addEventListener('toggle',()=>{if(section.open&&!drawing.innerHTML)renderGrove(drawing,b.id,false);});
   container.append(section);
  }
  mountPoster();
  if(viewer&&current.focus)viewer.focus(current.focus);else if(viewer&&!current.focus)viewer.fit(false);
 }

 // Kinship finder.
 const kinExamples=[['M3','A3'],['M2C0','N1C0'],['M1S','E2C1']];
 function kinPicker(slot){
  const input=$('kin-'+slot),box=$('kin-'+slot+'-results');
  const render=()=>{const results=model.search(input.value).slice(0,8);box.replaceChildren();box.hidden=!input.value.trim()||!results.length;for(const p of results){const b=el('button',null,'search-result');b.type='button';b.append(el('strong',p.name),el('small',model.context(p)));b.onclick=()=>{box.hidden=true;const a=slot==='a'?p.id:current.a,c=slot==='b'?p.id:current.b;location.hash='#/kin/'+(a||'-')+(c?'/'+c:'');};box.append(b);}};
  input.addEventListener('input',render);
  input.addEventListener('keydown',e=>{if(e.key==='Escape'){box.hidden=true;}if(e.key==='Enter'){const first=box.querySelector('button');if(first){e.preventDefault();first.onclick();}}});
 }
 function renderKin(route){
  $('kin-a').value=route.a?model.people.get(route.a).name:'';$('kin-b').value=route.b?model.people.get(route.b).name:'';
  $('kin-a-results').hidden=$('kin-b-results').hidden=true;
  const out=$('kin-result');out.replaceChildren();
  const ex=$('kin-examples');ex.replaceChildren();ex.append(el('p','جرّب مثلًا:','kin-examples-label'));
  for(const [a,b] of kinExamples)if(model.people.has(a)&&model.people.has(b))ex.append(link(model.people.get(a).name+' و'+model.people.get(b).name,'#/kin/'+a+'/'+b,'kin-example'));
  if(!route.a||!route.b){out.append(el('p',route.a||route.b?'اختار الاسم التاني عشان نوريك صلة القرابة.':'اكتب أول حروف من أي اسم واختاره من القائمة.','kin-empty'));return;}
  const result=model.kinship(route.a,route.b),text=model.explain(result);
  if(!result){out.append(el('p','مش لاقيين طريق بين الاسمين دول في الشجرة الحالية.','kin-empty'));return;}
  const card=el('article',null,'kin-card');card.append(el('p','صلة القرابة','eyebrow'),el('h2',text.title,'kin-title'));
  for(const s of text.sentences)card.append(el('p',s,'kin-sentence'));
  if(result.kind==='spouses'||result.kind==='affinity'){const blood=model.kinship(route.a,route.b,{bloodOnly:true});if(blood&&blood.kind==='blood'){const t=model.explain(blood);card.append(el('p','وكمان بينهم قرابة دم من الدرجة '+model.ordinal(blood.degree)+': '+t.sentences.join('، و'),'kin-sentence kin-extra'));}}
  if(result.kind==='blood'||result.kind==='affinity')card.append(el('span','درجة القرابة: '+model.ordinal(result.degree),'badge'));
  const steps=el('ol',null,'kin-path');
  result.path.forEach((step,i)=>{const li=el('li',null,'kin-step');if(i){const via=step.via==='parent'?['up','من الوالدين']:step.via==='child'?['down','من الأبناء']:step.via==='coparent'?['link','أبناء مشتركين']:['heart','زواج'];li.append(iconText('span',via[0],via[1],'kin-via kin-via-'+step.via));}li.append(chip(step.id,'person-chip'+(i===0||i===result.path.length-1?' is-end':'')));steps.append(li);});
  card.append(steps);out.append(card);
 }

 // Home: figures, the next birthdays and the branch cards.
 function renderHome(){
  const stats=$('home-stats');stats.replaceChildren();const gens=new Set(data.people.map(p=>p.generation)).size,thisMonth=model.birthdays().found.filter(x=>x.days<=31&&x.person.birthMonth===model.today().month).length;
  for(const t of [model.arCount(data.people.length,'أسماء','اسمًا','اسم','اسمين'),model.arCount(data.branches.length,'فروع','فرعًا','فرع','فرعين'),model.arCount(gens,'أجيال','جيلًا','جيل','جيلين'),thisMonth?model.arCount(thisMonth,'أعياد ميلاد','عيد ميلاد','عيد ميلاد','عيدين ميلاد')+' الشهر ده':null].filter(Boolean))stats.append(el('li',t));
  const strip=$('home-upcoming');strip.replaceChildren();
  for(const item of model.birthdays().found.slice(0,4)){const p=item.person,b=el('button',null,'upcoming-card'+(item.days===0?' is-today':''));b.type='button';b.onclick=()=>showPerson(p.id);const date=el('span',null,'upcoming-date');date.append(el('strong',model.year(p.birthDay)),el('small',model.months[p.birthMonth-1]));const info=el('span',null,'upcoming-info');info.append(el('strong',p.name),el('small',whenText(item.days)+(item.age!=null?' · الـ'+model.year(item.age):'')));b.append(date,info);strip.append(b);}
  $('home-today').hidden=!strip.children.length;
 }

 function applyRoute(initial=false){
  const previous=current;current=model.parseRoute(location.hash);closePerson();
  for(const view of ['home','branch','tree','birthdays','kin'])$(view+'-view').hidden=current.view!==view;
  if($('main-nav').querySelectorAll){const navView=current.view==='branch'?'home':current.view;for(const a of $('main-nav').querySelectorAll('a')){if(a.dataset.nav===navView)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}}
  $('navigation').hidden=current.view!=='branch';$('global-search-section').hidden=['birthdays','tree','kin'].includes(current.view);$('branch-select').value=current.branch||'';
  $('print-button').textContent=current.view==='birthdays'?'طباعة القائمة':current.view==='branch'?'طباعة الفرع':current.view==='tree'?'طباعة اللوحة':'طباعة العائلة';
  document.body.dataset.view=current.view;
  if(current.view==='branch')renderBranch(current);else if(current.view==='tree')renderWholeTree();else if(current.view==='birthdays')renderBirthdays();else if(current.view==='kin')renderKin(current);else renderHome();
  document.title=current.view==='birthdays'?'عيلتنا — أعياد الميلاد':current.view==='branch'?'عيلتنا — فرع '+model.branches.get(current.branch).name:current.view==='tree'?'عيلتنا — العائلة كاملة':current.view==='kin'?'عيلتنا — صلة القرابة':'عيلتنا — عائلة خيرات وفتحي';
  printReady=false;
  if(!initial){$('family-search').value='';renderSearch();const target=current.view==='branch'&&previous.view==='branch'&&previous.branch===current.branch?$('family-title'):$(current.view==='home'?'home-title':current.view==='tree'?'tree-title':current.view==='birthdays'?'birthdays-title':current.view==='kin'?'kin-title':'branch-title');const stay=current.view==='kin'&&previous.view==='kin';if(!stay)target.focus({preventScroll:true});if(!current.person&&!stay)target.scrollIntoView({behavior:'auto',block:'start'});}
  if(current.person)showPerson(current.person);
 }
 function renderSearch(){
  const query=$('family-search').value,results=model.search(query),box=$('search-results');box.replaceChildren();$('clear-search').hidden=!query;box.hidden=!query.trim();
  if(!query.trim()){$('search-status').textContent='';return;}
  $('search-status').textContent=results.length?results.length.toLocaleString('ar-EG')+' نتيجة'+(results.length>20?' · ظاهر أول ٢٠ اسم، زوّد جزء من الاسم لتحديد النتيجة':''):'مفيش اسم مطابق. جرّب جزء أصغر من الاسم.';
  for(const p of results.slice(0,20)){const a=link(null,model.routeFor(p.id,true),'search-result');a.dataset.person=p.id;a.append(el('strong',p.name+(p.star?' ★':'')),el('small',model.context(p)));a.addEventListener('click',()=>{if(location.hash===model.routeFor(p.id,true))showPerson(p.id);});box.append(a);}
 }
 for(const b of data.branches){
  const option=el('option',b.name);option.value=b.id;$('branch-select').append(option);
  const card=link(null,'#/branch/'+b.id,'branch-card');card.dataset.branch=b.id;const meta=el('span',null,'branch-meta'),memorial=model.people.get(b.id).memorial;
  const grand=new Set(b.children.flatMap(c=>model.householdFor(c).children)).size;
  if(memorial)meta.append(el('small',memorial,'branch-memorial'));meta.append(el('small',b.children.length.toLocaleString('ar-EG')+' من الأبناء · '+grand.toLocaleString('ar-EG')+' من الأحفاد'));
  const mark=el('span',null,'branch-icon');mark.setAttribute('aria-hidden','true');mark.innerHTML='<svg viewBox="0 0 32 32"><path d="M7 27C12 20 18 13 26 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 20C9 14 11 9 15 6C17 11 16 16 12 20ZM18 13C22 10 27 10 30 13C26 16 21 16 18 13Z" fill="#c6d6a5" stroke="#8ea16d"/></svg>';
  const go=el('span',null,'enter-branch');go.innerHTML='افتح الفرع'+iconHTML('arrow');
  card.append(mark,el('strong',b.name),meta,go);$('branch-cards').append(card);
 }
 fillPair($('home-roots'),['K','KS'],true,true);renderGrove($('home-grove'),'root',false);
 $('branch-select').onchange=e=>{if(e.target.value)location.hash='#/branch/'+e.target.value;};
 $('family-search').addEventListener('input',renderSearch);
 $('family-search').addEventListener('keydown',e=>{if(e.key==='Escape'){$('family-search').value='';renderSearch();}if(e.key==='Enter'){const first=$('search-results').querySelector('a');if(first){e.preventDefault();if(location.hash===first.getAttribute('href'))showPerson(first.dataset.person);else location.hash=first.getAttribute('href');}}});
 $('skip-link').addEventListener('click',e=>{e.preventDefault();$('main').focus();$('main').scrollIntoView({block:'start'});});
 $('clear-search').onclick=()=>{$('family-search').value='';renderSearch();$('family-search').focus();};
 $('type-size').onclick=()=>{const large=document.body.classList.toggle('large-type');$('type-size').setAttribute('aria-pressed',String(large));$('type-size').setAttribute('aria-label',large?'حجم الخط العادي':'تكبير الخط');$('type-size').textContent=large?'أ−':'أ+';renderGrove($('home-grove'),'root',false);if(current.view==='branch')renderGrove($('branch-grove'),current.branch);if(current.view==='tree')renderWholeTree();};
 $('print-button').onclick=()=>{preparePrint();window.print();};
 window.addEventListener('beforeprint',()=>{if(!printReady)preparePrint();});window.addEventListener('hashchange',()=>applyRoute());
 for(let i=0;i<model.months.length;i++){const option=el('option',model.months[i]);option.value=String(i+1);$('birthday-month').append(option);}
 $('birthday-search').addEventListener('input',renderBirthdays);
 $('birthday-month').addEventListener('change',renderBirthdays);
 $('birthday-include-deceased').addEventListener('change',renderBirthdays);
 $('clear-birthday-search').onclick=()=>{$('birthday-search').value='';renderBirthdays();$('birthday-search').focus();};
 $('birthday-search').addEventListener('keydown',e=>{if(e.key==='Escape')$('clear-birthday-search').onclick();});
 $('birthday-export').onclick=exportBirthdays;
 $('poster-find').addEventListener('input',renderPosterFind);
 $('poster-find').addEventListener('keydown',e=>{if(e.key==='Escape'){$('poster-find').value='';renderPosterFind();}if(e.key==='Enter'){const first=$('poster-find-results').querySelector('button');if(first){e.preventDefault();first.onclick();}}});
 kinPicker('a');kinPicker('b');
 $('kin-swap').onclick=()=>{if(current.a||current.b)location.hash='#/kin/'+(current.b||'-')+(current.a?'/'+current.a:'');};
 window.addEventListener('focus',refreshBirthdayDate);
 window.addEventListener('pageshow',refreshBirthdayDate);
 $('person-dialog').addEventListener('close',refreshBirthdayDate);
 if(window.setInterval)window.setInterval(refreshBirthdayDate,60000);
 if(document.addEventListener)document.addEventListener('keydown',e=>{if(e.key!=='/'||/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName||'')||$('person-dialog').open)return;const input=current.view==='tree'?$('poster-find'):current.view==='birthdays'?$('birthday-search'):current.view==='kin'?$('kin-a'):$('family-search');e.preventDefault();input.focus();});
 window.familyApp={birthdaysCalendar,preparePrint};
 applyRoute(true);document.body.classList.add('app-ready');
})();
