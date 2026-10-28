'use strict';
(()=>{
const tabs=[...document.querySelectorAll('[data-studio-tab]')],panels=[...document.querySelectorAll('[data-studio-panel]')];
function activate(name){tabs.forEach(t=>t.setAttribute('aria-pressed',String(t.dataset.studioTab===name)));panels.forEach(p=>p.classList.toggle('studio-visible',p.dataset.studioPanel===name));try{sessionStorage.setItem('starseedlings-studio-tab',name)}catch(e){}}
tabs.forEach(t=>t.addEventListener('click',()=>activate(t.dataset.studioTab)));
let initial='beats';try{const stored=sessionStorage.getItem('starseedlings-studio-tab');if(tabs.some(t=>t.dataset.studioTab===stored))initial=stored}catch(e){}
activate(initial);
})();