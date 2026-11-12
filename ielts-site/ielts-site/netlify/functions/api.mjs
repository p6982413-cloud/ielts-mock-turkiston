import {getStore} from '@netlify/blobs';
import {createHmac,randomBytes,scryptSync,timingSafeEqual,randomUUID} from 'node:crypto';
const E=process.env,DOM='@ielts-mock.uz',KEY=E.ADMIN_PASSWORD||'',TTL=432e5;
const COLS=['students','mocks','keys','settings','log','permissions','sections','attempts','results','feedback'];
const J=(o,s=200)=>Response.json(o,{status:s}),NO=()=>J({error:'Ruxsat yo\'q'},403);
const hm=b=>createHmac('sha256',KEY).update(b).digest('hex');
const sign=p=>{const b=Buffer.from(JSON.stringify(p)).toString('base64');return b+'.'+hm(b)};
const verify=t=>{try{const[b,h]=t.split('.');if(!KEY||!timingSafeEqual(Buffer.from(h),Buffer.from(hm(b))))return null;const p=JSON.parse(Buffer.from(b,'base64'));return p.exp>Date.now()?p:null}catch{return null}};
const eq=(a,b)=>{a=Buffer.from(String(a));b=Buffer.from(String(b));return a.length==b.length&&timingSafeEqual(a,b)};
const hash=(pw,salt)=>scryptSync(String(pw),salt,32).toString('hex');
const T=d=>{for(const k in d)if(d[k]?.__st)d[k]={__ts:Date.now()};return d};

export default async req=>{
 if(req.method!='POST')return J({error:'POST'},405);
 const b=await req.json().catch(()=>({})),s=getStore({name:'db',consistency:'strong'}),{op,c,id}=b;
 const get=(c,i)=>s.get(c+'/'+i,{type:'json'}),put=(c,i,d)=>s.setJSON(c+'/'+i,d);

 if(op=='login'){const em=String(b.email||'').trim().toLowerCase();
  if(E.ADMIN_EMAIL&&KEY&&eq(em,E.ADMIN_EMAIL.trim().toLowerCase())&&eq(b.password||'',KEY))return J({tok:sign({uid:'admin',adm:1,exp:Date.now()+TTL})});
  const u=await s.get('users/'+em,{type:'json'});
  if(u&&eq(hash(b.password||'',u.salt),u.hash))return J({tok:sign({uid:u.uid,exp:Date.now()+TTL})});
  return J({error:'bad'},401)}

 const p=verify(b.tok||'');if(!p)return J({error:'auth'},401);
 const adm=!!p.adm,me=p.uid;
 if(!adm){const st=await get('students',me);if(!st?.active)return NO()}

 if(op=='mkuser'){if(!adm)return NO();const em=String(b.email||'').trim().toLowerCase();
  if(await s.get('users/'+em))return J({error:'Bu login band'},409);
  const uid=randomUUID(),salt=randomBytes(16).toString('hex');
  await s.setJSON('users/'+em,{uid,salt,hash:hash(b.password,salt)});return J({uid})}

 if(!COLS.includes(c)||(id&&!/^[\w.@-]+$/.test(id)))return J({error:'Noto\'g\'ri so\'rov'},400);
 const can=async(i,d)=>adm||(c=='students'?i==me:c=='mocks'?true:c=='permissions'?d.uid==me
   :c=='sections'?!!await get('attempts',me+'_'+i):['attempts','results','feedback'].includes(c)&&d.uid==me);

 if(op=='get'){const d=await get(c,id);if(d&&!await can(id,d))return NO();return J({d})}
 if(op=='list'){const {blobs}=await s.list({prefix:c+'/'}),docs=[];
  await Promise.all(blobs.map(async x=>{const i=x.key.slice(c.length+1),d=await s.get(x.key,{type:'json'});
   if(d&&(b.w||[]).every(([f,,v])=>d[f]===v)&&await can(i,d))docs.push({id:i,d})}));return J({docs})}

 if(!['add','set','update','del'].includes(op))return J({error:'op'},400);
 const cur=id?await get(c,id):null,d=T(b.d||{});
 if(!adm){ // talaba faqat o'z attempt'ini boshlay/yangilay oladi (Firestore qoidalari bilan bir xil)
  if(c!='attempts')return NO();
  if(op=='set'){const pm=await get('permissions',id);
   if(cur||d.uid!=me||id!=me+'_'+d.sectionId||d.status!='in_progress'||Object.keys(d.answers||{}).length||!pm?.granted)return NO();
   d.startedAt={__ts:Date.now()};await put(c,id,d);return J({ok:1})}
  if(op=='update'){
   if(!cur||cur.uid!=me||cur.status!='in_progress'||Date.now()>cur.startedAt.__ts+361e4)return NO();
   if(!Object.keys(d).every(k=>['answers','status','submittedAt'].includes(k))||!['in_progress','submitted'].includes(d.status||cur.status))return NO();
   if(d.status=='submitted')d.submittedAt={__ts:Date.now()};else delete d.submittedAt;
   await put(c,id,{...cur,...d});return J({ok:1})}
  return NO()}
 if(op=='add'){const n=randomUUID().slice(0,20);await put(c,n,d);return J({id:n})}
 if(op=='set')await put(c,id,d);
 if(op=='update')await put(c,id,{...cur,...d});
 if(op=='del'){await s.delete(c+'/'+id);if(c=='students'&&cur?.login)await s.delete('users/'+cur.login+DOM)}
 return J({ok:1})};
export const config={path:'/api'};
