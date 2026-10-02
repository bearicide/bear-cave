'use strict';
const kitProfiles={
 studio:{name:'Studio Original',desc:'Original red-shell kit and full, unprocessed recorded tails.',tune:0,gain:1,cutoff:20000,decay:0},
 maple:{name:'Maple Session',desc:'Honey maple shells, bronze cymbals. Warm and rounded session sound.',tune:0,gain:1,cutoff:10500,decay:.8},
 jazz:{name:'Vintage Jazz',desc:'Champagne sparkle shells, aged cymbals. Higher drum tuning and softer attack.',tune:2,gain:.82,cutoff:8500,decay:0},
 arena:{name:'Arena Rock',desc:'Black lacquer, deep red shells, bright cymbals. Lower drums and full sustain.',tune:-2,gain:1.12,cutoff:20000,decay:0},
 funk:{name:'Funk Pocket',desc:'Emerald shells and crisp chrome. Tight, dry drums and short cymbal tails.',tune:1,gain:1.05,cutoff:15000,decay:.13},
 industrial:{name:'Industrial',desc:'Brushed steel shells, dark cymbals and orange hardware. Low, sharply gated sound.',tune:-4,gain:1.1,cutoff:7000,decay:.2}
};
let activeKit='studio';
try{const saved=localStorage.getItem('mattbear-acoustic-kit-preset-v1');if(kitProfiles[saved])activeKit=saved;}catch{}
function getKitSound(actual){const profile=kitProfiles[activeKit];const cym=['closed','open','pedal','crash','crash2','ride','bell','splash','china'].includes(actual);return {...profile,tune:cym?0:profile.tune,decay:cym&&profile.decay?Math.max(.25,profile.decay):profile.decay};}
function applyKit(id,announce=true){if(!kitProfiles[id])return;activeKit=id;stage.dataset.kit=id;$('kit-preset').value=id;$('kit-character').textContent=kitProfiles[id].desc;try{localStorage.setItem('mattbear-acoustic-kit-preset-v1',id);}catch{}if(announce)status.textContent=kitProfiles[id].name+' selected. Your layout and loop are ready.';}
$('kit-preset').onchange=e=>applyKit(e.target.value);
applyKit(activeKit,false);
