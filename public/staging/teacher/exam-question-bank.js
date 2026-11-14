// Pure bank/import/batching helpers. No Firebase, credentials, Worker calls or PDF CSS.
export const BANK_LANGUAGES=['English','Hindi','Odia','Hinglish'];
const copy=x=>structuredClone(x),norm=s=>String(s??'').normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
export const duplicateKey=q=>norm(q.text??q.question);
export function assertDistinct(rows,existing=[]){const seen=new Set(existing.map(duplicateKey).filter(Boolean));for(const q of rows){const k=duplicateKey(q);if(k&&seen.has(k))throw Error('Duplicate question detected: '+String(q.text??q.question).slice(0,90));if(k)seen.add(k);}return rows;}
export function selectedQuestions(bank){return bank.filter(q=>q.selected!==false);}
export function bankSignature(bank,answers){return JSON.stringify(bank.map(q=>({id:q.id,type:q.type,text:q.text,options:q.options||[],marks:Number(q.marks),key:answers[q.id]??null})).sort((a,b)=>a.id.localeCompare(b.id)));}
export function planBatches(config,max=8){if(!Number.isInteger(max)||max<1||max>10)throw Error('Batch size must be 1–10.');const left={...config.counts},batches=[];while(Object.values(left).some(n=>n>0)){let space=max;const counts={mcq:0,truefalse:0,fill:0,subjective:0};for(const t of Object.keys(counts)){counts[t]=Math.min(left[t],space);left[t]-=counts[t];space-=counts[t];}batches.push({...copy(config),counts,total:Object.values(counts).reduce((a,b)=>a+b,0)});}return batches;}
export function translationBatches(questions,max=8){const groups=new Map();for(const q of questions){const key=Number(q.marks);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(q);}const jobs=[];for(const group of groups.values()){let rows=[],length=0;for(const q of group){const n=JSON.stringify(q).length;if(n>18000)throw Error('One question is too large for safe AI translation. Edit it manually.');if(rows.length&&(rows.length>=max||length+n>18000)){jobs.push(rows);rows=[];length=0;}rows.push(q);length+=n;}if(rows.length)jobs.push(rows);}return jobs;}

export function parseMixedQuestionBank(text){
 const warnings=[],blocks=[];let current=null,section='Questions',sectionType=null,sectionMarks=1,headerTail=false;
 const digits=s=>s.replace(/[०-९]/g,c=>String(c.charCodeAt(0)-0x0966)).replace(/[୦-୯]/g,c=>String(c.charCodeAt(0)-0x0b66));
 const flush=()=>{if(current)blocks.push(current);current=null;};
 const noise=/^(?:CON\s*\/\s*N\d+|This Question Bank Covers|Particular Information|Trainee\s+(?:Name|ID)|Assessment Date|Batch ID|Job Role|Training Cent(?:er|re)|Student Signature|Teacher Signature|Trainer Sign|Signature of|Page\s+\d|©|Copyright)/i;
 function marks(line){const m=/(?:\b\d+\s*[×x*]\s*(\d+(?:\.\d+)?)\s*=|\[(\d+(?:\.\d+)?)\]\s*$)/i.exec(line);return m?Number(m[1]||m[2]):null;}
 for(const original of String(text).replace(/\r/g,'').split('\n')){
  let line=original.trim();if(!line)continue;
  if(noise.test(line)){headerTail=/^CON\s*\//i.test(line);continue;}
  if(headerTail&&/^(?:works\.?|electrical works\.?)$/i.test(line)){headerTail=false;continue;}headerTail=false;
  const sh=/^(?:Section|Part)\s*[-–:]?\s*([A-Z0-9]+)\b(.*)$/i.exec(line);
  const heading=sh||/^(?:Choose\s+the\s+correct|Multiple\s+Choice|MCQs?\b|Fill\s+in\s+the\s+Blanks|Short\s+(?:Answer\s+)?Questions|Subjective\s+Questions|True\s*\/\s*False)/i.test(line);
  if(heading){flush();section=line;sectionType=/fill|blanks|रिक्त|ଶୂନ୍ୟ/i.test(line)?'fill':/short|subjective|लघु|संक्षिप्त/i.test(line)?'subjective':/true\s*\/\s*false/i.test(line)?'truefalse':/choose|mcq|multiple/i.test(line)?'mcq':null;sectionMarks=marks(line)||(sectionType==='subjective'?2:1);continue;}
  if(/^\(?\s*(?:Instructions?|Attempt\b|Answer\s+(?:any|all)|(?:किसी|लकसी)\s+भी|निर्देश)/i.test(line)){sectionMarks=marks(line)||sectionMarks;continue;}
  const q=/^\s*(?:Q(?:uestion)?\s*)?([0-9०-९୦-୯]{1,3})\s*[.)।:]\s*(.+)$/i.exec(line);
  if(q){flush();current={number:Number(digits(q[1])),section,type:sectionType,marks:sectionMarks,lines:[q[2]]};}
  else if(current)current.lines.push(line);
 }
 flush();
 const rows=blocks.map((b,index)=>{
  const stem=[],opts=[];let ans='',optionMode=false,mark=b.marks;
  for(let line of b.lines){
   const answer=/(?:^|\s)(?:Answer|Ans\.?|Correct(?:\s+answer)?|उत्तर|ଉତ୍ତର)\s*[:：-]\s*(.*)$/i.exec(line);
   if(answer){ans=answer[1].trim();line=line.slice(0,answer.index).trim();if(!line)continue;}
   const tokens=[...line.matchAll(/(?:^|\s)\(?([A-Da-d])\s*[.)\]:]\s*/g)];
   if(tokens.length){
    const before=line.slice(0,tokens[0].index).trim();if(before){if(optionMode&&opts.length)opts.at(-1).value+=' '+before;else stem.push(before);}
    tokens.forEach((m,i)=>{opts.push({label:m[1].toUpperCase(),value:line.slice(m.index+m[0].length,i+1<tokens.length?tokens[i+1].index:undefined).trim()});});optionMode=true;
   }else if(optionMode&&opts.length)opts.at(-1).value+=' '+line;else stem.push(line);
  }
  let question=stem.join(' ').trim();const mm=/\s*(?:\[(\d+(?:\.\d+)?)\]|\((\d+(?:\.\d+)?)\s*marks?\))\s*$/i.exec(question);if(mm){mark=Number(mm[1]||mm[2]);question=question.slice(0,mm.index).trim();}
  let type=b.type;if(opts.length)type=opts.length===2&&/^true$/i.test(opts[0].value)&&/^false$/i.test(opts[1].value)?'truefalse':'mcq';else if(!type)type=/_{3,}|…{2,}|\.{5,}/.test(question)?'fill':/true\s*\/\s*false|true or false|सही.*गलत|ସତ୍ୟ.*ମିଥ୍ୟା/i.test(question)?'truefalse':'subjective';
  const label=/^\(?([A-D])(?:\)|\.|\s|$)/i.exec(ans),position=label?label[1].toUpperCase().charCodeAt(0)-65:opts.findIndex(o=>norm(o.value)===norm(ans));
  let key=type==='mcq'?(position>=0&&position<4?position:null):type==='truefalse'?(/^(?:true|सही|ସତ୍ୟ|A[.)]?)$/i.test(ans)?'True':/^(?:false|गलत|ମିଥ୍ୟା|B[.)]?)$/i.test(ans)?'False':null):type==='fill'?(ans?ans.split('|').map(s=>s.trim()).filter(Boolean):[]):ans;
  const options=type==='mcq'?['A','B','C','D'].map(l=>opts.find(o=>o.label===l)?.value||''):type==='truefalse'?['True','False']:[];
  if(type==='mcq'&&(opts.length!==4||opts.map(o=>o.label).join('')!=='ABCD'))warnings.push('Question '+(index+1)+' has missing/repeated option labels; edit all four options before approval.');
  if(type!=='subjective'&&(key===null||Array.isArray(key)&&!key.length))warnings.push('Question '+(index+1)+' has no reliable answer key; Teacher must supply it before publication.');
  return {id:'',type,text:question,options,marks:mark,key,section:b.section,sourceNumber:b.number,selected:true};
 }).filter(q=>q.text);
 if(!rows.length)throw Error('No recognizable numbered questions found. Check extracted text; image-only PDFs need a text layer. OCR is not configured.');
 Object.assign(rows,{warnings,importReport:{total:rows.length,counts:Object.fromEntries(['mcq','truefalse','fill','subjective'].map(t=>[t,rows.filter(q=>q.type===t).length])),sections:[...new Set(rows.map(q=>q.section))],missingKeys:rows.filter(q=>q.type!=='subjective'&&(q.key===null||Array.isArray(q.key)&&!q.key.length)).length}});
 return rows;
}
