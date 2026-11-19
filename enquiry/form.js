(() => {
  const $ = selector => document.querySelector(selector), form = $('#enquiry');
  let saving = false, session = null;
  async function getSession() {
    const response = await fetch('/api/enquiry', {cache:'no-store',signal:AbortSignal.timeout(30000)});
    const value = await response.json();
    const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (!response.ok || !uuid.test(value.id) || !uuid.test(value.token)) throw new Error('The enquiry service is unavailable. Please try again.');
    return value;
  }
  // Start a session before the visitor completes the form; no browser storage of contact details.
  const sessionReady = getSession().then(value => {session=value;}).catch(() => {});
  form.onsubmit = async event => {
    event.preventDefault();
    if (saving || !form.reportValidity()) return;
    const answers = {};
    ['name','whatsapp','email','city','service','goal','message'].forEach(key => answers[key]=$('#'+key).value.trim());
    answers.consent = $('#consent').checked;
    if (!/^\+?[\d\s().-]{7,24}$/.test(answers.whatsapp) || answers.whatsapp.replace(/\D/g,'').length < 7 || answers.whatsapp.replace(/\D/g,'').length > 15) {
      $('#feedback').textContent='Please enter a valid WhatsApp number, including your country code.'; $('#whatsapp').focus(); return;
    }
    const summary = ['SPEED FIT — NEW TRAINING ENQUIRY','Name: '+answers.name,'WhatsApp: '+answers.whatsapp,'Email: '+(answers.email||'Not provided'),'City: '+(answers.city||'Not provided'),'Interested in: '+answers.service,'Goal: '+answers.goal,'Enquiry: '+(answers.message||'Please contact me about training options.')].join('\n');
    saving=true; $('#submit').disabled=true; $('#submit').textContent='Saving…';
    $('#feedback').textContent='Saving your enquiry. Please keep this page open.'; $('#recovery').hidden=true;
    try {
      await sessionReady;
      if (!session) {session=await getSession(); throw new Error('Connection restored. Please press Submit enquiry again in a few seconds.');}
      const response = await fetch('/api/enquiry', {method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(30000),body:JSON.stringify({submissionId:session.id,token:session.token,website:form.elements.website.value,answers})});
      const receipt = await response.json();
      if (!response.ok || !receipt || receipt.ok !== true || receipt.submissionId !== session.id) throw new Error('The save was not confirmed. Please check your answers and try again. If this page has been open for over 6 hours, copy your details before reloading.');
      $('#receipt').textContent='Saved · Reference: '+receipt.submissionId; $('#summary').value=summary;
      $('#wa').href='https://wa.me/919025658178?text='+encodeURIComponent(summary);
      $('#formview').hidden=true; $('#result').hidden=false; window.scrollTo(0,0);
    } catch (error) {
      $('#feedback').textContent=(error.name==='TimeoutError'?'The save service took too long. Please try again.':error.message)+' Your entries remain on this page. You can also contact Speed Fit on WhatsApp using the link above.';
      $('#recoverytext').value=summary; $('#recovery').hidden=false;
    } finally {saving=false; $('#submit').disabled=false; $('#submit').textContent='Submit enquiry';}
  };
  $('#copy').onclick=async()=>{try{await navigator.clipboard.writeText($('#summary').value);$('#copystatus').textContent='Copied.';}catch{$('#summary').focus();$('#summary').select();$('#copystatus').textContent='Enquiry selected. Use Copy on your device.';}};
})();




