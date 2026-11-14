import {getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged,createUserWithEmailAndPassword,doc,getDoc,setDoc,updateDoc,deleteDoc,addDoc,collection,getDocs,query,where,serverTimestamp,getToken} from "./db.js";
/* Logo index.html dagi favicon bilan bir xil rasm — alohida nusxa kerak emas */
const LOGO=document.querySelector('link[rel=icon]')?.href||'';
const LS=k=>{try{return localStorage.getItem(k)}catch{return null}};try{document.body.classList.toggle('dk',!!localStorage.getItem('dk'))}catch{}
const $=s=>document.querySelector(s),app=$('#app'),DOM='@ielts-mock.uz',A=window.A={};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const auth=getAuth(),db={},sa={};
const ts=t=>t?.toDate?t.toDate().toLocaleString('uz'):'-',norm=s=>String(s??'').trim().toLowerCase().replace(/\s+/g,' ');
const log=a=>addDoc(collection(db,'log'),{a,t:serverTimestamp()}).catch(()=>{});
const col=n=>getDocs(collection(db,n)),wc=s=>(s.trim().match(/\S+/g)||[]).length;
const SEC=['listening','reading','writing'];

/* ---------- JSON test: tekshirish + chizish ---------- */
const X=esc,fmt=s=>X(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>'),LB=i=>String.fromCharCode(65+i),TF={t:'TRUE',f:'FALSE',ng:'NOT GIVEN',y:'YES',n:'NO'};
function build(kind,txt){const j=JSON.parse(txt),k={},ps=[];let n=1;if(!Array.isArray(j.parts)||!j.parts.length)throw Error('"parts" ro\'yxati kerak ('+kind+')');
 j.parts.forEach((p,pi)=>{const gs=(p.groups||[]).map((g,gi)=>{const w=`${kind} parts[${pi}].groups[${gi}]`,yn=g.variant=='yn',o=(g.options||[]).map((x,i)=>typeof x=='string'?{l:LB(i),t:x}:{l:x.label,t:x.text});
  const ak=(m,a)=>{if(a==null||a==='')throw Error(w+": "+m+"-savolda javob (answer) yo'q");k[m]=(Array.isArray(a)?a:String(a).split('/')).map(x=>{x=norm(x);return g.type=='tfng'?norm(TF[x.replace(/\s/g,'')]||x):x})};
  const g2={type:g.type,title:g.title||'',ins:g.instructions||'',img:g.image||'',opts:o};
  if(g.type=='fill'){const A=g.answers||{};let ai=0;g2.text=String(g.text||'').replace(/\[(\d*)\]/g,(_,d)=>{const m=d?+d:n;n=m+1;ak(m,Array.isArray(A)?A[ai++]:A[m]);return`[${m}]`})}
  else{if(!['mcq','tfng','match','short'].includes(g.type))throw Error(w+': noma\'lum type "'+g.type+'"');g2.q=(g.questions||[]).map(q=>{const m=q.n||n;n=m+1;ak(m,q.answer);return{n:m,t:q.text||'',o:(q.options||[]).map((x,i)=>typeof x=='string'?{l:LB(i),t:x}:{l:x.label,t:x.text})}});if(g.type=='tfng')g2.opts=(yn?['YES','NO','NOT GIVEN']:['TRUE','FALSE','NOT GIVEN']).map(x=>({l:x,t:''}))}
  return g2});ps.push({title:p.title||'Part '+(pi+1),intro:p.intro||'',passageTitle:p.passageTitle||'',passage:[].concat(p.passage||[]).join('\n\n'),groups:gs})});
 return{sec:{mockId:'',type:kind,v:2,minutes:Math.min(+j.minutes||60,60),parts:ps},map:k,total:Object.keys(k).length}}
function qhtml(g){let h=`<div class=grp><h4>${X(g.title)}</h4><p class=ins>${fmt(g.ins)}</p>`;if(g.img&&/^(\/|https:)/.test(g.img))h+=`<img src="${X(g.img)}" style="max-width:100%">`;
 if(g.type=='fill')return h+`<div class=q>${fmt(g.text).replace(/\[(\d+)\]/g,(_,m)=>`<input type=text name=q${m} placeholder=${m} autocomplete=off spellcheck=false>`)}</div></div>`;
 if(g.type=='match')h+=`<div class=box>${g.opts.map(o=>`<div><b>${X(o.l)}</b> ${X(o.t)}</div>`).join('')}</div>`;
 return h+g.q.map(q=>`<div class=q><span class=qn>${q.n}</span> ${fmt(q.t)}${g.type=='short'?`<br><input type=text name=q${q.n} autocomplete=off spellcheck=false>`:g.type=='match'?` <select name=q${q.n}><option value="">—</option>${g.opts.map(o=>`<option>${X(o.l)}</option>`).join('')}</select>`:`<div class=opts>${(q.o&&q.o.length?q.o:g.opts).map(o=>`<label><input type=radio name=q${q.n} value="${X(o.l)}"> <b>${X(o.l)}</b> ${X(o.t)}</label>`).join('')}</div>`}</div>`).join('')+'</div>'}

/* ---------- Kirish ---------- */
function landing(msg=''){app.innerHTML=`<div class=land><section class=lh><div class=logo><img src="${LOGO}" alt="">TURKISTON LC</div><h1>Computer-based IELTS mock imtihon platformasi</h1><p>Listening, Reading va Writing — haqiqiy kompyuter imtihoniga o'xshash muhitda.</p></section><section class=lf><div class=card><h3>Talaba kirishi</h3><input id=sl placeholder="Login kodi"><input id=sp type=password placeholder="Parol"><button onclick="A.login(0)">Kirish</button></div><div class=card><h3>Admin kirishi</h3><input id=ae placeholder="Admin email"><input id=ap type=password placeholder="Parol"><button onclick="A.login(1)">Kirish</button></div><p class=no>${msg}</p></section></div>`}
function shell(tabs,tab,act,ttl,sub,who){app.innerHTML=`<div class=shell><aside class=side><div class=logo><img src="${LOGO}" alt="">TURKISTON LC</div><small>MENU</small>${tabs.map(t=>`<a class="ni ${t[0]==tab?'on':''}" onclick="${act}('${t[0]}')"><span>${t[2]}</span>${t[1]}</a>`).join('')}<div class=me><div class=av>${esc((who||'?')[0])}</div><div><b>${esc(who)}</b><br><small style="margin:0">${esc(sub)}</small></div><button class=s onclick="A.out()" title="Chiqish">⏻</button></div></aside><main><div class=top><h2>${ttl}</h2><span><small>${new Date().toLocaleDateString('uz')}</small><button class=s onclick="A.dk()" title="Tungi rejim">🌙</button></span></div><div id=pg>Yuklanmoqda…</div></main></div>`}
A.login=async adm=>{try{await signInWithEmailAndPassword(auth,adm?$('#ae').value.trim():$('#sl').value.trim().toLowerCase()+DOM,adm?$('#ap').value:$('#sp').value)}catch(e){landing("Login yoki parol noto'g'ri")}};
A.out=()=>signOut(auth);
let me={};
onAuthStateChanged(auth,async u=>{if(!u)return landing();
 if(u.admin)return admin('stats');
 const s=await getDoc(doc(db,'students',u.uid)).catch(()=>null);
 if(s?.exists()&&s.data().active){me={id:u.uid,...s.data()};return student()}
 await signOut(auth);landing("Hisob faol emas yoki topilmadi")});

/* ---------- Xavfsiz render (skriptlar o'chiriladi) ---------- */
function clean(html){const d=new DOMParser().parseFromString(html||'','text/html');
 d.querySelectorAll('script,iframe,object,embed,link,style,base,meta').forEach(e=>e.remove());
 d.querySelectorAll('*').forEach(e=>[...e.attributes].forEach(a=>{if(/^on/i.test(a.name)||/^\s*(javascript|data):/i.test(a.value)&&a.name!='src')e.removeAttribute(a.name)}));return d.body}
function hl(el){el.addEventListener('mouseup',()=>{const s=getSelection();if(s.isCollapsed||!s.rangeCount)return;const r=s.getRangeAt(0);
 if(!el.contains(r.commonAncestorContainer)||r.commonAncestorContainer.nodeName=='TEXTAREA')return;
 if(r.cloneContents().querySelector('input,select,textarea'))return;try{const m=document.createElement('mark');r.surroundContents(m)}catch(e){}s.removeAllRanges()});
 el.addEventListener('click',e=>{if(e.target.tagName=='MARK'){const m=e.target;m.replaceWith(...m.childNodes)}})}

/* ---------- Guruh ruxsatlarini sinxronlash yordamchilari ---------- */
const gslug=n=>norm(n).replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'grp';
async function syncStudentGroupPerms(uid,groupName){
 const gn=String(groupName||'').trim();if(!gn)return;
 const gpSnap=await col('group_permissions').catch(()=>({docs:[]}));
 const matching=gpSnap.docs.map(d=>d.data()).filter(x=>norm(x.groupName)===norm(gn)&&x.granted);
 for(const gp of matching){
  await setDoc(doc(db,'permissions',uid+'_'+gp.sectionId),{uid,sectionId:gp.sectionId,mockId:gp.mockId,granted:true,fromGroup:gn},{merge:true}).catch(()=>{});
 }
}
async function hasSectionAccess(uid,sid,groupName){
 const pDoc=await getDoc(doc(db,'permissions',uid+'_'+sid)).catch(()=>null);
 if(pDoc?.exists()&&pDoc.data().granted)return true;
 const gn=String(groupName||'').trim();if(!gn)return false;
 const gpDoc=await getDoc(doc(db,'group_permissions',gslug(gn)+'_'+sid)).catch(()=>null);
 if(gpDoc?.exists()&&gpDoc.data().granted)return true;
 const gpAll=await col('group_permissions').catch(()=>({docs:[]}));
 return gpAll.docs.some(d=>{const x=d.data();return x.sectionId===sid&&norm(x.groupName)===norm(gn)&&x.granted});
}

/* ---------- Talaba paneli ---------- */
let ST_CACHE={M:{},T:{},R:{}};
async function student(note='',tab=window.stab||'h'){window.stab=tab;const uid=auth.currentUser.uid,q=n=>getDocs(query(collection(db,n),where('uid','==',uid)));
 const stDoc=await getDoc(doc(db,'students',uid)).catch(()=>null);
 if(stDoc?.exists())me={id:uid,...stDoc.data()};
 const [ms,ps,gps,as,rs]=await Promise.all([col('mocks'),q('permissions'),col('group_permissions').catch(()=>({docs:[]})),q('attempts'),q('results')]);
 const P={},T={},R={};
 ps.forEach(d=>P[d.data().sectionId]=d.data().granted);
 const myGrp=norm(me.group||'');
 if(myGrp){gps.docs.forEach(d=>{const x=d.data();if(norm(x.groupName)===myGrp&&x.granted)P[x.sectionId]=true})}
 as.forEach(d=>T[d.data().sectionId]=d.data());
 rs.forEach(d=>R[d.data().sectionId]=d.data());

 const D=x=>x?.toMillis?x.toMillis():0,K=t=>{const d=new Date(t);return d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()},IC={listening:'🎧',reading:'📖',writing:'✍️'},NM={listening:'Listening',reading:'Reading',writing:'Writing'},M={};ms.forEach(m=>M[m.id]=m.data());
 ST_CACHE={M,T,R};

 const cell=(m,t)=>{const sid=m.id+'_'+t,a=T[sid],r=R[sid];
  if(a?.status==='submitted')return `<span class=tag>Topshirilgan</span> ${r?`${r.raw!=null?r.raw+'/'+r.total+' · ':''}Band ${r.band}`:''}`;
  if(a)return `<button onclick="A.open('${sid}')">Davom etish</button>`;
  return P[sid]?`<button onclick="A.start('${m.id}','${t}')">START</button>`:'<span class=tag style="background:#f1f5f9;color:#64748b">🔒 Yopiq</span>'};
 const at=Object.values(T),sub=at.filter(x=>x.status==='submitted'),rows=Object.entries(R).filter(([k,r])=>r.band!=null).map(([k,r])=>({r,type:r.type||T[k]?.type,t:D(T[k]?.submittedAt)||D(T[k]?.startedAt)})).sort((x,y)=>y.t-x.t);
 const avg=rows.length?rows.reduce((x,y)=>x+y.r.band,0)/rows.length:null,ready=Object.keys(P).filter(k=>P[k]&&!T[k]),act=new Set(at.map(x=>K(D(x.startedAt))));
 let streak=0,d0=new Date();if(!act.has(K(d0)))d0=new Date(d0-864e5);while(act.has(K(d0))){streak++;d0=new Date(d0-864e5)}
 const mins=sub.reduce((x,y)=>x+Math.max(0,D(y.submittedAt)-D(y.startedAt)),0)/6e4,tb=+LS('tb')||7,ed=LS('ed'),dl=ed?Math.ceil((new Date(ed)-Date.now())/864e5):null,hr=new Date().getHours(),gr=hr<12?'Xayrli tong':hr<18?'Xayrli kun':'Xayrli kech';
 const best=t=>Math.max(0,...rows.filter(x=>x.type==t).map(x=>x.r.band));
 const BG=[['🚀','Birinchi qadam',"1 ta bo'lim topshirildi",sub.length>0],['🔥','3 kun seriya','3 kun ketma-ket mashq',streak>=3],['🎧','Listening 6+','Listening band 6 yoki yuqori',best('listening')>=6],['📖','Reading 6+','Reading band 6 yoki yuqori',best('reading')>=6],['✍️','Writing','Writing topshirildi',sub.some(x=>x.type=='writing')],['🏆',"To'liq mock","Bir mockning 3 bo'limi topshirildi",ms.docs.some(m=>SEC.every(t=>T[m.id+'_'+t]?.status==='submitted'))],['⭐','Band 7+',"Istalgan bo'limda band 7+",rows.some(x=>x.r.band>=7)]];
 const sc=(ic,col,v,l,f)=>`<div class=sc ${f?`onclick="${f}" style="cursor:pointer" title="O'zgartirish"`:''}><span class=ic style="background:${col}22">${ic}</span><h2>${v}</h2><small>${l}</small></div>`;
 const ct=window.ct||'all',W=520,H=150,WD=['Yak','Dush','Sesh','Chor','Pay','Jum','Shan'],dd=[...Array(7)].map((_,i)=>new Date(Date.now()-(6-i)*864e5)),Y=v=>H-24-v/9*(H-44),Xp=i=>34+i*(W-54)/6;
 const val=dd.map(x=>{const v=rows.filter(r=>K(r.t)==K(x)&&(ct=='all'||r.type==ct)).map(r=>r.r.band);return v.length?v.reduce((p,c)=>p+c)/v.length:null}),pt=val.map((v,i)=>v==null?null:[Xp(i),Y(v),v]).filter(Boolean);
 const chart=`<svg viewBox="0 0 ${W} ${H}" style="width:100%">${[0,3,6,9].map(g=>`<line x1="30" x2="${W-8}" y1="${Y(g)}" y2="${Y(g)}" stroke="#d9e2dd"/><text x="4" y="${Y(g)+4}" font-size="10" fill="#94a3b8">${g}</text>`).join('')}${pt.length>1?`<polyline points="${pt.map(p=>p[0]+','+p[1]).join(' ')}" fill="none" stroke="#1fa463" stroke-width="3"/>`:''}${pt.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#1fa463"/><text x="${p[0]}" y="${p[1]-10}" font-size="11" text-anchor="middle" fill="#1fa463">${p[2].toFixed(1)}</text>`).join('')}${dd.map((x,i)=>`<text x="${Xp(i)}" y="${H-6}" font-size="10" text-anchor="middle" fill="#94a3b8">${WD[x.getDay()]}</text>`).join('')}</svg>`;
 const cm=window.cm||0,nw=new Date(),cd=new Date(nw.getFullYear(),nw.getMonth()+cm,1),dim=new Date(cd.getFullYear(),cd.getMonth()+1,0).getDate(),MN=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
 const cal=`<div class=cal><div class=ch><button class=s onclick="A.cm(-1)">‹</button><b>${MN[cd.getMonth()]} ${cd.getFullYear()}</b><button class=s onclick="A.cm(1)">›</button></div><div class=cg>${['Du','Se','Ch','Pa','Ju','Sh','Ya'].map(x=>`<small>${x}</small>`).join('')}${'<i></i>'.repeat((cd.getDay()+6)%7)}${[...Array(dim)].map((_,i)=>{const k=cd.getFullYear()+'-'+cd.getMonth()+'-'+(i+1);return `<span class="${act.has(k)?'on':''} ${k==K(Date.now())?'td':''}">${i+1}</span>`}).join('')}</div></div>`;
 const qsl=[...Object.entries(T).filter(([k,x])=>x.status!=='submitted').map(([k])=>[k,'Davom etish',`A.open('${k}')`]),...ready.map(k=>[k,'START',`A.start('${k.split('_')[0]}','${k.split('_')[1]}')`])];
 const qs=qsl.map(([k,b,f])=>{const [mi,t]=k.split('_');return `<div class=qs><span>${IC[t]} <b>${esc(M[mi]?.title||'Mock')}</b> · ${NM[t]}</span><button onclick="${f}">${b}</button></div>`}).join('')||"<p class=mut>Hozircha ruxsat berilgan bo'lim yo'q. Admin ruxsatini kuting.</p>";
 const mocks=ms.docs.map(m=>`<div class=mk><div><b>${esc(m.data().title)}</b><br><small>${esc(m.data().date||'')}</small></div>${SEC.map(t=>`<div class=sec><span>${IC[t]} ${t}</span>${cell(m,t)}</div>`).join('')}</div>`).join('')||"<p class=mut>Hozircha mock yo'q</p>";

 const stuMocks=[...new Set([...Object.values(T).map(x=>x.mockId),...Object.values(R).map(x=>x.mockId)].filter(Boolean))];
 const mockCards=stuMocks.map(mid=>{
  const m=M[mid]||{};
  const bs=SEC.map(t=>R[mid+'_'+t]?.band??null);
  const ov=bs.every(x=>x!=null)?(Math.round(bs.reduce((x,y)=>x+y,0)/3*2)/2).toFixed(1):'—';
  const vals=SEC.map((t,i)=>{
   const r=R[mid+'_'+t],a=T[mid+'_'+t];
   if(r?.band!=null)return `${r.band}${r.raw!=null?` <small style="font-size:13px;font-weight:400">(${r.raw}/${r.total})</small>`:''}`;
   if(a?.status==='submitted')return '<span style="font-size:13px;color:#64748b">Tekshirilmoqda</span>';
   if(a)return '<span style="font-size:13px;color:#64748b">Jarayonda</span>';
   return '—';
  });
  return `<div class=card>
   <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">
    <div><h3 style="margin:0">${esc(m.title||'Mock')}</h3><small class=mut>${esc(m.date||'')}</small></div>
    <button onclick="A.myPdf('${mid}',this)">⬇ PDF yuklash (hammasi bitta faylda)</button>
   </div>
   <div class=sg>${[['🎧 Listening',vals[0]],['📖 Reading',vals[1]],['✍️ Writing',vals[2]],['🏆 Umumiy',ov]].map(x=>`<div class=sc><small>${x[0]}</small><h2>${x[1]}</h2></div>`).join('')}</div>
  </div>`;
 }).join('');

 const hist=rows.length?`<div class=card><h3>Batafsil natijalar tarixi</h3><table><tr><th>Mock</th><th>Bo'lim</th><th>Band</th><th>To'g'ri</th><th>Sana</th><th>Yuklab olish</th></tr>${rows.map(x=>`<tr><td>${esc(M[x.r.mockId]?.title||'—')}</td><td>${IC[x.type]||''} ${NM[x.type]||''}</td><td><b>${x.r.band}</b></td><td>${x.r.raw!=null?x.r.raw+'/'+x.r.total:'—'}</td><td>${x.t?new Date(x.t).toLocaleDateString('uz'):'—'}</td><td>${x.r.mockId?`<button class=s style="padding:5px 10px;margin:0" onclick="A.myPdf('${x.r.mockId}',this)">⬇ PDF</button>`:'—'}</td></tr>`).join('')}</table></div>`:`<div class=card><p class=mut>Hali tasdiqlangan natija yo'q</p></div>`;
 const pr=avg!=null?Math.min(100,Math.round(avg/tb*100)):0,TT={h:'Dashboard',m:'Mock imtihonlar',r:'Natijalarim',b:'Yutuqlar'};
 shell([['h','Dashboard','⌂'],['m','Mocklar','📝'],['r','Natijalar','📊'],['b','Yutuqlar','🏅']],tab,'A.stab',TT[tab],me.group||'Talaba',me.name);
 $('#pg').innerHTML=(note?`<div class=note>${note}</div>`:'')+(tab=='h'?`<div class=dg><div>
 <div class=hero2><h2>${gr}, ${esc(me.name)}! 👋</h2><p>${me.group?`Guruh: <b>${esc(me.group)}</b> · `:''}Muntazamlik — mahoratning kaliti.</p>${avg!=null?`<div class=pb><i style="width:${pr}%"></i></div><p style="margin-top:6px;font-size:13px">Maqsad ${tb.toFixed(1)} ga: ${pr}%</p>`:''}</div>
 <div class=sg>${sc('🎯','#1fa463',tb.toFixed(1),'Maqsad band',"A.tb()")}${sc('📈','#6c3df4',avg!=null?avg.toFixed(1):'—',"O'rtacha band")}${sc('📅','#ef4444',dl!=null?(dl>0?dl:0):'—','Imtihongacha (kun)',"A.ed()")}${sc('⏱️','#f59e0b',mins<60?Math.round(mins)+' daq':(mins/60).toFixed(1)+' soat','Mashq vaqti')}${sc('🔥','#f97316',streak,'Kunlik seriya')}</div>
 <div class=card><h3>Haftalik natijalar</h3><div class=tabs>${[['all','Hammasi'],['listening','Listening'],['reading','Reading'],['writing','Writing']].map(([k,l])=>`<a class="${ct==k?'d':''}" onclick="A.cht('${k}')">${l}</a>`).join('')}</div>${chart}</div>
 <div class=card><h3>Tezkor start</h3>${qs}</div></div>
 <div><div class=card>${cal}</div><div class=card><h3>Yutuqlar <small>${BG.filter(x=>x[3]).length}/${BG.length}</small></h3><div class=bg>${BG.map(b=>`<div class="${b[3]?'':'off'}" title="${esc(b[2])}"><b>${b[0]}</b>${b[1]}</div>`).join('')}</div></div></div></div>`
 :tab=='m'?`<div class=card><h3>Mock imtihonlar</h3>${mocks}</div>`:tab=='r'?`${mockCards}${hist}`
 :`<div class=card><h3>Yutuqlar</h3><div class=bg style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">${BG.map(b=>`<div class="${b[3]?'':'off'}"><b>${b[0]}</b>${b[1]}<br><small>${b[2]}</small></div>`).join('')}</div></div>`)};

/* ---------- Talabaning shaxsiy natijasini PDF yuklab olish ---------- */
A.myPdf=async(mid,btn)=>{
 const uid=auth.currentUser.uid,M=ST_CACHE.M[mid]||{},nm=me.name||'Talaba';
 const t0=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='PDF tayyorlanmoqda…'}
 try{
  const [ws,fb,lk,rk]=await Promise.all([
   getDoc(doc(db,'sections',mid+'_writing')).catch(()=>null),
   getDoc(doc(db,'feedback',uid+'_'+mid+'_writing')).catch(()=>null),
   getDoc(doc(db,'keys',mid+'_listening')).catch(()=>null),
   getDoc(doc(db,'keys',mid+'_reading')).catch(()=>null)
  ]);
  const S=ws?.exists()?ws.data():{},F=fb?.exists()?fb.data():{};
  const KM={listening:lk?.exists()?lk.data().map:null,reading:rk?.exists()?rk.data().map:null};
  const rL=ST_CACHE.R[mid+'_listening'],rR=ST_CACHE.R[mid+'_reading'],rW=ST_CACHE.R[mid+'_writing'];
  const bs=[rL?.band??null,rR?.band??null,rW?.band??null];
  const ob=bs.every(x=>x!=null)?Math.round(bs.reduce((x,y)=>x+y,0)/3*2)/2:null;

  const gt=t=>{
   const a=ST_CACHE.T[mid+'_'+t],r=ST_CACHE.R[mid+'_'+t];
   if(!a)return "<p>Bu bo'lim ishlanmagan.</p>";
   if(a.status!=='submitted')return '<p>Topshirilmagan.</p>';
   if(!r||r.band==null)return "<p>Natija hali tasdiqlanmagan.</p>";
   const k=KM[t];
   if(!k)return `<p>Natija: ${r.raw!=null?r.raw+'/'+r.total+' · ':''}Band: <b>${r.band}</b></p>`;
   const ans=a.answers||{},nums=Object.keys(k).map(Number).sort((x,y)=>x-y);
   let c=0,w=0,b=0;const bad=[];
   nums.forEach(n=>{const g=norm(ans[n]),ok=!!g&&k[n].includes(g);g?(ok?c++:w++):b++;if(!ok)bad.push({n,given:ans[n]||'',key:k[n].join(' / ')})});
   return `<p>Jami: ${nums.length} · To'g'ri: ${c} · Noto'g'ri: ${w} · Javobsiz: ${b} · Band: <b>${r.band}</b></p>`+
    (bad.length?`<table><tr><th>#</th><th>Sizning javobingiz</th><th>To'g'ri javob</th></tr>${bad.map(x=>`<tr><td>${x.n}</td><td>${esc(x.given||'—')}</td><td>${esc(x.key)}</td></tr>`).join('')}</table>`:"<p>Xato yo'q 🎉</p>");
  };

  const wA=ST_CACHE.T[mid+'_writing'],wa=wA?.answers||{};
  const wt=!wA?"<p>Bu bo'lim ishlanmagan.</p>":
   [1,2].map(i=>`<h3>Task ${i} (${wc(wa['t'+i]||'')} so'z)</h3><div class=tx><b>Savol:</b>\n${esc(S['t'+i]||'')}${i==1&&/^data:image\//.test(S.img||'')?`<br><img src="${esc(S.img)}" style="max-width:100%;margin-top:6px">`:''}</div><div class=tx>${wa['t'+i]?esc(wa['t'+i]):'<i>Yozilmagan</i>'}</div>`).join('')+
   (F.c?.some(x=>x!=null)?`<table><tr>${CR.map(x=>`<th>${x}</th>`).join('')}</tr><tr>${F.c.map(x=>`<td>${esc(x??'—')}</td>`).join('')}</tr></table>`:'')+
   (F.comment?`<h3>O'qituvchi izohi</h3><div class=tx>${esc(F.comment)}</div>`:'');

  const H=`<div class=hd><img src="${LOGO}" alt=""><div><h1>TURKISTON LC</h1><div>IELTS Mock natijasi</div></div></div>`
   +`<h2>${esc(nm)}</h2><p>Guruh: ${esc(me.group||'—')} · Mock: ${esc(M.title||'')}${M.date?' · '+fd(M.date):''}</p>`
   +`<table><tr><th>Listening</th><th>Reading</th><th>Writing</th><th>Umumiy</th></tr><tr><td>${rL?.band??'—'}</td><td>${rR?.band??'—'}</td><td>${rW?.band??'—'}</td><td><b>${ob??'—'}</b></td></tr></table>`
   +`<h2>Writing</h2>${wt}<h2>Reading — natija va xatolar</h2>${gt('reading')}<h2>Listening — natija va xatolar</h2>${gt('listening')}`;

  const fn=('Natija - '+nm+' - '+(M.title||'mock')).replace(/[\\/:*?"<>|]+/g,' ').trim()+'.pdf',
  pr=()=>{const d=document.createElement('div');d.id='rep';d.className='rp';d.innerHTML=H;document.body.append(d);const tOld=document.title;document.title=fn.replace(/\.pdf$/,'');const fin=()=>{d.remove();document.title=tOld;removeEventListener('afterprint',fin)};addEventListener('afterprint',fin);setTimeout(()=>window.print(),100)},
  lb=()=>window.html2pdf?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';s.onload=ok;s.onerror=no;document.head.append(s)});

  try{await lb();const el=document.createElement('div');el.className='rp';el.style.cssText='width:720px;background:#fff;color:#000;font:13px/1.5 Arial,sans-serif';el.innerHTML=H;
   await Promise.all([...el.querySelectorAll('img')].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
   await window.html2pdf().set({margin:[10,10,10,10],filename:fn,image:{type:'jpeg',quality:.95},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],avoid:['tr','h2','h3']}}).from(el).save()}
  catch(e){alert("PDF yaratib bo'lmadi ("+(e?.message||'internet xatosi')+"). Chop etish oynasi ochiladi — u yerda 'PDF sifatida saqlash' ni tanlang.");pr()}
 }finally{if(btn){btn.disabled=false;btn.textContent=t0}}
};

A.stab=t=>student('',t);A.cm=d=>{window.cm=(window.cm||0)+d;student('',window.stab)};A.cht=t=>{window.ct=t;student('',window.stab)};
A.tb=()=>{const v=prompt("Maqsadli band (1–9), masalan 7.0:",LS('tb')||'7');if(v&&+v>=1&&+v<=9){try{localStorage.setItem('tb',v)}catch{}student('',window.stab)}};
A.ed=()=>{const v=prompt("Imtihon sanasi (YYYY-MM-DD):",LS('ed')||'');if(v!==null){try{localStorage.setItem('ed',v.trim())}catch{}student('',window.stab)}};
A.dk=()=>{try{localStorage.setItem('dk',document.body.classList.toggle('dk')?'1':'')}catch{}};
A.start=async(mid,t)=>{const uid=auth.currentUser.uid,sid=mid+'_'+t;
 const stDoc=await getDoc(doc(db,'students',uid)).catch(()=>null);
 const grp=stDoc?.exists()?stDoc.data().group:(me.group||'');
 const allowed=await hasSectionAccess(uid,sid,grp);
 if(!allowed)return alert("Bu bo'limga sizga yoki guruhingizga ruxsat berilmagan.");
 try{await setDoc(doc(db,'permissions',uid+'_'+sid),{uid,sectionId:sid,mockId:mid,granted:true},{merge:true}).catch(()=>{});
  await setDoc(doc(db,'attempts',uid+'_'+sid),{uid,sectionId:sid,mockId:mid,type:t,startedAt:serverTimestamp(),status:'in_progress',answers:{}})}
 catch(e){return alert("Boshlab bo'lmadi: ruxsat yo'q yoki bo'lim allaqachon boshlangan")}A.open(sid)};

A.open=async sid=>{const aid=auth.currentUser.uid+'_'+sid;
 const [as,ss,pe]=await Promise.all([getDoc(doc(db,'attempts',aid)),getDoc(doc(db,'sections',sid)),getDoc(doc(db,'permissions',aid)).catch(()=>null)]);
 const at=as.data(),sc=ss.data();if(at.status!=='in_progress')return student();
 const extra=+(pe?.exists()?pe.data().extra:0)||0; /* admin bergan qo'shimcha vaqt (daqiqa) */
 const start=at.startedAt.toMillis(),end=start+(Math.min(sc.minutes||60,60)+extra)*6e4,t=sc.type,ans=at.answers||{};let done=false,aud=null;
 const ex=document.createElement('div');ex.className='exam';
 ex.innerHTML=`<div class=bar><b style="margin:0">${t.toUpperCase()}</b><button class=s id=fs>To'liq ekran</button><span id=sv></span><b id=tm></b><button id=sb>Topshirish</button></div><div class=split><div id=L></div><div id=R></div></div><div class=nav id=nv></div>`;
 document.body.append(ex);ex.requestFullscreen?.().catch(()=>{});$('#fs').onclick=()=>ex.requestFullscreen?.();
 if(t=='listening')ex.querySelector('.split').classList.add('ls');const L=$('#L'),R=$('#R'),nv=$('#nv'),mount=(el,h)=>{el.append(...clean(h).childNodes);hl(el)};
 const restore=()=>ex.querySelectorAll('[name^=q]').forEach(e=>{const v=ans[e.name.slice(1)];if(v==null)return;e.type=='radio'?e.checked=e.value==v:e.type=='checkbox'?e.checked=String(v).split(',').includes(e.value):e.value=v});
 let col2=()=>({}),go=()=>{};
 if(sc.parts){const Lp=[],Rp=[];L.innerHTML=(t=='listening'?'<div class=au><b>🎧 Listening</b> <span id=au>Audio yuklanmoqda…</span></div>':'')+'<div class=nav id=pt style="border:0;padding:0 0 10px"></div>';R.innerHTML='';
  sc.parts.forEach(p=>{const a=document.createElement('div'),b=document.createElement('div');a.innerHTML=`<h3>${X(p.title)}</h3><p>${fmt(p.intro)}</p>${p.passage?`<h3>${X(p.passageTitle)}</h3>${p.passage.split(/\n\n/).map(x=>`<p>${fmt(x)}</p>`).join('')}`:''}`;b.innerHTML=p.groups.map(qhtml).join('');hl(a);hl(b);L.append(a);R.append(b);Lp.push(a);Rp.push(b)});
  const show=i=>{Lp.forEach((e,j)=>{e.hidden=Rp[j].hidden=j!=i});[...$('#pt').children].forEach((x,j)=>x.className=j==i?'d':'')};
  $('#pt').innerHTML=sc.parts.map(p=>`<a>${X(p.title)}</a>`).join('');[...$('#pt').children].forEach((x,j)=>x.onclick=()=>show(j));go=el=>{const i=Rp.findIndex(r=>r.contains(el));i>=0&&show(i)};show(0);
  if(t=='listening'){const src=typeof sc.audio=='string'?'/'+sc.audio.replace(/^\/+/,''):'/media/'+sc.audio.id+'?t='+encodeURIComponent(getToken()),au=$('#au'),exp=()=>(Date.now()-start)/1000;aud=new Audio(src);
   aud.onloadedmetadata=()=>{aud.currentTime=Math.min(exp(),aud.duration);au.textContent='Audio ijro etilmoqda';aud.play().catch(()=>{au.innerHTML='<button>▶ Audioni yoqish</button>';au.onclick=()=>aud.play()})};
   aud.onpause=()=>{if(!done&&!aud.ended)aud.play().catch(()=>{})};aud.onratechange=()=>aud.playbackRate=1;aud.onerror=()=>au.innerHTML='<span class=no>Audio topilmadi</span>';
   const ai=setInterval(()=>{if(done)return clearInterval(ai);if(!aud.ended&&Math.abs(aud.currentTime-exp())>3)aud.currentTime=exp()},1000)}}
 if(t=='listening'&&!sc.parts){L.innerHTML=`<h3>Listening</h3><p>Audio avtomatik ijro etiladi. To'xtatish, oldinga/orqaga surish va tezlikni o'zgartirish mumkin emas.</p><div id=au></div>`;mount(R,sc.html);
  Promise.resolve(sc.audio||Promise.reject()).then(url=>{aud=new Audio('/'+String(url).replace(/^\/+/,''));const exp=()=>(Date.now()-start)/1000;
   aud.onloadedmetadata=()=>{aud.currentTime=Math.min(exp(),aud.duration);aud.play().catch(()=>$('#au').innerHTML='<button id=pa>Audioni yoqish</button>',$('#au').onclick=()=>aud.play())};
   aud.onpause=()=>{if(!done&&!aud.ended)aud.play().catch(()=>{})};aud.onratechange=()=>aud.playbackRate=1;
   setInterval(()=>{if(!done&&!aud.ended&&Math.abs(aud.currentTime-exp())>3)aud.currentTime=exp()},1000)}).catch(()=>L.innerHTML+='<p class=no>Audio topilmadi</p>')}
 if(t=='reading'&&!sc.parts){const D=[1,2,3].map(i=>clean(sc['p'+i])),Lp=[],Rp=[];
  L.innerHTML='<div class=nav id=pt style="border:0;padding:0 0 10px"></div>';R.innerHTML='';
  D.forEach((d,i)=>{const a=document.createElement('div'),b=document.createElement('div');a.append(d.querySelector('#passage')||d);const q=d.querySelector('#questions');if(q)b.append(q);hl(a);hl(b);L.append(a);R.append(b);Lp.push(a);Rp.push(b)});
  const show=i=>{Lp.forEach((e,j)=>{e.hidden=Rp[j].hidden=j!=i});[...$('#pt').children].forEach((x,j)=>x.className=j==i?'d':'')};
  $('#pt').innerHTML=[1,2,3].map(i=>`<a>Passage ${i}</a>`).join('');[...$('#pt').children].forEach((x,j)=>x.onclick=()=>show(j));show(0)}
 if(t=='writing'){const tk=(n,h)=>`<div class=tk id=k${n}><h3>Task ${n}${n==1?' ('+sc.kind+')':''}</h3>${n==1?'<img id=im style="max-width:100%">':''}<p style="white-space:pre-wrap"></p></div>`;
  L.innerHTML=`<div class=nav style="border:0;padding:0 0 10px"><a id=b1>Task 1</a><a id=b2>Task 2</a></div>${tk(1)}${tk(2)}`;
  const em='(Savol matni kiritilmagan — adminga xabar bering)';$('#k1 p').textContent=sc.t1||em;$('#k2 p').textContent=sc.t2||em;sc.img?$('#im').src=sc.img:$('#im').remove();
  R.innerHTML=`<textarea id=w1 style="height:70%" spellcheck=false></textarea><textarea id=w2 style="height:70%" spellcheck=false hidden></textarea><p id=wcn></p>`;
  $('#w1').value=ans.t1||'';$('#w2').value=ans.t2||'';
  const cnt=()=>{const a=wc($('#w1').value),b=wc($('#w2').value);$('#wcn').innerHTML=`Task 1: ${a} so'z${a<150?' <span class=no>(kamida 150)</span>':''} · Task 2: ${b} so'z${b<250?' <span class=no>(kamida 250)</span>':''} · Jami: ${a+b} · Belgilar: ${$('#w1').value.length}/${$('#w2').value.length}`};
  const sh=n=>{[1,2].forEach(i=>{$('#k'+i).hidden=$('#w'+i).hidden=i!=n;$('#b'+i).className=i==n?'d':''})};
  $('#b1').onclick=()=>sh(1);$('#b2').onclick=()=>sh(2);sh(1);ex.addEventListener('input',cnt);cnt();col2=()=>({t1:$('#w1').value,t2:$('#w2').value})}
 else{restore();const names=[...new Set([...ex.querySelectorAll('[name^=q]')].map(e=>e.name).filter(n=>/^q\d+$/.test(n)))].sort((a,b)=>a.slice(1)-b.slice(1));
  col2=()=>{const o={};ex.querySelectorAll('[name^=q]').forEach(e=>{const n=e.name.slice(1);if(!/^\d+$/.test(n))return;
   if(e.type=='radio'){if(e.checked)o[n]=e.value}else if(e.type=='checkbox'){if(e.checked)o[n]=(o[n]?o[n]+',':'')+e.value}else if(e.value)o[n]=e.value});return o};
  const paint=()=>{const a=col2();nv.innerHTML=names.map(n=>`<a class="${a[n.slice(1)]?'d':''}" data-n="${n}">${n.slice(1)}</a>`).join('')};
  nv.onclick=e=>{const n=e.target.dataset?.n;if(n){const el=ex.querySelector(`[name=${n}]`);go(el);el?.scrollIntoView({block:'center'})}};ex.addEventListener('input',paint);paint()}
 const submit=async auto=>{if(done)return;if(!auto&&!confirm('Topshirishni tasdiqlaysizmi? Keyin o\'zgartirib bo\'lmaydi.'))return;
  done=true;clearInterval(tm);clearInterval(sv);aud?.pause();
  try{await updateDoc(doc(db,'attempts',aid),{answers:col2(),status:'submitted',submittedAt:serverTimestamp()})}catch(e){alert('Saqlashda xato: '+e.message)}
  ex.remove();document.exitFullscreen?.().catch(()=>{});student("Bo'lim topshirildi. Keyingi bo'lim uchun admin ruxsatini kuting.")};
 $('#sb').onclick=()=>submit(false);
 const tm=setInterval(()=>{const r=Math.max(0,end-Date.now());$('#tm').className=r<3e5?'low':'';$('#tm').textContent=String(Math.floor(r/6e4)).padStart(2,'0')+':'+String(Math.floor(r/1e3)%60).padStart(2,'0');if(r<=0)submit(true)},1000);
 const sv=setInterval(()=>{if(!done)updateDoc(doc(db,'attempts',aid),{answers:col2()}).then(()=>$('#sv').textContent='Saqlandi ✓').catch(()=>$('#sv').textContent='Saqlanmadi!')},10000)};

/* ---------- Admin paneli ---------- */
async function admin(tab){const tabs=[['stats','Dashboard','▦'],['st','Talabalar','👥'],['mk','Mocklar','📝'],['pm','Ruxsatlar','🔑'],['rs','Natijalar','📊']];
 shell(tabs,tab,'A.tab','Salom, Admin 👋','Administrator','Admin');await A['t_'+tab]()}
A.tab=admin;const pg=h=>$('#pg').innerHTML=h;
A.t_stats=async()=>{const [s,m,a,l]=await Promise.all([col('students'),col('mocks'),col('attempts'),col('log')]),N={};s.forEach(d=>N[d.id]=d.data().name);
 const at=a.docs.map(d=>d.data()),sub=at.filter(x=>x.status=='submitted'),ip=at.length-sub.length,pc=at.length?Math.round(sub.length*100/at.length):0,by=SEC.map(t=>at.filter(x=>x.type==t).length),mx=Math.max(1,...by),
 rec=[...at].sort((x,y)=>(y.startedAt?.toMillis?.()||0)-(x.startedAt?.toMillis?.()||0)).slice(0,8);
 pg(`<div class=g3><div class=st><small>Yakunlanish darajasi</small><h1>${sub.length}</h1><p class=mut>${at.length} ta urinishdan</p><div class=ring style="--p:${pc}"><b>${pc}%</b></div></div>
 <div class=st><small>Talabalar · Mocklar</small><h1>${s.size} · ${m.size}</h1><div class=bars>${by.map(x=>`<i style="height:${8+x*48/mx}px"></i>`).join('')}</div><p class=mut>Listening · Reading · Writing</p></div>
 <div class=st><small>Hozir imtihonda</small><h1>${ip}</h1><p class=mut>faol urinishlar</p></div></div>
 <div class=card><h3>Oxirgi urinishlar</h3><table><tr><th>Talaba</th><th>Bo'lim</th><th>Holat</th><th>Boshlangan</th></tr>${rec.map(x=>`<tr><td><div style="display:flex;gap:10px;align-items:center"><div class=av>${esc((N[x.uid]||'?')[0])}</div>${esc(N[x.uid]||'—')}</div></td><td>${x.type}</td><td><span class=tag>${x.status=='submitted'?'Topshirgan':'Jarayonda'}</span></td><td>${ts(x.startedAt)}</td></tr>`).join('')}</table></div>
 <div class=card><h3>Faollik jurnali</h3><table>${l.docs.map(d=>d.data()).sort((a,b)=>(b.t?.seconds||0)-(a.t?.seconds||0)).slice(0,15).map(x=>`<tr><td>${ts(x.t)}</td><td>${esc(x.a)}</td></tr>`).join('')}</table></div>`)};

/* ---------- Talabalar va Guruhlarni boshqarish ---------- */
let SD=[],GD=[],SG='';
const allGroupNames=()=>{const set=new Map();GD.forEach(g=>{if(g.name)set.set(norm(g.name),g.name)});SD.forEach(s=>{if(s.group)set.set(norm(s.group),s.group)});return [...set.values()].sort((a,b)=>a.localeCompare(b))};

A.t_st=async()=>{
 const [stSnap,grSnap]=await Promise.all([col('students'),col('groups').catch(()=>({docs:[]}))]);
 SD=stSnap.docs.map(d=>({id:d.id,...d.data()}));
 GD=grSnap.docs.map(d=>({id:d.id,...d.data()}));
 const groups=allGroupNames();
 if(SG&&!groups.some(g=>norm(g)===norm(SG)))SG='';

 pg(`<div class=grid style="align-items:start">
  <div class=card>
   <h3>Yangi guruh yaratish</h3>
   <div style="display:flex;gap:8px;align-items:center">
    <input id=gn placeholder="Masalan: IELTS Beginner, IELTS Intermediate">
    <button onclick="A.addGrp()">Yaratish</button>
   </div>
   <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px" id=gchips>
    <a class="tag" style="cursor:pointer;${!SG?'background:var(--b);color:#fff':''}" onclick="A.selGrp('')">Barchasi (${SD.length})</a>
    ${groups.map(g=>{
      const cnt=SD.filter(s=>norm(s.group)===norm(g)).length;
      const on=norm(SG)===norm(g);
      return `<span style="display:inline-flex;align-items:center;gap:4px;background:${on?'var(--b)':'var(--l)'};color:${on?'#fff':'#12804b'};padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600">
        <a style="cursor:pointer" onclick="A.selGrp('${esc(g).replace(/'/g,"\\'")}')">${esc(g)} (${cnt})</a>
        <a style="cursor:pointer;opacity:.75;margin-left:2px" title="Guruhni o'chirish" onclick="A.delGrp('${esc(g).replace(/'/g,"\\'")}')">×</a>
      </span>`;
    }).join('')}
   </div>
   ${SG?`<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--ln)">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
     <select id=addToGrp style="flex:1;min-width:180px">
      <option value="">— ${esc(SG)} guruhiga o'quvchi qo'shish —</option>
      ${SD.filter(s=>norm(s.group)!==norm(SG)).map(s=>`<option value="${s.id}">${esc(s.name)} ${s.group?'('+esc(s.group)+')':'(guruhsiz)'}</option>`).join('')}
     </select>
     <button onclick="A.assignGrp()">Qo'shish</button>
    </div>
   </div>`:''}
  </div>

  <div class=card>
   <h3>Yangi talaba</h3>
   <div class=grid>
    <input id=n placeholder="To'liq ism">
    <input id=g list=glist value="${esc(SG)}" placeholder="Guruh (tanlang yoki yozing)">
    <datalist id=glist>${groups.map(g=>`<option value="${esc(g)}">`).join('')}</datalist>
    <input id=lg placeholder="Login kodi">
    <input id=ps placeholder="Parol (kamida 6)">
   </div>
   <button class=s onclick="A.gen()">Avto yaratish</button> <button onclick="A.addSt()">Qo'shish</button>
  </div>
 </div>

 <div class=card>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">
   <h3 style="margin:0">${SG?`Guruh: ${esc(SG)}`:'Barcha talabalar'}</h3>
   <input id=q style="max-width:300px;margin:0" placeholder="Ism yoki guruh bo'yicha qidirish" oninput="A.rows()">
  </div>
  <table id=sr></table>
 </div>`);
 A.rows();
};

A.selGrp=g=>{SG=g;A.t_st()};
A.addGrp=async()=>{
 const name=$('#gn').value.trim();if(!name)return alert('Guruh nomini kiriting');
 const id=gslug(name);
 await setDoc(doc(db,'groups',id),{name,createdAt:serverTimestamp()},{merge:true});
 log("Guruh yaratildi: "+name);SG=name;A.t_st();
};
A.delGrp=async name=>{
 if(!confirm(`"${name}" guruhini o'chirasizmi? (Guruhdagi o'quvchilar guruhsiz holatga o'tadi)`))return;
 await deleteDoc(doc(db,'groups',gslug(name))).catch(()=>{});
 for(const g of GD.filter(x=>norm(x.name)===norm(name)))await deleteDoc(doc(db,'groups',g.id)).catch(()=>{});
 for(const s of SD.filter(x=>norm(x.group)===norm(name)))await updateDoc(doc(db,'students',s.id),{group:''}).catch(()=>{});
 if(norm(SG)===norm(name))SG='';
 log("Guruh o'chirildi: "+name);A.t_st();
};
A.assignGrp=async()=>{
 const uid=$('#addToGrp')?.value;if(!uid||!SG)return alert("O'quvchini tanlang");
 await A.setStGrp(uid,SG);
};
A.setStGrp=async(uid,newGrp)=>{
 const grp=String(newGrp||'').trim();
 await updateDoc(doc(db,'students',uid),{group:grp});
 if(grp){
  await setDoc(doc(db,'groups',gslug(grp)),{name:grp},{merge:true}).catch(()=>{});
  await syncStudentGroupPerms(uid,grp);
 }
 log(`Talaba guruhi o'zgartirildi: ${uid} -> ${grp||'guruhsiz'}`);
 A.t_st();
};
A.rows=()=>{
 const q=norm($('#q')?.value),groups=allGroupNames();
 const list=SD.filter(s=>(!SG||norm(s.group)===norm(SG))&&norm(s.name+' '+(s.group||'')).includes(q));
 $('#sr').innerHTML='<tr><th>Ism</th><th>Login</th><th>Guruh</th><th>Holat</th><th>Amallar</th></tr>'+(list.length?list.map(s=>`<tr>
  <td><b>${esc(s.name)}</b></td>
  <td>${esc(s.login)}</td>
  <td>
   <select style="width:auto;padding:5px 8px;margin:0" onchange="A.setStGrp('${s.id}',this.value)">
    <option value="">— Guruhsiz —</option>
    ${groups.map(g=>`<option value="${esc(g)}" ${norm(s.group)===norm(g)?'selected':''}>${esc(g)}</option>`).join('')}
   </select>
   ${s.group?`<button class=s style="padding:4px 8px;margin:0 0 0 4px" title="Guruhdan chiqarish" onclick="A.setStGrp('${s.id}','')">Chiqarish</button>`:''}
  </td>
  <td>${s.active?'<span class=ok>Faol</span>':'<span class=no>Nofaol</span>'}</td>
  <td>
   <button class=s onclick="A.tg('${s.id}',${!s.active})">${s.active?"O'chirish":'Yoqish'}</button>
   <button class=s onclick="A.ed('${s.id}')">Tahrir</button>
   <button class=s onclick="A.del('${s.id}')">×</button>
  </td>
 </tr>`).join(''):'<tr><td colspan=5 class=mut>Talabalar topilmadi</td></tr>');
};
A.gen=()=>{const r=n=>Math.random().toString(36).slice(2,2+n);$('#lg').value='s'+Math.floor(1000+Math.random()*9000);$('#ps').value=r(8)};
A.addSt=async()=>{const name=$('#n').value.trim(),login=$('#lg').value.trim().toLowerCase(),pass=$('#ps').value,grp=$('#g').value.trim();
 if(!name||!login||pass.length<6)return alert("Ism, login va parol (6+) kerak");
 try{const c=await createUserWithEmailAndPassword(sa,login+DOM,pass);await signOut(sa);
  await setDoc(doc(db,'students',c.user.uid),{name,login,group:grp,active:true,createdAt:serverTimestamp()});
  if(grp){
   await setDoc(doc(db,'groups',gslug(grp)),{name:grp},{merge:true}).catch(()=>{});
   await syncStudentGroupPerms(c.user.uid,grp);
  }
  log("Talaba qo'shildi: "+name);alert(`Login: ${login}\nParol: ${pass}`);A.t_st()}catch(e){alert(e.message)}};
A.tg=async(id,v)=>{await updateDoc(doc(db,'students',id),{active:v});log('Talaba holati: '+id);A.t_st()};
A.ed=async id=>{const s=SD.find(x=>x.id==id),n=prompt('Ism',s.name);if(n==null)return;const g=prompt('Guruh',s.group||'');if(g==null)return;
 await updateDoc(doc(db,'students',id),{name:n,group:g.trim()});
 if(g.trim()){await setDoc(doc(db,'groups',gslug(g.trim())),{name:g.trim()},{merge:true}).catch(()=>{});await syncStudentGroupPerms(id,g.trim())}
 A.t_st()};
A.del=async id=>{if(confirm("O'chirilsinmi?")){await deleteDoc(doc(db,'students',id));log("Talaba o'chirildi");A.t_st()}};

const keys=t=>{const m={};t.split('\n').forEach(l=>{const x=l.match(/^\s*(\d+)\s*[=:.)\-\s]\s*(.+)$/);if(x)m[x[1]]=x[2].split('/').map(norm).filter(Boolean)});return m};
A.loadJ=(el,id)=>el.files[0]?.text().then(t=>$('#'+id).value=t);
A.smp=async id=>{$('#'+id).value=await(await fetch('/samples/'+{lj:'listening',rj:'reading',wj:'writing'}[id]+'.json')).text()};
A.t_mk=async()=>{const ms=await col('mocks'),J=(id,l)=>`<h4>${l}</h4><textarea id=${id} rows=6 placeholder="JSON kodni shu yerga qo'ying" style="font-family:monospace"></textarea><input type=file accept=".json,application/json" onchange="A.loadJ(this,'${id}')"> <button class=s onclick="A.smp('${id}')">Namuna</button>`;
 pg(`<div class=card><h3>Yangi mock</h3><div class=grid><input id=mt placeholder="Sarlavha"><input id=mn placeholder="Raqam"><input id=md type=date><input id=mdesc placeholder="Tavsif"></div>
 ${J('lj','🎧 Listening (40 savol) — JSON')}<label>Audio fayl (mp3) — kompyuterdan tanlang<input type=file id=la accept="audio/*"></label>
 ${J('rj','📖 Reading — JSON')}${J('wj','✍️ Writing — JSON')}<label>Writing Task 1 rasmi<input type=file id=wi accept="image/*"></label>
 <p id=up></p><button onclick="A.saveMock()">Saqlash</button></div>
 <div class=card><table>${ms.docs.map(d=>`<tr><td>${esc(d.data().title)}</td><td>${esc(d.data().date||'')}</td><td><button class=s onclick="A.delMock('${d.id}')">O'chirish</button></td></tr>`).join('')}</table></div>`)};
const wnorm=txt=>{const j=JSON.parse(txt),T=Array.isArray(j.tasks)?j.tasks:[],g=x=>typeof x=='string'?x:Array.isArray(x)?x.map(g).filter(Boolean).join('\n'):x&&typeof x=='object'?Object.entries(x).filter(([k])=>!/^(n|id|type|kind|minutes|words|minWords|image|img)$/i.test(k)).map(([k,v])=>g(v)).filter(Boolean).join('\n'):x!=null?String(x):'';
 const w={kind:j.kind||'Academic',task1:g(j.task1||j.t1||T[0]),task2:g(j.task2||j.t2||T[1])};
 if(!String(w.task1).trim()||!String(w.task2).trim())throw Error('Writing JSON da "task1" va "task2" matni bo\'sh. Namuna tugmasidagi formatdan foydalaning.');return w};
A.saveMock=async()=>{const f=id=>$('#'+id).files[0],v=id=>$('#'+id).value,up=$('#up');if(!v('mt'))return alert('Sarlavha kerak');
 let L,R,W;try{L=build('listening',v('lj'));R=build('reading',v('rj'));W=wnorm(v('wj'))}catch(e){return alert('JSON xato: '+e.message)}
 if(!f('la'))return alert('Listening audio faylini tanlang');
 try{const aid=crypto.randomUUID(),F=f('la'),C=3<<20,n=Math.ceil(F.size/C),H={authorization:'Bearer '+getToken()};
  for(let i=0;i<n;i++){up.textContent=`Audio yuklanmoqda… ${i+1}/${n}`;const r=await fetch(`/media/${aid}?i=${i}`,{method:'POST',headers:H,body:F.slice(i*C,(i+1)*C)});if(!r.ok)throw Error('Audio yuklanmadi ('+r.status+')')}
  if(!(await fetch(`/media/${aid}?done=1&chunks=${n}&size=${F.size}&type=${encodeURIComponent(F.type||'audio/mpeg')}`,{method:'POST',headers:H})).ok)throw Error('Audio yakunlanmadi');
  const id=(await addDoc(collection(db,'mocks'),{title:v('mt'),number:v('mn'),date:v('md'),desc:v('mdesc'),createdAt:serverTimestamp()})).id,[Ls,Rs,Ws]=SEC.map(s=>id+'_'+s);
  L.sec.mockId=R.sec.mockId=id;L.sec.audio={id:aid,name:F.name,size:F.size};
  await setDoc(doc(db,'sections',Ls),L.sec);await setDoc(doc(db,'keys',Ls),{map:L.map});await setDoc(doc(db,'sections',Rs),R.sec);await setDoc(doc(db,'keys',Rs),{map:R.map});
  const img=f('wi')?await new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f('wi'))}):'';
  await setDoc(doc(db,'sections',Ws),{mockId:id,type:'writing',kind:W.kind||'Academic',t1:W.task1||W.t1||'',t2:W.task2||W.t2||'',img});
  log('Mock yaratildi: '+v('mt'));alert(`Saqlandi: Listening ${L.total} ta, Reading ${R.total} ta savol`);A.t_mk()}catch(e){up.textContent='';alert('Xato: '+e.message)}};
A.delMock=async id=>{if(!confirm("O'chirilsinmi?"))return;const ls=(await getDoc(doc(db,'sections',id+'_listening'))).data();if(ls?.audio?.id)fetch('/media/'+ls.audio.id,{method:'DELETE',headers:{authorization:'Bearer '+getToken()}});for(const s of SEC){await deleteDoc(doc(db,'sections',id+'_'+s));await deleteDoc(doc(db,'keys',id+'_'+s))}await deleteDoc(doc(db,'mocks',id));log("Mock o'chirildi");A.t_mk()};

/* ---------- Ruxsatlar (Guruhlar + Individual talabalar) ---------- */
let SM='',PMG='';
A.t_pm=async()=>{
 const [ms,ss,gs,ps,gps,as]=await Promise.all([col('mocks'),col('students'),col('groups').catch(()=>({docs:[]})),col('permissions'),col('group_permissions').catch(()=>({docs:[]})),col('attempts')]);
 SM=SM||ms.docs[0]?.id||'';
 const P={},GP={},T={};
 ps.forEach(d=>P[d.id]=d.data().granted);
 gps.docs.forEach(d=>{const x=d.data();GP[norm(x.groupName)+'|'+x.sectionId]=x.granted});
 as.forEach(d=>T[d.id]=d.data().status);

 const stList=ss.docs.map(d=>({id:d.id,...d.data()}));
 const grpMap=new Map();
 gs.docs.forEach(d=>{const nm=d.data().name;if(nm)grpMap.set(norm(nm),nm)});
 stList.forEach(s=>{if(s.group)grpMap.set(norm(s.group),s.group)});
 const groups=[...grpMap.values()].sort((a,b)=>a.localeCompare(b));
 const filteredSt=PMG?stList.filter(s=>norm(s.group)===norm(PMG)):stList;

 pg(`<div class=card>
  <div class=grid>
   <label>Mock imtihonni tanlang
    <select onchange="SM=this.value;A.t_pm()">${ms.docs.map(d=>`<option value=${d.id} ${d.id==SM?'selected':''}>${esc(d.data().title)}</option>`).join('')}</select>
   </label>
   <label>Talabalar ro'yxatini guruh bo'yicha filtrlash
    <select onchange="A.pmGrp(this.value)">
     <option value="">Barcha guruhlar (${stList.length} talaba)</option>
     ${groups.map(g=>`<option value="${esc(g)}" ${norm(PMG)===norm(g)?'selected':''}>${esc(g)}</option>`).join('')}
    </select>
   </label>
  </div>
 </div>

 <div class=card>
  <h3>Guruhlar bo'yicha ruxsat berish (Group Access Control)</h3>
  <p class=mut style="margin-bottom:10px">Guruhga ruxsat berilganda yoki olinganda shu guruhdagi barcha o'quvchilarga hamda keyin qo'shiladigan yangi o'quvchilarga avtomatik qo'llanadi.</p>
  ${groups.length?`<table><tr><th>Guruh</th><th>O'quvchilar</th>${SEC.map(s=>`<th>${s}</th>`).join('')}</tr>
   ${groups.map(g=>{
    const cnt=stList.filter(s=>norm(s.group)===norm(g)).length;
    return `<tr>
     <td><b>${esc(g)}</b></td>
     <td><span class=tag>${cnt} talaba</span></td>
     ${SEC.map(t=>{
      const sid=SM+'_'+t,on=!!GP[norm(g)+'|'+sid];
      return `<td><button class="${on?'':'s'}" onclick="A.gperm('${esc(g).replace(/'/g,"\\'")}','${sid}',${!on})">${on?'Ruxsat ✓':'Ruxsat berish'}</button></td>`;
     }).join('')}
    </tr>`;
   }).join('')}
  </table>`:'<p class=mut>Hali guruhlar yaratilmagan. "Talabalar" bo\'limida guruh yarating.</p>'}
 </div>

 <div class=card>
  <h3>Individual talabalar ruxsatlari ${PMG?'('+esc(PMG)+')':''}</h3>
  <table><tr><th>Talaba</th><th>Guruh</th>${SEC.map(s=>`<th>${s}</th>`).join('')}</tr>${filteredSt.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.group||'—')}</td>${SEC.map(t=>{const sid=SM+'_'+t,k=s.id+'_'+sid,g=P[k]||GP[norm(s.group||'')+'|'+sid];
  return `<td>${T[k]=='submitted'?'<span class=ok>Topshirgan</span>':T[k]?'Jarayonda':''}<br><button class="${g?'':'s'}" onclick="A.perm('${s.id}','${sid}',${!g})">${g?'Ruxsat ✓':'Ruxsat berish'}</button></td>`}).join('')}</tr>`).join('')}</table>
 </div>`)};
window.SM=SM;Object.defineProperty(window,'SM',{get:()=>SM,set:v=>SM=v});
A.pmGrp=v=>{PMG=v;A.t_pm()};
A.perm=async(uid,sid,g)=>{await setDoc(doc(db,'permissions',uid+'_'+sid),{uid,sectionId:sid,mockId:sid.split('_')[0],granted:g},{merge:true});log(`Ruxsat ${g?'berildi':'olindi'}: ${sid}`);A.t_pm()};
A.gperm=async(groupName,sid,g)=>{
 const mid=sid.split('_')[0];
 await setDoc(doc(db,'group_permissions',gslug(groupName)+'_'+sid),{groupName,sectionId:sid,mockId:mid,granted:g,updatedAt:serverTimestamp()});
 const stSnap=await col('students');
 const members=stSnap.docs.filter(d=>norm(d.data().group)===norm(groupName));
 await Promise.all(members.map(d=>setDoc(doc(db,'permissions',d.id+'_'+sid),{uid:d.id,sectionId:sid,mockId:mid,granted:g,fromGroup:groupName},{merge:true})));
 log(`Guruh ruxsati (${groupName}) ${g?'berildi':'olindi'}: ${sid} (${members.length} talaba)`);
 A.t_pm();
};

const BT=[[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5]];
const band=(raw,tot)=>(BT.find(t=>Math.round(raw*40/tot)>=t[0])||[0,2])[1];

/* ===== Natijalar (admin): mock → sana → talaba → 3 bo'lim → PDF va Bulk ZIP Eksport ===== */
document.head.insertAdjacentHTML('beforeend','<style>'+
'.pn:not(.all) tr.okr{display:none}.pn.hid{display:none}.lk{cursor:pointer;color:var(--b);font-weight:700}'+
'#rep{display:none}'+
'@media print{body>*:not(#rep){display:none!important}#rep{display:block!important;color:#000;background:#fff;font:13px/1.5 Arial,sans-serif}@page{margin:14mm}}'+
'.rp h1{margin:0;font-size:22px}.rp h2{font-size:16px;margin:18px 0 6px;border-bottom:2px solid #888;padding-bottom:3px}.rp h3{font-size:14px;margin:12px 0 4px}'+
'.rp table{width:100%;border-collapse:collapse;margin:6px 0}.rp th,.rp td{border:1px solid #999;padding:4px 8px;text-align:left;background:#fff;color:#000}.rp th{background:#eee}.rp tr{page-break-inside:avoid}'+
'.rp .tx{white-space:pre-wrap;border:1px solid #bbb;padding:8px;margin:4px 0}.rp .hd{display:flex;align-items:center;gap:12px}.rp .hd img{width:54px;height:54px;border-radius:50%}'+
'</style>');
const dkey=t=>{if(!t?.toDate)return '';const d=t.toDate(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())},
 fd=s=>s?String(s).split('-').reverse().join('.'):'—',CR=['Task Achievement/Response','Coherence & Cohesion','Lexical Resource','Grammatical Range & Accuracy'];
let RS={v:'m',mock:'',date:'',grp:'',q:'',tab:'writing',sm:'',su:'',back:'m',cur:[],S:{}},RD={N:{},G:{},M:{},A:[]},RES={},RK={},ATT={};
async function rload(){
 const [a,s,ms,r]=await Promise.all([col('attempts'),col('students'),col('mocks'),col('results')]);
 RD={N:{},G:{},M:{},A:[]};s.forEach(d=>{RD.N[d.id]=d.data().name;RD.G[d.id]=d.data().group||''});ms.forEach(d=>RD.M[d.id]=d.data());
 RES={};r.forEach(d=>RES[d.id]=d.data());
 ATT={};a.forEach(d=>{ATT[d.id]={id:d.id,...d.data()}});RD.A=Object.values(ATT);
 RK=await col('keys').then(k=>{const o={};k.forEach(d=>o[d.id]=d.data().map||{});return o}).catch(async()=>{const o={};for(const m of ms.docs)for(const t of ['listening','reading']){const d=await getDoc(doc(db,'keys',m.id+'_'+t)).catch(()=>null);if(d&&d.exists())o[d.id]=d.data().map||{}}return o})}
const grade=at=>{const k=RK[at.sectionId];if(!k)return null;const a=at.answers||{},nums=Object.keys(k).map(Number).sort((x,y)=>x-y);let c=0,w=0,b=0;
 const rows=nums.map(n=>{const g=norm(a[n]),ok=!!g&&k[n].includes(g);g?(ok?c++:w++):b++;return{n,given:a[n]||'',key:k[n].join(' / '),ok,blank:!g}});
 return{rows,c,w,b,tot:nums.length,bd:band(c,nums.length||40)}};
const sb=at=>{if(!at)return{st:'-'};if(at.status!=='submitted')return{st:'prog'};const r=RES[at.id];
 if(at.type=='writing')return r?.band!=null?{st:'ok',band:r.band}:{st:'wait'};
 const g=grade(at);if(r?.band!=null)return{st:'ok',band:r.band,g};return g?{st:'ok',band:g.bd,auto:1,g}:{st:'wait'}};
const ovl=g=>{const b=SEC.map(t=>sb(g.S[t]).band);return b.every(x=>x!=null)?Math.round(b.reduce((x,y)=>x+y)/3*2)/2:null};
const cell2=at=>{const s=sb(at);if(s.st=='-')return '<span class=mut>—</span>';if(s.st=='prog')return '<span class=tag>Jarayonda</span>';if(s.st=='wait')return '<span class=tag>Baholanmagan</span>';
 return `<b>${s.band}</b>${s.g?` <small>${s.g.c}/${s.g.tot}</small>`:''}${s.auto?' <small>*</small>':''}`};

function rrows(mock,date,q,grp=''){const G={};
 RD.A.forEach(a=>{
  if(mock&&a.mockId!=mock)return;
  if(date&&dkey(a.startedAt)!=date)return;
  if(grp&&norm(RD.G[a.uid]||'')!==norm(grp))return;
  const k=a.uid+'|'+a.mockId,g=G[k]=G[k]||{uid:a.uid,mockId:a.mockId,t:0,d:'',S:{}};
  g.S[a.type]=a;
  const t=a.startedAt?.toMillis?.()||0;
  if(t>=g.t){g.t=t;g.d=dkey(a.startedAt)}
 });
 return Object.values(G).filter(g=>norm((RD.N[g.uid]||'')+' '+(RD.G[g.uid]||'')).includes(norm(q))).sort((x,y)=>y.t-x.t||String(RD.N[x.uid]).localeCompare(String(RD.N[y.uid])))}

function rtbl(){const full=RS.v=='a',rows=rrows(full?'':RS.mock,full?'':RS.date,RS.q,RS.grp);RS.cur=rows;
 const grps=[...new Set(Object.values(RD.G).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 $('#rt').innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
  <b>${rows.length} ta talaba</b>
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
   <select id=exGrp style="width:auto;margin:0;padding:7px 10px" title="Eksport uchun guruh">
    <option value="">Barcha guruhlar</option>
    ${grps.map(g=>`<option value="${esc(g)}" ${norm(RS.grp)===norm(g)?'selected':''}>${esc(g)}</option>`).join('')}
   </select>
   <select id=exSec style="width:auto;margin:0;padding:7px 10px" title="Eksport uchun bo'lim">
    <option value="writing">✍️ Writing (ZIP)</option>
    <option value="reading">📖 Reading (ZIP)</option>
    <option value="listening">🎧 Listening (ZIP)</option>
   </select>
   <button onclick="A.bulkZip(this)">📦 ZIP eksport</button>
   <button class=s onclick="A.csv()">CSV eksport</button>
   <button class=s onclick="A.bulkRetake()">🔁 Qayta ruxsat (tanlangan bo'lim)</button>
  </div>
 </div>`+
 (rows.length?`<table><tr><th>Talaba</th><th>Guruh</th>${full?'<th>Mock</th>':''}<th>Sana</th><th>🎧 Listening</th><th>📖 Reading</th><th>✍️ Writing</th><th>Umumiy</th></tr>${rows.map(g=>`<tr><td><a class=lk onclick="A.stu('${g.mockId}','${g.uid}')">${esc(RD.N[g.uid]||'—')}</a></td><td>${esc(RD.G[g.uid]||'')}</td>${full?`<td>${esc(RD.M[g.mockId]?.title||'—')}</td>`:''}<td>${fd(g.d)}</td>${SEC.map(t=>`<td>${cell2(g.S[t])}</td>`).join('')}<td><b>${ovl(g)??'—'}</b></td></tr>`).join('')}</table>`:'<p class=mut>Bu yerda hali hech kim ishlamagan</p>')+
 `<p class=mut><small>* — avtomatik hisoblangan band, talabaga hali ko'rsatilmagan (talaba ismini bosib, "Natijani saqlash" ni bosing). "Baholanmagan" — Writing hali tekshirilmagan.</small></p>`}

function rview(){const v=RS.v;
 const grps=[...new Set(Object.values(RD.G).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 if(v=='m'){const C={};RD.A.forEach(a=>{const c=C[a.mockId]=C[a.mockId]||{u:new Set(),n:0};c.u.add(a.uid);c.n++});
  const ms=Object.entries(RD.M).sort((x,y)=>String(y[1].date||'').localeCompare(String(x[1].date||'')));
  pg(`<div class=card style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><h3 style="margin:0">Mockni tanlang</h3><p class=mut style="margin:2px 0 0">Mock ustiga bosing — qaysi sanada kimlar ishlaganini ko'rasiz</p></div><button class=s onclick="A.ra()">📋 Umumiy jadval va Bulk Eksport</button></div>
  <div class=g3>${ms.map(([id,m])=>`<div class=st style="cursor:pointer" onclick="A.rm('${id}')"><small>${m.date?fd(m.date):'—'}</small><h3 style="margin:6px 0">${esc(m.title)}</h3><p class=mut>${C[id]?.u.size||0} talaba · ${C[id]?.n||0} urinish</p></div>`).join('')||"<p class=mut>Hali mock yo'q</p>"}</div>`);return}
 if(v=='a'){pg(`<div class=card><button class=s onclick="A.rb()">← Mocklar</button><h3 style="margin-top:10px">Umumiy natijalar (barcha mocklar)</h3>
  <div class=grid>
   <label>Guruh bo'yicha filtr<select onchange="A.rg(this.value)"><option value="">Barcha guruhlar</option>${grps.map(g=>`<option value="${esc(g)}" ${norm(RS.grp)===norm(g)?'selected':''}>${esc(g)}</option>`).join('')}</select></label>
   <label>Qidirish<input id=rq value="${esc(RS.q)}" placeholder="Ism yoki guruh bo'yicha qidirish" oninput="A.rq(this.value)"></label>
  </div></div><div class=card id=rt></div>`);rtbl();return}
 if(v=='k'){const m=RD.M[RS.mock]||{},ds={};RD.A.filter(a=>a.mockId==RS.mock).forEach(a=>{const d=dkey(a.startedAt);(ds[d]=ds[d]||new Set()).add(a.uid)});
  pg(`<div class=card><button class=s onclick="A.rb()">← Mocklar</button><h3 style="margin-top:10px">${esc(m.title)}</h3><div class=grid>
   <label>Sana<select onchange="A.rd(this.value)"><option value="">Barcha sanalar</option>${Object.keys(ds).sort().reverse().map(d=>`<option value="${d}" ${d==RS.date?'selected':''}>${fd(d)} (${ds[d].size} talaba)</option>`).join('')}</select></label>
   <label>Guruh<select onchange="A.rg(this.value)"><option value="">Barcha guruhlar</option>${grps.map(g=>`<option value="${esc(g)}" ${norm(RS.grp)===norm(g)?'selected':''}>${esc(g)}</option>`).join('')}</select></label>
   <label>Qidirish<input id=rq value="${esc(RS.q)}" placeholder="Ism yoki guruh" oninput="A.rq(this.value)"></label>
  </div></div><div class=card id=rt></div>`);rtbl()}}
A.t_rs=async()=>{RS.v='m';RS.date='';RS.grp='';RS.q='';await rload();rview()};
A.rm=id=>{RS.mock=id;RS.v='k';RS.date='';RS.grp='';RS.q='';rview()};
A.ra=()=>{RS.v='a';RS.grp='';RS.q='';rview()};
A.rd=v=>{RS.date=v;rtbl()};A.rg=v=>{RS.grp=v;rtbl()};A.rq=v=>{RS.q=v;rtbl()};
A.rb=()=>{RS.v=RS.v=='s'?(RS.back||'m'):'m';rview()};
A.pt=t=>{RS.tab=t;document.querySelectorAll('.pn').forEach(e=>e.classList.toggle('hid',e.id!='pn_'+t));document.querySelectorAll('.tabs a').forEach((e,i)=>e.className=['writing','reading','listening'][i]==t?'d':'')};

/* ---- Bulk Export: Barcha yoki tanlangan guruh o'quvchilari javoblarini bitta ZIP faylda yuklab olish ---- */
const loadJSZip=()=>window.JSZip?Promise.resolve(window.JSZip):new Promise((ok,no)=>{
 const s=document.createElement('script');
 s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
 s.onload=()=>ok(window.JSZip);s.onerror=no;document.head.append(s);
});
const safeFile=s=>String(s||'Student').trim().replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,'_')||'Student';

A.bulkZip=async btn=>{
 const sec=$('#exSec')?.value||'writing';
 const grp=$('#exGrp')?.value??RS.grp??'';
 const mockFilter=RS.v=='k'?RS.mock:'';
 const dateFilter=RS.v=='k'?RS.date:'';
 const items=RD.A.filter(a=>{
  if(a.type!==sec)return false;
  if(mockFilter&&a.mockId!==mockFilter)return false;
  if(dateFilter&&dkey(a.startedAt)!==dateFilter)return false;
  if(grp&&norm(RD.G[a.uid]||'')!==norm(grp))return false;
  return true;
 });
 if(!items.length)return alert("Tanlangan filtr bo'yicha eksport qilish uchun javoblar topilmadi.");
 const orig=btn?.textContent;
 if(btn){btn.disabled=true;btn.textContent='ZIP tayyorlanmoqda…'}
 try{
  const JSZip=await loadJSZip();
  const zip=new JSZip();
  const usedNames=new Map();
  const secTitle=sec[0].toUpperCase()+sec.slice(1);

  if(sec==='writing'){
   const secCache={},fbCache={};
   for(const a of items){
    if(!secCache[a.mockId]){
     const d=await getDoc(doc(db,'sections',a.mockId+'_writing')).catch(()=>null);
     secCache[a.mockId]=d?.exists()?d.data():{};
    }
    const fbD=await getDoc(doc(db,'feedback',a.id)).catch(()=>null);
    fbCache[a.id]=fbD?.exists()?fbD.data():{};
   }
   for(const a of items){
    const stName=RD.N[a.uid]||a.uid;
    const stGrp=RD.G[a.uid]||'—';
    const mkTitle=RD.M[a.mockId]?.title||a.mockId;
    const S=secCache[a.mockId]||{};
    const F=fbCache[a.id]||{};
    const res=RES[a.id]||{};
    const wa=a.answers||{};
    const base=`${safeFile(stName)}_${secTitle}`;
    const cnt=(usedNames.get(base)||0)+1;usedNames.set(base,cnt);
    const fname=(cnt>1?`${base}_${cnt}`:base)+'.doc';

    const docHtml='\x3Chtml xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
     +'\x3Chead>\x3Cmeta charset="utf-8">\x3Ctitle>'+esc(stName)+' — Writing\x3C/title>'
     +'\x3Cstyle>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;color:#111}h1{font-size:16pt;margin-bottom:4px}h2{font-size:13pt;margin-top:16px;border-bottom:1px solid #999;padding-bottom:3px}.meta{color:#444;margin-bottom:12px}.box{background:#f5f7fa;border:1px solid #cbd5e1;padding:10px;margin:6px 0;white-space:pre-wrap}.ans{border-left:3px solid #1fa463;padding:8px 12px;margin:8px 0;white-space:pre-wrap}table{border-collapse:collapse;width:100%;margin-top:8px}th,td{border:1px solid #999;padding:5px 8px;text-align:left}\x3C/style>'
     +'\x3C/head>\x3Cbody>'
     +'\x3Ch1>TURKISTON LC — IELTS Writing Javoblari\x3C/h1>'
     +'\x3Cdiv class="meta">\x3Cb>Talaba:\x3C/b> '+esc(stName)+' | \x3Cb>Guruh:\x3C/b> '+esc(stGrp)+' | \x3Cb>Mock:\x3C/b> '+esc(mkTitle)+' | \x3Cb>Sana:\x3C/b> '+ts(a.submittedAt||a.startedAt)+' | \x3Cb>Band:\x3C/b> '+(res.band??'Baholanmagan')+'\x3C/div>'
     +'\x3Ch2>Task 1 ('+wc(wa.t1||'')+' so\'z)\x3C/h2>'
     +'\x3Cdiv class="box">\x3Cb>Savol:\x3C/b>\n'+esc(S.t1||'')+'\x3C/div>'
     +'\x3Cdiv class="ans">'+(wa.t1?esc(wa.t1):'\x3Ci>Javob yozilmagan\x3C/i>')+'\x3C/div>'
     +'\x3Ch2>Task 2 ('+wc(wa.t2||'')+' so\'z)\x3C/h2>'
     +'\x3Cdiv class="box">\x3Cb>Savol:\x3C/b>\n'+esc(S.t2||'')+'\x3C/div>'
     +'\x3Cdiv class="ans">'+(wa.t2?esc(wa.t2):'\x3Ci>Javob yozilmagan\x3C/i>')+'\x3C/div>'
     +(F.c?.some(x=>x!=null)?'\x3Ch2>Baholash mezonlari\x3C/h2>\x3Ctable>\x3Ctr>'+CR.map(x=>'\x3Cth>'+esc(x)+'\x3C/th>').join('')+'\x3C/tr>\x3Ctr>'+F.c.map(x=>'\x3Ctd>'+(x??'—')+'\x3C/td>').join('')+'\x3C/tr>\x3C/table>':'')
     +(F.comment?'\x3Ch2>O\'qituvchi izohi\x3C/h2>\x3Cdiv class="box">'+esc(F.comment)+'\x3C/div>':'')
     +'\x3C/body>\x3C/html>';
    zip.file(fname,'\ufeff'+docHtml);
   }
  }else{
   for(const a of items){
    const stName=RD.N[a.uid]||a.uid;
    const stGrp=RD.G[a.uid]||'—';
    const mkTitle=RD.M[a.mockId]?.title||a.mockId;
    const g=grade(a);
    const res=RES[a.id];
    const finalBand=res?.band??g?.bd??'—';
    const base=`${safeFile(stName)}_${secTitle}`;
    const cnt=(usedNames.get(base)||0)+1;usedNames.set(base,cnt);
    const fname=(cnt>1?`${base}_${cnt}`:base)+'.csv';

    const lines=[
     `Talaba,"${stName.replace(/"/g,'""')}"`,
     `Guruh,"${stGrp.replace(/"/g,'""')}"`,
     `Mock,"${mkTitle.replace(/"/g,'""')}"`,
     `Bo'lim,${secTitle}`,
     `Natija,"${g?`${g.c}/${g.tot}`:'—'}"`,
     `Band,${finalBand}`,
     '',
     'Savol #,Talaba javobi,To\'g\'ri javob,Holat'
    ];
    if(g){
     g.rows.forEach(r=>{
      const status=r.blank?'Javobsiz':r.ok?"To'g'ri":"Noto'g'ri";
      lines.push([r.n,r.given||'—',r.key,status].map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','));
     });
    }else{
     const ans=a.answers||{};
     Object.keys(ans).sort((x,y)=>+x-+y).forEach(n=>{
      lines.push([n,ans[n],'—','Kalit topilmadi'].map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','));
     });
    }
    zip.file(fname,'\ufeff'+lines.join('\n'));
   }
  }

  const blob=await zip.generateAsync({type:'blob'});
  const zipName=`IELTS_${secTitle}${grp?'_'+safeFile(grp):'_Barchasi'}.zip`;
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download=zipName;
  link.click();
  log(`Bulk ZIP eksport: ${zipName} (${items.length} ta fayl)`);
 }catch(e){
  alert('ZIP yaratishda xato: '+(e?.message||e));
 }finally{
  if(btn){btn.disabled=false;btn.textContent=orig}
 }
};

/* ---- bitta talaba: Writing / Reading / Listening ---- */
A.stu=async(mid,uid,tab)=>{if(RS.v!='s')RS.back=RS.v;RS.v='s';RS.sm=mid;RS.su=uid;if(tab)RS.tab=tab;
 const aid=t=>uid+'_'+mid+'_'+t,at=t=>ATT[aid(t)],M=RD.M[mid]||{},
  [ws,fb]=await Promise.all([getDoc(doc(db,'sections',mid+'_writing')).catch(()=>null),getDoc(doc(db,'feedback',aid('writing'))).catch(()=>null)]),
  S=ws&&ws.exists()?ws.data():{},F=fb&&fb.exists()?fb.data():{};RS.S=S;
 const wA=at('writing'),wa=wA?.answers||{},
 wp=!wA?"<p class=mut>Bu bo'lim ishlanmagan</p>":`<p class=mut>Holat: ${wA.status=='submitted'?'topshirilgan · '+ts(wA.submittedAt):'jarayonda (hali topshirmagan)'}</p>`+[1,2].map(i=>`<h4>Task ${i} · ${wc(wa['t'+i]||'')} so'z</h4><div class=box><b>Savol</b><div style="white-space:pre-wrap">${esc(S['t'+i])}</div>${i==1&&/^data:image\//.test(S.img||'')?`<img src="${esc(S.img)}" style="max-width:100%;margin-top:8px">`:''}</div><p style="white-space:pre-wrap;border-left:3px solid var(--b);padding-left:12px">${wa['t'+i]?esc(wa['t'+i]):'<i>Yozilmagan</i>'}</p>`).join('')+(wA.status=='submitted'?`<h4>Baholash</h4>${CR.map((x,i)=>`<label>${x}<input class=fc type=number step=.5 min=0 max=9 value="${F.c?.[i]??''}"></label>`).join('')}<textarea id=fcm rows=4 placeholder="Izoh">${esc(F.comment)}</textarea><button onclick="A.saveW('${wA.id}')">Saqlash</button>`:''),
 rp=t=>{const a=at(t);if(!a)return "<p class=mut>Bu bo'lim ishlanmagan</p>";if(a.status!=='submitted')return '<p class=mut>Hali topshirilmagan (jarayonda)</p>';const g=grade(a);if(!g)return '<p class=no>Javob kaliti topilmadi</p>';const r=RES[a.id];
  return `<p>Jami: ${g.tot} · To'g'ri: <b class=ok>${g.c}</b> · Noto'g'ri: <b class=no>${g.w}</b> · Javobsiz: ${g.b} · Band: <b>${r?.band??g.bd}</b>${r?.band==null?' (avtomatik)':''}</p>
  <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap"><label>Band'ni qo'lda o'zgartirish (ixtiyoriy)<input id=ov_${a.id} type=number step=.5 min=0 max=9 value="${r?.manual?r.band:''}"></label><button onclick="A.saveR('${a.id}')">Natijani saqlash va talabaga ko'rsatish</button><button class=s onclick="this.closest('.pn').classList.toggle('all')">To'g'rilarni ko'rsatish / yashirish</button></div>
  ${g.w+g.b==0?"<p class=ok><b>Xato yo'q 🎉</b></p>":''}<table><tr><th>#</th><th>Talaba javobi</th><th>To'g'ri javob</th><th></th></tr>${g.rows.map(x=>`<tr class="${x.ok?'okr':''}"><td>${x.n}</td><td>${esc(x.given||'—')}</td><td>${esc(x.key)}</td><td class="${x.ok?'ok':'no'}">${x.blank?'Javobsiz':x.ok?"To'g'ri":"Noto'g'ri"}</td></tr>`).join('')}</table>`},
 P={writing:wp,reading:rp('reading'),listening:rp('listening')},L={writing:'✍️ Writing',reading:'📖 Reading',listening:'🎧 Listening'},
 sm=SEC.map(t=>sb(at(t))),vals=sm.map(s=>s.band!=null?s.band+(s.auto?'*':''):s.st=='prog'?'Jarayonda':s.st=='wait'?'Baholanmagan':'—'),ob=ovl({S:{listening:at('listening'),reading:at('reading'),writing:at('writing')}});
 pg(`<div class=card><button class=s onclick="A.rb()">← Orqaga</button><h3 style="margin-top:10px">${esc(RD.N[uid]||'—')} · ${esc(M.title)}</h3><p class=mut>${esc(RD.G[uid]||'')}</p><div class=sg>${[['Listening',vals[0]],['Reading',vals[1]],['Writing',vals[2]],['Umumiy',ob??'—']].map(x=>`<div class=sc><small>${x[0]}</small><h2>${x[1]}</h2></div>`).join('')}</div><p style="margin-top:12px"><button onclick="A.pdf(this)">⬇ PDF yuklash (hammasi bitta faylda)</button></p>
 <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${SEC.filter(t=>at(t)).map(t=>`<button class=s onclick="A.retake('${aid(t)}')">🔁 ${t} — qayta ishlashga ruxsat</button>`).join('')}${SEC.map(t=>`<button class=s onclick="A.extra('${uid}','${mid}_${t}')">⏱ ${t} +vaqt</button>`).join('')}</div><div id=hx style="margin-top:12px"></div></div>
 <div class=card><div class=tabs>${['writing','reading','listening'].map(t=>`<a class="${t==RS.tab?'d':''}" onclick="A.pt('${t}')">${L[t]}</a>`).join('')}</div>${['writing','reading','listening'].map(t=>`<div class="pn ${t==RS.tab?'':'hid'}" id=pn_${t}>${P[t]}</div>`).join('')}</div>`);
 A.hist(mid,uid)};

/* ---------- Qayta ishlash huquqi ---------- */
/* Eski urinish "history" kolleksiyasiga arxivlanadi, attempts/results/feedback o'chadi,
   permissions.granted=true qoladi -> talabada yana START tugmasi chiqadi. */
A.retake1=async aid=>{
 const at=ATT[aid];if(!at)return;
 const fb=at.type=='writing'?await getDoc(doc(db,'feedback',aid)).catch(()=>null):null;
 await addDoc(collection(db,'history'),{uid:at.uid,sectionId:at.sectionId,mockId:at.mockId,type:at.type,status:at.status,answers:at.answers||{},startedMs:at.startedAt?.toMillis?.()||null,submittedMs:at.submittedAt?.toMillis?.()||null,result:RES[aid]||null,feedback:fb?.exists()?fb.data():null,archivedAt:serverTimestamp()});
 await deleteDoc(doc(db,'attempts',aid));
 await deleteDoc(doc(db,'results',aid)).catch(()=>{});
 if(fb?.exists())await deleteDoc(doc(db,'feedback',aid)).catch(()=>{});
 await setDoc(doc(db,'permissions',at.uid+'_'+at.sectionId),{uid:at.uid,sectionId:at.sectionId,mockId:at.mockId,granted:true},{merge:true});
 log(`Qayta ishlashga ruxsat: ${RD.N[at.uid]||at.uid} · ${at.sectionId}`);
};
A.retake=async aid=>{
 if(!confirm("Eski urinish arxivga o'tadi va o'quvchi bu bo'limni qaytadan ishlay oladi. Davom etasizmi?"))return;
 try{await A.retake1(aid);await rload();alert("Ruxsat berildi. O'quvchida START tugmasi chiqdi.");A.stu(RS.sm,RS.su)}catch(e){alert('Xato: '+e.message)}
};
A.bulkRetake=async()=>{
 const sec=$('#exSec')?.value||'writing',grp=$('#exGrp')?.value??RS.grp??'';
 const items=RD.A.filter(a=>a.type===sec&&(RS.v!='k'||(a.mockId===RS.mock&&(!RS.date||dkey(a.startedAt)===RS.date)))&&(!grp||norm(RD.G[a.uid]||'')===norm(grp)));
 if(!items.length)return alert('Mos urinish topilmadi');
 if(!confirm(`${items.length} ta ${sec} urinishi arxivlanadi va o'quvchilar qayta ishlay oladi. Davom etasizmi?`))return;
 try{for(const a of items)await A.retake1(a.id);log(`Ommaviy qayta ruxsat: ${sec} (${items.length} ta)`);await rload();rview();alert('Tayyor')}catch(e){alert('Xato: '+e.message)}
};

/* ---------- Qo'shimcha vaqt (individual) ---------- */
A.extra=async(uid,sid)=>{
 const v=prompt("Qo'shimcha vaqt (daqiqa). 0 = olib tashlash:","10");if(v===null)return;
 await setDoc(doc(db,'permissions',uid+'_'+sid),{uid,sectionId:sid,mockId:sid.split('_')[0],granted:true,extra:Math.max(0,+v||0)},{merge:true});
 log(`Qo'shimcha vaqt: ${RD.N[uid]||uid} · ${sid} · ${+v||0} daq`);alert('Saqlandi');
};

/* ---------- Oldingi urinishlar tarixi ---------- */
A.hist=async(mid,uid)=>{const el=$('#hx');if(!el)return;
 const s=await getDocs(query(collection(db,'history'),where('uid','==',uid))).catch(()=>null);
 const h=(s?.docs||[]).map(d=>d.data()).filter(x=>x.mockId==mid).sort((a,b)=>(b.archivedAt?.seconds||0)-(a.archivedAt?.seconds||0));
 if(!h.length)return;
 el.innerHTML=`<h4>Oldingi urinishlar</h4><table><tr><th>Bo'lim</th><th>Boshlangan</th><th>Band</th><th>Javoblar soni</th><th>Arxivlangan</th></tr>${h.map(x=>`<tr><td>${esc(x.type)}</td><td>${x.startedMs?new Date(x.startedMs).toLocaleString('uz'):'—'}</td><td>${x.result?.band??'—'}</td><td>${Object.keys(x.answers||{}).length}</td><td>${ts(x.archivedAt)}</td></tr>`).join('')}</table>`};

A.saveR=async aid=>{const at=ATT[aid],g=grade(at),ov=$('#ov_'+aid).value;if(!g)return alert('Javob kaliti topilmadi');
 const o={uid:at.uid,sectionId:at.sectionId,mockId:at.mockId,type:at.type,correct:g.c,wrong:g.w,blank:g.b,total:g.tot,raw:g.c,band:ov!==''?+ov:g.bd,manual:ov!=='',t:serverTimestamp()};
 await setDoc(doc(db,'results',aid),o);RES[aid]=o;log('Natija saqlandi: '+aid);alert("Saqlandi — natija talabaga ko'rinadi");A.stu(RS.sm,RS.su)};
A.saveW=async aid=>{const at=ATT[aid],c=[...document.querySelectorAll('.fc')].map(x=>x.value===''?null:+x.value),v=c.filter(x=>x!=null),avg=v.length==4?Math.round(v.reduce((x,y)=>x+y,0)/4*2)/2:null;
 await setDoc(doc(db,'feedback',aid),{uid:at.uid,c,comment:$('#fcm').value});
 if(avg!=null){const o={uid:at.uid,sectionId:at.sectionId,mockId:at.mockId,type:'writing',band:avg,manual:true};await setDoc(doc(db,'results',aid),o);RES[aid]=o}
 log('Writing baholandi: '+aid);alert('Saqlandi'+(avg!=null?' · Writing band: '+avg:" · (band hisoblanishi uchun 4 ta mezonni ham to'ldiring)"));A.stu(RS.sm,RS.su)};
A.pdf=async btn=>{const mid=RS.sm,uid=RS.su,M=RD.M[mid]||{},S=RS.S||{},nm=RD.N[uid]||'',at=t=>ATT[uid+'_'+mid+'_'+t];
 const fc=[...document.querySelectorAll('.fc')].map(x=>x.value),cm=$('#fcm')?.value||'',wl=fc.length==4&&fc.every(x=>x!=='')?Math.round(fc.reduce((x,y)=>x+ +y,0)/4*2)/2:null;
 const sl=sb(at('listening')),sr=sb(at('reading')),sw=sb(at('writing')),wb=wl??sw.band,bs=[sl.band,sr.band,wb],ob=bs.every(x=>x!=null)?Math.round(bs.reduce((x,y)=>x+y)/3*2)/2:null;
 const gt=t=>{const a=at(t);if(!a)return "<p>Bu bo'lim ishlanmagan.</p>";if(a.status!=='submitted')return '<p>Topshirilmagan.</p>';const g=grade(a);if(!g)return '';const w=g.rows.filter(x=>!x.ok);
  return `<p>Jami: ${g.tot} · To'g'ri: ${g.c} · Noto'g'ri: ${g.w} · Javobsiz: ${g.b}</p>`+(w.length?`<table><tr><th>#</th><th>Sizning javobingiz</th><th>To'g'ri javob</th></tr>${w.map(x=>`<tr><td>${x.n}</td><td>${esc(x.given||'—')}</td><td>${esc(x.key)}</td></tr>`).join('')}</table>`:"<p>Xato yo'q 🎉</p>")};
 const wA=at('writing'),wa=wA?.answers||{},
 wt=!wA?"<p>Bu bo'lim ishlanmagan.</p>":[1,2].map(i=>`<h3>Task ${i} (${wc(wa['t'+i]||'')} so'z)</h3><div class=tx><b>Savol:</b>\n${esc(S['t'+i])}${i==1&&/^data:image\//.test(S.img||'')?`<br><img src="${esc(S.img)}" style="max-width:100%;margin-top:6px">`:''}</div><div class=tx>${wa['t'+i]?esc(wa['t'+i]):'<i>Yozilmagan</i>'}</div>`).join('')+(fc.some(x=>x!=='')?`<table><tr>${CR.map(x=>`<th>${x}</th>`).join('')}</tr><tr>${fc.map(x=>`<td>${esc(x)||'—'}</td>`).join('')}</tr></table>`:'')+(cm?`<h3>O'qituvchi izohi</h3><div class=tx>${esc(cm)}</div>`:'');
 const H=`<div class=hd><img src="${LOGO}" alt=""><div><h1>TURKISTON LC</h1><div>IELTS Mock natijasi</div></div></div><h2>${esc(nm)}</h2><p>Guruh: ${esc(RD.G[uid]||'—')} · Mock: ${esc(M.title||'')}${M.date?' · '+fd(M.date):''}</p><table><tr><th>Listening</th><th>Reading</th><th>Writing</th><th>Umumiy</th></tr><tr><td>${sl.band??'—'}</td><td>${sr.band??'—'}</td><td>${wb??'—'}</td><td><b>${ob??'—'}</b></td></tr></table><h2>Writing</h2>${wt}<h2>Reading — xatolar</h2>${gt('reading')}<h2>Listening — xatolar</h2>${gt('listening')}`;
 const fn=('Natija - '+nm+' - '+(M.title||'mock')).replace(/[\\/:*?"<>|]+/g,' ').trim()+'.pdf',
 pr=()=>{const d=document.createElement('div');d.id='rep';d.className='rp';d.innerHTML=H;document.body.append(d);const t0=document.title;document.title=fn.replace(/\.pdf$/,'');const fin=()=>{d.remove();document.title=t0;removeEventListener('afterprint',fin)};addEventListener('afterprint',fin);setTimeout(()=>window.print(),100)},
 lb=()=>window.html2pdf?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';s.onload=ok;s.onerror=no;document.head.append(s)}),
 t0=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='PDF tayyorlanmoqda…'}
 try{await lb();const el=document.createElement('div');el.className='rp';el.style.cssText='width:720px;background:#fff;color:#000;font:13px/1.5 Arial,sans-serif';el.innerHTML=H;
  await Promise.all([...el.querySelectorAll('img')].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
  await window.html2pdf().set({margin:[10,10,10,10],filename:fn,image:{type:'jpeg',quality:.95},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],avoid:['tr','h2','h3']}}).from(el).save()}
 catch(e){alert("PDF yaratib bo'lmadi ("+(e?.message||'internet yoki kutubxona xatosi')+"). Chop etish oynasi ochiladi — u yerda 'PDF sifatida saqlash' ni tanlang.");pr()}
 finally{if(btn){btn.disabled=false;btn.textContent=t0}}};
A.csv=()=>{const r=RS.cur||[],val=at=>{const s=sb(at);return s.band!=null?s.band:s.st=='prog'?'Jarayonda':s.st=='wait'?'Baholanmagan':''};
 const l=['Talaba,Guruh,Mock,Sana,Listening,Reading,Writing,Umumiy',...r.map(g=>[RD.N[g.uid],RD.G[g.uid],RD.M[g.mockId]?.title,fd(g.d),...SEC.map(t=>val(g.S[t])),ovl(g)??''].map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','))].join('\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+l],{type:'text/csv'}));a.download='natijalar.csv';a.click()};
