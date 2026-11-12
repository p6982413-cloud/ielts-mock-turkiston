// Firebase o'rniga: shu nomdagi funksiyalar Netlify Function (/api) bilan ishlaydi
const K='tk';let tok=localStorage.getItem(K),subs=[];
const dec=()=>{try{const p=JSON.parse(atob(tok.split('.')[0]));return p.exp>Date.now()?p:null}catch{return null}};
const auth={get currentUser(){const p=dec();return p&&{uid:p.uid,admin:!!p.adm}}};
const fire=()=>subs.forEach(f=>f(auth.currentUser));
const out=()=>{tok=null;localStorage.removeItem(K)};
async function api(op,b={}){
  const r=await fetch('/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({op,tok,...b})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){if(r.status==401&&tok){out();fire()}throw Object.assign(new Error(j.error||'Xato'),{code:r.status})}
  return j}
const rv=d=>{if(d)for(const k in d){const m=d[k]?.__ts;if(m)d[k]={seconds:m/1e3|0,toMillis:()=>m,toDate:()=>new Date(m)}}return d};
const snap=(id,d)=>({id,exists:()=>d!=null,data:()=>d});
export const getAuth=()=>auth;
export const serverTimestamp=()=>({__st:1});
export const collection=(_,c)=>({c});
export const doc=(_,c,id)=>({c,id});
export const where=(f,o,v)=>[f,o,v];
export const query=(r,...w)=>({...r,w});
export const getDoc=async r=>{const j=await api('get',r);return snap(r.id,j.d?rv(j.d):null)};
export const getDocs=async q=>{const j=await api('list',{c:q.c,w:q.w||[]});const docs=j.docs.map(x=>snap(x.id,rv(x.d)));return{docs,size:docs.length,forEach:f=>docs.forEach(f)}};
export const setDoc=(r,d)=>api('set',{...r,d});
export const updateDoc=(r,d)=>api('update',{...r,d});
export const deleteDoc=r=>api('del',r);
export const addDoc=async(r,d)=>({id:(await api('add',{c:r.c,d})).id});
export const signInWithEmailAndPassword=async(_,email,password)=>{const j=await api('login',{email,password});tok=j.tok;localStorage.setItem(K,tok);fire()};
export const signOut=async a=>{if(a===auth){out();fire()}};
export const createUserWithEmailAndPassword=async(_,email,password)=>({user:{uid:(await api('mkuser',{email,password})).uid}});
export const onAuthStateChanged=(a,f)=>{subs.push(f);setTimeout(()=>f(auth.currentUser))};
