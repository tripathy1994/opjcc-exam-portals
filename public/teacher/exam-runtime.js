import{session,api,cloud,bootstrap}from '../shared/session.js';
import{getFirestore,collection,doc,getDoc,getDocs,setDoc,updateDoc,addDoc,deleteDoc,query,where,serverTimestamp,arrayUnion,onSnapshot,writeBatch,runTransaction,getDocFromServer,getDocsFromServer,limit,deleteField}from "../shared/store.js";
const db={};let me=null,p={},cl=[],students=[],en=[];const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const toast=msg=>alert(msg);const refreshTeacherDashboardV2=()=>{};const updateStudentLiveExamDashboard=()=>{};const getTeacherActiveClasses=()=>cl;const auth={};const onAuthStateChanged=()=>()=>{};
import * as EA from "./exam-authoring.js";
import{diagramProjection as v35DiagramProjection,assertDiagramBudget as v35DiagramBudget}from'./exam-diagram.js';
import{diagramMarkup,diagramProjection,assertDiagramBudget}from './exam-diagram.js';
function normProjectName(v){v=String(v||"").trim();return /^jindal\s*csr$/i.test(v)?"Jindal Foundation":v}
function normProjectList(arr){return [...new Set((Array.isArray(arr)?arr:[]).map(normProjectName).filter(Boolean))]}
const day=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
function teacherClassTrade(c){
  const raw=String(c?.trade||c?.department||c?.subject||"").trim();
  if(raw.includes("@"))return String(p?.department||p?.trade||"").trim()||raw;
  return raw;
}
function teacherClassKey(c){
  return [
    String(c.projectType||"").trim().toLowerCase(),
    String(teacherClassTrade(c)||"").trim().toLowerCase(),
    String(c.className||"").trim().toLowerCase()
  ].join("||");
}
function teacherUniqueClasses(rows){
  const groups=new Map();
  for(const c of rows){
    const k=teacherClassKey(c);
    if(!groups.has(k))groups.set(k,[]);
    groups.get(k).push(c);
  }
  const out=[];
  for(const arr of groups.values()){
    arr.sort((a,b)=>{
      const sa=Number(a._activeStudentCount||0),sb=Number(b._activeStudentCount||0);
      if(sb!==sa)return sb-sa;
      const ca=Number(a.studentCapacity||0),cb=Number(b.studentCapacity||0);
      if(cb!==ca)return cb-ca;
      const ta=a.createdAt?.seconds||0,tb=b.createdAt?.seconds||0;
      return ta-tb;
    });
    const primary=arr[0];
    primary._duplicateIds=arr.slice(1).map(x=>x.id);
    primary._duplicateCount=primary._duplicateIds.length;
    primary._allIds=arr.map(x=>x.id);
    primary._effectiveCapacity=Math.max(0,...arr.map(x=>Number(x.studentCapacity||0)));
    if(primary._effectiveCapacity)primary.studentCapacity=primary._effectiveCapacity;
    out.push(primary);
  }
  return out;
}
function safeFileName(v){return String(v||"Outdoor_Duty").replace(/[^a-z0-9_-]+/gi,"_").replace(/^_+|_+$/g,"")||"Outdoor_Duty"}

function txUpdateImportButton(){const v=$('txPDFText')?.value||'';if($('txImportPDF'))$('txImportPDF').disabled=!v.trim();}
function txLooksDamagedHindi(text){const s=String(text||'');const dev=(s.match(/[\u0900-\u097F]/g)||[]).length;if(dev<30)return false;const breaks=(s.match(/[\u0900-\u097F]\s+[\u093E-\u094D]/g)||[]).length;const isolated=(s.match(/(?:^|\s)[\u0900-\u097F](?=\s)/gm)||[]).length;return breaks>=3||isolated>=Math.max(8,Math.floor(dev*.09));}
function txRandomPick(source,count){
 if(!Array.isArray(source)||!Number.isInteger(count)||count<0||count>source.length)throw Error('Invalid random selection count.');
 if(!globalThis.crypto?.getRandomValues)throw Error('Secure random selection unavailable on this browser.');
 const a=source.map(q=>structuredClone(q));
 for(let i=a.length-1;i>0;i--){const x=new Uint32Array(1);crypto.getRandomValues(x);const j=x[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}
 return a.slice(0,count);
}
async function txRegeneratePreviewOne(pv,index,button){
 if(TX_PREVIEW!==pv||pv.kind!=='generate')return toast('Only active AI draft preview can be regenerated.');
 const original=pv.rows[index];if(!original)return;
 const snapshot=JSON.stringify(original),sourceSignature=EA.signature(TX_QUESTIONS,TX_ANSWERS);
 const row=button.closest('[data-preview-row]');if(!row)return;
 button.disabled=true;button.textContent='Generating one alternative...';
 try{
  const counts={mcq:0,truefalse:0,fill:0,subjective:0};counts[original.type]=1;
  const current=txAuthorSettings();
  const cfg={...current,language:pv.language,counts,marks:{...current.marks,[original.type]:Number(original.marks)}};
  const subject=$('txAISubject').value.trim(),topic=$('txAITopic').value.trim();
  const sourceText=$('txAISource').value==='pdf' ? $('txPDFText').value.trim() : '';
  if(!subject&&!topic&&!sourceText)throw Error('Enter a subject or topic first.');
  const prompt=[topic,'Generate ONE different '+original.type+' question on the same subject. Do not repeat this question: '+original.text].filter(Boolean).join('\n');
  const params=EA.generationConfig(cfg,{subject,topic:prompt,sourceText});
  const result=EA.validateLanguage(EA.normalizeQuestions(await txAIRequest(params),cfg),pv.language);
  if(result.length!==1)throw Error('AI must return exactly one question.');
  const alternative=result[0];
  if(alternative.type!==original.type||Number(alternative.marks)!==Number(original.marks))throw Error('AI changed type or marks. Original question kept.');
  if(TX_PREVIEW!==pv||EA.signature(TX_QUESTIONS,TX_ANSWERS)!==sourceSignature||JSON.stringify(pv.rows[index])!==snapshot)throw Error('Preview changed while AI was generating. Original kept.');
  if(alternative.text.trim()===original.text.trim())throw Error('AI repeated the same question. Original kept.');
  const old=row.querySelector('[data-single-regeneration]');if(old)old.remove();
  const compare=document.createElement('div');compare.dataset.singleRegeneration='';compare.className='border rounded-xl p-3 mt-2';
  const head=document.createElement('p');head.textContent='Suggested alternative — NOT applied until you accept';compare.append(head);
  const desc=document.createElement('pre');desc.style.whiteSpace='pre-wrap';desc.style.fontFamily='inherit';desc.textContent=alternative.text+'\n'+(alternative.options||[]).map((x,i)=>String.fromCharCode(65+i)+'. '+x).join('\n');compare.append(desc);
  const accept=document.createElement('button');accept.type='button';accept.className='btn primary mr-2';accept.textContent='Accept New';
  const keep=document.createElement('button');keep.type='button';keep.className='btn border';keep.textContent='Keep Original';compare.append(accept,keep);row.append(compare);
  accept.onclick=()=>{if(TX_PREVIEW!==pv||JSON.stringify(pv.rows[index])!==snapshot||EA.signature(TX_QUESTIONS,TX_ANSWERS)!==sourceSignature){toast('Preview changed. Alternative not applied.');return;}pv.rows[index]={...structuredClone(alternative),marks:original.marks};txRenderPreview();if($('txPreviewReviewed'))$('txPreviewReviewed').checked=false;toast('Only this draft question replaced. Review all answers before adding.');};
  keep.onclick=()=>{compare.remove();button.disabled=false;button.textContent='Re-Generate';};
 }catch(e){toast('Re-generate failed: '+e.message);button.disabled=false;button.textContent='Re-Generate';}
}
function txAttachPerQuestionRegenerate(pv,root){
 if(pv.kind!=='generate')return;
 root.querySelectorAll('[data-preview-row]').forEach(row=>{
  const index=Number(row.dataset.previewRow);if(!Number.isInteger(index))return;
  const button=document.createElement('button');button.type='button';button.className='btn border mt-2';button.textContent='Re-Generate';button.setAttribute('aria-label','Re-generate question '+(index+1));
  row.append(button);button.onclick=()=>txRegeneratePreviewOne(pv,index,button);
 });
}
function txDiagramToolbar(q){q={...q,...v35DiagramProjection(q)};
 const d=q.diagramSrc?`<img alt="Circuit diagram" src="${esc(q.diagramSrc)}" style="display:block;max-width:100%;max-height:240px;margin:10px auto;object-fit:contain;background:#fff;border:1px solid #cbd5e1;border-radius:9px">`:'';
 return `<div class="mt-3 rounded-xl border border-indigo-200 p-3" data-diagram-card="${esc(q.id)}"><b>Electrical circuit / numerical diagram </b><p class="text-xs mt-1">Upload your own image or generate a clean editable-by-regeneration schematic. Check symbols, polarity and answers before approval.</p>
 <div class="flex flex-wrap gap-2 mt-2"><label class="btn border" style="cursor:pointer">Upload JPG/PNG<input type="file" accept="image/png,image/jpeg,image/webp" data-diagram-upload="${esc(q.id)}" style="display:none"></label><button type="button" class="btn border" data-diagram-auto="${esc(q.id)}">Generate schematic</button><button type="button" class="btn border" data-diagram-clean="${esc(q.id)}">Remove White Background</button><button type="button" class="btn border" data-diagram-original="${esc(q.id)}">Keep Original</button><button type="button" class="btn border" data-diagram-remove="${esc(q.id)}">Remove</button></div>
 <div class="grid md:grid-cols-2 gap-2 mt-2"><select class="inp" data-diagram-kind="${esc(q.id)}">${['ohm','series','parallel','kcl','kvl','power','rlc','threephase','transformer','motor','rectifier','control'].map(v=>`<option value="${v}">${({ohm:'Ohm Law / DC',series:'Series resistors',parallel:'Parallel resistors',kcl:'KCL junction',kvl:'KVL loop',power:'AC power and energy',rlc:'RLC circuit',threephase:'3-phase motor',transformer:'Transformer',motor:'Motor control',rectifier:'Rectifier',control:'Switch / lamp control'})[v]}</option>`).join('')}</select><input class="inp" data-diagram-values="${esc(q.id)}" placeholder="Values e.g. V=24V, R1=4Ω, R2=8Ω" value="${esc(q.diagramValues||'')}"></div>
 <input class="inp mt-2" data-diagram-caption="${esc(q.id)}" placeholder="Diagram caption / explanation (optional)" value="${esc(q.diagramCaption||'')}">${d}</div>`;
}
async function txDiagramConvert(blob){
 if(blob.size>5*1024*1024)throw Error('Diagram image max 5 MB');
 const url=URL.createObjectURL(blob);
 try {const img=new Image();img.src=url;await img.decode();
  const ratio=Math.min(1,900/img.width,520/img.height),w=Math.max(1,Math.round(img.width*ratio)),h=Math.max(1,Math.round(img.height*ratio));
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
  for(const quality of [.76,.55,.35]){const v=c.toDataURL('image/jpeg',quality);if(v.length<=85000)return v;}
  throw Error('Diagram too complex/large after compression; use a simpler image.');
 }finally{URL.revokeObjectURL(url)}
}
async function txRemoveWhiteBackground(dataURL){
 const im=new Image();im.src=dataURL;await im.decode();
 const maxSide=900,scale=Math.min(1,maxSide/Math.max(im.width,im.height));
 const w=Math.max(1,Math.round(im.width*scale)),h=Math.max(1,Math.round(im.height*scale));
 const c=document.createElement('canvas');c.width=w;c.height=h;
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0,w,h);
 let pixels=ctx.getImageData(0,0,w,h),d=pixels.data,light=0,ink=0;
 for(let i=0;i<d.length;i+=4){
  if(d[i+3]<8)continue;
  const r=d[i],g=d[i+1],b=d[i+2],hi=Math.max(r,g,b),lo=Math.min(r,g,b);
  // Only neutral near-white pixels are removed, not colored wires/highlights.
  if(lo>=238&&hi-lo<=12){
   const alpha=lo>=250?0:Math.round((250-lo)/12*255);
   d[i+3]=Math.min(d[i+3],Math.max(0,alpha));light++;
  }else if(lo<180)ink++;
 }
 if(light<d.length/4/20)throw Error('No white-paper background detected. Original kept.');
 if(ink<10)throw Error('No visible circuit strokes detected. Original kept.');
 ctx.putImageData(pixels,0,0);
 // PNG supports true alpha; JPEG would restore a white background.
 // Reduce dimensions only if needed; never silently flatten transparency.
 for(let n=0;n<6;n++){
  const png=c.toDataURL('image/png');
  if(png.length<=85000)return png;
  const nw=Math.round(c.width*.8),nh=Math.round(c.height*.8);
  if(nw<180||nh<110)break;
  const t=document.createElement('canvas');t.width=nw;t.height=nh;
  t.getContext('2d').drawImage(c,0,0,nw,nh);
  c.width=nw;c.height=nh;c.getContext('2d').drawImage(t,0,0);
 }
 throw Error('Transparent PNG exceeds the diagram size limit; original kept. Try a cleaner crop.');
}
function txSchematicSVG(kind,values){
 const E=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const val=E(String(values||'Values to be verified by Teacher').slice(0,130));
 const line=(x,y,X,Y)=>`<path d="M${x} ${y} L${X} ${Y}"/>`;
 const resistor=(x,y,n)=>`${line(x-25,y,x-19,y)}<rect x="${x-19}" y="${y-11}" width="38" height="22" fill="white"/><text x="${x}" y="${y-18}">${E(n)}</text>${line(x+19,y,x+25,y)}`;
 const bulb=(x,y)=>`<circle cx="${x}" cy="${y}" r="17" fill="white"/><path d="M${x-12} ${y-12}l24 24 m0 -24l-24 24"/>`;
 const battery=`<path d="M50 76V113 M50 143V184 M29 113H71 M37 128H63"/><text x="16" y="105">+</text><text x="16" y="150">-</text>`;
 let wires=`${battery}${line(50,76,50,58)}${line(50,58,294,58)}${line(294,58,294,184)}${line(294,184,50,184)}`;
 let shapes='';let title='Circuit';
 if(['ohm','series','power','rlc','kvl'].includes(kind)){
  title=({ohm:'Ohm Law',series:'Series resistors',power:'Power / Energy',rlc:'RLC circuit',kvl:'Kirchhoff Voltage Law'})[kind];
  wires=`${battery}${line(50,76,50,58)}${line(50,58,100,58)}${line(244,58,294,58)}${line(294,58,294,184)}${line(294,184,50,184)}`;
  if(kind==='series'||kind==='kvl'){shapes=`${line(100,58,115,58)}${resistor(142,58,'R1')}${line(167,58,176,58)}${resistor(203,58,'R2')}${line(228,58,244,58)}`;}
  else if(kind==='rlc'){shapes=`${line(100,58,112,58)}${resistor(135,58,'R')}${line(160,58,168,58)}<path d="M168 58q7 -22 14 0q7 -22 14 0"/><path d="M196 58h14m0 -14v28m8 -28v28m0 -14h26"/>`;}
  else shapes=`${line(100,58,151,58)}${resistor(176,58,kind==='power'?'Load':'R')}${line(201,58,244,58)}`;
 }else if(kind==='parallel'||kind==='kcl'){
  title=kind==='kcl'?'Kirchhoff Current Law':'Parallel resistors';
  wires=`${battery}${line(50,76,50,58)}${line(50,58,294,58)}${line(50,184,294,184)}${line(294,58,294,184)}`;
  shapes=`${line(142,58,142,100)}<rect x="130" y="100" width="24" height="43" fill="white"/><text x="116" y="125">R1</text>${line(142,143,142,184)}${line(225,58,225,100)}<rect x="213" y="100" width="24" height="43" fill="white"/><text x="253" y="125">R2</text>${line(225,143,225,184)}`;
  if(kind==='kcl')shapes+=`<text x="155" y="82">I1 + I2 = I</text>`;
 }else if(kind==='threephase'||kind==='motor'||kind==='transformer'){
  title=({threephase:'3-Phase motor',motor:'Motor supply / control',transformer:'Transformer'})[kind];
  wires=`${line(45,75,285,75)}${line(45,120,285,120)}${line(45,165,285,165)}`;
  shapes=`<circle cx="285" cy="120" r="45" fill="white"/><text x="285" y="117">${kind==='transformer'?'TX':'M'}</text><text x="285" y="136">${kind==='threephase'?'3~':'AC'}</text><text x="35" y="72">R</text><text x="35" y="117">Y</text><text x="35" y="162">B</text>`;
 }else if(kind==='rectifier'){
  title='Rectifier (simplified block)';
  wires=`${line(38,95,106,95)}${line(38,142,106,142)}<rect x="106" y="66" width="110" height="105" fill="white"/>${line(216,95,294,95)}${line(216,142,294,142)}`;
  shapes='<text x="161" y="117">AC to DC</text><text x="161" y="138">Rectifier</text><text x="56" y="79">AC</text><text x="262" y="79">DC+</text>';
 }else {
  title='Switch / Lamp control';
  wires=`${battery}${line(50,76,50,58)}${line(50,58,133,58)}${line(202,58,294,58)}${line(294,58,294,95)}${line(294,129,294,184)}${line(294,184,50,184)}`;
  shapes=`<circle cx="133" cy="58" r="5" fill="white"/><circle cx="202" cy="58" r="5" fill="white"/><path d="M133 58L193 40"/>${bulb(294,112)}`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="465" viewBox="0 0 360 232"><rect width="360" height="232" fill="white"/><g stroke="#172033" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">${wires}${shapes}</g><g fill="#172033" stroke="none" font-family="Arial,sans-serif" font-size="11" text-anchor="middle"><text x="180" y="24" font-size="14" font-weight="bold">${E(title)}</text><text x="180" y="216">${val}</text></g></svg>`;
}
function txBindDiagrams(){
 const root=$('txQList');
 root.querySelectorAll('[data-diagram-caption]').forEach(x=>x.oninput=()=>{let q=TX_QUESTIONS.find(q=>q.id===x.dataset.diagramCaption);if(q)q.diagramCaption=x.value.slice(0,180)});
 root.querySelectorAll('[data-diagram-values]').forEach(x=>x.oninput=()=>{let q=TX_QUESTIONS.find(q=>q.id===x.dataset.diagramValues);if(q)q.diagramValues=x.value.slice(0,130)});
 root.querySelectorAll('[data-diagram-upload]').forEach(x=>x.onchange=async()=>{const q=TX_QUESTIONS.find(q=>q.id===x.dataset.diagramUpload);if(!q||!x.files?.[0])return;try{const f=x.files[0];if(!/^image\/(png|jpeg|webp)$/.test(f.type))throw Error('Use PNG/JPG/WebP only');const value=await txDiagramConvert(f);q.diagramSrc=value;q.diagramOriginalSrc=value;txRenderQList();toast('Image added. Optional: Remove White Background.')}catch(e){toast(e.message)}});
 root.querySelectorAll('[data-diagram-auto]').forEach(x=>x.onclick=async()=>{const q=TX_QUESTIONS.find(q=>q.id===x.dataset.diagramAuto);if(!q)return;try{const card=x.closest('[data-diagram-card]');const kind=card.querySelector('[data-diagram-kind]').value,values=card.querySelector('[data-diagram-values]').value;const svg=txSchematicSVG(kind,values);q.diagramSrc=await txDiagramConvert(new Blob([svg],{type:'image/svg+xml'}));q.diagramOriginalSrc=q.diagramSrc;q.diagramValues=values;txRenderQList();toast('Schematic generated. Verify actual connection before approval.')}catch(e){toast(e.message)}});
 root.querySelectorAll('[data-diagram-clean]').forEach(x=>x.onclick=async()=>{
  const q=TX_QUESTIONS.find(q=>q.id===x.dataset.diagramClean);if(!q?.diagramSrc)return toast('Upload a circuit image first.');
  try{const original=q.diagramOriginalSrc||q.diagramSrc;
   const cleaned=await txRemoveWhiteBackground(original);
   q.diagramOriginalSrc=original;q.diagramSrc=cleaned;txRenderQList();
   toast('White background removed. Review the diagram; Keep Original to undo.');
  }catch(e){toast(e.message)}
 });
 root.querySelectorAll('[data-diagram-original]').forEach(x=>x.onclick=()=>{
  const q=TX_QUESTIONS.find(q=>q.id===x.dataset.diagramOriginal);if(!q?.diagramOriginalSrc)return toast('Original image not available for this draft.');
  q.diagramSrc=q.diagramOriginalSrc;txRenderQList();toast('Original image restored.');
 });
 root.querySelectorAll('[data-diagram-remove]').forEach(x=>x.onclick=()=>{let q=TX_QUESTIONS.find(q=>q.id===x.dataset.diagramRemove);if(q){delete q.diagramSrc;delete q.diagramCaption;txRenderQList()}});
}
function txUpdateOverview(){
 const active=TX_EXAMS.filter(x=>x.archived!==true);
 const ids=new Set(active.map(x=>x.id));
 const submitted=TX_ATTEMPTS.filter(x=>ids.has(x.examId)&&x.archived!==true&&x.status==='submitted');
 for(const [id,count] of [['txCountExams',active.length],['txCountSubmitted',submitted.length],['txCountReview',submitted.filter(x=>x.teacherVerified!==true).length],['txCountPublished',submitted.filter(x=>x.gradePublished===true&&x.teacherVerified===true).length]]){
  const el=$(id);if(el)el.textContent=String(count);
 }
}
function txReviewNormalize(v){return String(v??'').normalize('NFKC').toLocaleLowerCase().replace(/[\u200b-\u200d\ufeff]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ')}
function txReviewSimilarity(a,b){a=txReviewNormalize(a);b=txReviewNormalize(b);if(!a||!b)return 0;if(a===b)return 1;const aa=[...a],bb=[...b];if(aa.length>200||bb.length>200)return 0;let p=Array.from({length:bb.length+1},(_,i)=>i);for(let i=1;i<=aa.length;i++){let q=[i];for(let j=1;j<=bb.length;j++)q[j]=Math.min(q[j-1]+1,p[j]+1,p[j-1]+(aa[i-1]===bb[j-1]?0:1));p=q}return Math.max(0,1-p[bb.length]/Math.max(aa.length,bb.length,1))}
function txReviewSuggestion(q,student,key){const max=Number(q.marks)||0,answer=txReviewNormalize(student);if(!answer)return {score:0,note:'Blank answer'};let ok=false;
 if(q.type==='mcq'){let ix=Number.isInteger(key)?key:Number.isInteger(Number(key))?Number(key):-1;let expected=(q.options||[])[ix];ok=expected!==undefined&&(answer===txReviewNormalize(expected)||answer===String(ix));return {score:ok?max:0,note:'MCQ exact match — verify manually'};}
 if(q.type==='truefalse'){ok=answer===txReviewNormalize(key);return {score:ok?max:0,note:'True/False exact match — verify manually'};}
 if(q.type==='fill'||q.type==='fillblank'){const accepted=(Array.isArray(key)?key:[key]).map(txReviewNormalize).filter(Boolean);if(!accepted.length)return {score:0,note:'Answer key missing — inspect manually'};let sim=Math.max(...accepted.map(v=>txReviewSimilarity(answer,v)));let score=sim>=.89?max:sim>=.72?Math.min(max,Math.round(max*.75*2)/2):sim>=.54?Math.min(max,Math.round(max*.5*2)/2):0;return {score,note:`Spelling/word similarity ${Math.round(sim*100)}% — ONLY a hint. Check actual meaning and technical correctness.`};}
 return {score:0,note:'Subjective — inspect manually'};
}
const TX_WALL={page:0,pageSize:16,batch:'',peers:new Map(),active:false,renderKey:''};
const txWallList=()=>TX_ATTEMPTS.filter(a=>a.teacherId===me?.uid&&['started','blocked','hold'].includes(a.status)&&a.archived!==true&&a.studentId&&a.id)
  .sort((a,b)=>String(a.classId||'').localeCompare(String(b.classId||''))||String(a.studentName||a.studentId).localeCompare(String(b.studentName||b.studentId)));
function txWallVisible(){const rows=txWallList().filter(a=>!TX_WALL.batch||String(a.classId||'')===TX_WALL.batch);
 const pages=Math.max(1,Math.ceil(rows.length/TX_WALL.pageSize));TX_WALL.page=Math.min(TX_WALL.page,pages-1);
 return {rows:rows.slice(TX_WALL.page*TX_WALL.pageSize,(TX_WALL.page+1)*TX_WALL.pageSize),total:rows.length,pages};}
function txWallStatus(id,label){const grid=$('txWallGrid'),tile=grid&&[...grid.querySelectorAll('[data-wall-id]')].find(n=>n.dataset.wallId===id);
 if(!tile)return;const overlay=tile.querySelector('.tx-wall-overlay');if(overlay){overlay.textContent=label;overlay.classList.toggle('tx-wall-online',label==='LIVE')}
 const flag=tile.querySelector('.tx-wall-flag');if(flag){flag.textContent=label==='LIVE'?'● LIVE':label;flag.classList.toggle('tx-wall-live',label==='LIVE');}}
function txWallAttach(id,stream){const grid=$('txWallGrid'),tile=grid&&[...grid.querySelectorAll('[data-wall-id]')].find(n=>n.dataset.wallId===id);
 for(const video of tile?.querySelectorAll('video')||[]){video.srcObject=stream;video.muted=true;video.play().catch(()=>txWallStatus(id,'Tap to resume video'));}}
function txWallDisconnect(id){const entry=TX_WALL.peers.get(id);if(!entry)return;TX_WALL.peers.delete(id);
 try{entry.unsub?.()}catch{}try{entry.pc.close()}catch{}
 const tile=[...($('txWallGrid')?.querySelectorAll('[data-wall-id]')||[])].find(n=>n.dataset.wallId===id);
 if(tile){for(const video of tile.querySelectorAll('video'))video.srcObject=null}
 txWallStatus(id,'Stopped');
 // Student listener sees closed status and frees its sender. Fail closed if network drops.
 updateDoc(doc(db,'examProctorSignals',entry.signalId),{status:'closed',updatedAt:txStamp()}).then(()=>deleteDoc(doc(db,'examProctorSignals',entry.signalId)).catch(()=>{})).catch(e=>console.warn('Live wall close',e));
}
function txWallStop(){txWallExitExpanded();TX_WALL.active=false;for(const id of [...TX_WALL.peers.keys()])txWallDisconnect(id);
 const b=$('txWallStart');if(b)b.disabled=false;const note=$('txWallNote');if(note)note.textContent='Live cameras stopped. Click Start Visible Cameras to reconnect.'}
function txWallRender(){txWallWire();const grid=$('txWallGrid');if(!grid)return;
 const all=txWallList(),batchSel=$('txWallBatch');if(batchSel){const values=[...new Map(all.map(a=>[String(a.classId||''),a.className?`${a.classId} — ${a.className}`:String(a.classId||'—')])).entries()].filter(x=>x[0]);
  const opts='<option value="">All Batches</option>'+values.map(([id,label])=>`<option value="${esc(id)}">${esc(label)}</option>`).join('');
  if(batchSel.innerHTML!==opts)batchSel.innerHTML=opts;if(!values.some(([id])=>id===TX_WALL.batch))TX_WALL.batch='';batchSel.value=TX_WALL.batch;}
 const {rows,total,pages}=txWallVisible(),ids=new Set(rows.map(a=>a.id));
 for(const id of [...TX_WALL.peers.keys()])if(!ids.has(id))txWallDisconnect(id);
 const count=$('txWallCount');if(count)count.textContent=`${total} active students • ${TX_WALL.peers.size} live connections`;
 const pn=$('txWallPage');if(pn)pn.textContent=`Page ${TX_WALL.page+1} of ${pages}`;
 if($('txWallPrev'))$('txWallPrev').disabled=TX_WALL.page===0;
 if($('txWallNext'))$('txWallNext').disabled=TX_WALL.page>=pages-1;
 const key=JSON.stringify(rows.map(a=>[a.id,a.studentName,a.classId,a.className,a.status,a.warningCount,a.cameraOn,a.online]));
 if(key===TX_WALL.renderKey)return;TX_WALL.renderKey=key;
  const expandedId=grid.querySelector('.tx-wall-expanded')?.dataset.wallId||null;
  grid.innerHTML=rows.length?rows.map(a=>`<article class="tx-wall-card${expandedId===a.id?' tx-wall-expanded':''}" data-wall-id="${esc(a.id)}">
   <div class="tx-wall-frame" tabindex="0" aria-label="Student live camera. Hover or tap to show monitoring controls."><video class="tx-wall-ambient" autoplay playsinline muted preload="none" aria-hidden="true"></video><video class="tx-wall-main-video" autoplay playsinline muted preload="none" aria-label="Live camera of ${esc(a.studentName||a.studentId)}"></video><div class="tx-wall-overlay">Not connected</div><span class="tx-wall-warning" data-zero="${Number(a.warningCount||0)===0}">WARN ${Math.max(0,Number(a.warningCount)||0)}/5</span><span class="tx-wall-flag">${a.status==='blocked'?'BLOCKED':a.cameraOn&&a.online!==false?'READY':'OFFLINE'}</span>
   <div class="tx-wall-info"><strong class="tx-wall-student">${esc(a.studentName||a.studentId)}</strong><span class="tx-wall-batch">Batch ID: ${esc(TX_EXAMS.find(e=>e.id===a.examId)?.batchId||a.batchId||'Batch ID unavailable')}</span></div>
   <div class="tx-wall-tools" role="group" aria-label="Live exam actions">
    <button type="button" data-wall-action="expand">${expandedId===a.id?'Exit Fullscreen':'Fullscreen'}</button>
    <button type="button" data-wall-action="warn">Warn</button>
    <button type="button" data-wall-action="block" ${a.status==='blocked'?'disabled':''}>Block</button>
    <button type="button" data-wall-action="unblock" ${a.status!=='blocked'&&a.status!=='hold'?'disabled':''}>Unblock</button>
    <button type="button" data-wall-action="clear">Clear Warnings</button>
    <button type="button" data-wall-action="connect">Connect / Retry</button>
   </div></div></article>`).join(''):'<p class="exam-small">No current exam students in this batch.</p>';
  document.body.classList.toggle('tx-wall-no-scroll',!!expandedId&&rows.some(a=>a.id===expandedId));
 for(const a of rows){const entry=TX_WALL.peers.get(a.id);if(entry?.stream){txWallAttach(a.id,entry.stream);txWallStatus(a.id,'LIVE')}else if(entry)txWallStatus(a.id,'Connecting…')}
}
window.txWallStart=async()=>{TX_WALL.active=true;txWallRender();const {rows}=txWallVisible();
 const b=$('txWallStart');if(b)b.disabled=true;const note=$('txWallNote');if(note)note.textContent=`Connecting up to ${rows.length} student camera(s). Audio muted. Video requires student online and signaling access.`;
 // Start in small batches to avoid a burst of ICE/Firestore writes.
 for(let i=0;i<rows.length&&TX_WALL.active;i+=4){await Promise.allSettled(rows.slice(i,i+4).map(txWallConnect));}
 if(b)b.disabled=false;txWallRender()};
window.txWallStop=txWallStop;
function txWallSetBatch(value){txWallStop();TX_WALL.batch=value;TX_WALL.page=0;TX_WALL.renderKey='';txWallRender()}
function txWallMove(delta){txWallStop();TX_WALL.page=Math.max(0,TX_WALL.page+delta);TX_WALL.renderKey='';txWallRender()}
async function txWallClearWarnings(id){
  const a=TX_ATTEMPTS.find(x=>x.id===id);
  if(!a||a.teacherId!==me?.uid)throw Error('Not an authorized student attempt');
  if(!confirm('Reset displayed warning count to 0/5 for this student? This does NOT delete audit history or automatically unblock the exam.'))return;
  await updateDoc(doc(db,'examAttempts',id),{warningCount:0,aiLookAwayCount:0,warningMessage:'',warningAt:null,warningResetAt:txStamp(),warningResetBy:me.uid,updatedAt:txStamp()});
  await addDoc(collection(db,'examAuditEvents'),{attemptId:id,examId:a.examId,classId:a.classId,studentId:a.studentId,teacherId:me.uid,event:'TEACHER_WARNING_RESET',detail:'Teacher reset warning count to 0; audit events preserved',createdAt:txStamp()});
  toast('Warning count reset; audit history preserved.');
 }
function txWallExitExpanded(){const tile=$('txWallGrid')?.querySelector('.tx-wall-expanded');if(tile){tile.classList.remove('tx-wall-expanded');tile.querySelector('[data-wall-action="expand"]').textContent='Fullscreen'}document.body.classList.remove('tx-wall-no-scroll')}
const TX_WALL_CONTROLS_TIMERS=new WeakMap();
function txWallShowControls(tile){
 if(!tile)return;
 tile.classList.add('tx-wall-show-controls');
 const old=TX_WALL_CONTROLS_TIMERS.get(tile);if(old)clearTimeout(old);
 TX_WALL_CONTROLS_TIMERS.set(tile,setTimeout(()=>{
   if(!tile.matches(':focus-within')&&!tile.matches(':hover'))tile.classList.remove('tx-wall-show-controls');
 },3500));
}
function txWallWire(){const grid=$('txWallGrid');if(!grid||grid.dataset.txWallBound)return;grid.dataset.txWallBound='1';
 $('txWallStart').onclick=window.txWallStart;$('txWallStop').onclick=txWallStop;
 $('txWallBatch').onchange=e=>txWallSetBatch(e.target.value);
 $('txWallPrev').onclick=()=>txWallMove(-1);$('txWallNext').onclick=()=>txWallMove(1);
  grid.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')txWallShowControls(e.target.closest('.tx-wall-card'))});
  grid.addEventListener('pointerleave',e=>{e.target.closest?.('.tx-wall-card')?.classList.remove('tx-wall-show-controls')},true);
  grid.addEventListener('click',async e=>{
   const btn=e.target.closest('[data-wall-action]');
   if(!btn){if(e.target.closest('.tx-wall-frame')){const tile=e.target.closest('.tx-wall-card');if(tile){tile.classList.toggle('tx-wall-show-controls');if(tile.classList.contains('tx-wall-show-controls'))txWallShowControls(tile)}}return;}
   if(btn.disabled)return;
   txWallShowControls(btn.closest('.tx-wall-card'));
   const tile=btn.closest('[data-wall-id]'),id=tile?.dataset.wallId,action=btn.dataset.wallAction;
   const a=TX_ATTEMPTS.find(x=>x.id===id);if(!a||a.teacherId!==me?.uid)return;
   if(action==='expand'){
    const opening=!tile.classList.contains('tx-wall-expanded');
    for(const other of grid.querySelectorAll('.tx-wall-expanded'))other.classList.remove('tx-wall-expanded');
    tile.classList.toggle('tx-wall-expanded',opening);document.body.classList.toggle('tx-wall-no-scroll',opening);
    btn.textContent=opening?'Exit Fullscreen':'Fullscreen';txWallShowControls(tile);return;
   }
   btn.disabled=true;
   try{
    if(action==='connect'){if(TX_WALL.peers.has(id))txWallDisconnect(id);await txWallConnect(a)}
    else if(action==='warn'){await window.txWarn(id)}
    else if(action==='block'){if(confirm('Block this student exam? Teacher can unblock later.'))await window.txAttemptStatus(id,'blocked')}
    else if(action==='unblock'){if(confirm('Resume this student exam?'))await window.txAttemptStatus(id,'started')}
    else if(action==='clear'){await txWallClearWarnings(id)}
   }catch(err){console.error('Live wall action',err);toast('Action failed: '+(err.message||err))}
   finally{btn.disabled=false;}
  });
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')txWallExitExpanded()});
{const page=document.getElementById('p-exams'),app=document.getElementById('app');if(page){const observer=new MutationObserver(()=>{if((!page.classList.contains('active')||app?.classList.contains('hidden'))&&(TX_WALL.active||TX_WALL.peers.size||document.body.classList.contains('tx-wall-no-scroll')))txWallStop();});observer.observe(page,{attributes:true,attributeFilter:['class']});if(app)observer.observe(app,{attributes:true,attributeFilter:['class']});}window.addEventListener('pagehide',txWallStop);}
window.OPJCC_EXAM_RELEASE='FINAL-DEMO-20261029-1';
let TX_AUTHOR={variants:{},language:'English'},TX_PREVIEW=null,TX_AI_BUSY=false,TX_SOURCE_TEXT='',TX_PDF_SEQ=0;
let TX_AUTHOR_JOB=null,TX_AI_ABORT=null;
const txSelected=()=>EA.selectedQuestions(TX_QUESTIONS);
const txSelectedAnswers=()=>Object.fromEntries(txSelected().map(q=>[q.id,structuredClone(TX_ANSWERS[q.id]??null)]));
const txBankSource=()=>EA.bankSignature(TX_QUESTIONS,TX_ANSWERS);
function txCancelAuthorJob(){if(TX_AUTHOR_JOB)TX_AUTHOR_JOB.cancelled=true;TX_AI_ABORT?.abort();$('txAIStatus').textContent='Cancelled. Existing bank, selected paper and keys were kept.';}
async function txRunAuthorJob(job){
 if(job.running)return;job.running=true;const st=$('txAIStatus');
 try{
  while(job.index<job.plan.length){if(job.cancelled||TX_AUTHOR_JOB!==job)throw Error('Request cancelled.');if(job.source!==txBankSource())throw Error('The bank changed. Discard this request and start again.');
   st.textContent=`${job.kind==='translation'?'Translating':'Generating'} batch ${job.index+1}/${job.plan.length} • ${job.rows.length}/${job.total} questions received. Existing bank is unchanged.`;
   const part=job.plan[job.index],context=job.kind==='generate'?{...job.context,topic:job.context.topic+`\nBatch ${job.index+1}/${job.plan.length}. Do not repeat these already used bank/generated stems: `+JSON.stringify([...TX_QUESTIONS,...job.rows].map(q=>q.text))}:job.context,config=job.kind==='translation'?EA.translationConfig(part,TX_ANSWERS,job.language):EA.generationConfig(part,context);
   const raw=await txAIRequest(config),rows=job.kind==='translation'?EA.validateTranslation(raw,part,TX_ANSWERS):EA.normalizeQuestions(raw,part);EA.validateLanguage(rows,job.language);
   if(job.source!==txBankSource()||job.cancelled)throw Error('The bank changed or request was cancelled.');
   if(job.kind!=='translation')EA.assertDistinct(rows,[...TX_QUESTIONS.filter(q=>q.id!==job.targetId),...job.rows]);job.rows.push(...rows);job.index++;
  }
  let rows=job.rows;if(job.kind==='translation'){const byId=new Map(rows.map(q=>[q.id,q]));if(byId.size!==TX_QUESTIONS.length)throw Error('Translation did not return every canonical bank question.');rows=TX_QUESTIONS.map(q=>byId.get(q.id));}
  if(rows.length!==job.total)throw Error(`Incomplete response: ${rows.length}/${job.total}; nothing was added.`);
  await txStage(rows,job.kind,job.language,{targetId:job.targetId});TX_AUTHOR_JOB=null;st.textContent=`${rows.length}/${job.total} questions ready for Teacher review. Nothing has been published.`;
 }catch(e){st.textContent=`${job.kind==='translation'?'Translation':'Generation'} stopped after ${job.rows.length}/${job.total}: ${e.message} Existing bank, keys and approved versions were kept. ${job.cancelled?'':'Use Resume after the free service is available.'}`;toast(st.textContent);}
 finally{job.running=false;if($('txAIResume'))$('txAIResume').disabled=!TX_AUTHOR_JOB||!!job.cancelled;}
}
async function txQuestionAI(id,alternative=false){try{
 if(TX_PREVIEW||TX_AUTHOR_JOB?.running)throw Error('Review/discard the preview or finish the current request first.');const q=TX_QUESTIONS.find(q=>q.id===id);if(!q)throw Error('Question no longer exists.');
 const promptQuestion={id:q.id,type:q.type,text:q.text,options:[...(q.options||[])],marks:q.marks,...(q.diagramSrc?{diagramCaption:String(q.diagramCaption||'').slice(0,180),diagramValues:String(q.diagramValues||'').slice(0,130),diagramNote:'Retain the existing approved diagram and exact stated values/connections; Teacher must review correspondence.'}:{})};
 const config=EA.settings({language:TX_AUTHOR.language,counts:{mcq:0,truefalse:0,fill:0,subjective:0,...{[q.type]:1}},marks:{mcq:q.marks,truefalse:q.marks,fill:q.marks,subjective:q.marks}});
 TX_AUTHOR_JOB={kind:alternative?'alternative':'regenerate',targetId:id,language:TX_AUTHOR.language,source:txBankSource(),context:{subject:$('txAISubject').value.trim(),topic:`Create one new ${q.type} question testing the same topic as ${JSON.stringify(promptQuestion)}. Do not repeat this or any existing question. Return a complete correct answer. Keep type and marks. Existing bank stems to avoid: ${JSON.stringify(TX_QUESTIONS.map(q=>q.text))}`},plan:[config],rows:[],index:0,total:1};await txRunAuthorJob(TX_AUTHOR_JOB);
 }catch(e){toast(e.message);}}
function txMoveQuestion(id,delta){const i=TX_QUESTIONS.findIndex(q=>q.id===id),j=i+delta;if(i<0||j<0||j>=TX_QUESTIONS.length)return;[TX_QUESTIONS[i],TX_QUESTIONS[j]]=[TX_QUESTIONS[j],TX_QUESTIONS[i]];txRenderQList();}
function txRenderSelectedPreview(){const box=$('txSelectedPreview');box.innerHTML='<h4>Selected examination order</h4>'+txSelected().map((q,i)=>`<div>${i+1}. ${esc(q.text)} [${q.marks}] <button type="button" data-selected-move="${q.id}" data-delta="-1">↑</button> <button type="button" data-selected-move="${q.id}" data-delta="1">↓</button></div>`).join('');box.querySelectorAll('[data-selected-move]').forEach(b=>b.onclick=()=>{const selected=txSelected(),i=selected.findIndex(q=>q.id===b.dataset.selectedMove),other=selected[i+Number(b.dataset.delta)];if(other){const a=TX_QUESTIONS.findIndex(q=>q.id===b.dataset.selectedMove),j=TX_QUESTIONS.indexOf(other);[TX_QUESTIONS[a],TX_QUESTIONS[j]]=[TX_QUESTIONS[j],TX_QUESTIONS[a]];txRenderQList();txRenderSelectedPreview();}});}
async function txAssertEditable(){if(!TX_EDIT_ID)return;const snap=await getDocFromServer(doc(db,'exams',TX_EDIT_ID));if(!snap.exists())throw Error('Saved draft is no longer available.');const x=snap.data();if(x.status!=='draft'||x.publishedAt||x.approval?.approved===true)throw Error('Published examination content is protected. Create a separate draft copy.');const attempts=await getDocsFromServer(query(collection(db,'examAttempts'),where('examId','==',TX_EDIT_ID),where('teacherId','==',me.uid),limit(1)));if(!attempts.empty)throw Error('This examination already has attempts. Create a separate draft copy.');}
function txAuthorSettings(){return EA.settings({language:$('txAILanguage').value,counts:{mcq:$('txAIMCQ').value,truefalse:$('txAITF').value,fill:$('txAIFill').value,subjective:$('txAISub').value},marks:{mcq:$('txAIObjMarks').value,truefalse:$('txAITFMarks').value,fill:$('txAIFillMarks').value,subjective:$('txAISubMarks').value}})}
function txAuthorSummary(){try{const c=txAuthorSettings();$('txGenerationSummary').textContent=`${c.total} questions • ${Object.entries(c.counts).reduce((sum,[t,n])=>sum+n*c.marks[t],0)} marks • ${c.language}`}catch(e){$('txGenerationSummary').textContent=e.message}}
function txAuthorBind(){
 $('txAILanguage').value=TX_AUTHOR.language;
 $('txSelectAll').onclick=()=>{TX_QUESTIONS.forEach(q=>q.selected=true);txRenderQList()};$('txSelectNone').onclick=()=>{TX_QUESTIONS.forEach(q=>q.selected=false);txRenderQList()};$('txSelectApply').onclick=()=>{const n=Number($('txSelectCount').value);if(!Number.isInteger(n)||n<1||n>TX_QUESTIONS.length)return toast('Enter a whole count within the bank size.');TX_QUESTIONS.forEach((q,i)=>q.selected=i<n);txRenderQList()};$('txSelectedPreviewButton').onclick=txRenderSelectedPreview;$('txAIResume').onclick=()=>{if(TX_AUTHOR_JOB)txRunAuthorJob(TX_AUTHOR_JOB)};$('txAICancel').onclick=txCancelAuthorJob;
 for(const id of ['txAIMCQ','txAITF','txAIFill','txAISub','txAIObjMarks','txAITFMarks','txAIFillMarks','txAISubMarks','txAILanguage'])$(id).addEventListener('input',txAuthorSummary);
 $('txPaperLanguage').value=TX_AUTHOR.language;
 $('txPaperLanguage').onchange=()=>{if(TX_QUESTIONS.length&&$('txPaperLanguage').value!==TX_AUTHOR.language){$('txPaperLanguage').value=TX_AUTHOR.language;return toast('Translate and review the bank before changing its language.');}TX_AUTHOR.language=$('txPaperLanguage').value;$('txAILanguage').value=TX_AUTHOR.language;txAuthorSummary();document.getElementById('txQList').lang={English:'en',Hindi:'hi',Odia:'or',Hinglish:'en'}[TX_AUTHOR.language]};
 $('txPdfInput').onchange=txReadPDF;$('txPDFText').addEventListener('input',txUpdateImportButton);txUpdateImportButton();$('txImportPDF').onclick=txImportPDF;$('txTranslate').onclick=()=>txTranslate(false);$('txManualTranslation').onclick=()=>txTranslate(true);$('txSavedTranslation').onclick=txSavedTranslation;$('txRejectTranslation').onclick=()=>{const language=$('txTranslationLanguage').value,v=TX_AUTHOR.variants[language];if(!v)return toast('No saved version for this language.');if(confirm('Keep the translation text but remove approval for '+language+'?')){v.reviewed=false;txRenderQList();$('txAIStatus').textContent=language+' is no longer approved in this draft. Save Draft to persist.';}};
 $('txPassPercent').oninput=()=>{TX_AUTHOR.passMode='percent';const p=Number($('txPassPercent').value);if(p>=0&&p<=100)$('txPassMarks').value=(Number($('txTotal').value)*p/100).toFixed(2)};
 $('txPassMarks').addEventListener('input',()=>{TX_AUTHOR.passMode='marks';const total=Number($('txTotal').value);$('txPassPercent').value=total?(Number($('txPassMarks').value)*100/total).toFixed(1):0});
 $('txMetaBatch').onchange=()=>{const c=cl.find(c=>c.id===$('txMetaBatch').value);$('txClass').value=c?.id||'';txAuthorClass()};
 $('txBatchID').oninput=()=>{$('txActualBatch').textContent=$('txBatchID').value||'Enter a verified Batch ID; the class document ID is separate.'};
 $('txClass').addEventListener('change',txAuthorClass);
$('txClass').addEventListener('change',txSuggestTitle);
$('txAssessmentType').addEventListener('change',txSuggestTitle);$('txProject').onchange=()=>txAuthorClass(true);txAuthorClass();txSuggestTitle();txAuthorSummary();
 const advanced=$('txAdvancedBank');advanced.ontoggle=()=>{advanced.style.flexBasis=advanced.open?'100%':'';advanced.style.width=advanced.open?'100%':'';if(advanced.open)txRenderAdvancedQList();else txRenderQList()};$('txEnableHinglish').onclick=()=>{for(const id of ['txPaperLanguage','txAILanguage','txTranslationLanguage'])$(id).querySelector('option[value="Hinglish"]').hidden=false;toast('Hinglish enabled in all examination language selectors. Teacher review remains required.');};if(TX_AUTHOR.language==='Hinglish'){advanced.open=true;$('txEnableHinglish').click();}
}
function txSuggestTitle(){
  const title=$('txTitle'),batch=$('txClass'),type=$('txAssessmentType');
  if(!title||!batch||!type||TX_EDIT_ID)return;

  const c=cl.find(x=>x.id===batch.value);
  const name=String(c?.className||c?.name||'').trim();
  if(!name)return;

  const label=type.options[type.selectedIndex]?.textContent.trim()||'ASSESSMENT';
  const count=TX_EXAMS.filter(x=>x.classId===batch.value&&x.assessmentType===type.value).length+1;
  const suggestion=`${name} - ${label} ${String(count).padStart(2,'0')}`;

  if(!title.value.trim()||title.value===title.dataset.autoTitle){
    title.value=suggestion;
    title.dataset.autoTitle=suggestion;
  }
}
function txAuthorClass(filter=false){
 const selected=$('txClass').value,c=cl.find(c=>c.id===selected),projects=[...new Set(cl.filter(c=>c.active!==false&&!c.archived).map(c=>c.projectType||'').filter(Boolean))];
 if(!$('txProject').options.length)$('txProject').innerHTML='<option value="">All assigned projects</option>'+projects.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
 if(!filter&&c?.projectType)$('txProject').value=c.projectType;
 const project=$('txProject').value,rows=teacherUniqueClasses(cl.filter(c=>!c.archived&&c.active!==false&&(!project||c.projectType===project)));
 $('txMetaBatch').innerHTML='<option value="">Select assigned batch</option>'+rows.map(c=>`<option value="${esc(c.id)}">${esc(c.batchId||c.batchID||'Batch ID missing')} • ${esc(c.className||c.name||'')}</option>`).join('');
 if(rows.some(r=>r.id===selected))$('txMetaBatch').value=selected;else if(filter){$('txClass').value='';$('txMetaBatch').value=''}
 const chosen=cl.find(c=>c.id===$('txClass').value);if($('txBatchID').dataset.class!==(chosen?.id||'')){$('txBatchID').value='';$('txBatchID').dataset.class=chosen?.id||'';}$('txActualBatch').textContent=$('txBatchID').value||'Enter a verified Batch ID; the class document ID is separate.';
}
async function txReadPDF(){
 const input=$('txPdfInput'),seq=++TX_PDF_SEQ,file=input.files?.[0],st=$('txPDFStatus'),box=$('txPDFText');
 if(!file)return;
 // Never silently replace material a Teacher has already pasted or edited.
 if(box.value.trim()&&!confirm('Replace the current pasted/extracted text with the selected file?')){input.value='';return;}
 box.value='';txUpdateImportButton();TX_SOURCE_TEXT='';
 if(file.size>25*1024*1024){st.textContent='File limit: 25 MB.';return;}
 st.textContent='Reading local file…';
 try{
  let t='',description='';const name=String(file.name||'');
  if(/\.txt$/i.test(name)||file.type==='text/plain'){
   t=await file.text();description='TXT loaded locally';
   if(t.includes('\uFFFD'))throw Error('TXT contains invalid Unicode replacement characters. Save it as UTF-8.');
  }else if(/\.pdf$/i.test(name)||file.type==='application/pdf'){
   const d=await EA.extractPDF(file);t=d.text;description=`${d.pages} PDF page(s) extracted locally`;
  }else throw Error('Choose a PDF or UTF-8 TXT file.');
  if(seq!==TX_PDF_SEQ||input!==$('txPdfInput'))return;
  if(txLooksDamagedHindi(t))throw Error('Hindi glyph spacing appears damaged in this PDF text layer. Do not import it. Use a correctly encoded searchable PDF or a UTF-8 TXT file.');
  TX_SOURCE_TEXT=t;box.value=t;txUpdateImportButton();
  st.textContent=`${description}: ${t.length} characters. Review the questions and answers before Preview. Nothing is uploaded.`;
 }catch(e){if(seq!==TX_PDF_SEQ)return;st.textContent=e.message;toast(e.message);txUpdateImportButton();}
}
async function txImportPDF(){try{const text=$('txPDFText').value;if(txLooksDamagedHindi(text))throw Error('Hindi text looks damaged. Use a clean UTF-8 TXT or correctly encoded searchable PDF.');const rows=EA.parseQuestionBank(text);await txStage(rows,'import',$('txPaperLanguage').value);$('txPDFStatus').textContent=`${rows.length} questions staged for review (not published). Check all answers.`}catch(e){$('txPDFStatus').textContent=e.message;toast(e.message)}}
async function txGenerateAI(){try{
 if(TX_PREVIEW)throw Error('Review/add or discard the current preview first.');if(TX_AUTHOR.loadingKeys)throw Error('Wait for the saved bank to load.');
 const config=txAuthorSettings(),subject=$('txAISubject').value.trim(),topic=$('txAITopic').value.trim(),sourceText=$('txAISource').value==='pdf'?$('txPDFText').value.trim():'';
 if(!subject&&!topic&&!sourceText)throw Error('Enter a subject/topic or select extracted PDF text.');if(TX_QUESTIONS.length+config.total>100)throw Error('The bank can contain at most 100 questions. Delete unwanted questions or request a smaller bank.');
 if(sourceText&&!confirm('Send this selected text to the existing free OPJCC AI Worker?'))return;
 TX_AUTHOR_JOB={kind:'generate',language:config.language,source:txBankSource(),context:{subject,topic,sourceText},plan:EA.planBatches(config),rows:[],index:0,total:config.total};await txRunAuthorJob(TX_AUTHOR_JOB);
 }catch(e){$('txAIStatus').textContent='Generation not started: '+e.message;toast(e.message);}}
async function txTranslate(manual=false){try{
 if(TX_AUTHOR.loadingKeys)throw Error('Wait for the saved draft/bank to load.');
 if(TX_PREVIEW&&TX_PREVIEW.kind!=='translation'){if(!$('txPreviewReviewed')?.checked)throw Error('Review the generated/imported preview first. Add it to the editable bank; no publishing is needed.');await txAcceptPreview();}
 if(TX_PREVIEW)throw Error('Approve or reject the current preview first.');if(!TX_QUESTIONS.length)throw Error('Add questions to the editable bank or load a saved draft. Publishing is not required.');
 const language=$('txTranslationLanguage').value;if(language===TX_AUTHOR.language)throw Error('Choose a language different from the original bank.');EA.validateReviewed(TX_QUESTIONS.map(q=>({...q,key:TX_ANSWERS[q.id]})));
 if(manual){const saved=new Map((TX_AUTHOR.variants[language]?.rows||[]).map(q=>[q.id,q]));const rows=TX_QUESTIONS.map(q=>{const old=saved.get(q.id),usable=old&&old.type===q.type&&old.options.length===q.options.length;return {...q,...(usable?{text:old.text,options:structuredClone(old.options)}:{}),key:structuredClone(usable&&q.type==='fill'?old.key:TX_ANSWERS[q.id]??'')};});await txStage(rows,'translation',language);$('txAIStatus').textContent='Edit every translated question/option, then explicitly review this version. Original language and keys are unchanged.';return;}
 if(!confirm('Translate ALL canonical bank questions and options using the existing free Worker? Original questions and keys stay unchanged.'))return;
 TX_AUTHOR_JOB={kind:'translation',language,source:txBankSource(),plan:EA.translationBatches(TX_QUESTIONS),rows:[],index:0,total:TX_QUESTIONS.length};await txRunAuthorJob(TX_AUTHOR_JOB);
 }catch(e){$('txAIStatus').textContent='Translation not started: '+e.message+' Existing bank and versions were kept.';toast(e.message);}}
async function txStage(rows,kind,language,options={}){TX_PREVIEW={rows:structuredClone(rows).map(q=>({...q,id:q.id||txQuestionId(),importSelected:true})),kind,language,...options,source:txBankSource(),sourceHash:await EA.digest(TX_QUESTIONS,TX_ANSWERS)};txRenderPreview();}
function txRenderPreview(){const pv=TX_PREVIEW;if(!pv)return;const root=$('txAuthorPreview');root.innerHTML=`<div class="border rounded-2xl p-4"><h3 class="font-black">Editable ${esc(pv.language)} ${pv.kind==='translation'?'translation':'question'} preview</h3><p>Nothing is published here. True/False answer tokens remain True/False for Student Portal compatibility.</p>${pv.rows.map((q,i)=>`<div class="border rounded-xl p-3 mt-3" data-preview-row="${i}"><b>Q${i+1} • ${esc(q.type)}</b><textarea class="inp mt-2" data-ptext="${i}" lang="${{English:'en',Hindi:'hi',Odia:'or',Hinglish:'en'}[pv.language]}">${esc(q.text)}</textarea>${q.type==='mcq'?q.options.map((o,j)=>`<input class="inp mt-1" data-popt="${i}" data-oi="${j}" value="${esc(o)}" aria-label="Option ${j+1}">`).join(''):''}${q.type==='mcq'?`<select class="inp mt-2" data-pkey="${i}"><option value="">Select correct answer</option>${q.options.map((o,j)=>`<option value="${j}" ${q.key===j?'selected':''}>${String.fromCharCode(65+j)}</option>`).join('')}</select>`:q.type==='truefalse'?`<select class="inp mt-2" data-pkey="${i}"><option value="">Select correct answer</option>${['True','False'].map(x=>`<option ${q.key===x?'selected':''}>${x}</option>`).join('')}</select>`:q.type==='fill'?`<input class="inp mt-2" data-pkey="${i}" value="${esc((q.key||[]).join(' | '))}" placeholder="Accepted answers separated by |">`:''}<label>Marks <input type="number" min="1" max="100" data-pmarks="${i}" value="${q.marks}" ${pv.kind==='translation'?'readonly':''}></label></div>`).join('')}<label class="flex gap-2 mt-4"><input type="checkbox" id="txPreviewReviewed">I reviewed every question, translation, option and correct answer.</label><div class="flex flex-wrap gap-2 mt-3"><button id="txAcceptPreview" class="btn primary">${pv.kind==='translation'?'Save reviewed translation':pv.kind==='regenerate'?'Accept New':'Add reviewed questions to paper'}</button><button id="txDiscardPreview" class="btn border">${pv.kind==='regenerate'?'Keep Original':'Discard preview'}</button></div></div>`;
 if(pv.kind!=='translation'){
   const bank=pv.bankRows||(pv.bankRows=structuredClone(pv.rows));
   const specs=[['mcq','MCQ'],['truefalse','True/False'],['fill','Fill in the Blanks'],['subjective','Subjective']];
   const counts=Object.fromEntries(specs.map(([type])=>[type,bank.filter(q=>q.type===type).length]));
   const controls=document.createElement('div');controls.className='border rounded-xl p-3 mb-3';
   controls.innerHTML=`<b>Question bank — select how many of each type</b><p>Bank: ${bank.length} questions. Pick each count and preview the chosen questions before adding them to this exam. Each student receives the same approved subset, with their own saved shuffled order.</p><div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">${specs.filter(([type])=>counts[type]).map(([type,label])=>`<label>${label} (bank ${counts[type]}) <input class="inp" data-bank-count="${type}" type="number" min="0" max="100" step="1" value="${pv.bankSelectedCounts?.[type]??counts[type]}"></label>`).join('')}</div><div class="flex flex-wrap gap-2 mt-3"><button type="button" id="txBankPick" class="btn border">Pick randomly for review</button><button type="button" id="txBankRestore" class="btn border">Restore full bank</button></div><p id="txBankStatus" role="status">${pv.rows.length} questions in preview; not yet added or published.</p>`;
   root.prepend(controls);
   controls.querySelector('#txBankPick').onclick=()=>{
     const selectedCounts={};let total=0;
     for(const [type,label] of specs){
       const field=controls.querySelector(`[data-bank-count="${type}"]`);
       const count=field?Number(field.value):0;
       if(!Number.isInteger(count)||count<0||count>100)return toast('Invalid '+label+' count; choose 0 to 100.');
       if(count>counts[type])return toast(label+': only '+counts[type]+' questions available in this bank. Import more to select '+count+'.');
       selectedCounts[type]=count;total+=count;
     }
     if(total===0)return toast('Choose at least one question.');
     const selectedIndices=[];
     for(const [type] of specs){
       const candidates=bank.map((q,i)=>q.type===type?i:-1).filter(i=>i>=0);
       const count=selectedCounts[type];
       if(count)selectedIndices.push(...txRandomPick(candidates,count));
     }
     selectedIndices.sort((a,b)=>a-b);
     pv.rows=selectedIndices.map(i=>structuredClone(bank[i]));pv.bankSelectedCounts=selectedCounts;txRenderPreview();
     toast('Picked '+total+' questions for teacher review. Check the exact questions and marks before adding.');
   };
   controls.querySelector('#txBankRestore').onclick=()=>{pv.rows=structuredClone(bank);pv.bankSelectedCounts=null;txRenderPreview();};
 }
 txAttachPerQuestionRegenerate(pv,root);
 root.querySelectorAll('[data-ptext]').forEach(el=>el.oninput=()=>{pv.rows[+el.dataset.ptext].text=el.value;$('txPreviewReviewed').checked=false});
 root.querySelectorAll('[data-popt]').forEach(el=>el.oninput=()=>{pv.rows[+el.dataset.popt].options[+el.dataset.oi]=el.value;$('txPreviewReviewed').checked=false});
 root.querySelectorAll('[data-pkey]').forEach(el=>el.onchange=()=>{const q=pv.rows[+el.dataset.pkey];q.key=q.type==='mcq'?(el.value===''?null:Number(el.value)):q.type==='fill'?el.value.split('|').map(x=>x.trim()).filter(Boolean):el.value||null;$('txPreviewReviewed').checked=false});
 root.querySelectorAll('[data-pmarks]').forEach(el=>el.oninput=()=>{pv.rows[+el.dataset.pmarks].marks=Number(el.value);$('txPreviewReviewed').checked=false});
 $('txDiscardPreview').onclick=()=>{TX_PREVIEW=null;root.innerHTML=''};$('txAcceptPreview').onclick=txAcceptPreview;
}
async function txAcceptPreview(){try{const pv=TX_PREVIEW;if(!pv||!$('txPreviewReviewed').checked)throw Error('Confirm Teacher review before accepting.');if(pv.source!==txBankSource())throw Error('The bank changed during review. Discard and request a fresh preview.');const rows=pv.rows.filter(q=>q.importSelected!==false);if(!rows.length)throw Error('Select at least one question.');EA.validateLanguage(rows,pv.language);
 if(pv.kind==='translation'){EA.validateReviewed(rows);const raw=rows.map(q=>({...q,correctIndex:q.key,correctAnswer:q.key,acceptedAnswers:q.key}));const versionRows=EA.validateTranslation(raw,TX_QUESTIONS,TX_ANSWERS);TX_AUTHOR.variants[pv.language]={language:pv.language,rows:versionRows,sourceHash:pv.sourceHash,bankSource:txBankSource(),reviewed:true};$('txAIStatus').textContent='Approved '+pv.language+' version saved in this editor. Save Draft to persist it; publishing remains separate.';}
 else if(pv.kind==='regenerate'){EA.validateReviewed(rows);const i=TX_QUESTIONS.findIndex(q=>q.id===pv.targetId);if(i<0)throw Error('Original question is no longer present.');EA.assertDistinct(rows,TX_QUESTIONS.filter(q=>q.id!==pv.targetId));const old=TX_QUESTIONS[i],r=rows[0];TX_QUESTIONS[i]={...old,text:r.text,options:r.options,marks:r.marks};TX_ANSWERS[old.id]=structuredClone(r.key);$('txAIStatus').textContent='Only the reviewed question and its private key were replaced.';}
 else{if(TX_QUESTIONS.length&&TX_AUTHOR.language!==pv.language)throw Error('Generate/import in the bank language or use translation.');EA.assertDistinct(rows,TX_QUESTIONS);if(TX_QUESTIONS.length+rows.length>100)throw Error('Bank limit is 100 questions.');for(const r of rows){const id=txQuestionId();TX_QUESTIONS.push({id,type:r.type,text:r.text,options:r.options,marks:r.marks,section:r.section||'',sourceNumber:r.sourceNumber??null,selected:pv.kind!=='alternative'});TX_ANSWERS[id]=structuredClone(r.key??(r.type==='fill'?[]:null));}TX_AUTHOR.language=pv.language;$('txPaperLanguage').value=pv.language;$('txAIStatus').textContent=`${rows.length} questions added to the private editable bank. Review missing keys and choose the examination set.`;}
 TX_PREVIEW=null;$('txAuthorPreview').innerHTML='';txRenderQList();return true;
 }catch(e){toast(e.message);return false;}}
async function txSavedTranslation(){try{const language=$('txTranslationLanguage').value,v=TX_AUTHOR.variants[language];if(!v?.reviewed||v.bankSource!==txBankSource())throw Error('Review a current translation of the whole bank first.');if(!confirm('Use '+language+' as the base language and retain the original as a reviewed version? No publication occurs.'))return;const previous=TX_AUTHOR.language,source=txBankSource(),bankDiagrams=new Map(TX_QUESTIONS.map(q=>[q.id,{...v35DiagramProjection(q),...(q.diagramOriginalSrc?{diagramOriginalSrc:v35DiagramProjection({diagramSrc:q.diagramOriginalSrc}).diagramSrc}:{}),...(q.diagramValues?{diagramValues:String(q.diagramValues).slice(0,130)}:{})}])),original=TX_QUESTIONS.map(q=>({id:q.id,type:q.type,text:q.text,options:[...(q.options||[])],marks:q.marks,section:q.section||'',sourceNumber:q.sourceNumber??null,key:structuredClone(TX_ANSWERS[q.id])})),selection=new Map(TX_QUESTIONS.map(q=>[q.id,q.selected!==false])),translatedById=new Map(v.rows.map(q=>[q.id,q]));if(translatedById.size!==TX_QUESTIONS.length||TX_QUESTIONS.some(q=>!translatedById.has(q.id)))throw Error('The reviewed language does not match the current canonical bank. Review it again.');TX_QUESTIONS=TX_QUESTIONS.map(current=>translatedById.get(current.id)).map(q=>({id:q.id,type:q.type,text:q.text,options:q.options,marks:q.marks,section:q.section||'',sourceNumber:q.sourceNumber??null,selected:selection.get(q.id),...bankDiagrams.get(q.id)}));TX_ANSWERS=Object.fromEntries(v.rows.map(q=>[q.id,structuredClone(q.key)]));TX_AUTHOR.language=language;const next=txBankSource();for(const version of Object.values(TX_AUTHOR.variants))if(version.bankSource===source)version.bankSource=next;TX_AUTHOR.variants[previous]={rows:original,reviewed:true,language:previous,bankSource:next};$('txPaperLanguage').value=language;txRenderQList();}catch(e){toast(e.message);}}
async function txQuestionPdf(id){const exam=TX_EXAMS.find(e=>e.id===id);if(!exam)return;const host=document.createElement('div');host.style.cssText='position:fixed;left:0;top:0;width:210mm;z-index:-99999;pointer-events:none';document.body.append(host);try{
 const qr=await import('./vendor/qr.js'),paperId=exam.questionPaperId||('OPJCC-QP-'+id),logo=new URL('./icons/apple-touch-icon.png',location.href).href;
 const dataURL=await qr.toDataURL(paperId,{errorCorrectionLevel:'M',margin:1,width:180});const output=await EA.approvalPages({...exam,questionPaperId:paperId},logo,dataURL,{measureRoot:host});
 await EA.downloadApproval(output,host,`${safeFileName(exam.title||'Assessment')}_Question_Approval.pdf`);
 }catch(e){console.error('Question approval PDF',e);toast('Question approval PDF failed: '+e.message)}finally{host.remove()}}
let TX_EXAMS=[],TX_ATTEMPTS=[],TX_KEYS={},TX_EDIT_ID="",TX_QUESTIONS=[],TX_ANSWERS={},TX_UNSUBS=[],TX_VIEW_PC=null,TX_VIEW_UNSUB=null,TX_SEEN_CAND=new Set();
const txId=(e,s)=>`${e}_${s}`;
const txStamp=()=>serverTimestamp();
const txGrade=p=>p>90?"Excellent":p>80?"Very Good":p>70?"Good":p>60?"Average":p>=50?"Pass":"Fail";
function txTab(name){["manage","eligibility","monitor","results"].forEach(n=>$("tx"+n[0].toUpperCase()+n.slice(1))?.classList.toggle("hidden",n!==name));document.querySelectorAll('#txTabs button').forEach(b=>b.classList.toggle('active',b.dataset.x===name));if(name==='eligibility')txRenderEligibility();if(name==='monitor')txRenderMonitor();else txWallStop();if(name==='results')txRenderResults()}
function txPublicVerified(v){return Object.fromEntries(['questionScores','score','percentage','grade','totalMarks','feedback','teacherVerified','verifiedBy','verifiedAt','updatedAt'].map(k=>[k,v[k]]));}
async function txHydrateVerified(){const ids=[...new Set(TX_ATTEMPTS.map(a=>a.examId))];for(const id of ids){try{const k=await getDoc(doc(db,'examAnswerKeys',id));if(k.exists()){const grades=k.data().verifiedResults||{};TX_ATTEMPTS.filter(a=>a.examId===id&&!a.gradePublished).forEach(a=>{if(grades[a.id])Object.assign(a,grades[a.id])})}}catch(e){console.warn('Private grade lookup failed',e)}}}
function txStart(){if(!me)return;TX_UNSUBS.forEach(u=>{try{u()}catch{}});TX_UNSUBS=[];TX_UNSUBS.push(onSnapshot(query(collection(db,'exams'),where('teacherId','==',me.uid)),s=>{TX_EXAMS=s.docs.map(d=>({id:d.id,...d.data()}));txUpdateOverview();txRenderExams();txFillSelects();refreshTeacherDashboardV2()},e=>console.warn('exam live',e)));TX_UNSUBS.push(onSnapshot(query(collection(db,'examAttempts'),where('teacherId','==',me.uid)),async s=>{TX_ATTEMPTS=s.docs.map(d=>({id:d.id,...d.data()}));await txHydrateVerified();txUpdateOverview();txRenderExams();txRenderMonitor();txRenderResults();txRenderReopen();refreshTeacherDashboardV2()},e=>console.warn('attempt live',e)))}
function txFillSelects(){const opts='<option value="">Select exam</option>'+TX_EXAMS.filter(x=>x.archived!==true).map(x=>`<option value="${x.id}">${esc(x.title||'Exam')} • ${esc(x.className||x.classId||'')}</option>`).join('');['txEligExam','txResultExam'].forEach(id=>{if(!$(id))return;let v=$(id).value;$(id).innerHTML=opts;if([...$(id).options].some(o=>o.value===v))$(id).value=v})}
function txRenderExams(){if(!$('txExamList'))return;const rows=TX_EXAMS.filter(x=>x.archived!==true);$('txExamList').innerHTML=rows.length?rows.map(x=>{const qs=Array.isArray(x.questions)?x.questions:[],c={mcq:qs.filter(q=>q.type==='mcq').length,tf:qs.filter(q=>q.type==='truefalse').length,fill:qs.filter(q=>q.type==='fillblank'||q.type==='fill').length,sub:qs.filter(q=>q.type==='subjective').length},submitted=TX_ATTEMPTS.filter(a=>a.examId===x.id&&a.status==='submitted'&&a.archived!==true),allPublished=submitted.length>0&&submitted.every(a=>a.gradePublished===true);return `<div class="exam-card"><div class="flex flex-col md:flex-row md:justify-between gap-2"><div><h3 class="text-xl font-black">${esc(x.title||'Assessment')}</h3><p>${esc(x.className||x.classId||'')} • ${Number(x.totalMarks||0)} marks</p></div><span class="exam-pill ${x.status==='published'?'live':''}">${esc(String(x.status||'draft').toUpperCase())}</span></div><p class="mt-2"><b>${esc(x.assessmentType||'Assessment')}</b> • ${c.mcq?`MCQ ${c.mcq} • `:''}${c.tf?`T/F ${c.tf} • `:''}${c.fill?`Fill ${c.fill} • `:''}${c.sub?`Subjective ${c.sub} • `:''}Total ${qs.length}</p><p class="exam-small">${esc(x.startAt||'No start time')} ${x.endAt?'→ '+esc(x.endAt):''}</p><div class="flex flex-wrap gap-2 mt-3"><button class="btn border" onclick="window.txEdit('${x.id}')">Edit</button><button class="btn border" onclick="window.txQuestionPdf('${x.id}')">Question PDF</button><button class="btn border" onclick="window.txExtendRepublish('${x.id}')">Extend / Re-publish</button><button class="btn border" onclick="window.txExamResultPdf('${x.id}')">Result PDF</button><button class="btn border" onclick="window.txArchive('${x.id}')">Remove from Teacher View</button><button class="btn red" onclick="window.txDelete('${x.id}')">Permanent Delete</button><button class="btn border" onclick="window.txReviewExam('${x.id}')">Review Submissions</button>${submitted.length?`<button class="btn ${allPublished?'border':'primary'}" onclick="window.txPublishExamGrades('${x.id}',${allPublished?'false':'true'})">${allPublished?'Unpublish Grades':'Publish Grades'}</button>`:''}</div><div class="exam-small mt-2">Grade: ${submitted.length?(allPublished?'Published':'Not published yet'):'No submissions yet'}</div></div>`}).join(''):'<div class="card p-5 text-slate-500">No assessment created yet.</div>'}
function txEditor(exam=null){
  if(TX_AI_BUSY||TX_AUTHOR_JOB?.running||TX_AUTHOR.saving)return toast('Wait for the current operation before opening another paper.');TX_AUTHOR_JOB=null;TX_AUTHOR={variants:{},language:exam?.paperLanguage||'English',passMode:exam?'marks':'percent',loadingKeys:!!exam?.id};TX_PREVIEW=null;TX_SOURCE_TEXT='';
  TX_EDIT_ID=exam?.id||'';TX_QUESTIONS=(exam?.questions||[]).map(q=>({...q}));TX_ANSWERS={};
  $('txEditor').classList.remove('hidden');
  $('txEditor').innerHTML=`<div class="flex items-center justify-between gap-3"><div><h2 class="text-2xl font-black">${exam?'Edit Assessment':'Create Assessment'}</h2><p class="text-sm text-slate-500 mt-1">Same flexible builder as Classroom Assignment • Live examination controls remain separate.</p></div>${exam?'<span class="text-xs font-black text-amber-600">EDIT MODE</span>':''}</div>
<div class="grid md:grid-cols-2 gap-3 mt-4 border rounded-2xl p-4">
<label>Project<select id="txProject" class="inp"></select></label><select id="txMetaBatch" hidden aria-hidden="true"></select><label>Actual Batch ID<input id="txBatchID" class="inp" value="${esc(exam?.batchId||'')}" data-class="${esc(exam?.classId||'')}" placeholder="Enter Batch ID manually"><small id="txActualBatch"></small></label>
<label>NOS Code<input id="txNOS" class="inp" value="${esc(exam?.nosCode||'')}"></label>
<label class="md:col-span-2">Topic (printed exactly as entered)<textarea id="txTopic" class="inp">${esc(exam?.topic??'')}</textarea></label>
<label>Question-paper language<select id="txPaperLanguage" class="inp"><option>English</option><option>Hindi</option><option>Odia</option><option value="Hinglish" hidden>Hinglish</option></select></label>
<label>Passing percentage<input id="txPassPercent" class="inp" type="number" min="0" max="100" step="0.1" value="${Number(exam?.passingPercent??50)}"></label></div>
  <div class="grid md:grid-cols-2 gap-3 mt-4">
    <select id="txClass" class="inp"><option value="">Select assigned batch</option>${teacherUniqueClasses(cl.filter(c=>c.archived!==true&&c.active!==false)).map(c=>`<option value="${c.id}" ${exam?.classId===c.id?'selected':''}>${esc(c.className||c.name||c.id)}</option>`).join('')}</select>
    <select id="txAssessmentType" class="inp"><option value="Weekly Assessment" ${exam?.assessmentType==='Weekly Assessment'?'selected':''}>WEEKLY ASSESSMENT</option><option value="Monthly Assessment" ${exam?.assessmentType==='Monthly Assessment'?'selected':''}>MONTHLY ASSESSMENT</option><option value="NOS-wise Assessment" ${exam?.assessmentType==='NOS-wise Assessment'?'selected':''}>NOS-WISE ASSESSMENT</option><option value="Final Internal Assessment" ${exam?.assessmentType==='Final Internal Assessment'?'selected':''}>FINAL INTERNAL ASSESSMENT</option></select>
    <input id="txTitle" class="inp md:col-span-2" placeholder="Assessment title" value="${esc(exam?.title||'')}">
    <textarea id="txInstructions" class="inp md:col-span-2 min-h-24" placeholder="Instructions / description">${esc(exam?.instructions||'Camera and microphone are compulsory. Do not leave the assessment screen.')}</textarea>
    <input id="txStartAt" class="inp" type="datetime-local" value="${esc(exam?.startAt||'')}">
    <input id="txEndAt" class="inp" type="datetime-local" value="${esc(exam?.endAt||'')}">
    <input id="txDuration" class="inp" type="number" min="1" step="1" placeholder="Duration (minutes)" value="${Number(exam?.duration||60)}">
    <input id="txTotal" class="inp bg-slate-50" type="number" placeholder="Total marks (auto)" readonly>
    <input id="txPassMarks" class="inp" type="number" min="0" step="0.01" placeholder="Passing marks" value="${Number(exam?.passingMarks??Math.round(Number(exam?.totalMarks||0)*Number(exam?.passingPercent||50)/100))}">
    <label class="inp flex items-center justify-between cursor-pointer"><span>Optional attachment</span><input id="txFile" type="file" class="max-w-[220px]"></label>
  </div>
  <div class="mt-5"><div class="font-black mb-2">Add Question</div><div class="flex flex-wrap gap-2"><button id="txAddMCQ" type="button" class="btn border">+ MCQ</button><button id="txAddTF" type="button" class="btn border">+ True / False</button><button id="txAddFill" type="button" class="btn border">+ Fill in the Blanks</button><button id="txAddSubjective" type="button" class="btn border">+ Subjective</button></div><p class="text-xs text-slate-500 mt-2">Mix any question type in any order. Total marks calculate automatically.</p></div>
  <div class="mt-5 border rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/40"><div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2"><div><b>✨ AI Question Generator</b><p class="text-xs text-slate-500">Same AI draft workflow as Classroom Assignment. Review/edit before publish.</p></div><button id="txAIGenerate" type="button" class="btn border">Generate with AI</button></div><div class="grid md:grid-cols-3 gap-2 mt-3"><input id="txAISubject" class="inp" placeholder="Subject / Module"><input id="txAITopic" class="inp" placeholder="AI topic / prompt (printed Topic is above)"><select id="txAILanguage" class="inp"><option value="English">English</option><option value="Hindi">Hindi</option><option value="Odia">Odia</option><option value="Hinglish" hidden>Hinglish</option></select><input id="txAIMCQ" class="inp" type="number" min="0" value="5" placeholder="MCQ count"><input id="txAITF" class="inp" type="number" min="0" value="0" placeholder="True/False count"><input id="txAIFill" class="inp" type="number" min="0" value="0" placeholder="Fill blanks count"><input id="txAISub" class="inp" type="number" min="0" value="0" placeholder="Subjective count"><label>MCQ marks<input id="txAIObjMarks" class="inp" type="number" min="1" value="1" placeholder="Marks/MCQ"></label><label>True/False marks<input id="txAITFMarks" class="inp" type="number" min="1" value="1"></label><label>Fill marks<input id="txAIFillMarks" class="inp" type="number" min="1" value="1"></label><input id="txAISubMarks" class="inp" type="number" min="1" value="2" placeholder="Marks/subjective"></div><p id="txGenerationSummary" role="status"></p><label>AI source<select id="txAISource" class="inp"><option value="topic">Subject / Topic (no PDF required)</option><option value="pdf">Extracted / pasted PDF text (sent to existing AI only when requested)</option></select></label><div id="txAIStatus" class="text-xs text-slate-500 mt-2"></div></div>
<section class="mt-4 border rounded-2xl p-4"><h3 class="font-black">Upload PDF / Question Bank</h3><p>Upload searchable PDF or UTF-8 TXT, OR paste text directly below. Preview is available for pasted text. Hindi PDF extraction may be unreliable with damaged font mappings; such text is blocked. OCR is not configured.</p><input id="txPdfInput" type="file" accept=".pdf,.txt,application/pdf,text/plain" class="inp"><p id="txPDFStatus" role="status"></p><textarea id="txPDFText" class="inp" aria-label="Extracted PDF text" placeholder="Paste verified numbered questions here (or upload searchable PDF / UTF-8 TXT)"></textarea><button type="button" id="txImportPDF" class="btn border" disabled>Preview recognizable questions</button></section>
<section class="mt-4 border rounded-2xl p-4"><h3 class="font-black">Translate the same questions</h3><select id="txTranslationLanguage" class="inp"><option>English</option><option>Hindi</option><option>Odia</option><option value="Hinglish" hidden>Hinglish</option></select><div class="flex flex-wrap gap-2 mt-2"><button type="button" id="txTranslate" class="btn border">Request AI translation for review</button><button type="button" id="txManualTranslation" class="btn border">Edit translation manually</button><button type="button" id="txSavedTranslation" class="btn border">Use reviewed translation as paper</button></div><p>Translations stay private in the teacher answer-key document when you save. They do not replace or publish the active paper automatically.</p></section><div id="txAuthorPreview" class="mt-4"></div>
  <div id="txQList" class="space-y-3 mt-4"></div>

  <div class="mt-5 flex flex-wrap gap-2"><button id="txSaveDraft" type="button" class="btn border">Save Draft</button><button id="txPublish" type="button" class="btn primary">Approve &amp; Publish Assessment</button><button id="txCancel" type="button" class="btn border">Cancel</button><details id="txAdvancedBank" class="relative"><summary class="btn border cursor-pointer">Advanced Bank Controls</summary><p class="text-sm mt-2">Original question-bank selection, private marking guides and reorder controls are preserved here. They use the same canonical questions and answers as the default editor.</p><button type="button" id="txEnableHinglish" class="btn border mt-2">Enable Hinglish (Roman Hindi)</button><button type="button" id="txRejectTranslation" class="btn border mt-2">Unapprove selected language</button><section class="mt-4 border rounded-2xl p-4"><h3>Question bank and examination selection</h3><p id="txBankSummary" role="status"></p><button type="button" class="btn border" id="txSelectAll">Select all</button> <button type="button" class="btn border" id="txSelectNone">Clear selection</button><label>Number to select <input id="txSelectCount" type="number" min="1" max="100" step="1" value="30"></label><button type="button" class="btn border" id="txSelectApply">Select first N in bank order</button> <button type="button" class="btn border" id="txSelectedPreviewButton">Preview / reorder selected paper</button><div id="txSelectedPreview"></div><p id="txTranslationVersions" role="status"></p><button id="txAIResume" type="button" class="btn border" disabled>Resume incomplete AI batches</button> <button id="txAICancel" type="button" class="btn border">Cancel AI request</button></section>
<div id="txAdvancedQList" class="space-y-3 mt-4"></div></details></div>`;
  $('txAddMCQ').onclick=()=>txAddQuestion('mcq');$('txAddTF').onclick=()=>txAddQuestion('truefalse');$('txAddFill').onclick=()=>txAddQuestion('fillblank');$('txAddSubjective').onclick=()=>txAddQuestion('subjective');$('txSaveDraft').onclick=()=>txSave('draft');$('txPublish').onclick=()=>txSave('published');$('txCancel').onclick=()=>{$('txEditor').classList.add('hidden')};$('txAIGenerate').onclick=txGenerateAI;txAuthorBind();if(exam?.id)txLoadKey(exam.id);txRenderQList();
}
async function txLoadKey(id){TX_AUTHOR.loadingKeys=true;try{const snap=await getDocFromServer(doc(db,'examAnswerKeys',id));const data=snap.exists()?snap.data():{};if(data.questionBank?.schema===1){TX_QUESTIONS=structuredClone(data.questionBank.questions);TX_ANSWERS=structuredClone(data.questionBank.answers);TX_AUTHOR.pdfWarnings=structuredClone(data.questionBank.warnings||[]);if(TX_AUTHOR.pdfWarnings.length)$('txPDFStatus').textContent=TX_AUTHOR.pdfWarnings.join(' ');TX_AUTHOR.language=data.questionBank.language||TX_AUTHOR.language;$('txPaperLanguage').value=TX_AUTHOR.language;}else{TX_ANSWERS=structuredClone(data.answers||{});}TX_AUTHOR.variants=structuredClone(data.authoringVariants||{});txRenderQList();}catch(e){toast('Could not load private bank: '+e.message);}finally{TX_AUTHOR.loadingKeys=false;}}
function txQuestionId(){return 'q_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function txAddQuestion(type,data={}){const id=data.id||txQuestionId();if(type==='mcq'){TX_QUESTIONS.push({id,type:'mcq',text:data.question||data.text||'',options:Array.isArray(data.options)&&data.options.length===4?data.options:['','','',''],marks:Number(data.marks||1)});TX_ANSWERS[id]=Number.isInteger(data.correctIndex)?Number(data.correctIndex):null}else if(type==='truefalse'){TX_QUESTIONS.push({id,type:'truefalse',text:data.question||data.text||'',options:['True','False'],marks:Number(data.marks||1)});TX_ANSWERS[id]=['True','False'].includes(data.correctAnswer)?data.correctAnswer:null}else if(type==='fillblank'){TX_QUESTIONS.push({id,type:'fill',text:data.question||data.text||'',options:[],marks:Number(data.marks||1)});TX_ANSWERS[id]=Array.isArray(data.acceptedAnswers)?data.acceptedAnswers.map(x=>String(x).trim()).filter(Boolean):['']}else{TX_QUESTIONS.push({id,type:'subjective',text:data.question||data.text||'',options:[],marks:Number(data.marks||2)});TX_ANSWERS[id]=data.modelAnswer||''}txRenderQList()}
function txSyncTotal(){const qs=txSelected(),total=qs.reduce((a,q)=>a+Math.max(0,Number(q.marks||0)),0);if($('txTotal'))$('txTotal').value=total||'';if($('txPassPercent')&&$('txPassMarks')){if(TX_AUTHOR.passMode==='percent')$('txPassMarks').value=(total*Number($('txPassPercent').value||0)/100).toFixed(2);else $('txPassPercent').value=total?(Number($('txPassMarks').value||0)*100/total).toFixed(1):0;}if($('txTranslationVersions'))$('txTranslationVersions').textContent=EA.LANGUAGES.filter(l=>l!==TX_AUTHOR.language).map(l=>l+': '+(TX_AUTHOR.variants[l]?.reviewed&&TX_AUTHOR.variants[l].bankSource===txBankSource()?'approved':'needs review')).join(' • ');if($('txBankSummary')){$('txBankSummary').textContent=`Bank: ${TX_QUESTIONS.length} • Examination: ${qs.length} selected • ${total} marks. Every Student receives this same set; only question order is shuffled.`;}}
function txRenderQList(){if(!$('txQList'))return;txSyncTotal();const visible=txSelected();if(!visible.length){$('txQList').innerHTML='<p class="text-sm text-slate-500">No questions added yet.</p>';txRenderAdvancedQList();return}$('txQList').innerHTML=visible.map((q,i)=>{if(q.type==='mcq')return `<div class="border rounded-2xl p-4"><div class="flex justify-between"><b>Q${i+1}. MCQ</b><button type="button" class="text-red-600 font-bold" data-txdel="${q.id}">Delete</button></div><input class="inp mt-3" data-txtext="${q.id}" value="${esc(q.text)}" placeholder="Question"><div class="grid md:grid-cols-2 gap-2 mt-2">${(q.options||['','','','']).map((o,oi)=>`<input class="inp" data-txopt="${q.id}" data-oi="${oi}" value="${esc(o)}" placeholder="Option ${oi+1}">`).join('')}</div><div class="grid md:grid-cols-2 gap-2 mt-2"><select class="inp" data-txcorrect="${q.id}">${Number.isInteger(TX_ANSWERS[q.id])?'':'<option value="">Answer key missing</option>'}${[0,1,2,3].map(x=>`<option value="${x}" ${TX_ANSWERS[q.id]===x?'selected':''}>Correct: Option ${x+1}</option>`).join('')}</select><input class="inp" type="number" min="0.01" step="any" data-txmarks="${q.id}" value="${Number(q.marks||1)}"></div></div>`;if(q.type==='truefalse')return `<div class="border rounded-2xl p-4"><div class="flex justify-between"><b>Q${i+1}. True / False</b><button type="button" class="text-red-600 font-bold" data-txdel="${q.id}">Delete</button></div><input class="inp mt-3" data-txtext="${q.id}" value="${esc(q.text)}" placeholder="Statement / Question"><div class="grid md:grid-cols-2 gap-2 mt-2"><select class="inp" data-txtf="${q.id}">${['True','False'].includes(TX_ANSWERS[q.id])?'':'<option value="">Answer key missing</option>'}<option value="True" ${TX_ANSWERS[q.id]==='True'?'selected':''}>Correct: True</option><option value="False" ${TX_ANSWERS[q.id]==='False'?'selected':''}>Correct: False</option></select><input class="inp" type="number" min="0.01" step="any" data-txmarks="${q.id}" value="${Number(q.marks||1)}"></div></div>`;if(q.type==='fill')return `<div class="border rounded-2xl p-4"><div class="flex justify-between"><b>Q${i+1}. Fill in the Blanks</b><button type="button" class="text-red-600 font-bold" data-txdel="${q.id}">Delete</button></div><input class="inp mt-3" data-txtext="${q.id}" value="${esc(q.text)}" placeholder="Question with ______"><div class="grid md:grid-cols-2 gap-2 mt-2"><input class="inp" data-txfill="${q.id}" value="${esc((Array.isArray(TX_ANSWERS[q.id])?TX_ANSWERS[q.id]:[TX_ANSWERS[q.id]||'']).join(' | '))}" placeholder="Accepted answers separated by |"><input class="inp" type="number" min="0.01" step="any" data-txmarks="${q.id}" value="${Number(q.marks||1)}"></div></div>`;return `<div class="border rounded-2xl p-4"><div class="flex justify-between"><b>Q${i+1}. Subjective</b><button type="button" class="text-red-600 font-bold" data-txdel="${q.id}">Delete</button></div><textarea class="inp mt-3 min-h-24" data-txtext="${q.id}" placeholder="Subjective question">${esc(q.text)}</textarea><input class="inp mt-2" type="number" min="0.01" step="any" data-txmarks="${q.id}" value="${Number(q.marks||2)}"></div>`}).map((html,i)=>html.replace(/<\/div>$/,txDiagramToolbar(visible[i])+'</div>')).join('');
  $('txQList').querySelectorAll('[data-txtext]').forEach(x=>x.oninput=()=>{const q=TX_QUESTIONS.find(q=>q.id===x.dataset.txtext);if(q)q.text=x.value});$('txQList').querySelectorAll('[data-txopt]').forEach(x=>x.oninput=()=>{const q=TX_QUESTIONS.find(q=>q.id===x.dataset.txopt);if(q)q.options[+x.dataset.oi]=x.value});$('txQList').querySelectorAll('[data-txcorrect]').forEach(x=>x.onchange=()=>TX_ANSWERS[x.dataset.txcorrect]=x.value===''?null:Number(x.value));$('txQList').querySelectorAll('[data-txtf]').forEach(x=>x.onchange=()=>TX_ANSWERS[x.dataset.txtf]=x.value);$('txQList').querySelectorAll('[data-txfill]').forEach(x=>x.oninput=()=>TX_ANSWERS[x.dataset.txfill]=x.value.split('|').map(v=>v.trim()).filter(Boolean));$('txQList').querySelectorAll('[data-txmarks]').forEach(x=>x.oninput=()=>{const q=TX_QUESTIONS.find(q=>q.id===x.dataset.txmarks);if(q){q.marks=Number(x.value);txSyncTotal()}});$('txQList').querySelectorAll('[data-txdel]').forEach(x=>x.onclick=()=>{delete TX_ANSWERS[x.dataset.txdel];TX_QUESTIONS=TX_QUESTIONS.filter(q=>q.id!==x.dataset.txdel);txRenderQList()});txBindDiagrams();txRenderAdvancedQList()
}
function txRenderAdvancedQList(){if(!$('txAdvancedQList'))return;txSyncTotal();$('txAdvancedQList').innerHTML=TX_QUESTIONS.length?TX_QUESTIONS.map((q,i)=>`<div class="border rounded-2xl p-4" data-bank-question="${q.id}"><div><label><input type="checkbox" data-txselect="${q.id}" ${q.selected!==false?'checked':''}> Select Q${i+1}</label> • ${esc(q.type)} • ${esc(q.section||'')} <button type="button" data-txedit="${q.id}">Edit</button> <button type="button" data-txdel="${q.id}">Delete</button> <button type="button" data-txregen="${q.id}">Regenerate this question</button> <button type="button" data-txalternative="${q.id}">Generate new alternative</button> <button type="button" data-txup="${q.id}">↑</button> <button type="button" data-txdown="${q.id}">↓</button></div><textarea class="inp mt-2" data-txtext="${q.id}">${esc(q.text)}</textarea>${q.type==='mcq'?q.options.map((o,j)=>`<input class="inp" data-txopt="${q.id}" data-oi="${j}" value="${esc(o)}" aria-label="Option ${j+1}">`).join(''):''}${q.type==='mcq'?`<select class="inp" data-txcorrect="${q.id}"><option value="">Answer key missing</option>${q.options.map((o,j)=>`<option value="${j}" ${TX_ANSWERS[q.id]===j?'selected':''}>Correct: ${String.fromCharCode(65+j)}. ${esc(o)}</option>`).join('')}</select>`:q.type==='truefalse'?`<select class="inp" data-txtf="${q.id}"><option value="">Answer key missing</option>${['True','False'].map(v=>`<option ${TX_ANSWERS[q.id]===v?'selected':''}>${v}</option>`).join('')}</select>`:`<textarea class="inp" ${q.type==='fill'?'data-txfill':'data-txrubric'}="${q.id}" placeholder="${q.type==='fill'?'Accepted answers separated by |':'Private model answer / marking guide'}">${esc(Array.isArray(TX_ANSWERS[q.id])?TX_ANSWERS[q.id].join(' | '):TX_ANSWERS[q.id]||'')}</textarea>`}<label>Marks <input class="inp" type="number" min="0.01" step="any" data-txmarks="${q.id}" value="${q.marks}"></label></div>`).join(''):'<p>No bank questions yet. Add manually, generate or import a PDF.</p>';
 const root=$('txAdvancedQList');root.querySelectorAll('[data-txselect]').forEach(b=>b.onchange=()=>{TX_QUESTIONS.find(q=>q.id===b.dataset.txselect).selected=b.checked;txSyncTotal();if($('txSelectedPreview').innerHTML)txRenderSelectedPreview();});root.querySelectorAll('[data-txtext]').forEach(b=>b.oninput=()=>{TX_QUESTIONS.find(q=>q.id===b.dataset.txtext).text=b.value;txSyncTotal();});root.querySelectorAll('[data-txopt]').forEach(b=>b.oninput=()=>{TX_QUESTIONS.find(q=>q.id===b.dataset.txopt).options[+b.dataset.oi]=b.value;txSyncTotal();});root.querySelectorAll('[data-txcorrect]').forEach(b=>b.onchange=()=>TX_ANSWERS[b.dataset.txcorrect]=b.value===''?null:Number(b.value));root.querySelectorAll('[data-txtf]').forEach(b=>b.onchange=()=>TX_ANSWERS[b.dataset.txtf]=b.value||null);root.querySelectorAll('[data-txfill]').forEach(b=>b.oninput=()=>TX_ANSWERS[b.dataset.txfill]=b.value.split('|').map(s=>s.trim()).filter(Boolean));root.querySelectorAll('[data-txrubric]').forEach(b=>b.oninput=()=>TX_ANSWERS[b.dataset.txrubric]=b.value);root.querySelectorAll('[data-txmarks]').forEach(b=>b.oninput=()=>{TX_QUESTIONS.find(q=>q.id===b.dataset.txmarks).marks=Number(b.value);txSyncTotal();});root.querySelectorAll('[data-txdel]').forEach(b=>b.onclick=()=>{if(!confirm('Delete this bank question and its private answer?'))return;TX_QUESTIONS=TX_QUESTIONS.filter(q=>q.id!==b.dataset.txdel);delete TX_ANSWERS[b.dataset.txdel];txRenderQList();});for(const [attr,fn]of [['txedit',b=>root.querySelector('[data-txtext="'+b.dataset.txedit+'"]').focus()],['txregen',b=>txQuestionAI(b.dataset.txregen)],['txalternative',b=>txQuestionAI(b.dataset.txalternative,true)],['txup',b=>txMoveQuestion(b.dataset.txup,-1)],['txdown',b=>txMoveQuestion(b.dataset.txdown,1)]])root.querySelectorAll('[data-'+attr+']').forEach(b=>b.onclick=()=>fn(b));
 if($('txTranslationVersions'))$('txTranslationVersions').textContent=EA.LANGUAGES.filter(l=>l!==TX_AUTHOR.language).map(l=>l+': '+(TX_AUTHOR.variants[l]?.reviewed&&TX_AUTHOR.variants[l].bankSource===txBankSource()?'approved':'needs review')).join(' • ');


}
function txValidate(status){try{EA.assertDistinct(TX_QUESTIONS);}catch(e){return e.message;}const classId=$('txClass')?.value||'',title=$('txTitle')?.value.trim()||'',start=$('txStartAt')?.value||'',end=$('txEndAt')?.value||'',total=txSelected().reduce((a,q)=>a+Number(q.marks||0),0),pass=Number($('txPassMarks')?.value||0);if(!classId)return'Select assigned batch';if(!title)return'Assessment title is required';if(status==='published'&&!start)return'Start date/time is required before publish';if(status==='published'&&!txSelected().length)return'Select at least one bank question';if(!TX_QUESTIONS.length)return'Add bank questions first';if(!Number.isFinite(Number($('txDuration').value))||Number($('txDuration').value)<=0)return'Enter a positive examination duration';if(new Set(txSelected().map(q=>q.id)).size!==txSelected().length)return'Question IDs must be unique';for(const [i,q] of txSelected().entries()){if(!String(q.text||'').trim())return`Question ${i+1} is empty`;if(!Number.isFinite(Number(q.marks))||Number(q.marks)<=0)return`Question ${i+1}: marks must be greater than 0`;if(status==='published'&&q.type==='mcq'&&(!Number.isInteger(TX_ANSWERS[q.id])||TX_ANSWERS[q.id]<0||TX_ANSWERS[q.id]>3))return`MCQ ${i+1}: select a valid correct option`;if(status==='published'&&q.type==='truefalse'&&!['True','False'].includes(TX_ANSWERS[q.id]))return`True/False ${i+1}: select the correct answer`;if(q.type==='mcq'&&(q.options||[]).length!==4)return`MCQ ${i+1}: 4 options are required`;if(q.type==='mcq'&&new Set((q.options||[]).map(o=>String(o).trim().toLowerCase())).size!==4)return`MCQ ${i+1}: options must be distinct`;if(q.type==='mcq'&&(q.options||[]).some(o=>!String(o||'').trim()))return`MCQ ${i+1}: all 4 options are required`;if(status==='published'&&q.type==='fill'&&(!Array.isArray(TX_ANSWERS[q.id])||!TX_ANSWERS[q.id].length||TX_ANSWERS[q.id].some(v=>!String(v).trim())))return`Fill ${i+1}: accepted answer required`}if(!Number.isFinite(pass)||pass<0||pass>total)return'Passing marks must be between 0 and total marks';if(start&&end&&new Date(end)<=new Date(start))return'End time must be after start time';return''}
async function txSave(status='draft'){
 if(TX_AUTHOR.saving||TX_AI_BUSY||TX_AUTHOR_JOB?.running)return toast('Wait for the current operation to finish.');if(TX_AUTHOR.loadingKeys)return toast('Wait for the saved bank to load.');if(TX_PREVIEW)return toast('Review/add or discard the preview first.');
 const err=txValidate(status);if(err)return toast(err);if(status==='published'&&!$('txBatchID').value.trim())return toast('Enter the verified actual Batch ID.');if(status==='published'&&!confirm(`Approve and publish exactly ${txSelected().length} selected questions from the ${TX_QUESTIONS.length}-question bank? Every Student receives this same set.`))return;
 TX_AUTHOR.saving=true;const captured=EA.signature(TX_QUESTIONS,TX_ANSWERS);
 try{
  await txAssertEditable();if(captured!==EA.signature(TX_QUESTIONS,TX_ANSWERS))throw Error('Bank changed while checking the saved draft. Save again.');
  const classId=$('txClass').value,c=cl.find(x=>x.id===classId),id=TX_EDIT_ID||doc(collection(db,'exams')).id,old=TX_EXAMS.find(x=>x.id===id),selected=txSelected(),answers=txSelectedAnswers(),totalMarks=selected.reduce((sum,q)=>sum+Number(q.marks),0),passingMarks=Number($('txPassMarks').value||0),publicQuestions=selected.map(q=>({id:q.id,type:q.type,text:String(q.text||'').trim(),options:['mcq','truefalse'].includes(q.type)?[...q.options]:[],marks:Number(q.marks),...v35DiagramProjection(q)}));v35DiagramBudget(publicQuestions);
  let attachment=old?.attachment||null;const file=$('txFile')?.files?.[0];if(file){if(file.size>10*1024*1024)throw Error('Attachment max size is 10 MB');const up=await cloud(file,`opjcc/live-assessment/${me.uid}/${classId}`);attachment={name:file.name,type:file.type||'',size:file.size,url:up.secure_url};}
  const questionHash=await EA.digest(publicQuestions,{}),approvalHash=await EA.digest(publicQuestions,answers),questionLanguages=await EA.publicQuestionLanguages(publicQuestions,answers,TX_AUTHOR.variants,{bankQuestions:TX_QUESTIONS,bankAnswers:TX_ANSWERS});
  const privateBank={schema:1,language:TX_AUTHOR.language,questions:structuredClone(TX_QUESTIONS),answers:structuredClone(TX_ANSWERS),warnings:structuredClone(TX_AUTHOR.pdfWarnings||[])},privatePayload={examId:id,classId,teacherId:me.uid,answers,questionBank:privateBank,approved:status==='published',approvalHash,approvedBy:me.uid,authoringVariants:structuredClone(TX_AUTHOR.variants),updatedAt:txStamp()};
  if(new TextEncoder().encode(JSON.stringify(privatePayload)).length>900000)throw Error('Bank and translations exceed safe document size. Split into smaller banks; nothing was saved.');
  const payload={id,title:$('txTitle').value.trim(),assessmentType:$('txAssessmentType').value,classId,className:c?.className||c?.name||classId,projectType:c?.projectType||'',batchId:$('txBatchID').value.trim(),nosCode:$('txNOS').value,section:old?.section||'',topic:$('txTopic').value,paperLanguage:TX_AUTHOR.language,examSchema:2,examProtocolVersion:1,approval:{approved:status==='published',teacherId:me.uid,questionHash,approvedAt:status==='published'?txStamp():null},clientWriteToken:crypto.randomUUID(),startAtMs:$('txStartAt').value?new Date($('txStartAt').value).getTime():0,endAtMs:$('txEndAt').value?new Date($('txEndAt').value).getTime():0,questionPaperId:old?.questionPaperId||('OPJCC-QP-'+id),teacherId:me.uid,teacherName:p?.name||'',startAt:$('txStartAt').value,endAt:$('txEndAt').value,duration:Number($('txDuration').value),passingMarks,passingPercent:totalMarks?passingMarks*100/totalMarks:0,instructions:$('txInstructions').value.trim(),attachment,archived:false,questions:publicQuestions,questionLanguages,totalMarks,gradePublished:false,createdAt:old?.createdAt||txStamp(),updatedAt:txStamp()};
  let created=false;await runTransaction(db,async t=>{const ref=doc(db,'exams',id),snapshot=await t.get(ref);created=!snapshot.exists();if(snapshot.exists()){const current=snapshot.data();if(current.status!=='draft'||current.publishedAt||current.approval?.approved)throw Error('Paper was published by another session. Create a draft copy instead.');}if(captured!==EA.signature(TX_QUESTIONS,TX_ANSWERS))throw Error('Bank changed during saving. Save again.');t.set(doc(db,'examAnswerKeys',id),privatePayload,{merge:true});t.set(ref,{...payload,approval:snapshot.exists()?payload.approval:{...payload.approval,approved:false,approvedAt:null},status:snapshot.exists()?status:'draft',publishedAt:snapshot.exists()&&status==='published'?txStamp():null},{merge:snapshot.exists()});});
  TX_EDIT_ID=id;if(created&&status==='published')await updateDoc(doc(db,'exams',id),{status:'published',approval:payload.approval,publishedAt:txStamp(),updatedAt:txStamp()});
  TX_EDIT_ID=id;$('txEditor').classList.add('hidden');toast(status==='published'?'Assessment published':'Assessment saved as draft');
 }catch(e){console.error('Assessment save',e);toast('Assessment save failed: '+(e.message||e.code));}finally{TX_AUTHOR.saving=false;}
}
window.txReviewExam=id=>{const sel=$('txResultExam');if(sel)sel.value=id;txTab('results');txRenderResults()};
window.txExtendRepublish=async id=>{const a=TX_EXAMS.find(x=>x.id===id);if(!a)return;const current=(a.endAt||'').slice(0,16),endAt=prompt('New exam closing date/time (YYYY-MM-DDTHH:MM):',current||new Date(Date.now()+3600000).toISOString().slice(0,16));if(!endAt)return;if(!confirm(`Re-publish / extend this exam until ${endAt.replace('T',' ')}?`))return;try{await updateDoc(doc(db,'exams',id),{endAt,status:'published',republished:true,republishedAt:txStamp(),updatedAt:txStamp()});toast('Exam extended and re-published.')}catch(e){console.error(e);toast('Could not extend exam: '+(e.message||e))}};
window.txPublishExamGrades=async(id,value)=>{const rows=TX_ATTEMPTS.filter(a=>a.examId===id&&a.status==='submitted'&&a.archived!==true);if(!rows.length)return toast('No submitted results found.');const k=await getDoc(doc(db,'examAnswerKeys',id)),grades=k.exists()?k.data().verifiedResults||{}:{};if(value&&rows.some(a=>!grades[a.id]?.teacherVerified))return toast('Verify every submitted result before publishing this batch.');if(!confirm(`${value?'Publish':'Unpublish'} grades for ${rows.length} submitted student(s)?`))return;for(const a of rows)await window.txPublishGrade(a.id,value);toast(value?'Grades published.':'Grades unpublished.')};
async function txExamResultPdf(id){
 const exam=TX_EXAMS.find(x=>x.id===id);if(!exam)return;const host=document.createElement('div');host.style.cssText='position:fixed;left:0;top:0;width:297mm;z-index:-99999;pointer-events:none';document.body.append(host);
 try{await txHydrateVerified();const reports=await import('./exam-reports.js'),qr=await import('./vendor/qr.js'),snap=await getDocs(query(collection(db,'enrollments'),where('classId','==',exam.classId))),roster=new Map(snap.docs.map(d=>[d.data().studentId,d.data()])),records=TX_ATTEMPTS.filter(a=>a.examId===id&&a.status==='submitted'&&a.archived!==true).map(a=>({attempt:a,profile:roster.get(a.studentId)||{}})),reportId=await reports.reportID('RES',exam),qrURL=await qr.toDataURL(reportId,{errorCorrectionLevel:'M',margin:1,width:200}),logo=new URL('./icons/apple-touch-icon.png',location.href).href;
 const output=await reports.combinedPages(exam,records,logo,qrURL,{measureRoot:host,id:reportId});await reports.downloadReport(output,host,`${safeFileName(exam.title||'Examination')}_Combined_Result.pdf`);
 }catch(e){console.error('Exam Result PDF:',e);toast('Result PDF failed: '+e.message)}finally{host.remove()}
}
window.txExamResultPdf=txExamResultPdf;
async function txExamSubmissionPdf(id){
 const attempt=TX_ATTEMPTS.find(a=>a.id===id),exam=TX_EXAMS.find(x=>x.id===attempt?.examId);if(!attempt||!exam)return;const host=document.createElement('div');host.style.cssText='position:fixed;left:0;top:0;width:210mm;z-index:-99999;pointer-events:none';document.body.append(host);
 try{await txHydrateVerified();let profile={};const en=await getDocs(query(collection(db,'enrollments'),where('classId','==',exam.classId),where('studentId','==',attempt.studentId)));if(!en.empty)profile=en.docs[0].data();const reports=await import('./exam-reports.js'),qr=await import('./vendor/qr.js'),reportId=await reports.reportID('ANS',exam,attempt),qrURL=await qr.toDataURL(reportId,{errorCorrectionLevel:'M',margin:1,width:200}),logo=new URL('./icons/apple-touch-icon.png',location.href).href;
 const output=await reports.answerPages(exam,attempt,profile,logo,qrURL,{measureRoot:host,id:reportId});await reports.downloadReport(output,host,`${safeFileName(profile.studentName||attempt.studentName||'Student')}_Individual_Answer.pdf`);
 }catch(e){console.error('Exam Submission PDF:',e);toast('Submission PDF failed: '+e.message)}finally{host.remove()}
}
window.txExamSubmissionPdf=txExamSubmissionPdf;
window.txQuestionPdf=txQuestionPdf;
window.txEdit=async id=>{const x=TX_EXAMS.find(a=>a.id===id);if(!x)return;if(x.status!=='draft'||x.publishedAt||x.approval?.approved){if(!confirm('Published/used papers are protected. Create a separate editable draft copy?'))return;txEditor({...x,id:'',title:(x.title||'Exam')+' — Draft copy',status:'draft',publishedAt:null});TX_EDIT_ID='';await txLoadKey(id);return;}txEditor(x)};
window.txStatus=async(id,status)=>{if(status==='published')return window.txEdit(id);if(!['draft','closed'].includes(status))return toast('Invalid examination status.');const x=TX_EXAMS.find(x=>x.id===id);if(status==='draft'&&(x?.status!=='draft'||x?.publishedAt))return window.txEdit(id);await updateDoc(doc(db,'exams',id),{status,updatedAt:txStamp()})};
window.txArchive=async id=>{if(confirm('Archive this assessment?'))await updateDoc(doc(db,'exams',id),{archived:true,status:'closed',updatedAt:txStamp()})};
window.txDelete=async id=>{
  try{
    const ref=doc(db,'exams',id);
    const snap=await getDocFromServer(ref);
    if(!snap.exists())return toast('Exam not found.');
    const exam=snap.data();
    if(!me||exam.teacherId!==me.uid)
      return toast('Only the exam owner can delete this exam.');

    const attempts=await getDocsFromServer(query(
      collection(db,'examAttempts'),
      where('teacherId','==',me.uid),
      where('examId','==',id),
      limit(451)
    ));
    const eligibility=await getDocsFromServer(query(
      collection(db,'examEligibility'),
      where('teacherId','==',me.uid),
      where('examId','==',id),
      limit(451)
    ));
    const key=await getDocFromServer(doc(db,'examAnswerKeys',id));

    const count=attempts.size+eligibility.size+1+(key.exists()?1:0);
    if(count>450)
      return toast('Too many linked records. Deletion stopped safely.');

    if(attempts.docs.some(d=>['started','reopen_allowed','hold'].includes(d.data().status)))
      return toast('Active student attempt found. Close the exam first.');

    const records=[...attempts.docs,...eligibility.docs];
    if(records.some(d=>d.data().examId!==id||d.data().teacherId!==me.uid))
      throw Error('Linked record ownership mismatch.');

    if(key.exists()&&(key.data().teacherId!==me.uid||key.data().examId!==id))
      throw Error('Answer key ownership mismatch.');

    const backup={
      exportedAt:new Date().toISOString(),
      examId:id,
      exam:{id:snap.id,...exam},
      answerKey:key.exists()?{id:key.id,...key.data()}:null,
      attempts:attempts.docs.map(d=>({id:d.id,...d.data()})),
      eligibility:eligibility.docs.map(d=>({id:d.id,...d.data()}))
    };

    const blob=new Blob([JSON.stringify(backup,null,2)],
      {type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='OPJCC_EXAM_BACKUP_'+id+'.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);

    const title=exam.title||'Assessment';
    if(!confirm(
      'BACKUP DOWNLOAD STARTED.\n\nExam: '+title+
      '\nStudent attempts: '+attempts.size+
      '\nEligibility records: '+eligibility.size+
      '\n\nVerify the JSON backup file is saved.\n\nContinue?'
    ))return;

    if(prompt(
      'PERMANENT DELETE: '+title+
      '\nAll associated student attempts, marks and answers will be removed.'+
      '\nType DELETE to confirm:'
    )!=='DELETE')return;

    const batch=writeBatch(db);
    attempts.docs.forEach(d=>batch.delete(d.ref));
    eligibility.docs.forEach(d=>batch.delete(d.ref));
    if(key.exists())batch.delete(key.ref);
    batch.delete(ref);
    await batch.commit();

    toast('Exam and linked records permanently deleted.');
  }catch(e){
    console.error('Permanent exam delete failed',e);
    toast('Deletion stopped: '+e.message);
  }
};
async function txRenderEligibility(){
  if(!$('txEligList'))return;
  const eid=$('txEligExam')?.value;
  if(!eid){$('txEligList').innerHTML='<p class="text-slate-500">Select an assessment.</p>';return}
  const x=TX_EXAMS.find(e=>e.id===eid);
  if(!x){$('txEligList').innerHTML='<p class="text-red-600">Assessment not found.</p>';return}
  $('txEligList').innerHTML='<p class="text-slate-500">Loading students...</p>';
  try{
    const ens=await getDocs(query(collection(db,'enrollments'),where('classId','==',x.classId)));
    const rows=ens.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.archived!==true&&r.deleted!==true&&r.blocked!==true);
    if(!rows.length){$('txEligList').innerHTML='<p>No active students enrolled in this batch.</p>';return}
    const statusPairs=await Promise.all(rows.map(async r=>{
      try{
        const es=await getDoc(doc(db,'examEligibility',txId(eid,r.studentId)));
        return [r.studentId,es.exists()?es.data().status:''];
      }catch(err){console.warn('Eligibility read',r.studentId,err);return [r.studentId,'']}
    }));
    const em=new Map(statusPairs);
    $('txEligList').innerHTML=rows.map(r=>{
      const v=em.get(r.studentId)||'';
      return `<div class="flex flex-wrap items-center justify-between gap-3 border-b py-3"><div><b>${esc(r.studentName||r.name||r.studentId)}</b><div class="exam-small">${esc(r.rollNumber||'')} ${esc(r.fatherName||'')}</div></div><select class="inp max-w-xs" onchange="window.txSetElig('${eid}','${r.studentId}','${x.classId}',this.value)"><option value="" ${!v?'selected':''}>Not marked</option><option value="eligible" ${v==='eligible'?'selected':''}>Eligible / Present</option><option value="leave" ${v==='leave'?'selected':''}>Leave</option><option value="absent" ${v==='absent'?'selected':''}>Absent</option><option value="hold" ${v==='hold'?'selected':''}>Hold</option></select></div>`;
    }).join('');
  }catch(err){
    console.error('Eligibility students load failed',err);
    $('txEligList').innerHTML='<p class="text-red-600">Unable to load students. Check Firestore permission and enrollment data.</p>';
  }
}
window.txSetElig=async(examId,studentId,classId,status)=>{if(!status)return;await setDoc(doc(db,'examEligibility',txId(examId,studentId)),{examId,studentId,classId,teacherId:me.uid,status,updatedAt:txStamp()},{merge:true});toast('Eligibility updated live.')};
function txRenderMonitor(){if(!$('txMonitorList'))return;const rows=TX_ATTEMPTS.filter(a=>!['submitted','deleted'].includes(a.status)&&a.archived!==true);$('txMonitorList').innerHTML=rows.length?rows.map(a=>`<div class="exam-card"><span class="exam-pill ${a.status==='started'?'live':a.status}">${esc(a.status||'started')}</span><h3 class="font-black mt-2">${esc(a.studentName||a.studentId)}</h3><p>${esc(a.examTitle||a.examId)} • Warnings ${Number(a.warningCount||0)}</p><p class="exam-small">Camera: ${a.cameraOn?'ON':'—'} • Mic: ${a.micOn?'ON':'—'} • ${a.online===false?'Offline':'Online'}</p><div class="flex flex-wrap gap-2 mt-3"><button class="btn primary" onclick="window.txViewLive('${a.id}','${a.studentId}')">Live Camera/Mic</button><button class="btn border" onclick="window.txWarn('${a.id}')">Warn</button><button class="btn border" onclick="window.txAttemptStatus('${a.id}','hold')">Hold</button><button class="btn green" onclick="window.txAttemptStatus('${a.id}','started')">Resume</button><button class="btn red" onclick="window.txAttemptStatus('${a.id}','blocked')">Block</button><button class="btn border" onclick="window.txArchiveAttempt('${a.id}')">Archive</button><button class="btn red" onclick="window.txDeleteAttempt('${a.id}')">Delete</button></div></div>`).join(''):'<p class="text-slate-500">No active attempts.</p>';txWallRender()}
window.txWarn=async id=>{const a=TX_ATTEMPTS.find(x=>x.id===id),m=prompt('Warning message for student:','Please follow examination rules.');if(!m||!a)return;await updateDoc(doc(db,'examAttempts',id),{warningMessage:m,warningAt:txStamp(),updatedAt:txStamp()});await addDoc(collection(db,'examAuditEvents'),{attemptId:id,examId:a.examId,classId:a.classId,studentId:a.studentId,teacherId:me.uid,event:'TEACHER_WARNING',detail:m,createdAt:txStamp()})};
window.txAttemptStatus=async(id,status)=>{const a=TX_ATTEMPTS.find(x=>x.id===id);if(!a)return;await updateDoc(doc(db,'examAttempts',id),{status,updatedAt:txStamp()});await addDoc(collection(db,'examAuditEvents'),{attemptId:id,examId:a.examId,classId:a.classId,studentId:a.studentId,teacherId:me.uid,event:'TEACHER_'+status.toUpperCase(),detail:'Attempt '+status+' by teacher',createdAt:txStamp()})};
window.txArchiveAttempt=async id=>{if(confirm('Archive this attempt from active view?'))await updateDoc(doc(db,'examAttempts',id),{archived:true,updatedAt:txStamp()})};
window.txDeleteAttempt=async id=>{if(confirm('Delete this attempt? Student may be able to start again if still eligible.'))await deleteDoc(doc(db,'examAttempts',id))};
function txStopLive(){if(TX_VIEW_UNSUB){try{TX_VIEW_UNSUB()}catch{}TX_VIEW_UNSUB=null}if(TX_VIEW_PC){try{TX_VIEW_PC.close()}catch{}TX_VIEW_PC=null}if($('txRemoteVideo'))$('txRemoteVideo').srcObject=null;if($('txViewerBox'))$('txViewerBox').classList.add('hidden')}
window.txViewLive=txViewLive;
function txRenderReopen(){
  const box=$('terList');if(!box)return;
  const all=TX_ATTEMPTS.filter(a=>a.archived!==true&&a.status!=='deleted');
  if($('terSubmitted'))$('terSubmitted').textContent=all.filter(a=>a.status==='submitted').length;
  if($('terAllowed'))$('terAllowed').textContent=all.filter(a=>a.status==='reopen_allowed'||a.reopenAllowed===true).length;
  if($('terRunning'))$('terRunning').textContent=all.filter(a=>a.status==='started').length;
  const q=($('terSearch')?.value||'').trim().toLowerCase();
  let rows=all.filter(a=>['submitted','reopen_allowed','started','hold','blocked'].includes(a.status));
  if(q)rows=rows.filter(a=>[a.studentName,a.examTitle,a.className,a.classId,a.status].some(v=>String(v||'').toLowerCase().includes(q)));
  rows.sort((a,b)=>(b.updatedAt?.seconds||b.submittedAt?.seconds||0)-(a.updatedAt?.seconds||a.submittedAt?.seconds||0));
  box.innerHTML=rows.length?rows.map(a=>{const canReopen=a.status==='submitted',allowed=a.status==='reopen_allowed'||a.reopenAllowed===true,label=allowed?'REOPEN ALLOWED':String(a.status||'—').toUpperCase();return `<div class="card p-5"><div class="flex flex-wrap justify-between gap-4"><div class="min-w-0 flex-1"><div class="font-black text-lg">${esc(a.studentName||a.studentId||'Student')}</div><div class="text-sm mt-1"><b>Exam:</b> ${esc(a.examTitle||a.examId||'—')}</div><div class="text-sm"><b>Batch:</b> ${esc(a.className||a.classId||'—')}</div><div class="text-sm"><b>Status:</b> ${esc(label)}</div>${allowed?`<div class="mt-2 text-emerald-700 font-bold">Student can reopen once • ${Number(a.reopenDurationMinutes||15)} min</div>`:''}</div><div class="flex flex-wrap gap-2 items-start">${canReopen?`<button class="btn green" onclick="window.teacherAllowExamReopen('${a.id}')">Allow Reopen</button>`:''}${allowed?`<button class="btn border" onclick="window.teacherCancelExamReopen('${a.id}')">Cancel Permission</button>`:''}<button class="btn red" onclick="window.txDeleteAttempt('${a.id}')">Delete Response</button></div></div></div>`}).join(''):'<div class="card p-5 text-slate-500">No exam responses found.</div>';
}
window.teacherAllowExamReopen=async id=>{const a=TX_ATTEMPTS.find(x=>x.id===id);if(!a||a.status!=='submitted')return toast('Only submitted exam can be reopened.');const raw=prompt('Reopen time in minutes:',String(a.reopenDurationMinutes||15));if(raw===null)return;const minutes=Math.max(1,Math.min(240,Math.round(Number(raw)||15)));if(!confirm(`Allow ${a.studentName||'this student'} to reopen "${a.examTitle||'exam'}" for ${minutes} minutes? Existing answers will remain saved.`))return;try{await updateDoc(doc(db,'examAttempts',id),{status:'reopen_allowed',reopenAllowed:true,reopenDurationMinutes:minutes,reopenGrantedAt:txStamp(),reopenGrantedBy:me.uid,reopenGrantedByName:p?.name||'Teacher',previousSubmittedAt:a.submittedAt||null,submittedAt:null,cameraOn:false,micOn:false,online:false,gradePublished:false,updatedAt:txStamp()});await addDoc(collection(db,'examAuditEvents'),{attemptId:id,examId:a.examId||'',classId:a.classId||'',studentId:a.studentId||'',teacherId:me.uid,event:'TEACHER_REOPEN_ALLOWED',detail:`Teacher allowed exam reopen for ${minutes} minutes`,createdAt:txStamp()}).catch(()=>{});toast('Reopen permission granted.')}catch(e){console.error(e);toast('Could not allow reopen: '+(e.message||e))}};
window.teacherCancelExamReopen=async id=>{const a=TX_ATTEMPTS.find(x=>x.id===id);if(!a)return;if(!confirm('Cancel this reopen permission?'))return;try{await updateDoc(doc(db,'examAttempts',id),{status:'submitted',reopenAllowed:false,reopenDurationMinutes:0,submittedAt:a.previousSubmittedAt||txStamp(),updatedAt:txStamp()});await addDoc(collection(db,'examAuditEvents'),{attemptId:id,examId:a.examId||'',classId:a.classId||'',studentId:a.studentId||'',teacherId:me.uid,event:'TEACHER_REOPEN_CANCELLED',detail:'Teacher cancelled reopen permission',createdAt:txStamp()}).catch(()=>{});toast('Reopen permission cancelled.')}catch(e){console.error(e);toast('Could not cancel permission: '+(e.message||e))}};
window.txRecoverDeviceBackup=async()=>{const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const file=input.files[0];if(!file)return;const data=JSON.parse(await file.text()),exam=TX_EXAMS.find(e=>e.id===data.payload?.descriptor?.examId);if(!exam)throw Error('Select/load the examination belonging to this backup first.');const module=await import('./exam-recovery.js');await module.openRecovery({file,exam,uid:me.uid,api:{db,doc,getDocFromServer,runTransaction,deleteField,serverTimestamp},refresh:async()=>{toast('Recovery accepted. Review and grade before publication.')}})}catch(e){toast('Recovery not accepted: '+e.message)}};input.click()};
async function txRenderResults(){if($('txResultList')&&!$('txDeviceRecovery')){const b=document.createElement('button');b.id='txDeviceRecovery';b.className='btn border';b.textContent='Review Student Device Backup';b.onclick=window.txRecoverDeviceBackup;$('txResultList').before(b);}if(!$('txResultList'))return;const eid=$('txResultExam')?.value;if(!eid){$('txResultList').innerHTML='<p class="text-slate-500">Select an exam.</p>';return}const rows=TX_ATTEMPTS.filter(a=>a.examId===eid&&a.status==='submitted'&&a.archived!==true);$('txResultList').innerHTML=rows.length?rows.map(a=>`<div class="exam-card mb-3"><div class="flex flex-wrap justify-between gap-4"><div class="flex gap-3">${a.examPhotoURL?`<img src="${esc(a.examPhotoURL)}" class="w-16 h-20 object-cover rounded-lg border" alt="Exam selfie">`:''}<div><b>${esc(a.studentName||a.studentId)}</b><p>${a.teacherVerified?`${Number(a.score||0)}/${Number(a.totalMarks||0)} • ${Number(a.percentage||0).toFixed(1)}% • ${esc(a.grade||'')}`:'Awaiting verification'}</p><p class="exam-small">Result: ${a.gradePublished?'Published':'Not published'}</p></div></div><div class="flex flex-wrap gap-2 items-start"><button class="btn primary" onclick="window.txGrade('${a.id}')">Review / Grade</button><button class="btn border" onclick="window.txExamSubmissionPdf('${a.id}')">Submission PDF</button>${a.teacherVerified?`<button class="btn green" onclick="window.txPublishGrade('${a.id}',${a.gradePublished?'false':'true'})">${a.gradePublished?'Unpublish':'Publish'} Result</button>`:''}<button class="btn border" onclick="window.txArchiveAttempt('${a.id}')">Archive</button><button class="btn red" onclick="window.txDeleteAttempt('${a.id}')">Delete Response</button></div></div></div>`).join(''):'<p>No submitted attempts.</p>'}
function txReviewStable(value){
  if(Array.isArray(value))return value.map(txReviewStable);
  if(value&&typeof value==='object'){
    return Object.fromEntries(Object.keys(value).sort().map(k=>[k,txReviewStable(value[k])]));
  }
  return value;
}
function txReviewAnswers(value){return JSON.stringify(txReviewStable(value||{}));}
async function txReviewPaperFingerprint(questions,approvedKeys){
  const canonical=JSON.stringify(txReviewStable({questions:questions||[],approvedKeys:approvedKeys||{}}));
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
window.txGrade=async id=>{
  const cached=TX_ATTEMPTS.find(x=>x.id===id);if(!cached)return;
  let a,exam,keydoc;
  try{
    const [attemptDoc,paperDoc,privateDoc]=await Promise.all([
      getDocFromServer(doc(db,'examAttempts',id)),
      getDocFromServer(doc(db,'exams',cached.examId)),
      getDocFromServer(doc(db,'examAnswerKeys',cached.examId))
    ]);
    if(!attemptDoc.exists()||!paperDoc.exists()||!privateDoc.exists())throw Error('Attempt, exam or private key not found.');
    a={id,...attemptDoc.data()};exam={id:paperDoc.id,...paperDoc.data()};keydoc=privateDoc;
    if(a.examId!==exam.id||a.teacherId!==me.uid||exam.teacherId!==me.uid||keydoc.data().teacherId!==me.uid)throw Error('Review access or exam identity changed.');
  }catch(e){return toast('Cannot open current server review: '+(e.message||e));}
  if(a.status!=='submitted')return toast('Only submitted answers can be verified.');
 if(a.gradePublished)return toast('Unpublish this result before changing verified marks.');
 const keys=keydoc.data().answers||{},qs=exam.questions||[];
 const total=Number(qs.reduce((s,q)=>s+Number(q.marks||0),0).toFixed(2));
 if(!Number.isFinite(total)||total<=0)return toast('Invalid exam maximum marks.');
 const old=document.getElementById('txReviewOverlay');if(old)old.remove();
 const layer=document.createElement('div');layer.id='txReviewOverlay';layer.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(15,23,42,.75);display:flex;align-items:center;justify-content:center;padding:12px';
 let header=`<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2 style="font-size:19px;font-weight:900">Teacher Verification — ${esc(a.studentName||a.name||a.studentId||'Student')}</h2><button id="txReviewClose" type="button" class="btn border">Close</button></div><div style="margin:8px 0;padding:10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;color:#1e3a8a"><b>Paper Maximum: ${total} marks</b> (${qs.length} questions)${Number(exam.totalMarks||0)!==total?' • WARNING: Saved exam.totalMarks='+Number(exam.totalMarks||0):''}${Number(a.totalMarks||0)!==total?' • Attempt snapshot='+Number(a.totalMarks||0):''}<div style="font-size:12px">Suggestions are NOT AI grading. Every question requires your explicit review; partial marks 0.5 / 1 / 1.5 / 2 are allowed within question maximum. Nothing is published here.</div></div>`;
 const rows=qs.map((q,i)=>{const ans=(a.answers||{})[q.id],key=keys[q.id],hint=txReviewSuggestion(q,ans,key),prev=Number(a.questionScores?.[q.id]),initial=Number.isFinite(prev)&&prev>=0&&prev<=Number(q.marks)?prev:hint.score;
 const correct=q.type==='mcq'&&Number.isInteger(key)?(q.options||[])[key]:Array.isArray(key)?key.join(' | '):String(key??'');
 const img=typeof q.diagramSrc==='string'&&/^data:image\/(?:png|jpeg|webp);base64,/.test(q.diagramSrc)?`<img src="${q.diagramSrc}" alt="Question diagram" style="max-width:320px;max-height:150px;object-fit:contain;display:block;margin:5px auto">`:'';
 return `<section data-review-row="${i}" style="border:1px solid #dbe3ef;border-radius:12px;padding:12px;margin-top:10px;background:white;color:#0f172a"><b>Q${i+1}. [${esc(q.type)}] Maximum ${Number(q.marks)} marks</b><div style="margin-top:5px;white-space:pre-wrap">${esc(q.text)}</div>${img}<div style="font-size:13px;margin-top:6px"><b>Student:</b> ${esc(ans===undefined||ans===null||String(ans)===''?'(Blank)':ans)}</div><div style="font-size:13px"><b>Key:</b> ${esc(correct||'(Not provided)')}</div><div style="font-size:12px;color:#475569">Suggestion: ${hint.score} / ${Number(q.marks)}. ${esc(hint.note)}</div><div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:8px"><label>Teacher marks <input data-review-score="${i}" type="number" min="0" max="${Number(q.marks)}" step="0.5" value="${initial}" style="width:95px;border:1px solid #64748b;border-radius:6px;padding:6px;margin-left:4px"></label><label style="display:flex;align-items:center;gap:5px"><input data-review-ok="${i}" type="checkbox"> <b>I reviewed this answer</b></label></div></section>`}).join('');
 layer.innerHTML=`<div style="background:#fff;color:#0f172a;border-radius:16px;max-width:850px;width:100%;max-height:94vh;overflow-y:auto;padding:18px">${header}${rows}<label style="display:block;margin-top:12px"><b>Teacher feedback (optional)</b><textarea id="txReviewFeedback" style="display:block;width:100%;min-height:65px;border:1px solid #94a3b8;border-radius:8px;padding:8px">${esc(a.feedback||'')}</textarea></label><div style="position:sticky;bottom:0;padding:12px 0;background:white;border-top:1px solid #ddd;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b id="txReviewProgress">0/${qs.length} reviewed</b><button id="txReviewSave" type="button" class="btn primary">Save Teacher Verified Marks (Not Published)</button></div></div>`;
 document.body.append(layer);layer.querySelector('#txReviewClose').onclick=()=>layer.remove();
 const progress=()=>{let n=layer.querySelectorAll('[data-review-ok]:checked').length;layer.querySelector('#txReviewProgress').textContent=n+'/'+qs.length+' reviewed';};layer.querySelectorAll('[data-review-ok]').forEach(el=>el.onchange=progress);layer.querySelectorAll('[data-review-score]').forEach(el=>el.oninput=()=>{layer.querySelector('[data-review-ok="'+el.dataset.reviewScore+'"]').checked=false;progress();});
 layer.querySelector('#txReviewSave').onclick=async()=>{try{
  if(layer.querySelectorAll('[data-review-ok]:checked').length!==qs.length)throw Error('Review and tick every question before saving.');
  const scores={};let score=0;for(let i=0;i<qs.length;i++){const q=qs[i],el=layer.querySelector(`[data-review-score="${i}"]`),n=Number(el.value),mx=Number(q.marks);if(!el.value.trim()||!Number.isFinite(n)||n<0||n>mx||!Number.isInteger(n*2))throw Error('Q'+(i+1)+': enter marks in 0.5 increments within 0–'+mx);scores[q.id]=n;score+=n;}
  score=Number(score.toFixed(2));const pct=score*100/total;
  const verified={sourceAnswers:txReviewAnswers(a.answers||{}),sourcePaperHash:await txReviewPaperFingerprint(exam.questions||[],keys),questionScores:scores,score,percentage:pct,grade:txGrade(pct),totalMarks:total,feedback:layer.querySelector('#txReviewFeedback').value.slice(0,2000),teacherVerified:true,verifiedBy:me.uid,verifiedAt:txStamp(),updatedAt:txStamp()};
  const button=layer.querySelector('#txReviewSave');button.disabled=true;button.textContent='Saving…';
  await runTransaction(db,async t=>{const keyRef=doc(db,'examAnswerKeys',exam.id),attemptRef=doc(db,'examAttempts',id),paperRef=doc(db,'exams',exam.id),currentKey=await t.get(keyRef),currentAttempt=await t.get(attemptRef),currentPaper=await t.get(paperRef);if(!currentKey.exists()||!currentAttempt.exists()||!currentPaper.exists())throw Error('The saved examination or attempt is unavailable.');const current=currentAttempt.data(),paper=currentPaper.data(),keyData=currentKey.data();if(current.teacherId!==me.uid||paper.teacherId!==me.uid||keyData.teacherId!==me.uid||current.examId!==exam.id||current.studentId!==a.studentId||current.status!=='submitted'||current.gradePublished)throw Error('This result changed or is no longer available for private review. Reopen it.');if(txReviewAnswers(current.answers||{})!==verified.sourceAnswers)throw Error('Student answers changed since review opened. Close and reopen review.');if(await txReviewPaperFingerprint(paper.questions||[],keyData.answers||{})!==verified.sourcePaperHash)throw Error('Exam questions or approved answer key changed since review opened. Close and reopen review.');t.update(keyRef,{['verifiedResults.'+id]:verified});});Object.assign(a,verified);layer.remove();txRenderResults();toast('Teacher verification saved: '+score+'/'+total+'. NOT published.');
 }catch(e){toast(e.message);console.error('Teacher review',e);const button=layer.querySelector('#txReviewSave');if(button){button.disabled=false;button.textContent='Save Teacher Verified Marks (Not Published)'}}};
};
window.txPublishGrade=async(id,v)=>{const a=TX_ATTEMPTS.find(x=>x.id===id);if(!a||a.status!=='submitted')return toast('Only a submitted attempt can receive a result.');const k=await getDoc(doc(db,'examAnswerKeys',a.examId)),verified=k.exists()?k.data().verifiedResults?.[id]:null;if(v&&!verified?.teacherVerified)return toast('Review and verify marks before publication.');if(v){const exam=TX_EXAMS.find(x=>x.id===a.examId);if(verified.sourceAnswers!==txReviewAnswers(a.answers||{})||verified.sourcePaperHash!==await txReviewPaperFingerprint(exam.questions||[],k.data().answers||{}))return toast('Answers or paper changed. Review marks again before publication.');}await updateDoc(doc(db,'examAttempts',id),v?{...txPublicVerified(verified),gradePublished:true,updatedAt:txStamp()}:{score:null,percentage:null,grade:null,totalMarks:null,questionScores:null,feedback:null,teacherVerified:false,verifiedAt:null,verifiedBy:null,gradePublished:false,updatedAt:txStamp()})};
async function txAIRequest(){throw Error('BLOCKED: production AI Worker origin access not verified. No AI request sent.');}
async function txWallConnect(){}
async function txViewLive(){toast('Continuous streaming disabled. Use warning/status monitoring.');}

window.addEventListener('load',()=>{document.querySelectorAll('#txTabs button').forEach(b=>b.onclick=()=>txTab(b.dataset.x));$('txNew')&&($('txNew').onclick=()=>{txTab('manage');txEditor();});$('txEligExam')&&($('txEligExam').onchange=txRenderEligibility);$('txResultExam')&&($('txResultExam').onchange=txRenderResults);$('txRefreshMonitor')&&($('txRefreshMonitor').onclick=txRenderMonitor);$('txStopViewer')&&($('txStopViewer').onclick=txStopLive);$('terRefresh')&&($('terRefresh').onclick=()=>{txStart();txRenderReopen()});$('terSearch')&&($('terSearch').oninput=txRenderReopen);document.querySelector('[data-p="exams"]')?.addEventListener('click',()=>{txStart();txFillSelects()});document.querySelector('[data-p="examreopen"]')?.addEventListener('click',()=>{txStart();txRenderReopen()})});
await bootstrap('teacher',async s=>{me=s.user;p=s.profile;cl=s.classes;students=s.students;en=s.enrollments;window.me=me;txFillSelects();txEditor();txStart();document.querySelectorAll('#txTabs button').forEach(b=>b.onclick=()=>txTab(b.dataset.x));txAuthorBind();txTab('manage');});
