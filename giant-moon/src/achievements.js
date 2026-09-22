export class Achievements{
  constructor(state,ui){
    this.state=state;
    this.ui=ui;
    this.unlocked=new Set(state.achievements||[]);
    this.queue=[];
    this.showing=false;
    this.defs=new Map([
      ["goodmorning",["You Arrived","The first step into a very large silence.",25]],
      ["walk100",["A Hundred Meters","The landscape opens as you move through it.",50]],
      ["walk1k",["Lunar Traveler","One kilometer beneath the giant moon.",100]],
      ["walk3k",["Beyond The Map","You crossed far enough for the silence to feel designed.",180]],
      ["jump",["Briefly Less Grounded","A small leap in a place built at enormous scale.",75]],
      ["still20",["Quiet Observer","The moon changes when you stop rushing beneath it.",150]],
      ["look45",["Wide Horizon","You looked long enough to notice the world looking back.",200]],
      ["saved",["Journey Preserved","Your progress through the landscape is safely stored.",75]]
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
