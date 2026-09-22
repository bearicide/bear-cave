
export class Controls{
  constructor(canvas,ui){
    this.keys={};this.drag=false;this.yaw=.75;this.pitch=.48;this.mobileX=0;this.mobileY=0;this.jumpPressed=false;this.lookSeconds=0;this.lx=0;this.ly=0;
    addEventListener("keydown",e=>this.keys[e.key.toLowerCase()]=true);
    addEventListener("keyup",e=>this.keys[e.key.toLowerCase()]=false);
    canvas.addEventListener("pointerdown",e=>{this.drag=true;this.lx=e.clientX;this.ly=e.clientY;canvas.setPointerCapture?.(e.pointerId)});
    canvas.addEventListener("pointerup",()=>this.drag=false);
    canvas.addEventListener("pointermove",e=>{
      if(!this.drag)return;
      const dx=e.clientX-this.lx,dy=e.clientY-this.ly;this.lx=e.clientX;this.ly=e.clientY;
      const sens=Number(ui.sensitivityRange.value)/5;
      this.yaw-=dx*.006*sens;
      this.pitch+=dy*.004*sens*(ui.invertToggle.checked?1:-1);
      this.pitch=Math.max(.1,Math.min(1.25,this.pitch));
      if(Math.abs(dx)+Math.abs(dy)>1)this.lookSeconds+=.016;
    });
    this.setupStick(ui);
  }
  setupStick(ui){
    const stick=ui.stick,nub=ui.nub;let active=false;
    const reset=()=>{active=false;this.mobileX=0;this.mobileY=0;nub.style.left="39px";nub.style.top="39px"};
    stick.addEventListener("pointerdown",e=>{active=true;stick.setPointerCapture(e.pointerId)});
    stick.addEventListener("pointermove",e=>{
      if(!active)return;
      const rect=stick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
      const dx=e.clientX-cx,dy=e.clientY-cy,len=Math.min(44,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);
      this.mobileX=Math.cos(a)*(len/44);this.mobileY=Math.sin(a)*(len/44);
      nub.style.left=`${39+Math.cos(a)*len}px`;nub.style.top=`${39+Math.sin(a)*len}px`;
    });
    stick.addEventListener("pointerup",reset);stick.addEventListener("pointercancel",reset);
    ui.jumpBtn.addEventListener("pointerdown",()=>this.jumpPressed=true);
    ui.jumpBtn.addEventListener("pointerup",()=>this.jumpPressed=false);
  }
  movement(){
    let x=0,z=0;if(this.keys.w)z-=1;if(this.keys.s)z+=1;if(this.keys.a)x-=1;if(this.keys.d)x+=1;
    x+=this.mobileX;z+=this.mobileY;const len=Math.hypot(x,z)||1;
    return{x:x/len,z:z/len,active:Math.hypot(x,z)>.1};
  }
  jump(){return this.keys[" "]||this.jumpPressed}
}
