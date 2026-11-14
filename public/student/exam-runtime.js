import{session,api,cloud,bootstrap}from '../shared/session.js';
import{getFirestore,collection,doc,getDoc,getDocs,setDoc,updateDoc,addDoc,deleteDoc,query,where,limit,serverTimestamp,onSnapshot,arrayUnion,runTransaction,getDocFromServer}from "../shared/store.js";
const db={};let me=null,p={},cl=[],students=[],en=[];const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const toast=msg=>alert(msg);const refreshTeacherDashboardV2=()=>{};const updateStudentLiveExamDashboard=()=>{};const getTeacherActiveClasses=()=>cl;const auth={};const onAuthStateChanged=()=>()=>{};
import{diagramMarkup as v35DiagramMarkup}from'./exam-diagram.js';
import{diagramMarkup,diagramProjection,assertDiagramBudget}from './exam-diagram.js';
const day=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const SX_CAMERA_THRESHOLD_MS=3000;
function sxCameraEpisodeWarning(kind,now){
 // A sustained violation generates a new warning every 3 seconds, up to the existing 5-warning block.
 // Re-arm only after 1s of clear face detection; never double-count while Firestore sync is pending.
 if(kind){
  if(SX_CAMERA_EPISODE.kind!==kind){
   SX_CAMERA_EPISODE={kind,since:now,lastWarningAt:0,clearSince:0};
   return false;
  }
  SX_CAMERA_EPISODE.clearSince=0;
  const anchor=SX_CAMERA_EPISODE.lastWarningAt||SX_CAMERA_EPISODE.since;
  if(!SX_CAMERA_WARN_INFLIGHT&&now-anchor>=SX_CAMERA_THRESHOLD_MS){
   SX_CAMERA_EPISODE.lastWarningAt=now;
   return true;
  }
  return false;
 }
 if(SX_CAMERA_EPISODE.kind){
  if(!SX_CAMERA_EPISODE.clearSince)SX_CAMERA_EPISODE.clearSince=now;
  if(now-SX_CAMERA_EPISODE.clearSince>=1000)SX_CAMERA_EPISODE={kind:null,since:0,lastWarningAt:0,clearSince:0};
 }
 return false;
}
function sxUpdateWarningBadge(){
 const b=$('sxWarningCount');if(b){b.textContent='Warnings '+SX_LOOK_WARNINGS+'/5';b.classList.toggle('critical',SX_LOOK_WARNINGS>=3)}
}
function sxWarningPopup(msg,kind='warn'){
 let e=$('sxCameraPopup');if(!e){e=document.createElement('div');e.id='sxCameraPopup';e.setAttribute('role','alert');e.setAttribute('aria-live','assertive');document.body.append(e)}
 e.className='sx-camera-popup'+(kind==='block'?' block':'');e.textContent=msg;
 clearTimeout(SX_CAMERA_POPUP_TIMER);if(kind!=='block')SX_CAMERA_POPUP_TIMER=setTimeout(()=>e.remove(),4800);
}
let SX_VIEW='live';
function sxViewChange(view){if(SX_ACTIVE?.attempt&&['started','hold','blocked'].includes(SX_ACTIVE.attempt.status))return toast('Finish or return to your active examination before changing result views.');
 SX_VIEW=view==='results'?'results':'live';
 $('sxShowLive')?.classList.toggle('active',SX_VIEW==='live');
 $('sxShowResults')?.classList.toggle('active',SX_VIEW==='results');
 $('sxShowLive')?.setAttribute('aria-pressed',String(SX_VIEW==='live'));
 $('sxShowResults')?.setAttribute('aria-pressed',String(SX_VIEW==='results'));
 $('sxRoom')?.classList.add('hidden');
 $('sxExamList')?.classList.toggle('hidden',SX_VIEW!=='live');
 $('sxResultsHistory')?.classList.toggle('hidden',SX_VIEW!=='results');
 if(SX_VIEW==='results')sxRenderHistory();
}
function sxRenderHistory(){
 const target=$('sxResultsHistoryList');if(!target)return;
 const all=[...SX_ATTEMPTS.values()].filter(a=>a.studentId===me?.uid&&a.archived!==true);
 const submitted=all.filter(a=>a.status==='submitted');
 submitted.sort((a,b)=>{const val=x=>x?.toMillis?.()||Number(x?.seconds||0)*1000||0;return val(b.updatedAt)-val(a.updatedAt)});
 target.innerHTML=submitted.length?submitted.map(a=>{
  const published=a.status==='submitted'&&a.gradePublished===true&&a.teacherVerified===true&&Number.isFinite(Number(a.score))&&Number.isFinite(Number(a.totalMarks))&&Number(a.totalMarks)>0&&Number(a.score)>=0&&Number(a.score)<=Number(a.totalMarks);
  const exam=SX_EXAMS.get(a.examId);
  const downloadable=!!exam&&published&&exam.id===a.examId&&exam.status==='published'&&exam.archived!==true&&exam.deleted!==true&&exam.teacherId===a.teacherId&&exam.classId===a.classId;
  return `<article class="exam-card sx-result-card"><div><span class="exam-pill ${published?'live':'hold'}">${published?'Published Result':'Teacher Verification Pending'}</span><h3 class="text-lg font-black mt-2">${esc(exam?.title||a.examTitle||'Examination')}</h3><p class="exam-small">${esc(exam?.className||a.className||a.classId||'')} • ${esc(a.paperLanguage||'English')} • Submitted</p></div>${published?`<div class="sx-result-score"><b>${Number(a.score)} / ${Number(a.totalMarks)}</b><small>${Number(a.percentage||0).toFixed(1)}% • ${esc(a.grade||'')}</small></div>${downloadable?`<button type="button" class="btn primary" data-answer-sheet-exam="${esc(a.examId)}">Download A4 Answer Sheet (Student Copy)</button><p class="exam-small">Print, sign and submit to Teacher. Internet connection required.<span class="exam-small" data-answer-sheet-status role="status"></span></p>`:'<p class="exam-small" role="status">Answer sheet unavailable: the examination paper is closed, archived or not currently accessible. Ask your teacher to review its publication status.</p>'}`:'<p class="exam-small">Marks and answer sheet will appear after Teacher verifies and publishes the result.</p>'}</article>`;
 }).join(''):'<div class="exam-card">No submitted examinations yet. Your results will appear here after Teacher publishes them.</div>';

}
function sxCloseSignal(id){const pc=SX_SIGNAL_PCS.get(id);if(!pc)return;SX_SIGNAL_PCS.delete(id);try{pc._unsub?.()}catch{}try{pc.close()}catch{}}
let SX_EXAMS=new Map(),SX_ELIG=new Map(),SX_ATTEMPTS=new Map(),SX_UNSUBS=[],SX_STREAM=null,SX_ACTIVE=null,SX_ANSWERS={},SX_TIMER=null,SX_HEARTBEAT=null,SX_ATTEMPT_UNSUB=null,SX_SIGNAL_UNSUB=null,SX_SIGNAL_PCS=new Map(),SX_FACE_TIMER=null,SX_FACE_LAST=0,SX_NOFACE=0,SX_FACE_LANDMARKER=null,SX_FACE_LOADING=null,SX_LOOK_STREAK=0,SX_LOOK_WARNINGS=0,SX_LOOK_LAST_WARN=0,SX_AUTO_BLOCKING=false,SX_FULLSCREEN_SUPPORTED=false,SX_CAMERA_EPISODE={kind:null,since:0,lastWarningAt:0,clearSince:0},SX_CAMERA_WARN_INFLIGHT=false,SX_CAMERA_POPUP_TIMER=null;
let SX_RUNTIME_EXPIRES_AT=0,SX_AUTO_SUBMITTING=false;
const sxStamp=()=>serverTimestamp();
const sxId=(e,s)=>`${e}_${s}`;
function sxAndroidFinalizeMediaUI(){for(const id of ['sxLocalVideo','sxFaceVideo']){const video=$(id);if(!video)continue;try{video.pause();video.srcObject=null;video.removeAttribute('src');video.load();if(id==='sxFaceVideo')video.style.display='none'}catch{}}const status=$('sxDeviceStatus');if(status){status.dataset.mediaReady='false';status.textContent='Camera and microphone stopped.'}if($('sxBegin'))$('sxBegin').disabled=true;if($('sxStartStatus'))$('sxStartStatus').textContent='';if($('sxTimer'))$('sxTimer').textContent='--:--';if($('sxAiStatus'))$('sxAiStatus').textContent='AI Camera stopped';}
function sxStopAll(){if(sxAndroidChrome()){sxExamConfirm.cancel?.();SX_ANDROID_RUNTIME?.close();SX_ANDROID_RUNTIME=null;}if(sxAndroidChrome())sxCheckAndroidDevice.ticket=null;SX_RUNTIME_EXPIRES_AT=0;SX_AUTO_SUBMITTING=false;if(SX_TIMER)clearInterval(SX_TIMER);SX_TIMER=null;if(SX_HEARTBEAT)clearInterval(SX_HEARTBEAT);SX_HEARTBEAT=null;if(SX_FACE_TIMER)clearInterval(SX_FACE_TIMER);SX_FACE_TIMER=null;if(SX_FACE_WATCHDOG)clearInterval(SX_FACE_WATCHDOG);SX_FACE_WATCHDOG=null;SX_LAST_FACE_SAMPLE=null;SX_LOOK_STREAK=0;SX_NOFACE=0;SX_CAMERA_EPISODE={kind:null,since:0,lastWarningAt:0,clearSince:0};SX_CAMERA_WARN_INFLIGHT=false;SX_AUTO_BLOCKING=false;clearTimeout(SX_CAMERA_POPUP_TIMER);$('sxCameraPopup')?.remove();$('sxBackupOverlay')?.remove();document.body.classList.remove('sx-exam-focus');if(SX_ATTEMPT_UNSUB){try{SX_ATTEMPT_UNSUB()}catch{}SX_ATTEMPT_UNSUB=null}if(SX_SIGNAL_UNSUB){try{SX_SIGNAL_UNSUB()}catch{}SX_SIGNAL_UNSUB=null}SX_SIGNAL_PCS.forEach(pc=>{try{pc.close()}catch{}});SX_SIGNAL_PCS.clear();if(SX_STREAM){SX_STREAM.getTracks().forEach(t=>t.stop());SX_STREAM=null}if(sxAndroidChrome())sxAndroidFinalizeMediaUI();}
function sxStart(){if(!me)return;SX_UNSUBS.forEach(u=>{try{u()}catch{}});SX_UNSUBS=[];SX_EXAMS.clear();SX_ELIG.clear();SX_ATTEMPTS.clear();const ids=[...new Set((en||[]).filter(x=>x.archived!==true&&x.blocked!==true&&x.deleted!==true).map(x=>x.classId).filter(Boolean))];ids.forEach(cid=>SX_UNSUBS.push(onSnapshot(query(collection(db,'exams'),where('classId','==',cid),where('status','==','published')),s=>{[...SX_EXAMS.values()].filter(x=>x.classId===cid).forEach(x=>SX_EXAMS.delete(x.id));s.docs.forEach(d=>{const x={id:d.id,...d.data()};if(x.archived!==true)SX_EXAMS.set(d.id,x)});sxRenderList()},console.warn)));SX_UNSUBS.push(onSnapshot(query(collection(db,'examEligibility'),where('studentId','==',me.uid)),s=>{SX_ELIG.clear();s.docs.forEach(d=>SX_ELIG.set(d.data().examId,{id:d.id,...d.data()}));sxRenderList()},console.warn));SX_UNSUBS.push(onSnapshot(query(collection(db,'examAttempts'),where('studentId','==',me.uid)),s=>{SX_ATTEMPTS.clear();s.docs.forEach(d=>SX_ATTEMPTS.set(d.data().examId,{id:d.id,...d.data()}));sxRenderList()},console.warn))}
function sxRenderList(){if(!$('sxExamList'))return;const rows=[...SX_EXAMS.values()].filter(x=>SX_ATTEMPTS.get(x.id)?.status!=='submitted').sort((a,b)=>String(a.startAt||'').localeCompare(String(b.startAt||'')));$('sxExamList').innerHTML=rows.length?rows.map(x=>{const el=SX_ELIG.get(x.id),a=SX_ATTEMPTS.get(x.id),now=Date.now(),st=x.startAt?new Date(x.startAt).getTime():0,en=x.endAt?new Date(x.endAt).getTime():Infinity,reopen=a?.status==='reopen_allowed'||a?.reopenAllowed===true,windowOk=reopen||((!st||now>=st)&&now<=en),eligible=el?.status==='eligible',submitted=a?.status==='submitted';let state=reopen?'Reopen Allowed':(el?.status||'Not marked');return `<div class="exam-card"><span class="exam-pill ${(eligible||reopen)?'live':''}">${esc(state)}</span><h3 class="text-xl font-black mt-2">${esc(x.title||'Exam')}</h3><p>${esc(x.projectType||'')} • ${esc(x.className||x.classId||'')}</p><p>${(x.questions||[]).length} questions • ${Number(x.totalMarks||0)} marks • ${Number(x.duration||0)} min</p><p class="exam-small">${esc(x.startAt||'')} ${x.endAt?'→ '+esc(x.endAt):''}</p>${submitted&&a.gradePublished?`<div class="mt-3"><b>Result:</b> ${Number(a.score||0)}/${Number(a.totalMarks||x.totalMarks||0)} • ${Number(a.percentage||0).toFixed(1)}% • ${esc(a.grade||'')}<br><span class="exam-small">${esc(a.feedback||'')}</span>${a.teacherVerified===true&&a.studentId===me?.uid&&a.archived!==true?`<div class="mt-3"><button type="button" class="btn primary" data-answer-sheet-exam="${esc(x.id)}">Download Individual Answer Sheet PDF</button><p class="exam-small mt-2">Download, print and submit the signed answer sheet to your teacher. Internet connection required.</p><span class="exam-small" data-answer-sheet-status role="status"></span></div>`:''}</div>`:submitted?'<p class="font-bold mt-3">Submitted • Teacher can allow Reopen if required</p>':`<button class="btn primary mt-3" ${(!eligible||!windowOk)?'disabled':''} onclick="window.sxOpen('${x.id}')">${!eligible?'Not eligible':reopen?'Reopen Secure Exam':!windowOk?'Outside exam time':'Start Secure Exam'}</button>`}</div>`}).join(''):'<div class="card p-5 text-slate-500">No published exam for your enrolled trade/batch.</div>';sxRenderHistory();}
window.sxDownloadAnswerSheet=async id=>{try{const M=await import('./exam-answer-sheet.js');await M.downloadOwnAnswerSheet({examId:id,uid:()=>me?.uid===auth.currentUser?.uid?me.uid:null,read:async(name,id)=>{const s=await getDocFromServer(doc(db,name,id));if(!s.exists())throw Error('Your examination record is unavailable. Ask your teacher to review it.');return {...s.data(),id:s.id}}});toast('Answer sheet downloaded. Print it and submit the signed copy to your teacher.');return true}catch(e){toast('Answer sheet not downloaded: '+e.message);return false}};
document.getElementById('p-exams')?.addEventListener('click',async event=>{const button=event.target.closest('button[data-answer-sheet-exam]');if(!button||button.disabled)return;const status=button.parentElement.querySelector('[data-answer-sheet-status]');button.disabled=true;if(status)status.textContent='Preparing your answer sheet…';try{const saved=await window.sxDownloadAnswerSheet(button.dataset.answerSheetExam);if(status)status.textContent=saved?'Downloaded. Print and submit the signed copy.':'Download unavailable. See the message and try again.'}finally{button.disabled=false}});
let SX_STORE=null;
const SX_DRAFT_PENDING=new Set();
async function sxSetupAnswerStore(){SX_STORE?.close();const M=await import('./exam-answer-store.js'),x=SX_ACTIVE.exam,a=SX_ACTIVE.attempt,ref=doc(db,'examAttempts',a.id);SX_STORE=new M.AnswerStore({uid:me.uid,exam:x,attempt:a,onChange:sxAnswerState,adapter:{stamp:sxStamp,read:async()=>{const s=await (sxAndroidChrome()?Promise.race([getDocFromServer(ref),new Promise((_,reject)=>setTimeout(()=>reject(Error('Server read timed out; device backup remains active.')),12000))]):getDocFromServer(ref));if(!s.exists())throw Error('Server attempt missing.');return {id:s.id,...s.data()}},transact:fn=>runTransaction(db,async t=>{const s=await t.get(ref);if(!s.exists())throw Error('Server attempt missing.');const server={id:s.id,...s.data()},r=fn(server);if(!r.noop)t.update(ref,{...r.patch,clientWriteToken:crypto.randomUUID(),updatedAt:sxStamp()});return r.noop?server:{...server,...r.patch}},{maxAttempts:3})}});await SX_STORE.init();SX_ANSWERS={...SX_STORE.info().answers,...SX_STORE.info().drafts};}
function sxAnswerState(info){if(!SX_ACTIVE||!SX_STORE||SX_STORE.uid!==me?.uid)return;SX_ANSWERS={...info.answers,...info.drafts};const status=$('sxSaveStatus');if(status)status.textContent=info.status+(info.needsTeacher?' — Teacher review required.':'')+(info.error?' '+info.error:'');document.querySelectorAll('#sxRoom .exam-q').forEach((block,i)=>{const qid=SX_ACTIVE.questionOrder[i],pending=!!info.pending[qid],remaining=2-Number(info.revisions[qid]||0),locked=info.locked||pending||remaining<=0||info.serverStatus!=='started';block.querySelectorAll('input,textarea,button[data-confirm]').forEach(e=>e.disabled=locked);const label=block.querySelector('[data-save-label]');if(label)label.textContent=`${remaining} changes remaining after the initial saved answer. ${pending?'Saved on Device — Sync Pending':Object.hasOwn(info.drafts,qid)?'Draft on device — confirm answer':info.status}`;block.querySelectorAll('input[type=radio]').forEach(e=>e.checked=e.value===info.answers[qid]);const t=block.querySelector('textarea');if(t&&document.activeElement!==t)t.value=SX_ANSWERS[qid]||'';});}
async function sxExamConfirm(message){if(!sxAndroidChrome())return confirm(message);if(!SX_ACTIVE?.attempt?.id||SX_ACTIVE.attempt.status!=='started'||SX_AUTO_BLOCKING)return false;sxExamConfirm.cancel?.();const id=SX_ACTIVE.attempt.id;return new Promise(resolve=>{const box=document.createElement('div');box.id='sxExamConfirmation';box.setAttribute('role','alertdialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Confirm examination action');box.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px';const card=document.createElement('div');card.style.cssText='background:#fff;color:#111;max-width:420px;padding:20px;border-radius:12px';const text=document.createElement('p');text.textContent=message;const yes=document.createElement('button'),no=document.createElement('button');yes.type=no.type='button';yes.className=no.className='btn border';yes.textContent='Confirm';no.textContent='Cancel';card.append(text,yes,no);box.append(card);document.body.append(box);let done=false;const finish=value=>{if(done)return;done=true;box.remove();if(sxExamConfirm.cancel===cancel)sxExamConfirm.cancel=null;resolve(value&&SX_ACTIVE?.attempt?.id===id&&SX_ACTIVE.attempt.status==='started'&&!SX_AUTO_BLOCKING)};const cancel=()=>finish(false);sxExamConfirm.cancel=cancel;yes.onclick=()=>finish(true);no.onclick=cancel;no.focus();})}
function sxBindAnswerControls(){const panel=document.createElement('details');panel.className='sx-sync-tools';panel.innerHTML='<summary>Answer sync / Emergency Backup</summary><p>Confirm each answer. The initial successful answer allows two further changes. Pending confirmations must sync before another change.</p><p>Device backups may be lost if browser storage is cleared or the device fails. Keep exported backups private.</p><button id="sxRetrySync" class="btn border">Retry Sync</button> <button id="sxExportBackup" class="btn border">Export Emergency Backup</button>';document.querySelector('#sxRoom > .card')?.append(panel);$('sxRetrySync').onclick=()=>SX_STORE.sync();$('sxExportBackup').onclick=()=>sxExportBackup(SX_STORE);document.querySelectorAll('#sxRoom .exam-q').forEach((block,i)=>{const qid=SX_ACTIVE.questionOrder[i],label=document.createElement('p');label.dataset.saveLabel='';block.append(label);block.querySelectorAll('input[type=radio]').forEach(e=>e.onchange=async()=>{if(!await sxExamConfirm('Confirm this selection? Only two changes are allowed after the first saved answer.'))return sxAnswerState(SX_STORE.info());try{await SX_STORE.confirm(qid,e.value)}catch(err){toast(err.message);sxAnswerState(SX_STORE.info())}});const textarea=block.querySelector('textarea');if(textarea){textarea.oninput=async()=>{SX_ANSWERS[qid]=textarea.value;const job=SX_STORE.draft(qid,textarea.value);SX_DRAFT_PENDING.add(job);try{await job}catch(e){label.textContent='Device backup failed: '+e.message}finally{SX_DRAFT_PENDING.delete(job)}};const b=document.createElement('button');b.className='btn border';b.dataset.confirm='';b.textContent='Confirm Answer';b.onclick=async()=>{try{await SX_STORE.confirm(qid,textarea.value)}catch(e){toast(e.message)}};block.append(b)}});sxAnswerState(SX_STORE.info());}
async function sxExportBackup(store){try{const file=await store.exportBackup(),url=URL.createObjectURL(new Blob([JSON.stringify(file,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='OPJCC_Exam_Backup_'+store.attempt.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){toast('Backup export failed: '+e.message)}}
window.sxDeviceBackups=async function sxDeviceBackups(uid=me?.uid){if(!uid)return toast('Log in to access your device backups.');const M=await import('./exam-answer-store.js'),dbLocal=new M.DeviceDB(),records=await dbLocal.list(uid);let box=$('sxBackupOverlay');if(box)box.remove();box=document.createElement('div');box.id='sxBackupOverlay';box.style.cssText='position:fixed;inset:5%;z-index:99999;background:white;color:#111;padding:20px;overflow:auto;border:2px solid #64748b';box.innerHTML='<h2>Device examination backups</h2><p>Only this device has unsynchronized answers. Export the backup and give it directly to your teacher. Editable files require teacher review; they are not authoritative. Clearing storage or device failure may lose this data.</p><button id="sxBackupClose">Close</button>';document.body.append(box);$('sxBackupClose').onclick=()=>box.remove();for(const r of records){const row=document.createElement('div');row.textContent=r.descriptor.exam.title+' — '+(r.final?.serverConfirmed?'Server submission confirmed':r.final?'Locally locked; sync/review pending':'In progress');const b=document.createElement('button');b.textContent='Export backup';b.onclick=async()=>{const store=new M.AnswerStore({uid,exam:r.descriptor.exam,attempt:{...r.descriptor.attemptMeta,...r.server,id:r.descriptor.attemptId},adapter:{read:async()=>{throw Error('Export only')},stamp:sxStamp},onChange:()=>{}});store.record=r;await sxExportBackup(store);store.close()};row.append(b);box.append(row)}if(!records.length)box.append('No backups for this signed-in account on this device.');dbLocal.close();}
window.sxOpen=async id=>{const x=SX_EXAMS.get(id),el=SX_ELIG.get(id),old=SX_ATTEMPTS.get(id),reopen=old?.status==='reopen_allowed';if(!x)return toast('Exam not available. Please refresh once.');if(x.examProtocolVersion!==1)return toast('Ask your teacher to create a fresh demo examination. This paper is not enabled for this release.');if(!reopen&&el?.status!=='eligible')return toast('Teacher/Admin has not marked you Eligible.');if(old?.status==='submitted'&&!reopen)return toast('Exam already submitted. Teacher must Allow Reopen first.');if(old?.status==='hold'||old?.status==='blocked')return toast(old.status==='blocked'?'Attempt is blocked by Teacher/Admin.':'Attempt is on hold. Wait for Teacher/Admin to resume it.');SX_ACTIVE={exam:x,attempt:old||null};$('sxRoom').classList.remove('hidden');$('sxExamList').classList.add('hidden');$('sxRoom').innerHTML=`<div class="card p-5 exam-precheck"><h2 class="text-2xl font-black">Secure Exam Pre-check</h2><p class="exam-small">Demo release FINAL-1 • Reload if your teacher asks.</p><p>${esc(x.title)} • ${esc(p?.name||'Student')}</p><div class="grid md:grid-cols-2 gap-4 mt-4"><video id="sxLocalVideo" autoplay muted playsinline></video><div><p><b>Name:</b> ${esc(p?.name||'')}</p><p><b>Father:</b> ${esc(p?.fatherName||p?.fathersName||'—')}</p><p><b>Roll:</b> ${esc(p?.rollNumber||'—')}</p><p><b>Candidate/Trainee ID:</b> ${esc(p?.candidateId||p?.traineeId||'—')}</p><p><b>Batch ID:</b> ${esc(p?.batchId||'—')}</p><label class="block mt-3">Examination language <select id="sxLanguage" class="inp">${OPExamLanguage.available(x).map(l=>`<option value="${l}">${l}</option>`).join('')}</select></label><p id="sxLanguageMessage" role="status"></p><div id="sxDeviceStatus" class="mt-3 font-bold">Camera & microphone permission required.</div><div class="sx-fullscreen-note">Exam room opens after server confirmation. You can type answers normally without fullscreen locking.</div><p id="sxStartStatus" role="status" aria-live="polite"></p><label class="mt-3 flex items-start gap-2"><input id="sxConsent" type="checkbox" class="mt-1"> <span>I confirm that I am the registered student and will take this examination myself.</span></label><button id="sxDevice" class="btn border mt-3">Allow Camera & Mic</button><button id="sxBegin" class="btn primary mt-3" disabled>${reopen?'Reopen Exam':'Start Exam'}</button><button id="sxCancel" class="btn border mt-3">Cancel</button></div></div></div>`;const original=OPExamLanguage.languages.includes(x.paperLanguage)?x.paperLanguage:'English';const locked=old?.languageSnapshot;const chosen=old?.paperLanguage||original;$('sxLanguage').value=chosen;$('sxLanguage').disabled=!!old;SX_ACTIVE.languageSnapshot=locked||null;SX_ACTIVE.questionOrder=OPExamLanguage.order(x.questions||[],old?(old.questionOrder||(x.questions||[]).map(q=>q.id)):null);const selectLanguage=()=>{try{const l=$('sxLanguage').value;SX_ACTIVE.languageSnapshot=OPExamLanguage.choose(x,l,locked);$('sxLanguageMessage').textContent='Teacher-approved '+l+' paper selected. Language is locked when the attempt starts.'}catch(e){$('sxLanguageMessage').textContent=e.message;$('sxLanguage').value=original;SX_ACTIVE.languageSnapshot=old?null:OPExamLanguage.choose(x,original)}};selectLanguage();$('sxLanguage').onchange=selectLanguage;$('sxDevice').onclick=sxCheckDevice;$('sxConsent').onchange=()=>{$('sxBegin').disabled=!$('sxConsent').checked||!SX_STREAM||$('sxDeviceStatus')?.dataset.mediaReady!=='true'};$('sxBegin').onclick=sxBegin;$('sxCancel').onclick=()=>{sxStopAll();SX_ACTIVE=null;$('sxRoom').classList.add('hidden');$('sxExamList').classList.remove('hidden')}};
function sxMediaDiagnosticHint(error){
 const name=error?.name||'UnknownError',ua=navigator.userAgent||'',platform=navigator.userAgentData?.platform||navigator.platform||'';
 const android=/Android/i.test(ua+' '+platform),ios=!android&&(/iPhone|iPad|iPod/i.test(ua)||(/Mac/i.test(platform)&&Number(navigator.maxTouchPoints)>1));
 if(name==='NotAllowedError'){
  if(android&&/;\s*wv\b/i.test(ua))return 'Android app permission or browser policy blocked camera/microphone access. Check Android Settings > Apps > OPJCC Student > Permissions, and the device camera/microphone privacy switches.';
  if(android)return 'Android browser permission or security policy blocked camera/microphone access. Allow both for this HTTPS site and for your browser in Android Settings. Check device privacy switches; use Chrome directly if an in-app browser blocks access.';
  if(ios)return 'iPhone/iPad browser permission or security policy blocked camera/microphone access. Allow both for this HTTPS website in your browser settings and check device restrictions. Use the browser directly if an in-app browser blocks access.';
  return 'Browser or operating-system permission/security policy blocked camera/microphone access. Allow both for this HTTPS website and check device privacy settings.';
 }
 if(name==='NotReadableError')return 'Camera or microphone could not be opened. Another app, the operating system, or unavailable hardware may be blocking it.';
 if(name==='NotFoundError')return 'No usable camera or microphone device was found.';
 if(name==='OverconstrainedError')return 'The device cannot satisfy the requested media constraint'+(error?.constraint?': '+error.constraint:'')+'.';
 if(name==='AbortError')return 'The browser aborted media capture. Check camera/microphone availability and try again.';
 if(name==='SecurityError')return 'Camera/microphone access is disabled by browser or document security policy.';
 return 'Camera/microphone capture failed. This is a media check, not a Firestore attempt-creation error.';
}
function sxAndroidChrome(){return /Android/i.test(navigator.userAgent||'')&&/Chrome\//i.test(navigator.userAgent||'')&&!/;\s*wv\b|EdgA\/|OPR\/|SamsungBrowser\//i.test(navigator.userAgent||'')}
function sxAndroidMediaReady(stream=SX_STREAM){return !!stream&&['video','audio'].every(kind=>stream.getTracks().some(t=>t.kind===kind&&t.readyState==='live'&&t.enabled!==false&&!t.muted))}
async function sxCheckAndroidDevice(){
 const status=$('sxDeviceStatus'),button=$('sxDevice'),start=$('sxBegin'),active=SX_ACTIVE,video=$('sxLocalVideo');
 if(sxCheckAndroidDevice.ticket)return;
 if(document.body.classList.contains('sx-exam-focus'))return toast('An exam is already active. Keep this page open.');
 if(status)status.dataset.mediaReady='false';if(start)start.disabled=true;
 const ticket={active,status};sxCheckAndroidDevice.ticket=ticket;if(button)button.disabled=true;
 const current=()=>sxCheckAndroidDevice.ticket===ticket&&SX_ACTIVE===active&&$('sxDeviceStatus')===status;
 const fail=message=>{if(!current())return;if(status){status.dataset.mediaReady='false';status.textContent=message}if(start)start.disabled=true;toast(message)};
 let stream=null;
 try{
  if(!window.isSecureContext)throw Object.assign(Error('HTTPS is required.'),{name:'SecurityError'});
  if(!navigator.mediaDevices?.getUserMedia)throw Object.assign(Error('Use Android Chrome directly on this HTTPS website.'),{name:'NotSupportedError'});
  if(status)status.textContent='Allow both camera and microphone in Chrome. Waiting for live media…';
  if(sxAndroidMediaReady())stream=SX_STREAM;
  else{const previous=SX_STREAM;SX_STREAM=null;if(previous)previous.getTracks().forEach(t=>t.stop());stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:true})}
  if(!current()){if(stream!==SX_STREAM)stream.getTracks().forEach(t=>t.stop());return}
  if(!sxAndroidMediaReady(stream))throw Object.assign(Error('Both live, enabled and unmuted camera and microphone tracks are required. Close other camera apps, check privacy switches, then retry.'),{name:'NotReadableError'});
  if(!video)throw Error('Camera preview was closed. Reopen the exam pre-check.');video.srcObject=stream;await video.play();
  if(!current()){if(stream!==SX_STREAM)stream.getTracks().forEach(t=>t.stop());return}
  if(!sxAndroidMediaReady(stream)||!video.videoWidth||!video.videoHeight)throw Object.assign(Error('Camera preview or microphone is not ready. Keep this page visible and retry.'),{name:'NotReadableError'});
  SX_STREAM=stream;
  if(!stream.opjccAndroidPrecheckBound){for(const track of stream.getTracks()){track.addEventListener('ended',()=>{if(SX_STREAM!==stream)return;const s=$('sxDeviceStatus');if(s){s.dataset.mediaReady='false';s.textContent='Camera/microphone interrupted. Tap Allow Camera & Mic again.'}if($('sxBegin'))$('sxBegin').disabled=true;sxAudit(track.kind==='video'?'CAMERA_ENDED':'MIC_ENDED',track.kind==='video'?'Camera stream ended':'Microphone stream ended').catch(()=>{})});track.addEventListener('mute',()=>{if(SX_STREAM!==stream)return;const s=$('sxDeviceStatus');if(s){s.dataset.mediaReady='false';s.textContent='Camera/microphone interrupted. Tap Allow Camera & Mic again.'}if($('sxBegin'))$('sxBegin').disabled=true})}stream.opjccAndroidPrecheckBound=true}
  if(status){status.dataset.mediaReady='true';status.textContent='Camera ON • Microphone ON — live camera preview and both media tracks verified.'}if(start)start.disabled=!$('sxConsent')?.checked;
 }catch(e){if(stream){if(SX_STREAM===stream)SX_STREAM=null;stream.getTracks().forEach(t=>t.stop())}if(video&&video.srcObject===stream)video.srcObject=null;const denied=e?.name==='NotAllowedError'||e?.name==='PermissionDeniedError';fail('Camera/Mic Diagnostic: '+(e?.name||'Error')+' — '+(denied?'Android Chrome: tap the site controls beside the address > Permissions > allow Camera AND Microphone. Also open Android Settings > Apps > Chrome > Permissions and allow both; check device camera/microphone privacy switches. Return here and tap Allow Camera & Mic again. Permission cannot be bypassed.':(e?.message||sxMediaDiagnosticHint(e))))}
 finally{if(sxCheckAndroidDevice.ticket===ticket){sxCheckAndroidDevice.ticket=null;if(button&&$('sxDevice')===button)button.disabled=false}}
}
function sxLegacyIntegrity(){const off=()=>sxWarn('NETWORK_OFFLINE','Connection offline');window.addEventListener('offline',off);const old=sxStopAll;sxStopAll=function(){window.removeEventListener('offline',off);sxStopAll=old;return old()}}
async function sxCheckDevice(){if(sxAndroidChrome())return sxCheckAndroidDevice();
  const status=$('sxDeviceStatus');
  if(status)status.dataset.mediaReady='false';
  if($('sxBegin'))$('sxBegin').disabled=true;
  const fail=(title,detail='')=>{
    const msg=`${title}${detail?` • ${detail}`:''}`;
    if(status)status.innerHTML=`<span class="text-red-600">${esc(msg)}</span>`;
    toast(msg);
  };
  try{
    if(!window.isSecureContext)return fail('Camera/Mic Diagnostic: Insecure Context','HTTPS required');
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return fail('Camera/Mic Diagnostic: Unsupported','getUserMedia unavailable in this browser');
    if(status)status.textContent='Checking camera & microphone…';
    SX_STREAM=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:true});
    const videoTracks=SX_STREAM.getVideoTracks(),audioTracks=SX_STREAM.getAudioTracks();
    if(!videoTracks.length||!audioTracks.length){
      SX_STREAM.getTracks().forEach(t=>t.stop());SX_STREAM=null;
      return fail('Camera/Mic Diagnostic: Missing Track',`video=${videoTracks.length}, audio=${audioTracks.length}`);
    }
    $('sxLocalVideo').srcObject=SX_STREAM;
    if(status)status.innerHTML='<span class="text-green-600">Camera ON • Microphone ON</span><div class="text-xs text-slate-500 mt-1">Diagnostic: permission and media stream OK.</div>';
    if(status)status.dataset.mediaReady='true';
    $('sxBegin').disabled=!$('sxConsent').checked;
    videoTracks[0]?.addEventListener('ended',()=>{sxAudit('CAMERA_ENDED','Camera stream ended').catch(()=>{});sxLocalNotice('Camera stopped. Ask your teacher for help restoring camera access.','warn')});
    audioTracks[0]?.addEventListener('ended',()=>{sxAudit('MIC_ENDED','Microphone stream ended').catch(()=>{});sxLocalNotice('Microphone stopped. Ask your teacher for help restoring microphone access.','warn')});
  }catch(e){
    console.error('Camera/Mic diagnostic:',e);
    const name=e?.name||'UnknownError',detail=e?.message||'No browser error message';
    const hint=sxMediaDiagnosticHint(e);
    fail(`Camera/Mic Diagnostic: ${name}`,`${hint} | ${detail}`);
  }
}
async function sxCapturePhoto(){try{const v=$('sxLocalVideo'),c=document.createElement('canvas');c.width=v.videoWidth||640;c.height=v.videoHeight||480;c.getContext('2d').drawImage(v,0,0,c.width,c.height);const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.8));if(!blob)return'';const f=new File([blob],`exam-selfie-${Date.now()}.jpg`,{type:'image/jpeg'}),u=await cloud(f,`opjcc/exams/selfie/${me.uid}`);return u.secure_url||''}catch(e){console.warn('selfie',e);return''}}
let SX_ANDROID_RUNTIME=null,SX_FACE_WATCHDOG=null,SX_LAST_FACE_SAMPLE=null;
async function sxAndroidAIReady(){const context=SX_ACTIVE;const M=await import('./exam-android-runtime.js');if(SX_ACTIVE!==context)throw Error('Exam pre-check was closed');if(!SX_ANDROID_RUNTIME||SX_ANDROID_RUNTIME.closed)SX_ANDROID_RUNTIME=new M.AndroidExamRuntime({onState:message=>{const e=$('sxStartStatus')||$('sxAiStatus');if(e)e.textContent=message},onFailure:error=>{const ai=$('sxAiStatus');if(ai)ai.textContent='AI Camera unavailable — Teacher review required';if(SX_ACTIVE?.attempt?.status==='started'&&document.body.classList.contains('sx-exam-focus')){const lock=$('sxLockOverlay');if(lock)lock.classList.remove('hidden');if($('sxLockTitle'))$('sxLockTitle').textContent='Camera monitoring unavailable';if($('sxLockText'))$('sxLockText').textContent='Keep this page open. Your existing answers are preserved. Contact Teacher; monitoring failed: '+error.message}}});await SX_ANDROID_RUNTIME.prepare($('sxLocalVideo'));if(SX_ACTIVE!==context)throw Error('Exam pre-check was closed');}
async function sxAndroidFaceMonitor(){const runtime=SX_ANDROID_RUNTIME,attempt=SX_ACTIVE?.attempt,video=$('sxFaceVideo'),ai=$('sxAiStatus');if(!runtime||runtime.closed||!video)throw Error('Verified AI runtime or camera video is unavailable');sxFaceDirection.pitchBaseline=null;await video.play();if(SX_ACTIVE?.attempt?.id!==attempt.id||runtime!==SX_ANDROID_RUNTIME)return;runtime.onFaces=async(faces,now)=>{if(runtime!==SX_ANDROID_RUNTIME||SX_ACTIVE?.attempt?.id!==attempt.id||SX_ACTIVE?.attempt?.status!=='started')return;let kind=null,detail='';if(faces.length===0){kind='AI_NO_FACE';detail='Face not visible for over 3 seconds'}else if(faces.length>1){kind='AI_MULTIPLE_FACES';detail='Multiple faces visible for over 3 seconds'}else if(sxFaceDirection(faces[0]).away){kind='AI_LOOK_AWAY';detail='Looking away for over 3 seconds'}SX_LAST_FACE_SAMPLE={kind,detail,at:Date.now()};const trigger=sxCameraEpisodeWarning(kind,Date.now());if(ai)ai.textContent=kind?(kind==='AI_NO_FACE'?'Face missing':kind==='AI_MULTIPLE_FACES'?'Multiple faces':'Look at screen')+' • '+SX_LOOK_WARNINGS+'/5':'AI Camera active • '+SX_LOOK_WARNINGS+'/5';if(trigger)await sxLookWarning(detail,kind)};if(ai)ai.textContent='AI Camera active • '+SX_LOOK_WARNINGS+'/5';
 if(SX_FACE_WATCHDOG)clearInterval(SX_FACE_WATCHDOG);
 SX_FACE_WATCHDOG=setInterval(()=>{
  if(SX_ACTIVE?.attempt?.status!=='started'||runtime!==SX_ANDROID_RUNTIME)return;
  const sample=SX_LAST_FACE_SAMPLE;
  // Only use fresh, actual detector results. Never infer no-face from a stalled worker.
  if(!sample||Date.now()-sample.at>2200)return;
  if(sample.kind&&sxCameraEpisodeWarning(sample.kind,Date.now()))sxLookWarning(sample.detail,sample.kind).catch(console.warn);
 },500);
 runtime.start(video);}
async function sxBegin(){let sxStartStage="prepare",sxServerConfirmed=false,sxStartContext=SX_ACTIVE;const hadFullscreen=!!(document.fullscreenElement||document.webkitFullscreenElement),startStatus=$('sxStartStatus'),startButton=$('sxBegin');if(startButton){startButton.disabled=true;startButton.textContent='Confirming exam start…'}if(startStatus)startStatus.textContent='Pre-check: waiting for server confirmation. The exam room has not opened.';try{if(sxAndroidChrome()&&(!sxAndroidMediaReady()||$('sxDeviceStatus')?.dataset.mediaReady!=='true'))throw Error('Camera/microphone is no longer available. Tap Allow Camera & Mic again before starting.');if(!SX_ACTIVE.languageSnapshot)throw Error('The saved examination language is unavailable. Ask your teacher.');OPExamLanguage.choose(SX_ACTIVE.exam,SX_ACTIVE.languageSnapshot.language,SX_ACTIVE.languageSnapshot);SX_FULLSCREEN_SUPPORTED=false; /* Native fullscreen not required */if(sxAndroidChrome()){const prior=SX_ATTEMPTS.get(SX_ACTIVE.exam.id);if(prior&&prior.status!=='reopen_allowed'&&(!Number.isFinite(Number(prior.expiresAtMs))||Number(prior.expiresAtMs)<=Date.now()))throw Error('This attempt has expired. Existing answers are preserved. Ask Teacher to review or authorize reopening.');sxStartStage='ai-precheck';await sxAndroidAIReady();const storeModule=await import('./exam-answer-store.js'),preDB=new storeModule.DeviceDB();try{await Promise.race([preDB.open(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Device backup could not initialize. Close old tabs before starting.')),10000))])}finally{preDB.close()}if(SX_ACTIVE!==sxStartContext)throw Error('Exam pre-check was closed');}sxStartStage="selfie";const x=SX_ACTIVE.exam,id=sxId(x.id,me.uid),existing=SX_ATTEMPTS.get(x.id),photo=existing?.status==='started'&&existing.examPhotoURL?existing.examPhotoURL:await sxCapturePhoto(),isReopen=existing?.status==='reopen_allowed',now=Date.now(),reopenMinutes=Math.max(1,Math.min(240,Number(existing?.reopenDurationMinutes||15))),normalExpires=Math.min(sxAndroidChrome()&&Number.isFinite(x.endAtMs)?x.endAtMs:x.endAt?new Date(x.endAt).getTime():Infinity,now+Number(x.duration||60)*60000);SX_RUNTIME_EXPIRES_AT=isReopen?now+reopenMinutes*60000:(existing?Number(existing.expiresAtMs):(Number.isFinite(normalExpires)?normalExpires:now+Number(x.duration||60)*60000));if(!photo)throw Error('Selfie capture/upload failed. Check the camera and connection, then retry.');if(sxAndroidChrome()&&SX_ACTIVE!==sxStartContext)throw Error('Exam pre-check was closed');if(sxAndroidChrome()&&!sxAndroidMediaReady())throw Error('Camera/microphone stopped during pre-check. Allow both and retry.');if(existing){sxStartStage="existing-attempt";if(isReopen)await updateDoc(doc(db,'examAttempts',id),{status:'started',expiresAtMs:SX_RUNTIME_EXPIRES_AT,cameraOn:true,micOn:true,online:true,submittedAt:null,updatedAt:sxStamp()})}else{sxStartStage='create-attempt';await setDoc(doc(db,'examAttempts',id),{id,clientWriteToken:crypto.randomUUID(),examId:x.id,examTitle:x.title,classId:x.classId,className:x.className||'',teacherId:x.teacherId,studentId:me.uid,studentName:p?.name||'',status:'started',paperLanguage:SX_ACTIVE.languageSnapshot.language,languageSnapshot:SX_ACTIVE.languageSnapshot,questionOrder:SX_ACTIVE.questionOrder,answers:{},warningCount:0,warningMessage:'',cameraOn:true,micOn:true,online:true,examPhotoURL:photo,consent:true,startedAt:sxStamp(),expiresAtMs:SX_RUNTIME_EXPIRES_AT,archived:false,gradePublished:false,updatedAt:sxStamp()})}const confirmed=await getDocFromServer(doc(db,'examAttempts',id));if(!confirmed.exists())throw Error('Server attempt receipt missing');sxServerConfirmed=true;SX_ACTIVE.attempt={id,...confirmed.data()};SX_RUNTIME_EXPIRES_AT=Number(SX_ACTIVE.attempt.expiresAtMs);SX_ANSWERS={...(existing?.answers||{})};SX_LOOK_WARNINGS=Number(existing?.aiLookAwayCount||0);SX_CAMERA_EPISODE={kind:null,since:0,lastWarningAt:0,clearSince:0};try{window.scrollTo(0,1)}catch{}sxStartStage="answer-store";await sxSetupAnswerStore();document.body.classList.add('sx-exam-focus');if(startStatus)startStatus.textContent='Server confirmed. Opening your exam…';sxAudit(isReopen?'EXAM_REOPENED':'EXAM_STARTED',isReopen?`Teacher-approved reopen started • ${reopenMinutes} min`:'Camera and microphone active');sxRenderRoom();sxBindAttempt();sxSignals();sxHeartbeat();sxIntegrity();if(sxAndroidChrome())await sxAndroidFaceMonitor();else sxFaceMonitor()}catch(e){console.error('Exam start failed',e);if(!(sxAndroidChrome()&&sxServerConfirmed))document.body.classList.remove('sx-exam-focus');if((!sxAndroidChrome()||!sxServerConfirmed)&&!hadFullscreen&&(document.fullscreenElement||document.webkitFullscreenElement)){try{const exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit)await exit.call(document)}catch{}}SX_FULLSCREEN_SUPPORTED=!!(hadFullscreen&&(document.fullscreenElement||document.webkitFullscreenElement));if(!sxServerConfirmed)SX_RUNTIME_EXPIRES_AT=0;const denied=/permission-denied|PERMISSION_DENIED|insufficient permissions/i.test(String(e?.code||'')+' '+String(e?.message||'')),reason=denied&&['create-attempt','existing-attempt'].includes(sxStartStage)?'Firestore did not authorize this start/resume. Ask your Teacher to check the published schedule, enrollment and eligibility. Camera/microphone permission is a separate check. Existing attempts are preserved.':(sxServerConfirmed?'Server attempt confirmed, but local setup could not finish. Keep this page open and contact your Teacher. ':'')+(e?.message||e?.name||'Unknown error');if(startStatus)startStatus.textContent=(sxServerConfirmed?'Attempt saved on server. ':'Start not confirmed. ')+reason;toast('Exam start failed ['+sxStartStage+']: '+reason);if(sxAndroidChrome()&&sxServerConfirmed&&SX_ACTIVE?.attempt?.status==='started'){if($('sxLockOverlay'))$('sxLockOverlay').classList.remove('hidden');if($('sxLockTitle'))$('sxLockTitle').textContent='Exam setup needs Teacher review';if($('sxLockText'))$('sxLockText').textContent='Your server attempt and existing answers are preserved. Keep this page open. '+(e?.message||'Setup could not finish');}const b=$('sxBegin');if(b){b.disabled=!($('sxConsent')?.checked&&SX_STREAM&&$('sxDeviceStatus')?.dataset.mediaReady==='true');b.textContent='Start Exam'}}}
function sxRenderRoom(){const x=SX_ACTIVE.exam,a=SX_ACTIVE.attempt;const language=SX_ACTIVE.languageSnapshot;$('sxRoom').lang=OPExamLanguage.codes[language.language];$('sxRoom').innerHTML=`<div class="card p-5"><div class="sx-exam-topbar"><div class="sx-exam-headline">${esc(x.title)}</div><div class="sx-exam-headmeta"><span id="sxTimer" class="exam-timer">--:--</span><span id="sxWarningCount" class="sx-camera-count" role="status">Warnings ${SX_LOOK_WARNINGS}/5</span><span id="sxAiStatus" class="sx-ai-status">AI Camera starting…</span></div><div class="sx-exam-headmeta"><span id="sxSaveStatus" class="sx-sync-line" role="status">Saving answers…</span><button id="sxDeviceBackupExam" type="button" class="btn border">Backup</button><button id="sxSubmit" class="btn primary">Final Submit</button></div></div><div id="sxLiveWarning" class="exam-warning-banner hidden"></div><video id="sxFaceVideo" autoplay muted playsinline style="${sxAndroidChrome()?'display:block;width:160px;max-width:42vw;aspect-ratio:4/3;object-fit:cover;border-radius:8px':'display:none'}"></video><div class="mt-5">${SX_ACTIVE.questionOrder.map(id=>OPExamLanguage.display(x,language).find(q=>q.id===id)).map((q,i)=>`<div class="exam-q exam-answer"><h3 class="font-black">Q${i+1}. ${esc(q.text)} <small>(${q.marks})</small></h3>${v35DiagramMarkup((x.questions||[]).find(z=>z.id===q.id),'sx-question-diagram')}${q.type==='mcq'||q.type==='truefalse'?(q.type==='truefalse'?['True','False']:(q.options||[])).map((o,oi)=>`<label class="flex gap-2 mt-2"><input type="radio" name="sx_${q.id}" value="${esc(o)}" ${SX_ANSWERS[q.id]===o?'checked':''}> ${esc(q.displayOptions[oi])}</label>`).join(''):`<textarea class="inp mt-2" data-q="${q.id}">${esc(SX_ANSWERS[q.id]||'')}</textarea>`}</div>`).join('')}</div></div>`;const fv=$('sxFaceVideo');if(fv&&SX_STREAM){fv.srcObject=SX_STREAM;fv.play().catch(()=>{})}$('sxSubmit').onclick=()=>sxSubmit(false);$('sxDeviceBackupExam').onclick=()=>window.sxDeviceBackups(me?.uid);if(sxAndroidChrome()){if(SX_TIMER)clearInterval(SX_TIMER);sxTimerTick();SX_TIMER=setInterval(sxTimerTick,1000)}sxBindAnswerControls();sxUpdateWarningBadge();if(!sxAndroidChrome()){sxTimerTick();SX_TIMER=setInterval(sxTimerTick,1000)}}
async function sxAutosave(){if(SX_STORE)await SX_STORE.sync()}
function sxTimerTick(){if(!SX_ACTIVE?.attempt)return;const exp=Number(SX_RUNTIME_EXPIRES_AT||SX_ACTIVE.attempt.expiresAtMs||0);if(!exp||!Number.isFinite(exp)){if($('sxTimer'))$('sxTimer').textContent='--:--';return}const left=Math.max(0,exp-Date.now()),m=Math.floor(left/60000),sec=Math.floor(left%60000/1000);if($('sxTimer'))$('sxTimer').textContent=`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;if(left<=0&&SX_ACTIVE?.attempt?.status==='started'&&!SX_AUTO_SUBMITTING){SX_AUTO_SUBMITTING=true;sxSubmit(true).finally(()=>{SX_AUTO_SUBMITTING=false})}}
async function sxSubmit(auto=false){if(!SX_ACTIVE?.attempt?.id||!SX_STORE)return;if(!auto&&!await sxExamConfirm('Final submit? Confirm typed answers first. Pending device answers may require teacher recovery. Answers will be locally locked.'))return;if(SX_ACTIVE.submitting)return;SX_ACTIVE.submitting=true;try{await Promise.allSettled([...SX_DRAFT_PENDING]);const state=await SX_STORE.finalize(auto?'deadline':'student');sxStopAll();if(state.serverConfirmed){SX_ACTIVE=null;$('sxRoom').classList.add('hidden');$('sxExamList').classList.remove('hidden');toast('Server submission confirmed.')}else{SX_ACTIVE.attempt.status='local_submission_pending';sxAnswerState(state);toast('Saved on Device — Sync Pending. Export a backup; teacher review is required after the server deadline.')}}catch(e){toast('Submission not confirmed: '+e.message)}finally{if(SX_ACTIVE)SX_ACTIVE.submitting=false}}
async function sxAudit(event,detail){if(!SX_ACTIVE?.attempt?.id)return;try{await addDoc(collection(db,'examAuditEvents'),{attemptId:SX_ACTIVE.attempt.id,examId:SX_ACTIVE.exam.id,classId:SX_ACTIVE.exam.classId,studentId:me.uid,teacherId:SX_ACTIVE.exam.teacherId,event,detail:String(detail||'').slice(0,500),createdAt:sxStamp()})}catch(e){console.warn('audit',e)}}
function sxLocalNotice(msg,kind='warn'){const el=$('sxLiveWarning');if(el){el.textContent=msg;el.classList.remove('hidden');if(kind!=='block')setTimeout(()=>{if(el.textContent===msg)el.classList.add('hidden')},4800)}const ai=$('sxAiStatus');if(ai){ai.textContent=kind==='block'?'Blocked — Teacher review':`AI Camera • ${SX_LOOK_WARNINGS}/5`;ai.className='sx-ai-status mt-2 '+(kind==='block'?'block':kind==='warn'?'warn':'')}sxUpdateWarningBadge();sxWarningPopup(msg,kind)}
async function sxWarn(event,detail){if(!SX_ACTIVE?.attempt?.id)return;try{const ref=doc(db,'examAttempts',SX_ACTIVE.attempt.id),snap=await getDoc(ref),n=Number(snap.data()?.warningCount||0)+1;await updateDoc(ref,{warningCount:n,lastWarning:event,lastWarningAt:sxStamp(),updatedAt:sxStamp()});await sxAudit(event,detail)}catch(e){console.warn('warning',e)}}
async function sxLookWarning(detail,event='AI_LOOK_AWAY'){
 if(!SX_ACTIVE?.attempt?.id||SX_ACTIVE.attempt.status!=='started'||SX_CAMERA_WARN_INFLIGHT)return;
 SX_CAMERA_WARN_INFLIGHT=true;
 const currentId=SX_ACTIVE.attempt.id;
 const proposed=Math.min(5,SX_LOOK_WARNINGS+1),resetAtStart=JSON.stringify(SX_ACTIVE.attempt.warningResetAt||null);
 SX_LOOK_WARNINGS=proposed;sxUpdateWarningBadge();
 sxLocalNotice(`AI Warning ${proposed}/5: ${detail}. Look at the exam screen.`,'warn');
 try{
  const ref=doc(db,'examAttempts',currentId);
  const saved=await runTransaction(db,async t=>{
   const snap=await t.get(ref);
   if(!snap.exists()||snap.data().status!=='started')return null;
   const prev=Number(snap.data().aiLookAwayCount||0);
   const resetChanged=JSON.stringify(snap.data().warningResetAt||null)!==resetAtStart;const n=Math.min(5,resetChanged?prev+1:Math.max(proposed,prev+1));
   t.update(ref,{warningCount:Math.max(Number(snap.data().warningCount||0)+1,n),aiLookAwayCount:n,lastWarning:event,lastWarningAt:sxStamp(),updatedAt:sxStamp(),clientWriteToken:crypto.randomUUID()});
   return {count:n,resetChanged};
  });
  if(saved!==null){SX_LOOK_WARNINGS=saved.resetChanged?saved.count:Math.max(SX_LOOK_WARNINGS,saved.count);sxUpdateWarningBadge();await sxAudit(event,`${detail} • Warning ${SX_LOOK_WARNINGS}/5`)}
 }catch(e){console.warn('AI warning sync failed; warning retained on device',e);sxLocalNotice(`Warning ${SX_LOOK_WARNINGS}/5: sync pending. Teacher review required.`,'warn')}
 finally{SX_CAMERA_WARN_INFLIGHT=false}
 if(SX_ACTIVE?.attempt?.id===currentId&&SX_LOOK_WARNINGS>=5)await sxAutoBlock('AI_CAMERA_WARNING_LIMIT','Five sustained camera warnings recorded; teacher review required');
}
async function sxAutoBlock(event,detail){
 if(event!=='AI_CAMERA_WARNING_LIMIT'&&event!=='PAGE_HIDDEN')return;
 const attempt=SX_ACTIVE?.attempt;
 if(!attempt?.id||(event==='AI_CAMERA_WARNING_LIMIT'&&SX_LOOK_WARNINGS<5)||attempt.status!=='started')return;
 const key='opjcc-exam-block-pending-'+attempt.id;
 if(event==='PAGE_HIDDEN')try{sessionStorage.setItem(key,'PAGE_HIDDEN')}catch{}
 const message=event==='PAGE_HIDDEN'?'Exam page was minimized/backgrounded. Teacher/Admin review required.':'Five sustained camera warnings reached. Teacher/Admin review required.';
 const show=()=>{
  $('sxLockOverlay')?.classList.remove('hidden');
  if($('sxLockTitle'))$('sxLockTitle').textContent='Exam Blocked — sync pending';
  if($('sxLockText'))$('sxLockText').textContent=message;
 };
 show();
 if(SX_AUTO_BLOCKING)return;
 SX_AUTO_BLOCKING=true;
 if(sxAndroidChrome())sxExamConfirm.cancel?.();
 try{
  // Begin the Firestore block write immediately. Autosave must not delay it during page suspension.
  await updateDoc(doc(db,'examAttempts',attempt.id),{
   status:'blocked',autoBlockReason:event,autoBlockedAt:sxStamp(),
   lastWarning:event,lastWarningAt:sxStamp(),updatedAt:sxStamp()
  });
  if(SX_ACTIVE?.attempt?.id===attempt.id)SX_ACTIVE.attempt.status='blocked';
  try{sessionStorage.removeItem(key)}catch{}
  if($('sxLockTitle'))$('sxLockTitle').textContent='Exam Blocked';
  sxAutosave().catch(e=>console.warn('Post-block answer sync pending',e));
  sxAudit('AUTO_BLOCK_'+event,detail).catch(console.warn);
 }catch(e){
  console.warn('Exam block write pending; keep local lock',e);
  if($('sxLockTitle'))$('sxLockTitle').textContent='Exam locked — server sync pending';
 }finally{SX_AUTO_BLOCKING=false}
}
function sxBindAttempt(){const boundAttemptId=SX_ACTIVE?.attempt?.id;if(SX_ATTEMPT_UNSUB)SX_ATTEMPT_UNSUB();SX_ATTEMPT_UNSUB=onSnapshot(doc(db,'examAttempts',SX_ACTIVE.attempt.id),s=>{if(!s.exists()||!SX_ACTIVE||SX_ACTIVE.attempt?.id!==boundAttemptId)return;const a=s.data();if(s.metadata&&!s.metadata.fromCache&&!s.metadata.hasPendingWrites)SX_STORE?.observe({id:s.id,...a}).catch(console.warn);const prev=SX_ACTIVE.attempt?.status,priorWarningReset=JSON.stringify(SX_ACTIVE.attempt?.warningResetAt||null);SX_ACTIVE.attempt={...SX_ACTIVE.attempt,...a};if(sxAndroidChrome()&&s.metadata&&!s.metadata.fromCache&&!s.metadata.hasPendingWrites&&a.status==='started'&&a.reopenGrantedBy&&Number.isFinite(a.expiresAtMs))SX_RUNTIME_EXPIRES_AT=a.expiresAtMs;if(s.metadata&&!s.metadata.fromCache&&!s.metadata.hasPendingWrites&&Number.isFinite(a.aiLookAwayCount)){const previousWarnings=SX_LOOK_WARNINGS,serverWarnings=Math.max(0,Math.min(5,Number(a.aiLookAwayCount)));const teacherReset=JSON.stringify(a.warningResetAt||null)!==priorWarningReset;SX_LOOK_WARNINGS=teacherReset?serverWarnings:Math.max(previousWarnings,serverWarnings);if(teacherReset){SX_CAMERA_EPISODE={kind:null,since:0,lastWarningAt:0,clearSince:0};}sxUpdateWarningBadge();}if(a.warningMessage&&$('sxLiveWarning')){$('sxLiveWarning').textContent='Warning from Teacher/Admin: '+a.warningMessage;$('sxLiveWarning').classList.remove('hidden')}if(a.status==='hold'||a.status==='blocked'){$('sxLockOverlay').classList.remove('hidden');$('sxLockTitle').textContent=a.status==='blocked'?'Exam Blocked':'Exam on Hold';$('sxLockText').textContent=a.status==='blocked'?'Teacher/Admin has blocked this attempt. You cannot continue.':'Wait for Teacher/Admin to resume your exam.'}else{if(!(SX_AUTO_BLOCKING||(()=>{try{return !!sessionStorage.getItem('opjcc-exam-block-pending-'+boundAttemptId)}catch{return false}})()))$('sxLockOverlay').classList.add('hidden');if(prev&&prev!=='started'&&a.status==='started'){SX_LOOK_STREAK=0;SX_NOFACE=0;sxLocalNotice(`Exam resumed by Teacher/Admin. AI warnings: ${SX_LOOK_WARNINGS}/5`,'')}}})}
function sxHeartbeat(){const send=()=>SX_ACTIVE?.attempt?.id&&updateDoc(doc(db,'examAttempts',SX_ACTIVE.attempt.id),{cameraOn:!!SX_STREAM?.getVideoTracks().some(t=>t.readyState==='live'&&t.enabled),micOn:!!SX_STREAM?.getAudioTracks().some(t=>t.readyState==='live'&&t.enabled),online:navigator.onLine,lastSeenAt:sxStamp(),updatedAt:sxStamp()}).catch(()=>{});send();SX_HEARTBEAT=setInterval(send,10000)}
function sxIntegrity(){
 if(!sxAndroidChrome())return sxLegacyIntegrity();
 // Android Chrome: screen minimization / tab switch is distinct from fullscreen exit.
 // The browser can freeze JavaScript before a network write finishes. Retain a local
 // block marker immediately and retry the server write upon visibility/focus recovery.
 let wasHidden=false,blurredAt=0,blurredAttempt=null;
 const pendingKey=id=>'opjcc-exam-block-pending-'+id;
 const activeAttempt=()=>SX_ACTIVE?.attempt?.status==='started'?SX_ACTIVE.attempt:null;
 const requestBlock=reason=>{
  const a=activeAttempt();if(!a?.id)return;
  wasHidden=true;
  try{sessionStorage.setItem(pendingKey(a.id),'PAGE_HIDDEN')}catch{}
  const overlay=$('sxLockOverlay');if(overlay)overlay.classList.remove('hidden');
  if($('sxLockTitle'))$('sxLockTitle').textContent='Exam Blocked — server sync pending';
  if($('sxLockText'))$('sxLockText').textContent='Exam left the screen. Teacher/Admin review required.';
  sxAutoBlock('PAGE_HIDDEN',reason).catch(console.warn);
 };
 const vis=()=>{if(document.hidden){requestBlock('Exam tab hidden or phone minimized')}else onReturn()};
 const onBlur=()=>{
  const a=activeAttempt();if(!a)return;
  // Android virtual keyboard focusing an answer must not cause a false block.
  const el=document.activeElement,tag=el?.tagName?.toLowerCase();
  if(tag==='input'||tag==='textarea'||el?.isContentEditable)return;
  blurredAt=Date.now();blurredAttempt=a.id;
  if(document.hidden)requestBlock('Exam page hidden on window blur');
 };
 const onReturn=()=>{
  const a=activeAttempt();if(!a||document.hidden)return;
  const id=a.id;
  let pending=false;try{pending=!!sessionStorage.getItem(pendingKey(id))}catch{}
  // Some Android builds send window blur/focus but no visibilitychange.
  const backgroundBlur=blurredAttempt===id&&blurredAt>0&&Date.now()-blurredAt>=1500;
  blurredAt=0;blurredAttempt=null;
  if(pending||wasHidden||backgroundBlur){
   requestBlock('Exam left the screen and returned; Teacher/Admin review required');
  }
 };
 const onPageHide=()=>requestBlock('Exam page unloaded/backgrounded');
 const onOffline=()=>sxWarn('NETWORK_OFFLINE','Connection offline');
 document.addEventListener('visibilitychange',vis);
 window.addEventListener('blur',onBlur);
 window.addEventListener('focus',onReturn);
 window.addEventListener('pageshow',onReturn);
 window.addEventListener('pagehide',onPageHide);
 window.addEventListener('offline',onOffline);
 const old=sxStopAll;
 sxStopAll=function(){
  document.removeEventListener('visibilitychange',vis);
  window.removeEventListener('blur',onBlur);
  window.removeEventListener('focus',onReturn);
  window.removeEventListener('pageshow',onReturn);
  window.removeEventListener('pagehide',onPageHide);
  window.removeEventListener('offline',onOffline);
  sxStopAll=old;return old();
 };
}
async function sxLoadFaceAI(){if(SX_FACE_LANDMARKER)return SX_FACE_LANDMARKER;if(SX_FACE_LOADING)return SX_FACE_LOADING;SX_FACE_LOADING=(async()=>{const mod=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/+esm');const FaceLandmarker=mod.FaceLandmarker,FilesetResolver=mod.FilesetResolver;const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm');let opts={baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numFaces:2,outputFaceBlendshapes:false,outputFacialTransformationMatrixes:false};try{SX_FACE_LANDMARKER=await FaceLandmarker.createFromOptions(vision,opts)}catch(e){opts.baseOptions.delegate='CPU';SX_FACE_LANDMARKER=await FaceLandmarker.createFromOptions(vision,opts)}return SX_FACE_LANDMARKER})();try{return await SX_FACE_LOADING}finally{SX_FACE_LOADING=null}}
function sxFaceDirection(lm){if(!lm||lm.length<478)return{away:false,score:0};const avg=arr=>arr.reduce((a,b)=>a+b,0)/arr.length;const irisR=avg([468,469,470,471,472].map(i=>lm[i].x)),irisL=avg([473,474,475,476,477].map(i=>lm[i].x));const r1=lm[33].x,r2=lm[133].x,l1=lm[362].x,l2=lm[263].x;const ratio=(x,a,b)=>Math.abs(b-a)<.001?.5:(x-Math.min(a,b))/Math.abs(b-a);const rr=ratio(irisR,r1,r2),lr=ratio(irisL,l1,l2);const gaze=Math.max(Math.abs(rr-.5),Math.abs(lr-.5));const faceMid=(lm[234].x+lm[454].x)/2,faceW=Math.max(.01,Math.abs(lm[454].x-lm[234].x)),yaw=Math.abs(lm[1].x-faceMid)/faceW;// Approximate vertical head pose relative to an initial frontal baseline.
 const points=[10,152,1,13,33,263];
 if(points.some(i=>!Number.isFinite(lm[i]?.y)))return{away:gaze>.27||yaw>.115,score:Math.max(gaze/.27,yaw/.115),pitchReady:false};
 const height=Math.abs(lm[152].y-lm[10].y);
 if(height<.04)return{away:gaze>.27||yaw>.115,score:Math.max(gaze/.27,yaw/.115),pitchReady:false};
 const eyeY=(lm[33].y+lm[263].y)/2,pitch=((lm[1].y-eyeY)-.35*(lm[13].y-eyeY))/height;
 let baseline=sxFaceDirection.pitchBaseline;
 if(yaw<.075&&gaze<.18&&(!baseline||baseline.samples<8)){
  if(!baseline)baseline=sxFaceDirection.pitchBaseline={mean:pitch,samples:1};
  else if(Math.abs(pitch-baseline.mean)<.025){baseline.samples++;baseline.mean+=(pitch-baseline.mean)/baseline.samples;}
  else baseline=sxFaceDirection.pitchBaseline={mean:pitch,samples:1};
 }
 const pitchReady=!!baseline&&baseline.samples>=8,pitchDelta=pitchReady?pitch-baseline.mean:0,pitchAway=Math.abs(pitchDelta)>.065;
 return{away:gaze>.27||yaw>.115||pitchAway,score:Math.max(gaze/.27,yaw/.115,Math.abs(pitchDelta)/.065),pitchReady,pitchAway,pitchDelta}}
async function sxFaceMonitor(){
 if(!SX_STREAM)return;
 sxFaceDirection.pitchBaseline=null;
 const ai=$('sxAiStatus');
 try{
  const fd=await sxLoadFaceAI();
  if(ai){ai.textContent='AI Camera initializing…';ai.className='sx-ai-status mt-2'}
  let busy=false;
  SX_FACE_TIMER=setInterval(async()=>{
   if(busy||!SX_ACTIVE||!SX_STREAM||SX_ACTIVE.attempt?.status!=='started')return;
   const v=$('sxFaceVideo');
   if(!v||v.readyState<2){if(ai)ai.textContent='AI Camera waiting for video…';return}
   busy=true;
   try{
    const now=performance.now();
    const res=fd.detectForVideo(v,now),faces=res.faceLandmarks||[];
    let kind=null,detail='';
    if(faces.length===0){kind='AI_NO_FACE';detail='Face not visible for over 3 seconds'}
    else if(faces.length>1){kind='AI_MULTIPLE_FACES';detail='Multiple faces visible for over 3 seconds'}
    else if(sxFaceDirection(faces[0]).away){kind='AI_LOOK_AWAY';detail='Looking away for over 3 seconds'}
    const trigger=sxCameraEpisodeWarning(kind,now);
    if(ai){ai.textContent=kind?`${kind==='AI_NO_FACE'?'Face missing':kind==='AI_MULTIPLE_FACES'?'Multiple faces':'Look at screen'} • ${SX_LOOK_WARNINGS}/5`:`AI Camera active • ${SX_LOOK_WARNINGS}/5`;ai.className='sx-ai-status mt-2'+(kind?' warn':'')}
    if(trigger)await sxLookWarning(detail,kind);
   }catch(e){console.warn('AI frame',e);if(ai){ai.textContent='AI Camera frame error — teacher review';ai.className='sx-ai-status mt-2 warn'}}
   finally{busy=false}
  },400);
 }catch(e){console.warn('AI camera unavailable',e);if(ai){ai.textContent='AI Camera unavailable — teacher review';ai.className='sx-ai-status mt-2 warn'}sxWarningPopup('AI Camera unavailable. Notify your teacher.','warn');await sxAudit('AI_CAMERA_UNAVAILABLE',String(e?.message||e))}
}
function sxSignals(){}


await bootstrap('student',async s=>{me=s.user;p=s.profile;cl=s.classes;students=s.students;en=s.enrollments;window.me=me;sxStart();$('sxShowLive').onclick=()=>sxViewChange('live');$('sxShowResults').onclick=()=>sxViewChange('results');});
