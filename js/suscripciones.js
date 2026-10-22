(()=>{'use strict';
const labels={es:{pay:'🔒 Pagar ahora',apply:'Solicitar beca 100 %',pending:'Preparando el pago…',error:'No se pudo iniciar el pago. El servicio de cobro todavía no está disponible.'},en:{pay:'🔒 Pay now',apply:'Apply for a 100% scholarship',pending:'Preparing checkout…',error:'Checkout could not be started. The payment service is not available yet.'}};
const radios=[...document.querySelectorAll('input[name="billing"]')],btn=document.getElementById('payNow'),status=document.getElementById('paymentStatus');
const lang=()=>document.getElementById('languageSelect')?.value==='en'?'en':'es';
const selected=()=>radios.find(r=>r.checked)?.value||'monthly';
function render(){if(!btn)return;btn.textContent=selected()==='scholarship'?labels[lang()].apply:labels[lang()].pay;}
radios.forEach(r=>r.addEventListener('change',()=>{if(status)status.textContent='';render()}));document.getElementById('languageSelect')?.addEventListener('change',render);
btn?.addEventListener('click',async()=>{const plan=selected();if(plan==='scholarship'){location.href='beca.html';return;}btn.disabled=true;status.textContent=labels[lang()].pending;try{const res=await fetch('/api/create-checkout-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan})});const data=await res.json();if(!res.ok||!/^https:\/\//.test(data.url||''))throw Error('Checkout unavailable');location.assign(data.url);}catch(e){status.textContent=labels[lang()].error;btn.disabled=false;}});
render();})();