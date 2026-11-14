export const session={token:sessionStorage.getItem('opjcc-exam-local-token')||'',user:null};
let identityProvider=null;
export function configureExamIdentity(provider){identityProvider=provider;}
let apiBase='/api/';
export function configureExamEndpoint(value){if(!value){apiBase='/api/';return;}const url=new URL(value);if(url.protocol!=='https:'||!url.hostname.endsWith('.himansu-iot.workers.dev')||url.pathname!=='/api/'||url.username||url.password||url.search||url.hash)throw Error('Only a verified dedicated-account HTTPS examination API may be configured');apiBase=url.href;}
export async function api(route,body){const identity=identityProvider?.(),token=identity?.getIdToken?await identity.getIdToken():session.token;const response=await fetch(apiBase+route,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await response.json();if(!response.ok)throw Object.assign(Error(data.error||'Request failed'),{status:response.status,code:data.code});return data;}
export async function cloud(file,folder){
 // Existing production preset is deliberately NOT reused before privacy approval.
 if(!['127.0.0.1','localhost'].includes(location.hostname))throw Error('Photo storage BLOCKED pending private delivery approval');if(!file.type.startsWith('image/')||file.size>500000)throw Error('Local synthetic selfie must be an image below 500 KB');
 return {secure_url:await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);})};
}
export async function bootstrap(role,ready){
 const login=document.getElementById('demoLogin'),logout=document.getElementById('logout');
 login.onclick=async()=>{try{const student=role==='student'?Number(prompt('Synthetic student number (1–50)','1')):1;const result=await api('local-login',{role,student});sessionStorage.setItem('opjcc-exam-local-token',result.token);location.reload();}catch(e){alert(e.message);}};
 logout.onclick=()=>{sessionStorage.removeItem('opjcc-exam-local-token');location.reload();};
 if(!session.token){document.getElementById('app').hidden=true;return;}
 try{const state=await api('session');if(state.user.role!==role)throw Error('Sign out and choose the matching synthetic role');session.user=state.user;state.user.getIdToken=async()=>session.token;state.classes=state.classes.map(x=>({id:x.id,...x.data}));state.students=state.students.map(x=>({id:x.id,...x.data}));state.enrollments=state.enrollments.map(x=>({id:x.id,...x.data}));login.hidden=true;await ready(state);}catch(e){document.getElementById('integrationStatus').textContent=e.message;document.getElementById('app').hidden=true;}
}
