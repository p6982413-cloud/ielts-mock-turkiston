import {getStore} from '@netlify/blobs';
import {createHmac,timingSafeEqual} from 'node:crypto';
const KEY=process.env.ADMIN_PASSWORD||'',CH=3<<20,hm=b=>createHmac('sha256',KEY).update(b).digest('hex');
const verify=t=>{try{const[b,h]=t.split('.');if(!KEY||!timingSafeEqual(Buffer.from(h),Buffer.from(hm(b))))return null;const p=JSON.parse(Buffer.from(b,'base64'));return p.exp>Date.now()?p:null}catch{return null}};
const R=(s,c=200)=>new Response(s,{status:c});
export default async req=>{
 const u=new URL(req.url),id=u.pathname.split('/')[2]||'',q=u.searchParams,s=getStore({name:'media',consistency:'strong'});
 if(!/^[\w-]{8,64}$/.test(id))return R('bad',400);
 const p=verify((req.headers.get('authorization')||'').replace(/^Bearer /,'')||q.get('t')||'');if(!p)return R('auth',401);
 if(req.method=='GET'){
  if(!p.adm){const st=await getStore({name:'db',consistency:'strong'}).get('students/'+p.uid,{type:'json'});if(!st?.active)return R('no',403)}
  const m=await s.get(id+'/meta',{type:'json'});if(!m)return R('404',404);
  const r=/bytes=(\d*)-(\d*)/.exec(req.headers.get('range')||''),a=r&&r[1]?+r[1]:0;
  if(a>=m.size)return new Response('',{status:416,headers:{'content-range':'bytes */'+m.size}});
  const b=Math.min(r&&r[2]?+r[2]:m.size-1,m.size-1,a+CH-1),c0=Math.floor(a/CH),parts=[];
  for(let i=c0;i<=Math.floor(b/CH);i++)parts.push(Buffer.from(await s.get(`${id}/${i}`,{type:'arrayBuffer'})));
  const buf=Buffer.concat(parts).subarray(a-c0*CH,b-c0*CH+1);
  return new Response(buf,{status:206,headers:{'content-type':m.type,'accept-ranges':'bytes','content-range':`bytes ${a}-${b}/${m.size}`,'cache-control':'private, max-age=3600'}})}
 if(!p.adm)return R('no',403);
 if(req.method=='DELETE'){const{blobs}=await s.list({prefix:id+'/'});await Promise.all(blobs.map(x=>s.delete(x.key)));return Response.json({ok:1})}
 if(req.method=='POST'){if(q.get('done'))await s.setJSON(id+'/meta',{size:+q.get('size'),chunks:+q.get('chunks'),type:q.get('type')||'audio/mpeg'});else await s.set(`${id}/${+q.get('i')}`,await req.arrayBuffer());return Response.json({ok:1})}
 return R('',405)};
export const config={path:['/media/*']};
