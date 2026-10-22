
/* Indicador de navegación activo: mismo estilo de login.html en todas las páginas. */
(()=>{
 const page=decodeURIComponent(location.pathname.split('/').pop()||'index.html').toLowerCase();
 const isDirectory=page==='index.html' && location.hash.toLowerCase()==='#directorio';
 const links=document.querySelectorAll('.topbar nav a[href]');
 const setActive=()=>{
  const directory=page==='index.html' && location.hash.toLowerCase()==='#directorio';
  links.forEach(a=>{
   const href=a.getAttribute('href')||'';
   const file=href.split('#')[0]||'index.html';
   const active=page==='index.html' ? directory && href.includes('#directorio') : file.toLowerCase()===page && !href.includes('#');
   a.classList.toggle('active',active);
   if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  const signIn=document.querySelector('.topbar .header-actions > a[href="login.html"]');
  if(signIn){signIn.classList.toggle('active',page==='login.html');if(page==='login.html')signIn.setAttribute('aria-current','page');else signIn.removeAttribute('aria-current');}
 };
 setActive();window.addEventListener('hashchange',setActive);
})();
