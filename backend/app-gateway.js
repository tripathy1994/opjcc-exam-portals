// Optional standalone app Worker, bound ONLY to the new opjcc-exam-api service.
export default {async fetch(request,env){const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return env.EXAM_API.fetch(request);if(url.pathname==='/')return Response.redirect(url.origin+'/'+env.PORTAL_ROLE+'/',302);return env.ASSETS.fetch(request);}};
