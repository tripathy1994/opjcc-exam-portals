/* Local classic Worker. No Firebase, credentials, student identifiers or network writes. */
let detector=null,busy=false;
self.onmessage=async event=>{
 const m=event.data||{};
 try{
  if(m.type==='init'){
   self.exports={};importScripts('./exam-vision/vision_bundle.js');
   const vision=self.exports,files=await vision.FilesetResolver.forVisionTasks(new URL('./exam-vision/wasm',self.location.href).href);
   detector=await vision.FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:new URL('./exam-vision/face_landmarker.task',self.location.href).href,delegate:'CPU'},canvas:new OffscreenCanvas(1,1),runningMode:'VIDEO',numFaces:2,outputFaceBlendshapes:false,outputFacialTransformationMatrixes:false});
   self.postMessage({type:'ready'});return;
  }
  if(m.type==='frame'){
   if(!detector||busy)throw Error('AI worker is not ready');busy=true;let result;
   try{result=detector.detectForVideo(m.bitmap,m.timestamp)}finally{m.bitmap?.close();busy=false}
   self.postMessage({type:'result',id:m.id,faces:result.faceLandmarks||[]});
  }
 }catch(e){m.bitmap?.close();busy=false;self.postMessage({type:'error',id:m.id,message:String(e?.message||e).slice(0,240)})}
};
