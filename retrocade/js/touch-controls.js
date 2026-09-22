function sendKey(key,type){document.dispatchEvent(new KeyboardEvent(type||'keydown',{key:key,bubbles:true}));}
function makeTouchControls(mode){
  const existing=document.getElementById('touchControls');
  if(existing) existing.remove();
  const wrap=document.createElement('div');
  wrap.id='touchControls';
  wrap.className='touch-controls '+(mode||'dpad');
  const button=(label,key,cls)=>'<button class="touch-btn '+(cls||'')+'" data-key="'+key+'">'+label+'</button>';
  if(mode==='leftright') wrap.innerHTML=button('◀','ArrowLeft')+button('▶','ArrowRight')+button('ACTION',' ','wide');
  else if(mode==='paddle') wrap.innerHTML='<div class="touch-pad-label">DRAG / SWIPE THE SCREEN TO MOVE</div>'+button('RESET','r','wide');
  else if(mode==='drop') wrap.innerHTML=button('◀','ArrowLeft')+button('DROP',' ','wide')+button('▶','ArrowRight');
  else if(mode==='dual') wrap.innerHTML=button('W','w')+button('S','s')+button('▲','ArrowUp')+button('▼','ArrowDown');
  else wrap.innerHTML=button('▲','ArrowUp')+'<div>'+button('◀','ArrowLeft')+button('▶','ArrowRight')+'</div>'+button('▼','ArrowDown')+button('ACTION',' ','wide');
  document.body.appendChild(wrap);
  wrap.querySelectorAll('button').forEach(btn=>{
    const key=btn.dataset.key;
    btn.addEventListener('touchstart',e=>{e.preventDefault();sendKey(key,'keydown')},{passive:false});
    btn.addEventListener('mousedown',()=>sendKey(key,'keydown'));
    btn.addEventListener('touchend',e=>{e.preventDefault();sendKey(key,'keyup')},{passive:false});
    btn.addEventListener('mouseup',()=>sendKey(key,'keyup'));
  });
}
function enableCanvasPointer(canvas,handler){
  if(!canvas||!handler)return;
  canvas.addEventListener('touchstart',e=>{e.preventDefault();handler(e.touches[0],canvas,e)},{passive:false});
  canvas.addEventListener('touchmove',e=>{e.preventDefault();handler(e.touches[0],canvas,e)},{passive:false});
  canvas.addEventListener('pointerdown',e=>handler(e,canvas,e));
  canvas.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')handler(e,canvas,e)});
}