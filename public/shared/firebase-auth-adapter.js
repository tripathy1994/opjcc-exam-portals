// Explicitly disabled unless a future approved deployment supplies public Firebase config.
// Uses only Authentication SDK. Never imports Firestore or creates/changes users or roles.
export async function createFirebaseIdentityAdapter({enabled=false,publicConfig}={}){
 if(!enabled)throw Error('Firebase integration disabled pending authorized master access');
 if(publicConfig?.projectId!=='opjcc-management-system')throw Error('Firebase project mismatch');
 const appSDK=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
 const authSDK=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
 const auth=authSDK.getAuth(appSDK.initializeApp(publicConfig,'OPJCCIndependentExam'));
 await authSDK.setPersistence(auth,authSDK.browserSessionPersistence);
 return {signIn:async(email,password)=>(await authSDK.signInWithEmailAndPassword(auth,email,password)).user,signOut:()=>authSDK.signOut(auth),token:async()=>{if(!auth.currentUser)throw Error('Sign in required');return auth.currentUser.getIdToken();},observe:fn=>authSDK.onAuthStateChanged(auth,fn)};
}
