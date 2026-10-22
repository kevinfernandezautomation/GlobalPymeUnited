(()=>{'use strict';
const byId=id=>document.getElementById(id);
const directory=window.DIRECTORY||[];
const categoryNames={'professional-college':'Colegio profesional','solidarity-association':'Asociación solidarista','media':'Medio de comunicación','community-development':'Desarrollo comunal','youth-committee':'Comité de juventud','chamber-commerce':'Cámara de comercio','embassy':'Embajada','hotel':'Hotel','university':'Universidad','private-school':'Colegio privado','foundation':'Fundación'};
const types=new Set(directory.map(o=>o.category).filter(Boolean));
if(byId('statTypes'))byId('statTypes').textContent=types.size;
const grid=byId('collegeGrid');
const decorate=()=>{
 if(!grid)return;
 grid.querySelectorAll('.college-card').forEach(card=>{
  if(card.dataset.enhanced)return;
  card.dataset.enhanced='1';
  const checkbox=card.querySelector('input[type="checkbox"]');
  const main=card.querySelector('.college-main');if(!main)return;
  const id=checkbox?.dataset.id;
  const item=directory.find(o=>String(o.id)===id);
  if(!item)return;
  const tag=document.createElement('span');tag.className='org-type';tag.textContent=categoryNames[item.category]||'Organización';
  const top=main.querySelector('.card-top');if(top)top.append(tag);
  const icon=document.createElement('div');icon.className='org-avatar';icon.setAttribute('aria-hidden','true');icon.textContent=(item.es||'?').split(/\s+/).filter(x=>x.length>2).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'PA';
  const name=main.querySelector('.college-name');if(name){const wrap=document.createElement('div');wrap.className='org-identity';name.parentNode.insertBefore(wrap,name);wrap.append(icon,name);const area=main.querySelector('.college-area');if(area)wrap.append(area)}
  const footer=document.createElement('div');footer.className='org-actions';
  const details=document.createElement('button');details.type='button';details.className='org-details';details.textContent='Ver detalles';details.addEventListener('click',()=>{
   const existing=card.querySelector('.org-detail-panel');if(existing){existing.remove();details.setAttribute('aria-expanded','false');return;}
   const panel=document.createElement('div');panel.className='org-detail-panel';panel.textContent=[item.note,item.phone?`Teléfono: ${item.phone}`:'',item.area].filter(Boolean).join(' · ');card.append(panel);details.setAttribute('aria-expanded','true');
  });details.setAttribute('aria-expanded','false');
  const proposal=document.createElement('a');proposal.className='org-proposal';proposal.href='html/propuesta.html';proposal.textContent='▣ Crear propuesta';proposal.addEventListener('click',()=>{if(!id||!item.email)return;try{const chosen=new Set(JSON.parse(sessionStorage.getItem('pa_selected')||'[]'));chosen.add(id);sessionStorage.setItem('pa_selected',JSON.stringify([...chosen]));}catch{}});
  footer.append(details,proposal);card.append(footer);
 });
};
if(grid){const observer=new MutationObserver(()=>{observer.disconnect();decorate();observer.observe(grid,{childList:true})});observer.observe(grid,{childList:true});decorate();}
const reset=byId('resetFilters');if(reset)reset.addEventListener('click',()=>{for(const id of ['countryFilter','categoryFilter','contactFilter']){const e=byId(id);if(e){e.value='';e.dispatchEvent(new Event('change',{bubbles:true}))}}const search=byId('searchInput');if(search){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}))}});
})();
