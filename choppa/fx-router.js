(()=>{'use strict';
function build(){
  document.querySelectorAll('.fxAssign').forEach(el=>el.remove());
  const deck=document.querySelector('.knobDeck');
  const pads=document.querySelector('.padgrid');
  if(deck&&pads&&deck.parentElement===pads.parentElement){
    deck.parentElement.insertBefore(deck,pads);
  }
  const labels=['Volume','Pitch','Attack','Release','Filter','Drive','Delay','Feedback'];
  document.querySelectorAll('.knob').forEach((card,i)=>{
    const name=card.querySelector('em');
    if(name&&labels[i])name.textContent=labels[i];
  });
  const css=document.createElement('style');
  css.textContent=`
    .knobDeck{margin:14px 0 18px!important}
    .knobs{grid-template-columns:repeat(8,minmax(92px,1fr))!important;gap:12px!important}
    .knob{padding:12px 9px!important;min-height:142px!important;border-radius:15px!important}
    .dial{width:66px!important;height:66px!important;margin:10px auto 8px!important}
    .dial i{top:7px!important;height:19px!important;transform-origin:50% 25px!important}
    .knob strong{font-size:.78rem!important}
    .knob em{font-size:.66rem!important}
    .knob output{font-size:.76rem!important}
    .fxAssign{display:none!important}
    @media(max-width:1080px){.knobs{grid-template-columns:repeat(4,minmax(105px,1fr))!important}}
    @media(max-width:620px){.knobs{grid-template-columns:repeat(2,minmax(130px,1fr))!important}.knob{min-height:136px!important}}
  `;
  document.head.appendChild(css);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();