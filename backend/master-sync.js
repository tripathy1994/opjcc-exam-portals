// No production Firestore client or privileged credentials. Only isolated fixtures accepted.
const fields=['id','uid','studentId','teacherId','classId','name','studentName','role','projectType','batchId','className','candidateId','traineeId','fatherName','fathersName','active','blocked','archived','deleted'];
export function minimalSnapshot(record){return Object.fromEntries(fields.filter(k=>record[k]!==undefined).map(k=>[k,record[k]]));}
export async function synchronizeMaster(source){if(source.kind!=='isolated-fixture')throw Error('Production master access requires separate approval and privacy review');return {users:source.users.map(minimalSnapshot),classes:source.classes.map(minimalSnapshot),enrollments:source.enrollments.map(minimalSnapshot)};}
