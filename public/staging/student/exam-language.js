// Public question content only. Never reads answer-key documents.
(function(g){
const languages=['English','Hindi','Odia','Hinglish'], codes={English:'en',Hindi:'hi',Odia:'or',Hinglish:'en'};
const clean=qs=>qs.map(q=>({id:q.id,type:q.type,text:String(q.text||'').trim(),options:q.type==='mcq'||q.type==='truefalse'?[...(q.options||[])]:[],marks:Number(q.marks)}));
const signature=qs=>JSON.stringify(clean(qs));
function valid(base,rows){return Array.isArray(rows)&&rows.length===base.length&&rows.every((q,i)=>q.id===base[i].id&&q.type===base[i].type&&Number(q.marks)===Number(base[i].marks)&&typeof q.text==='string'&&q.text.trim()&&Array.isArray(q.options)&&q.options.length===(base[i].options||[]).length&&q.options.every(o=>typeof o==='string'&&o.trim()));}
function choose(exam,language,snapshot){
 const base=clean(exam.questions||[]),original=languages.includes(exam.paperLanguage)?exam.paperLanguage:'English';
 if(!languages.includes(language))throw Error('Unsupported examination language.');
 if(snapshot){if(snapshot.language!==language||snapshot.sourceSignature!==signature(base)||!valid(base,snapshot.questions))throw Error('The examination changed after this attempt started. Ask your teacher before continuing.');return snapshot;}
 let questions=base;
 if(language!==original){const v=exam.questionLanguages?.[language];if(v?.reviewed!==true||v.sourceSignature!==signature(base)||!valid(base,v.questions))throw Error('A teacher-reviewed '+language+' translation is unavailable. The original approved examination is retained.');questions=clean(v.questions);}
 return {language,sourceSignature:signature(base),questions};
}
function display(exam,snapshot){const selected=choose(exam,snapshot.language,snapshot);return clean(exam.questions).map((q,i)=>({...q,text:selected.questions[i].text,displayOptions:q.type==='truefalse'?({Hindi:['सही','गलत'],Odia:['ସତ୍ୟ','ମିଥ୍ୟା'],Hinglish:['Sahi (True)','Galat (False)']}[snapshot.language]||['True','False']):selected.questions[i].options}));}
function order(questions,saved){const ids=questions.map(q=>q.id);if(saved){if(saved.length!==ids.length||new Set(saved).size!==ids.length||saved.some(id=>!ids.includes(id)))throw Error('Saved question order is invalid. Ask your teacher.');return [...saved];}for(let i=ids.length-1;i>0;i--){let n;const limit=Math.floor(4294967296/(i+1))*(i+1);do{n=crypto.getRandomValues(new Uint32Array(1))[0]}while(n>=limit);const j=n%(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}return ids;}
function available(exam){const base=clean(exam.questions||[]),original=languages.includes(exam.paperLanguage)?exam.paperLanguage:'English';return languages.filter(l=>l===original||(exam.questionLanguages?.[l]?.reviewed===true&&exam.questionLanguages[l].sourceSignature===signature(base)&&valid(base,exam.questionLanguages[l].questions)));}
g.OPExamLanguage={available,order,languages,codes,clean,signature,valid,choose,display};
})(globalThis);
