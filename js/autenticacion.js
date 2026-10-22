
function passwordChecks(value){
  return {
    length:value.length>=8,
    upper:/[A-ZÁÉÍÓÚÑ]/.test(value),
    lower:/[a-záéíóúñ]/.test(value),
    number:/\d/.test(value),
    special:/[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/.test(value)
  };
}
function passwordIsValid(value){
  const c=passwordChecks(value);
  return c.length&&c.upper&&c.lower&&c.number&&c.special;
}
function renderPasswordRequirements(input){
  const target=document.querySelector(`[data-password-requirements="${input.id}"]`);
  if(!target)return;
  const c=passwordChecks(input.value);
  const item=(ok,label)=>`<li class="${ok?'ok':'pending'}">${ok?'✓':'○'} ${label}</li>`;
  target.innerHTML=[
    item(c.length,'Mínimo 8 caracteres'),
    item(c.upper,'Al menos una mayúscula'),
    item(c.lower,'Al menos una minúscula'),
    item(c.number,'Al menos un número'),
    item(c.special,'Al menos un carácter especial')
  ].join('');
}
['registerPassword','recoverPassword'].forEach(id=>{
  const input=document.getElementById(id);
  if(input){
    input.addEventListener('input',()=>renderPasswordRequirements(input));
    renderPasswordRequirements(input);
  }
});

const status=$('#loginStatus');
async function hash(v){const b=new TextEncoder().encode(v);const d=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function accounts(){
 let list=[];try{list=JSON.parse(localStorage.getItem('global-pyme-unitedAccounts')||'[]')}catch{}
 if(!Array.isArray(list))list=[];
 const legacy=(()=>{try{return JSON.parse(localStorage.getItem('global-pyme-unitedAccount')||'null')}catch{return null}})();
 if(legacy?.email&&!list.some(a=>a.email===String(legacy.email).toLowerCase())){legacy.email=String(legacy.email).toLowerCase();list.push(legacy);localStorage.setItem('global-pyme-unitedAccounts',JSON.stringify(list));}
 return list;
}
function findAccount(email){return accounts().find(a=>a.email===String(email||'').trim().toLowerCase())||null}
function emailIsDuplicate(email){return !!findAccount(email)}
function registrationReady(){
 const name=$('#registerName')?.value.trim()||'',email=$('#registerEmail')?.value.trim().toLowerCase()||'',pw=$('#registerPassword')?.value||'',cf=$('#registerConfirm')?.value||'';
 return name.split(/\s+/).filter(Boolean).length>=2 && /^\S+@\S+\.\S+$/.test(email) && passwordIsValid(pw) && pw===cf && !emailIsDuplicate(email);
}
function updateRegisterButton(){
 const b=$('#registerSubmit');if(!b)return;const ok=registrationReady();b.disabled=!ok;b.setAttribute('aria-disabled',String(!ok));
}
function showStatus(t){
 if(!status)return;
 status.textContent=t;
 status.hidden=!t;
}
function clearStatus(){if(status){status.textContent='';status.hidden=true}}
const LOGIN_MAX_ATTEMPTS=5;
const LOGIN_LOCK_MS=15*60*1000;
function getLoginGuard(){
 try{return JSON.parse(localStorage.getItem('global-pyme-unitedLoginGuard')||'{}')}catch{return{}}
}
function saveLoginGuard(g){localStorage.setItem('global-pyme-unitedLoginGuard',JSON.stringify(g))}
function loginGuardKey(email){return String(email||'').trim().toLowerCase()}
function loginRemaining(email){
 const all=getLoginGuard(),key=loginGuardKey(email),g=all[key]||{count:0,lockedUntil:0};
 if(g.lockedUntil&&Date.now()>=g.lockedUntil){delete all[key];saveLoginGuard(all);return {count:0,lockedUntil:0}}
 return g;
}
function recordLoginFailure(email){
 const all=getLoginGuard(),key=loginGuardKey(email),g=loginRemaining(email);
 const next={count:(g.count||0)+1,lockedUntil:0};
 if(next.count>=LOGIN_MAX_ATTEMPTS)next.lockedUntil=Date.now()+LOGIN_LOCK_MS;
 all[key]=next;saveLoginGuard(all);return next;
}
function resetLoginFailures(email){
 const all=getLoginGuard();delete all[loginGuardKey(email)];saveLoginGuard(all);
}
function strongPassword(v){return passwordIsValid(v)}
function makePassword(){
  const upper='ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower='abcdefghijkmnopqrstuvwxyz';
  const digits='23456789';
  const special='!@#$%&*?_-';
  const all=upper+lower+digits+special;
  const pick=s=>s[crypto.getRandomValues(new Uint32Array(1))[0]%s.length];
  // Garantiza al menos un carácter de cada requisito antes de completar.
  let chars=[pick(upper),pick(lower),pick(digits),pick(special)];
  while(chars.length<14)chars.push(pick(all));
  for(let i=chars.length-1;i>0;i--){
    const r=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);
    [chars[i],chars[r]]=[chars[r],chars[i]];
  }
  const password=chars.join('');
  return passwordIsValid(password)?password:makePassword();
}
$$('[data-auth]').forEach(b=>b.onclick=()=>{$$('[data-auth]').forEach(x=>x.classList.toggle('active',x===b));$$('[data-auth-panel]').forEach(p=>p.hidden=p.dataset.authPanel!==b.dataset.auth);clearStatus()});
$('#generatePassword')?.addEventListener('click',()=>{
  const pw=makePassword();
  $('#registerPassword').value=pw;
  $('#registerConfirm').value=pw;
  renderPasswordRequirements($('#registerPassword'));updateRegisterButton();
  showStatus('Guarde la contraseña en un administrador de contraseñas y no la comparta.');
});
$('#registerForm').onsubmit=async e=>{
 e.preventDefault();
 const name=$('#registerName').value.trim(),email=$('#registerEmail').value.trim().toLowerCase(),pw=$('#registerPassword').value,cf=$('#registerConfirm').value;
 if(emailIsDuplicate(email)){showStatus('Ese correo ya está registrado.');updateRegisterButton();return}
 if(!strongPassword(pw)){showStatus('La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.');return}
 if(pw!==cf){showStatus('Las contraseñas no coinciden.');updateRegisterButton();return}
 if(!registrationReady()){showStatus('Complete nombre, correo y contraseñas coincidentes antes de registrarse.');return}
 const list=accounts();const a={name,email,passwordHash:await hash(pw)};list.push(a);localStorage.setItem('global-pyme-unitedAccounts',JSON.stringify(list));localStorage.setItem('global-pyme-unitedUser',JSON.stringify({name,email}));localStorage.setItem('global-pyme-unitedSessionLastActivity',String(Date.now()));
 showStatus('Cuenta creada. Bienvenido a la Academia.');window.renderUserSession?.();updateRegisterButton();
};
$('#loginForm').onsubmit=async e=>{
 e.preventDefault();
 const email=$('#loginEmail').value.trim().toLowerCase(),pw=$('#loginPassword').value;
 const guard=loginRemaining(email);
 if(guard.lockedUntil>Date.now()){
   const mins=Math.max(1,Math.ceil((guard.lockedUntil-Date.now())/60000));
   showStatus(`Demasiados intentos fallidos. Intente nuevamente en aproximadamente ${mins} minuto(s).`);
   return;
 }
 const a=findAccount(email);
 if(!a||a.passwordHash!==await hash(pw)){
   const failed=recordLoginFailure(email);
   const remaining=Math.max(0,LOGIN_MAX_ATTEMPTS-failed.count);
   if(failed.lockedUntil){
     showStatus('Se alcanzó el máximo de 5 intentos. El acceso queda bloqueado temporalmente durante 15 minutos.');
   }else{
     showStatus(`Correo o contraseña incorrectos. Quedan ${remaining} intento(s).`);
   }
   return;
 }
 resetLoginFailures(email);
 localStorage.setItem('global-pyme-unitedUser',JSON.stringify({name:a.name,email:a.email}));
 localStorage.setItem('global-pyme-unitedSessionLastActivity',String(Date.now()));
 window.renderUserSession?.();
 showStatus(`Bienvenido, ${a.name}.`);
 $('#loginPassword').value='';
};
$('#recoverForm').onsubmit=async e=>{
 e.preventDefault();const email=$('#recoverEmail').value.trim().toLowerCase(),pw=$('#recoverPassword').value,a=findAccount(email);
 if(!strongPassword(pw)){showStatus('La nueva contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.');return}
 if(!a){showStatus('No se encontró una cuenta con ese correo en este navegador.');return}
 const list=accounts(),i=list.findIndex(x=>x.email===email);list[i]={...list[i],passwordHash:await hash(pw)};localStorage.setItem('global-pyme-unitedAccounts',JSON.stringify(list));showStatus('Contraseña actualizada. Ya puede iniciar sesión.');
};
// Mostrar / ocultar contraseñas con icono ojo / ojo tachado
const eyeSvg=(slashed=false)=>`<span class="eye-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="3"/>${slashed?'<path class="eye-slash" d="M4 4l16 16"/>':''}</svg></span>`;
document.querySelectorAll('[data-password-target]').forEach(btn=>{
  btn.innerHTML=eyeSvg(false);
  btn.addEventListener('click',()=>{
    const input=document.getElementById(btn.dataset.passwordTarget);if(!input)return;
    const show=input.type==='password';
    input.type=show?'text':'password';
    btn.setAttribute('aria-pressed',String(show));
    btn.setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña');
    btn.innerHTML=eyeSvg(show);
  });
});
['registerName','registerEmail','registerPassword','registerConfirm'].forEach(id=>{
 const input=document.getElementById(id);if(!input)return;
 input.addEventListener('input',()=>{
  if(id==='registerPassword')renderPasswordRequirements(input);
  if(id==='registerEmail'&&input.value.trim()&&emailIsDuplicate(input.value)){showStatus('Ese correo ya está registrado.');}
  else if(id==='registerEmail'&&status.textContent==='Ese correo ya está registrado.')clearStatus();
  updateRegisterButton();
 });
});
updateRegisterButton();
