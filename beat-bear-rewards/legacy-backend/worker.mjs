const json = (value,status=200,headers={}) => Response.json(value,{status,headers:{'Cache-Control':'no-store',...headers}});
const bad = () => json({error:'Invalid run or board.'},400);
function board(track,difficulty,mode) {
  return Object.hasOwn(tracks,track) && Object.hasOwn(levels,difficulty) && ['classic','hunt'].includes(mode);
}
function replay(track,difficulty,mode,events) {
  const chart=createChart(track,difficulty);
  if (!Array.isArray(events)||events.length>chart.notes.length*5) return null;
  const hunt=mode==='hunt', round=createRound(chart,difficulty,hunt);
  let last=-levels[difficulty].good, charge=0, until=0;
  for(const event of events){
    if(!Array.isArray(event)||event.length!==2) return null;
    const [time,key]=event;
    if(!Number.isFinite(time)||time<last||time>=chart.duration||!Number.isInteger(key)||key<0||key>5) return null;
    last=time;
    if(key===4){
      if(!hunt||time<0||charge!==12||time<until) return null;
      charge=0;
      until=time+chart.step*32;
      continue;
    }
    round.advance(time);
    if(key===5){if(!hunt||!round.reverse(time))return null;continue;}
    const boosted=hunt&&time<until;
    const result=round.hit(key,time,boosted?2:1);
    if(hunt&&!boosted&&['perfect','great'].includes(result.grade)) charge=Math.min(12,charge+1);
  }
  round.advance(chart.duration+.28);
  return round.stats();
}
export default {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname!=='/api/scores'){
    const asset=assets[url.pathname==='/'?'/index.html':url.pathname];
    if(!asset) return new Response('Not found',{status:404});
    return new Response(Uint8Array.from(atob(asset[1]),c=>c.charCodeAt(0)),{headers:{'Content-Type':asset[0],'Cache-Control':'no-cache'}});
  }
  if(!env.DB)return json({error:'Score storage is unavailable.'},503);
  if(request.method==='GET'){
    const params=['track','difficulty','mode'].map(key=>url.searchParams.get(key));
    if(!board(...params))return bad();
    const result=await env.DB.prepare('SELECT player,score,accuracy FROM scores WHERE track=? AND difficulty=? AND mode=? ORDER BY score DESC, accuracy DESC, updated ASC, player ASC LIMIT 10').bind(...params).all();
    return json(await Promise.all(result.results.map(async ({player,score,accuracy})=>{
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(player));
      const tag=[...new Uint8Array(digest).slice(0,4)].map(n=>n.toString(16).padStart(2,'0')).join('');
      return {player:tag,score,accuracy};
    })));
  }
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  if(request.headers.get('Origin')!==url.origin)return bad();
  const body=await request.text();
  if(body.length>50000)return bad();
  let run;
  try {run=JSON.parse(body);} catch {return bad();}
  if(!run||!board(run.track,run.difficulty,run.mode))return bad();
  const result=replay(run.track,run.difficulty,run.mode,run.events);
  if(!result||result.score<=0)return bad();
  let player=request.headers.get('Cookie')?.match(/(?:^|; )beat_player=([a-f0-9]{32})(?:;|$)/)?.[1];
  if(!player)player=crypto.randomUUID().replaceAll('-','');
  await env.DB.prepare('INSERT INTO scores VALUES (?,?,?,?,?,?,?) ON CONFLICT(player,track,difficulty,mode) DO UPDATE SET score=excluded.score,accuracy=excluded.accuracy,updated=excluded.updated WHERE excluded.score>scores.score OR (excluded.score=scores.score AND excluded.accuracy>scores.accuracy)').bind(player,run.track,run.difficulty,run.mode,result.score,Math.round(result.accuracy*10000),Date.now()).run();
  return json({score:result.score},200,{'Set-Cookie':'beat_player='+player+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000'});
}};
