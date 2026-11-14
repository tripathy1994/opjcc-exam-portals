import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{createRequire}from'node:module';import{analyze}from'../tools/analyze-source.mjs';
const require=createRequire(import.meta.url),P=require('../tools/vendor/parse5'),root=path.resolve(import.meta.dirname,'..'),baseline='E:/OPJCC_LOCKED_RECOVERY_20261114_005807';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex').toUpperCase();
const sdk=new Set(['collection','doc','getDoc','getDocFromServer','getDocs','getDocsFromServer','setDoc','updateDoc','addDoc','deleteDoc','query','where','limit','serverTimestamp','arrayUnion','onSnapshot','writeBatch','runTransaction','deleteField']);
const editsReport={baseline,createdAt:new Date().toISOString(),roles:{}};
function walk(n,fn,parent=null,key=null){if(!n||typeof n!=='object')return;fn(n,parent,key);for(const[k,v]of Object.entries(n)){if(Array.isArray(v))v.forEach(x=>walk(x,fn,n,k));else if(v&&typeof v==='object')walk(v,fn,n,k);}}
function transport(unit){const edits=new Map();walk(unit.node,(n,p,k)=>{if(n.type!=='Identifier'||!sdk.has(n.name)&&n.name!=='cloud')return;const name=n.name==='cloud'?'uploadExamImage':n.name;if(p?.type==='CallExpression'&&p.callee===n)edits.set(n.start,{start:n.start,end:n.end,text:'EX.'+name});if(p?.type==='Property'&&p.shorthand&&p.value===n)edits.set(n.start,{start:n.start,end:n.end,text:n.name+':EX.'+name});});let text=unit.text;for(const e of [...edits.values()].sort((a,b)=>b.start-a.start))text=text.slice(0,e.start-unit.node.start)+e.text+text.slice(e.end-unit.node.start);return text;}
function nodeById(html,id){let found;function scan(n){if(n.attrs?.some(a=>a.name==='id'&&a.value===id))found=n;for(const c of n.childNodes||[])scan(c);}scan(P.parse(html,{sourceCodeLocationInfo:true}));if(!found?.sourceCodeLocation)throw Error('Missing '+id);return found.sourceCodeLocation;}
for(const role of['teacher','student']){
 const source=path.join(baseline,role==='teacher'?'Teacher':'Student',role+'-public'),out=root+'/public/staging/'+role;fs.mkdirSync(out,{recursive:true});fs.cpSync(source,out,{recursive:true});
 const a=analyze(source+'/index.html'),changes=[],allowed=new Set();const first=a.units.findIndex(u=>role==='teacher'?u.name==='txUpdateImportButton':u.name.startsWith('SX_EXAMS')),last=a.units.findIndex(u=>role==='teacher'?u.name==='window.txPublishGrade':u.name==='sxAnswerSignal');
 const reference=root+'/references/locked-baseline/'+role;fs.mkdirSync(reference,{recursive:true});fs.copyFileSync(source+'/index.html',reference+'/index.html');fs.copyFileSync(path.join(source,'..','firebase.json'),reference+'/firebase.json');
 for(const u of a.units.slice(first,last+1)){
  if(u.node.type==='ImportDeclaration')continue;let text=transport(u);
  if(role==='teacher'){
   if(u.name==='txAIRequest')text=`async function txAIRequest(){throw Error('AI integration BLOCKED: protected Worker compatibility for this isolated staging origin is unverified. No request sent.');}`;
   if(u.name==='txRenderMonitor')text=`function txRenderMonitor(){const root=document.getElementById('opjcc-warning-monitor');if(!root)return;OMON??=createWarningMonitor({root,api:EX.examAPI});OMON.refresh();}`;
   if(u.name==='txWallConnect')text=`async function txWallConnect(){throw Error('Continuous live camera streaming is disabled in this staging candidate.');}`;
   if(u.name==='txViewLive')text=`async function txViewLive(id){txTab('monitor');OMON?.selectAttempt(id);}`;
  }else{
   if(u.name==='sxSignals')text=`function sxSignals(){} // No continuous streaming; on-device AI remains unchanged.`;
   if(u.name==='sxAnswerSignal')text=`async function sxAnswerSignal(){throw Error('Continuous streaming disabled');}`;
   if(u.name==='sxBegin'){text=text.replace(/sxServerConfirmed=true;SX_ACTIVE\.attempt=\{id,\.\.\.\(existing\|\|\{\}\)[\s\S]*?expiresAtMs:SX_RUNTIME_EXPIRES_AT\};/,`const receipt=await EX.getDocFromServer(EX.doc(db,'examAttempts',id));if(!receipt.exists())throw Error('Server attempt receipt unavailable');sxServerConfirmed=true;SX_ACTIVE.attempt={id,...receipt.data()};SX_RUNTIME_EXPIRES_AT=Number(SX_ACTIVE.attempt.expiresAtMs);`).replace('Firestore did not authorize this start/resume.','The examination API did not authorize this start/resume.');}
   if(u.name==='sxAnswerState')text=text.replace('{','{EX.reportSyncState(SX_ACTIVE?.attempt?.id,state);');
   if(u.name==='sxHeartbeat')text=text.replace('const send=()=>',`const send=()=>{EX.reportAIState(SX_ACTIVE?.attempt?.id,SX_ANDROID_RUNTIME?(SX_ANDROID_RUNTIME.closed?'stopped':SX_ANDROID_RUNTIME.running&&SX_ANDROID_RUNTIME.stats.frames>0?'active':'initializing'):SX_FACE_TIMER&&SX_FACE_LANDMARKER?'active':SX_STREAM?'initializing':'stopped');return `).replace('.catch(()=>{});send();','.catch(()=>{});};send();');
  }
  if(text!==u.text){changes.push({start:u.start,end:u.end,text,name:u.name});allowed.add(u.name);}
 }
 // The AnswerStore callback parameter name is read from the locked source, not guessed.
 if(role==='student'){const change=changes.find(c=>c.name==='sxAnswerState');if(change){const original=a.units.find(u=>u.name==='sxAnswerState');const param=original.node.params[0].name;change.text=change.text.replace('?.id,state);',`?.id,${param});`);}}
 fs.writeFileSync(out+'/exam-transport-config.js',`// No cloud endpoint enabled. Set only after new-account verification and staging approval.\nexport const EXAM_API_BASE='';\n`);
 let setup=`\nimport * as EX from '../../shared/store.js';\nimport{EXAM_API_BASE}from './exam-transport-config.js';\nEX.configureExamIdentity(()=>me);EX.configureExamEndpoint(EXAM_API_BASE);\n`;
 if(role==='teacher')setup+=`import{createWarningMonitor}from '../../shared/warning-monitor.js';let OMON=null;\n`;
 changes.push({start:a.main.offset,end:a.main.offset,text:setup,name:'Live Exam API integration import'});
 // Fixture hook is loopback-only, explicitly requested test mode, and does NOT authenticate
 // the API or modify original Authentication handlers. Server still verifies synthetic token.
 const fixture=`\nif(location.hostname==='127.0.0.1'&&new URLSearchParams(location.search).get('localFixture')==='1'){window.OPJCC_LOCAL_EXAM_FIXTURE=async()=>{const s=await EX.examAPI('session');me={...s.user,getIdToken:async()=>sessionStorage.getItem('opjcc-exam-local-token')};p=s.profile;${role==='teacher'?"cl=s.classes.map(x=>({id:x.id,...x.data}));students=s.students.map(x=>({id:x.id,...x.data}));txStart();txFillSelects();":"en=s.enrollments.map(x=>({id:x.id,...x.data}));sxStart();"}return s.user;};}\n`;
 changes.push({start:a.main.location.endTag.startOffset,end:a.main.location.endTag.startOffset,text:fixture,name:'Loopback synthetic exam fixture hook'});
 if(role==='teacher'){
  const loc=nodeById(a.html,'txMonitor');changes.push({start:loc.startTag.endOffset,end:loc.endTag.startOffset,text:'\n<div id="opjcc-warning-monitor"></div>\n',name:'Teacher Live Exam monitoring panel'});
  const before=a.html.indexOf('</head>');changes.push({start:before,end:before,text:'<link rel="stylesheet" href="../../shared/warning-monitor.css">\n',name:'Scoped Live Exam monitoring stylesheet'});
 }
 changes.sort((x,y)=>y.start-x.start);let html=a.html;for(const c of changes)html=html.slice(0,c.start)+c.text+html.slice(c.end);fs.writeFileSync(out+'/index.html',html);
 // Exact inverse proves bytes outside declared Live Exam edit ranges are untouched.
 let restored=html;const ordered=[...changes].sort((x,y)=>x.start-y.start);let delta=0;for(const c of ordered){c.outputStart=c.start+delta;delta+=c.text.length-(c.end-c.start);}for(const c of [...ordered].reverse())restored=restored.slice(0,c.outputStart)+a.html.slice(c.start,c.end)+restored.slice(c.outputStart+c.text.length);
 if(restored!==a.html)throw Error('Protected byte verification failed for '+role);
 const after=analyze(out+'/index.html'),unchanged=a.units.filter(u=>!allowed.has(u.name)).filter(u=>!['expression CallExpression','expression ChainExpression','BlockStatement','IfStatement'].includes(u.name)).map(u=>({name:u.name,pass:after.units.some(v=>v.name===u.name&&v.text===u.text)}));
 if(unchanged.some(u=>!u.pass))throw Error('Non-exam unit changed: '+JSON.stringify(unchanged.filter(u=>!u.pass)));
 const otherFiles=[];for(const rel of fs.readdirSync(source,{recursive:true})){const file=path.join(source,rel);if(rel==='index.html'||!fs.statSync(file).isFile())continue;const good=hash(fs.readFileSync(file))===hash(fs.readFileSync(path.join(out,rel)));if(!good)throw Error('Protected asset changed');otherFiles.push({file:rel,unchanged:true});}
 editsReport.roles[role]={originalHTML:hash(fs.readFileSync(source+'/index.html')),stagingHTML:hash(fs.readFileSync(out+'/index.html')),outsideAllowedRangesIdentical:true,unchangedNamedUnits:unchanged.length,protectedNonExamUnits:a.units.filter(u=>u.start<a.units[first].start||u.end>a.units[last].end).length,allOtherFilesUnchanged:otherFiles,edits:ordered.map(c=>({name:c.name,originalStart:c.start,originalEnd:c.end,outputStart:c.outputStart,oldSHA256:hash(a.html.slice(c.start,c.end)),newSHA256:hash(c.text)}))};
}
fs.writeFileSync(root+'/docs/integrated/PROTECTED_CHANGE_REPORT.json',JSON.stringify(editsReport,null,2));console.log(JSON.stringify(Object.fromEntries(Object.entries(editsReport.roles).map(([r,d])=>[r,{protectedBytesIdentical:d.outsideAllowedRangesIdentical,protectedNonExamUnits:d.protectedNonExamUnits,unchangedFiles:d.allOtherFilesUnchanged.length,examEdits:d.edits.length}]))));
