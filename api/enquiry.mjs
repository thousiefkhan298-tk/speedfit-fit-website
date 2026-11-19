const UPSTREAM = process.env.ENQUIRY_UPSTREAM_URL;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const headers = {'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'};
const fail = (status = 502) => Response.json({ok:false,message:'Your enquiry was not saved. Please check your details and try again. Your entries remain on this page.'},{status,headers});
function sameSite(request) {
  const origin = request.headers.get('origin');
  return request.headers.get('sec-fetch-site') !== 'cross-site' && (!origin || origin === new URL(request.url).origin);
}
async function upstream(options = {}) {
  const response = await fetch(UPSTREAM + (options.method === 'POST' ? '' : '?form=enquiry-session'), {
    ...options, redirect:'follow', cache:'no-store', signal:AbortSignal.timeout(25000)
  });
  if (!response.ok) throw new Error('Save service unavailable');
  const text = await response.text();
  if (text.length > 10000) throw new Error('Invalid save service response');
  return JSON.parse(text);
}
export async function GET(request) {
  if (!sameSite(request)) return fail(403);
  try {
    const session = await upstream();
    if (!session || !UUID.test(session.id) || !UUID.test(session.token)) throw new Error('Invalid session');
    return Response.json({id:session.id,token:session.token},{headers});
  } catch {
    console.error('Enquiry session service unavailable.');
    return fail();
  }
}
export async function POST(request) {
  if (!sameSite(request)) return fail(403);
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) return fail(415);
  try {
    if (Number(request.headers.get('content-length')) > 10000) return fail(413);
    const text = await request.text();
    if (Buffer.byteLength(text,'utf8') > 10000) return fail(413);
    const payload = JSON.parse(text);
    const allowed = ['name','whatsapp','email','city','service','goal','message','consent'];
    if (!payload || !UUID.test(payload.submissionId) || !UUID.test(payload.token)
      || typeof payload.website !== 'string' || payload.website.trim()
      || !payload.answers || typeof payload.answers !== 'object' || Array.isArray(payload.answers)
      || Object.keys(payload.answers).some(key=>!allowed.includes(key))
      || payload.answers.consent !== true) return fail(400);
    const receipt = await upstream({method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({submissionId:payload.submissionId,token:payload.token,website:'',answers:payload.answers})});
    if (!receipt || receipt.ok !== true || receipt.submissionId !== payload.submissionId) return fail(400);
    return Response.json({ok:true,submissionId:receipt.submissionId,duplicate:receipt.duplicate === true},{headers});
  } catch {
    console.error('Enquiry save service unavailable; no contact details logged.');
    return fail();
  }
}




