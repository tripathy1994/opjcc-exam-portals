// Same pure adapter contract; public copy verified by tests.
export function normalizeExamSchedule(ref,data){
 if(ref.collection!=='exams'||typeof data.endAt!=='string'||Object.hasOwn(data,'endAtMs'))return data;
 const value=data.endAt,withZone=/[zZ]|[+-]\d\d:\d\d$/.test(value)?value:value+'+05:30',endAtMs=Date.parse(withZone);
 if(!Number.isFinite(endAtMs))throw Error('Invalid examination end time');return {...data,endAtMs};
}
