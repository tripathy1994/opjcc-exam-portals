import {answerPages,downloadReport,reportID} from './exam-reports.js';
import {toDataURL} from './vendor/qr.js';
// Isolated PDF globals: Student Attendance's jsPDF/AutoTable are never replaced.
window.renderStudentAnswerSheet=async({exam,attempt,profile})=>{
 const host=document.getElementById('report'),id=await reportID('ANS',exam,{...attempt,individualReportId:undefined});
 // Preserve the approved QR area without activating live verification or issuing records.
 const qr=await toDataURL('OPJCC REFERENCE ONLY | '+id,{errorCorrectionLevel:'M',margin:4,width:400});
 const output=await answerPages(exam,attempt,profile,new URL('./icons/apple-touch-icon.png',import.meta.url).href,qr,{measureRoot:host,id});
 if(output.warnings?.length||output.html.includes('rp-no-photo'))throw Error('A photograph or PDF asset could not be loaded. Reconnect and try again.');
 return downloadReport(output,host,'',{save:false});
};
