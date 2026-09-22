export class Achievements{
  constructor(state,ui){
    this.state=state;
    this.ui=ui;
    this.unlocked=new Set(state.achievements||[]);
    this.queue=[];
    this.showing=false;
    this.defs=new Map([
      ["goodmorning",["You Arrived","Nobody asked why. That was the first mercy.",25]],
      ["walk100",["A Hundred Meters Of Proof","The world stayed mostly empty. You continued anyway.",50]],
      ["walk1k",["Distance As Character Development","One kilometer of lunar vacancy. Heroic, technically.",100]],
      ["walk3k",["The Map Gave Up","At this distance, empty space stops being setting and becomes accusation.",180]],
      ["jump",["Briefly Less Grounded","Jumping solved nothing, but it did create a measurable event.",75]],
      ["still20",["Standing Around","The moon watched you do nothing. It was almost respectful.",150]],
      ["look45",["Looked At The Problem","You stared long enough for the lack of story to blink first.",200]],
      ["saved",["Filed Paperwork On The Moon","Progress preserved. Bureaucracy has breached orbit.",75]]
    ]);
    this.renderList();
  }
  addDef(id,title,desc,xp=100){if(!this.defs.has(id))this.defs.set(id,[title,desc,xp])}
  unlock(id,title,descOrXp,xpMaybe){
    let desc="",xp=0;
    if(this.defs.has(id)){[title,desc,xp]=this.defs.get(id)}
    else{desc=typeof descOrXp==="string"?descOrXp:"";xp=typeof descOrXp==="number"?descOrXp:(xpMaybe||100)}
    if(this.unlocked.has(id))return;
    this.unlocked.add(id);
    this.state.achievements=[...this.unlocked];
    this.state.xp+=xp;
    this.queue.push({id,title,desc,xp});
    this.renderList();
    this.showNext();
  }
  renderList(){
    if(!this.ui.achievementList)return;
    this.ui.achievementList.innerHTML="";
    for(const [id,[title,desc]] of this.defs.entries()){
      const li=document.createElement("li");
      if(this.unlocked.has(id)){li.className="unlocked";li.innerHTML=`<b>${title}</b><br>${desc}`}
      else li.textContent="???";
      this.ui.achievementList.appendChild(li);
    }
  }
  showNext(){
    if(this.showing||!this.queue.length)return;
    this.showing=true;
    const item=this.queue.shift();
    this.ui.achievement.innerHTML=`<strong>🏆 ${item.title}</strong><span>+${item.xp} XP</span><small>${item.desc}</small>`;
    this.ui.achievement.style.display="block";
    setTimeout(()=>{this.ui.achievement.style.display="none";this.showing=false;this.showNext()},3300);
  }
  tick(s){
    if(s.distanceKm>=.1)this.unlock("walk100");
    if(s.distanceKm>=1)this.unlock("walk1k");
    if(s.distanceKm>=3)this.unlock("walk3k");
    if(s.jumps>=1)this.unlock("jump");
    if(s.stillSeconds>=20)this.unlock("still20");
    if(s.lookSeconds>=45)this.unlock("look45");
  }
}
