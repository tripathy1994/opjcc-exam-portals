// Read-only Student export. Authorization is also enforced by existing Firestore rules.
const pick=(value,keys)=>Object.fromEntries(keys.filter(k=>value[k]!==undefined).map(k=>[k,value[k]]));
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const examFields=['id','classId','teacherId','status','archived','deleted','title','assessmentType','projectType','batchId','nosCode','section','topic','totalMarks','passingMarks','passingPercent','startAtMs','startAt','duration','paperLanguage','questions','questionLanguages','questionPaperId'];
const attemptFields=['id','examId','classId','teacherId','studentId','status','archived','deleted','teacherVerified','verifiedBy','verifiedAt','gradePublished','questionScores','score','percentage','grade','totalMarks','feedback','paperLanguage','languageSnapshot','questionOrder','answers','examPhotoURL','startedAt','submittedAt','candidateId','traineeId','studentName','fatherName','fathersName','batchId'];
const profileFields=['name','studentName','candidateId','traineeId','fatherName','fathersName','batchId'];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const close=(a,b)=>Math.abs(a-b)<1e-7;
const validId=id=>typeof id==='string'&&id.length>0&&id.length<=512&&!/[\/\x00-\x1f]/.test(id)&&id!=='.'&&id!=='..';
function requireOnline(online){if(!online())throw Error('Connect to the internet to confirm your published result before downloading.');}
function sameUser(getUID,uid){if(!uid||getUID()!==uid)throw Error('Your signed-in account changed. Sign in again before downloading.');}
function bounded(work,ms){let timer;return Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Answer sheet preparation timed out. Reconnect and try again.')),ms)})]).finally(()=>clearTimeout(timer));}

export function validatePublishedAnswerSheet(uid,examId,exam,attempt,profile){
 if(!validId(uid)||!validId(examId)||!exam||!attempt||!profile)throw Error('Your examination records are unavailable.');
 if(exam.id!==examId||attempt.id!==examId+'_'+uid||attempt.examId!==examId||attempt.studentId!==uid)throw Error('Only your own answer sheet can be downloaded.');
 if(!exam.teacherId||attempt.teacherId!==exam.teacherId||attempt.classId!==exam.classId)throw Error('The examination and attempt do not match. Ask your teacher to review the result.');
 if(exam.status!=='published'||exam.archived===true||exam.deleted===true)throw Error('The examination paper is unavailable. Ask your teacher to keep the paper published for answer-sheet downloads.');
 if(attempt.status!=='submitted'||attempt.archived===true||attempt.deleted===true||attempt.gradePublished!==true||attempt.teacherVerified!==true||attempt.verifiedBy!==exam.teacherId||!attempt.verifiedAt)throw Error('Your teacher must verify and publish your submitted result before you can download the answer sheet.');
 const questions=exam.questions;
 if(!Array.isArray(questions)||!questions.length||new Set(questions.map(q=>q.id)).size!==questions.length||questions.some(q=>!validId(q.id)||!finite(q.marks)||q.marks<=0))throw Error('The question paper needs teacher review.');
 if(!Array.isArray(attempt.questionOrder)||attempt.questionOrder.length!==questions.length||new Set(attempt.questionOrder).size!==questions.length||attempt.questionOrder.some(id=>!questions.some(q=>q.id===id)))throw Error('The saved question order is unavailable or invalid.');
 const scores=attempt.questionScores,total=questions.reduce((n,q)=>n+q.marks,0);
 if(!scores||Object.keys(scores).length!==questions.length||questions.some(q=>!finite(scores[q.id])||scores[q.id]<0||scores[q.id]>q.marks)||!finite(attempt.score)||!finite(attempt.totalMarks)||!finite(attempt.percentage)||!finite(exam.totalMarks)||!close(total,exam.totalMarks)||!close(total,attempt.totalMarks)||!close(questions.reduce((n,q)=>n+scores[q.id],0),attempt.score)||!close(attempt.score*100/total,attempt.percentage)||typeof attempt.grade!=='string'||!attempt.grade.trim())throw Error('Published marks are incomplete or inconsistent. Ask your teacher to review and republish the result.');
 if(!attempt.answers||typeof attempt.answers!=='object'||Array.isArray(attempt.answers))throw Error('Saved answers are unavailable.');
 if(typeof attempt.examPhotoURL!=='string'||!attempt.examPhotoURL||!/^https:\/\/|^data:image\/(png|jpeg|webp);base64,/.test(attempt.examPhotoURL))throw Error('Your saved examination selfie is unavailable. Ask your teacher to review the attempt.');
 return {exam:pick(exam,examFields),attempt:pick(attempt,attemptFields),profile:pick(profile,profileFields)};
}

export function createAnswerSheetDownloader({uid,read,render,save,online=()=>navigator.onLine,timeoutMs=15000,renderTimeoutMs=120000}){
 let busy=false;
 return async examId=>{
  if(busy)throw Error('Please wait for your current answer sheet download.');
  busy=true;
  try{
   const owner=uid();sameUser(uid,owner);requireOnline(online);
   if(!validId(examId)||!validId(owner))throw Error('Invalid examination identity.');
   async function fresh(){
    sameUser(uid,owner);requireOnline(online);
    // IDs are derived from the current account, never supplied attempt/student IDs.
    const [exam,attempt,profile]=await bounded(Promise.all([read('exams',examId),read('examAttempts',examId+'_'+owner),read('users',owner)]),timeoutMs);
    sameUser(uid,owner);requireOnline(online);
    return validatePublishedAnswerSheet(owner,examId,exam,attempt,profile);
   }
   const source=await fresh(),version=canonical(source);
   const blob=await bounded(render(source),renderTimeoutMs);
   if(!blob||blob.type!=='application/pdf'||!blob.size)throw Error('The answer sheet could not be rendered. No PDF was saved.');
   const latest=await fresh();
   if(canonical(latest)!==version)throw Error('Your paper, answers, profile or result changed while the PDF was prepared. Please try again.');
   sameUser(uid,owner);requireOnline(online);
   const filename='OPJCC_Individual_Answer_Sheet_'+examId.replace(/[^a-zA-Z0-9_-]/g,'_')+'.pdf';
   save(blob,filename);
   return {filename};
  }finally{busy=false;}
 };
}

async function renderInFrame(source){
 const frame=document.createElement('iframe');
 frame.title='Answer sheet PDF preparation';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
 frame.style.cssText='position:fixed;left:0;top:0;width:900px;height:1100px;border:0;z-index:-99999;pointer-events:none';
 try{
  await bounded(new Promise((resolve,reject)=>{frame.onload=()=>resolve();frame.onerror=()=>reject(Error('The answer sheet renderer could not load.'));frame.src=new URL('./exam-answer-sheet-frame.html',import.meta.url).href;document.body.append(frame);}),15000);
  if(typeof frame.contentWindow?.renderStudentAnswerSheet!=='function')throw Error('The answer sheet renderer is unavailable. Refresh and try again.');
  return await bounded(frame.contentWindow.renderStudentAnswerSheet(source),110000);
 }finally{frame.remove();}
}
function saveBlob(blob,filename){const url=URL.createObjectURL(blob),link=document.createElement('a');try{link.href=url;link.download=filename;document.body.append(link);link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}}
let activeDownload=null;
export async function downloadOwnAnswerSheet({examId,uid,read}){
 if(activeDownload)throw Error('Please wait for your current answer sheet download.');
 activeDownload=createAnswerSheetDownloader({uid,read,render:renderInFrame,save:saveBlob});
 try{return await activeDownload(examId);}finally{activeDownload=null;}
}
