const enc=new TextEncoder();let keyCache=null,keyUntil=0;
const fail=()=>{throw Object.assign(Error('Authentication required'),{status:401});};
const un64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export async function authenticate(request,env){
 const token=request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)fail();
 if(env.LOCAL_TEST_MODE===true&&env.verifyLocal){const identity=await env.verifyLocal(token);if(identity)return identity;fail();}
 try{
  const parts=token.split('.');if(parts.length!==3)fail();const head=JSON.parse(new TextDecoder().decode(un64(parts[0]))),claim=JSON.parse(new TextDecoder().decode(un64(parts[1]))),now=Date.now()/1000;
  if(head.alg!=='RS256'||!head.kid||claim.aud!=='opjcc-management-system'||claim.iss!=='https://securetoken.google.com/opjcc-management-system'||typeof claim.sub!=='string'||!claim.sub||claim.sub.length>128||!Number.isFinite(claim.exp)||claim.exp<=now||!Number.isFinite(claim.iat)||claim.iat>now+30||!Number.isFinite(claim.auth_time)||claim.auth_time>now+30)fail();
  if(!keyCache||Date.now()>keyUntil){const r=await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');if(!r.ok)fail();keyCache=await r.json();keyUntil=Date.now()+Math.min(3600,Number(/max-age=(\d+)/.exec(r.headers.get('cache-control')||'')?.[1]||300))*1000;}
  const jwk=keyCache.keys.find(k=>k.kid===head.kid);if(!jwk)fail();const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,un64(parts[2]),enc.encode(parts[0]+'.'+parts[1])))fail();
  // Roles are never accepted from the token/client. Provision only after approved master sync.
  const principal=await env.DB.prepare('SELECT uid,role FROM principals WHERE uid=? AND enabled=1').bind(claim.sub).first();if(!principal)throw Object.assign(Error('Master synchronization not authorized/configured'),{status:403});return principal;
 }catch(e){if(e.status)throw e;fail();}
}
