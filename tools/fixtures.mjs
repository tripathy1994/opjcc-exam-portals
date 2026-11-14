export function seed(db){
 const insert=db.sqlite.prepare('INSERT OR IGNORE INTO documents(collection,id,body) VALUES(?,?,?)');
 const users=[{id:'demo-teacher',uid:'demo-teacher',role:'teacher',name:'Synthetic Teacher'}];for(let i=1;i<=50;i++)users.push({id:'demo-student-'+i,uid:'demo-student-'+i,role:'student',name:'Synthetic Student '+i,studentName:'Synthetic Student '+i,candidateId:'TEST-'+i,batchId:i<=30?'LOCAL-JF':'LOCAL-NTPC',fatherName:'Synthetic Parent'});
 for(const u of users){db.sqlite.prepare('INSERT OR IGNORE INTO principals(uid,role) VALUES(?,?)').run(u.uid,u.role);insert.run('users',u.id,JSON.stringify(u));}
 for(const [id,name,projectType] of [['local-jf','Jindal Foundation synthetic batch','Jindal Foundation'],['local-ntpc','NTPC synthetic batch','NTPC CSR']])insert.run('classes',id,JSON.stringify({id,teacherId:'demo-teacher',name,className:name,projectType,active:true,batchId:id==='local-jf'?'LOCAL-JF':'LOCAL-NTPC',trade:'Electrician',campus:'Punjipathra'}));
 for(const u of users.filter(u=>u.role==='student')){const cid=Number(u.uid.split('-').at(-1))<=30?'local-jf':'local-ntpc';insert.run('enrollments',cid+'_'+u.uid,JSON.stringify({...u,id:cid+'_'+u.uid,classId:cid,teacherId:'demo-teacher',studentId:u.uid,studentName:u.name,rollNumber:u.uid.split('-').at(-1)}));}
}
