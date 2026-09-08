const envelopeIntro = document.getElementById('envelopeIntro');
const waxSeal = document.getElementById('waxSeal');
const form = document.getElementById('rsvpForm');
const submitButton = document.getElementById('submitButton');
const formStatus = document.getElementById('formStatus');
const thanksModal = document.getElementById('thanksModal');
const thanksTitle = document.getElementById('thanksTitle');
const closeThanks = document.getElementById('closeThanks');
const confettiCanvas = document.getElementById('confettiCanvas');
const ctx = confettiCanvas?.getContext('2d');
const REQUIRED_BACKEND_VERSION = 'EVENING-1.0';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
function goTop(){ window.scrollTo({top:0,left:0,behavior:'instant'}); document.documentElement.scrollTop=0; document.body.scrollTop=0; }
goTop();
window.addEventListener('pageshow', goTop);

if (envelopeIntro && waxSeal) {
  let opened = false;
  waxSeal.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    waxSeal.disabled = true;
    goTop();
    envelopeIntro.classList.add('is-pressed');
    setTimeout(() => {
      goTop();
      document.body.classList.remove('intro-active');
      envelopeIntro.classList.add('is-fading');
    }, 180);
    setTimeout(() => { goTop(); envelopeIntro.remove(); }, 1050);
  });
}

const celebrationDate = new Date('2027-07-24T18:00:00+01:00');
function updateCountdown(){
  const remaining = celebrationDate.getTime() - Date.now();
  const ids = ['days','hours','minutes','seconds'];
  if (remaining <= 0) { ids.forEach((id,i)=>document.getElementById(id).textContent=i===0?'000':'00'); return; }
  const total = Math.floor(remaining/1000);
  const values = [Math.floor(total/86400), Math.floor((total%86400)/3600), Math.floor((total%3600)/60), total%60];
  values.forEach((value,i)=>document.getElementById(ids[i]).textContent=String(value).padStart(i===0?3:2,'0'));
}
updateCountdown(); setInterval(updateCountdown,1000);

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if(entry.isIntersecting){ entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), {threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

function setGuestEnabled(number, enabled){
  const fields = document.querySelector(`[data-fields="${number}"]`);
  if(!fields) return;
  fields.hidden = !enabled;
  fields.querySelectorAll('input,textarea,select').forEach(el => el.disabled = !enabled);
  ['FirstName','LastName'].forEach(suffix => {
    const el = fields.querySelector(`[name="guest${number}${suffix}"]`);
    if(el) el.required = enabled;
  });
  fields.querySelectorAll(`[name="guest${number}Attending"]`).forEach(el => el.required = enabled);
  if(!enabled){
    fields.querySelectorAll('input').forEach(input => { if(input.type==='radio'||input.type==='checkbox') input.checked=false; else input.value=''; });
    fields.querySelectorAll('textarea').forEach(t=>t.value='');
  }
}

document.querySelectorAll('.guest-enable').forEach(toggle => {
  toggle.addEventListener('change', () => setGuestEnabled(toggle.dataset.enable, toggle.checked));
});

// Pressing Enter never submits the RSVP. Textareas still allow line breaks.
form.addEventListener('keydown', event => {
  if(event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement)) event.preventDefault();
});

async function sha256(value){
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function jsonp(endpoint, params, prefix){
  return new Promise((resolve,reject)=>{
    const cb = `${prefix}_${Date.now()}_${Math.floor(Math.random()*100000)}`;
    const script = document.createElement('script');
    const timer = setTimeout(()=>{cleanup();reject(new Error('TIMEOUT'));},10000);
    function cleanup(){ clearTimeout(timer); delete window[cb]; script.remove(); }
    window[cb] = data => { cleanup(); resolve(data||{}); };
    script.onerror = () => { cleanup(); reject(new Error('NETWORK')); };
    const url = new URL(endpoint);
    Object.entries({...params,callback:cb,_:Date.now()}).forEach(([k,v])=>url.searchParams.set(k,v));
    script.src = url.toString();
    document.body.appendChild(script);
  });
}

async function waitForSaved(endpoint, hash){
  for(let i=0;i<4;i++){
    await new Promise(r=>setTimeout(r,900+i*500));
    const result = await jsonp(endpoint,{action:'status',hash},'eveningStatus');
    if(result.found) return result;
  }
  return {found:false};
}

let confettiFrame;
function stopConfetti(){ if(confettiFrame) cancelAnimationFrame(confettiFrame); if(ctx) ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height); }
function runConfetti(){
  if(!ctx) return;
  stopConfetti();
  const ratio = Math.max(devicePixelRatio||1,1);
  confettiCanvas.width = innerWidth*ratio; confettiCanvas.height=innerHeight*ratio; confettiCanvas.style.width=innerWidth+'px'; confettiCanvas.style.height=innerHeight+'px'; ctx.setTransform(ratio,0,0,ratio,0,0);
  const colors=['#b38b45','#46593f','#d6a8a2','#ebe0c9','#8d86b7'];
  const bits=Array.from({length:150},()=>({x:Math.random()*innerWidth,y:-20-Math.random()*innerHeight*.25,w:5+Math.random()*7,h:8+Math.random()*9,vx:-2+Math.random()*4,vy:2+Math.random()*4,r:Math.random()*6,s:-.15+Math.random()*.3,c:colors[Math.floor(Math.random()*colors.length)]}));
  const start=performance.now();
  function frame(now){ ctx.clearRect(0,0,innerWidth,innerHeight); const elapsed=now-start; ctx.globalAlpha=Math.max(0,1-elapsed/3200); bits.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.r+=p.s;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}); if(elapsed<3200) confettiFrame=requestAnimationFrame(frame); else stopConfetti(); }
  confettiFrame=requestAnimationFrame(frame);
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if(event.submitter !== submitButton) return;
  if(!form.checkValidity()){ form.reportValidity(); return; }
  const endpoint = window.EVENING_RSVP_CONFIG?.RSVP_ENDPOINT?.trim();
  if(!endpoint || endpoint.includes('PASTE_YOUR_')){ formStatus.textContent='The evening RSVP service has not been connected yet.'; formStatus.className='form-status error'; return; }
  const data=Object.fromEntries(new FormData(form).entries());
  data.guest1Email=String(data.guest1Email||'').trim().toLowerCase();
  data.email=data.guest1Email;
  const guests=[1,2,3,4].map(number=>{
    const first=String(data[`guest${number}FirstName`]||'').trim();
    const last=String(data[`guest${number}LastName`]||'').trim();
    const attending=String(data[`guest${number}Attending`]||'').trim();
    data[`guest${number}Name`]=[first,last].filter(Boolean).join(' ');
    return {number,name:data[`guest${number}Name`],attending};
  }).filter(g=>g.name);
  data.name=data.guest1Name;
  data.attending=guests.some(g=>g.attending==='Yes')?'Yes':'No';
  data.guestCount=String(guests.filter(g=>g.attending==='Yes').length);
  data.submittedAt=new Date().toISOString(); data.pageUrl=location.href; data.userAgent=navigator.userAgent;
  submitButton.disabled=true; submitButton.innerHTML='Checking…'; formStatus.textContent='Checking your email address…'; formStatus.className='form-status';
  try{
    const hash=await sha256(data.email);
    const check=await jsonp(endpoint,{action:'check',hash},'eveningCheck');
    if(check.version!==REQUIRED_BACKEND_VERSION) throw new Error('VERSION');
    if(check.duplicate){ formStatus.textContent='An evening RSVP has already been submitted using this email address. Please contact Emma or Joe if it needs changing.'; formStatus.className='form-status error'; return; }
    submitButton.innerHTML='Sending…'; formStatus.textContent='Sending your reply…';
    await fetch(endpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)});
    formStatus.textContent='Confirming your RSVP was saved…';
    const saved=await waitForSaved(endpoint,hash);
    if(saved.version!==REQUIRED_BACKEND_VERSION) throw new Error('VERSION');
    if(!saved.found) throw new Error('NOT_CONFIRMED');
    thanksTitle.textContent=data.attending==='Yes'?'We cannot wait to celebrate with you.':'Thank you for letting us know.';
    if(data.attending==='Yes') runConfetti(); else stopConfetti();
    thanksModal.classList.add('show'); thanksModal.setAttribute('aria-hidden','false');
    form.reset(); [2,3,4].forEach(n=>setGuestEnabled(n,false));
    formStatus.textContent=saved.emailStatus==='Sent'?'Your evening RSVP was saved. Please check your inbox for confirmation.':'Your RSVP was saved, but the confirmation email could not be sent. Please contact Emma or Joe.';
    formStatus.className=saved.emailStatus==='Sent'?'form-status success':'form-status error';
  }catch(error){
    console.error(error);
    formStatus.textContent=error.message==='VERSION'?'The evening RSVP service is not on the expected version. Please contact Emma or Joe.':error.message==='NOT_CONFIRMED'?'Your reply may have been received, but the website could not confirm it. Please contact Emma or Joe before trying again.':'We could not send your RSVP. Please check your connection and try again.';
    formStatus.className='form-status error';
  }finally{ submitButton.disabled=false; submitButton.innerHTML='Send Your Reply <span>❧</span>'; }
});

closeThanks.addEventListener('click',()=>{ thanksModal.classList.remove('show'); thanksModal.setAttribute('aria-hidden','true'); });
