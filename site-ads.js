(()=>{if(window.top!==window.self||document.querySelector('[data-mb-ad-strip]'))return;
const base=new URL(document.currentScript?.src||'https://bearicide.github.io/bear-cave/site-ads.js');
const root=new URL('./',base);const path=location.pathname;
const ads=[
{img:'1000022204.gif',label:'Explore the Bear Cave',href:'./'},
{img:'1000022194.webp',label:'Free music tools',href:'./'},
{img:'1000022195.webp',label:'Play Retrocade',href:'retrocade/'},
{img:'1000022196.webp',label:'Explore BearBeats',href:'bearbeats.html'},
{img:'1000022199.webp',label:'MATTBEAR web design',href:'https://bearicide.github.io/'}
];const relevant=path.includes('retrocade')?2:/bearbeat|knock|prismatic|ethereal|tectonic|faultline|drum-machine|citrus_turntable/.test(path)?3:path.includes('promo')?4:path.endsWith('/bear-cave/')?0:1;
if(/\/retrocade\/(games\/|admin\.html|network\.html)/.test(path)||/kaoss-command-2\.html$/.test(path)||/\/promotions\.html$/.test(path))return;
const chosen=ads[relevant];const link=new URL(chosen.href,root).href;
const style=document.createElement('style');style.textContent=`
.mb-site-ad{box-sizing:border-box;max-width:1100px;width:calc(100% - 24px);margin:22px auto;padding:10px;border:1px solid #64458b;border-radius:12px;background:#100f1e;color:#fff;font:13px system-ui,sans-serif;clear:both}
.mb-site-ad__top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;color:#b8c4d6}
.mb-site-ad__top a{color:#76eaff}
.mb-site-ad__image{display:block;max-width:100%;margin:auto;text-align:center}
.mb-site-ad__image img{display:block;max-width:100%;width:auto;height:auto;max-height:210px;object-fit:contain;margin:auto;border-radius:6px}
.mb-site-ad__image:focus-visible{outline:3px solid #70eaff;outline-offset:3px}
@media(max-width:520px){.mb-site-ad{margin:16px auto}.mb-site-ad__image img{max-height:170px}}
`;document.head.append(style);
const section=document.createElement('aside');section.className='mb-site-ad';section.dataset.mbAdStrip='';section.setAttribute('aria-label','MATTBEAR featured project');section.innerHTML='<div class="mb-site-ad__top"><span>FEATURED PROJECT</span><a href="'+new URL('promotions.html',root).href+'">All promotions</a></div><a class="mb-site-ad__image" href="'+link+'" aria-label="'+chosen.label+'"><img src="'+new URL('assets/'+chosen.img,root).href+'" alt="'+chosen.label+'" loading="lazy" decoding="async"></a>';
const insert=()=>{if(document.querySelector('[data-mb-ad-strip]'))return;const footer=document.querySelector('footer');if(footer)footer.before(section);else document.body.append(section)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',insert,{once:true});else insert();
})();