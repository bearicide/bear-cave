"""Generate original, redistributable 44.1 kHz mono PCM samples for LOOP LAB."""
import math, random, struct, wave
from pathlib import Path
SR=44100
DEST=Path(__file__).parent/"assets"/"samples"
DEST.mkdir(parents=True,exist_ok=True)
random.seed(4808)
def make(track,variant):
    length=0.8 if track==0 else 0.4
    n=int(SR*length)
    result=[]
    phase=0.
    for j in range(n):
        t=j/SR
        noise=random.uniform(-1,1)
        if track==0 and variant<3:
            f=(40+variant*4)+(155-variant*20)*math.exp(-t*(28-variant*5))
            phase+=2*math.pi*f/SR
            x=math.sin(phase)*math.exp(-t*(7+variant*2))
            x+=noise*.1*math.exp(-t*180)
        elif track==0:
            f=150+variant*14
            phase+=2*math.pi*f/SR
            x=.48*math.sin(phase)*math.exp(-t*28)
            x+=noise*.7*math.exp(-t*(16+variant*2))
        elif variant==0:
            x=noise*.9*math.exp(-t*70)
        elif variant==1:
            x=noise*.7*math.exp(-t*15)
        elif variant==2:
            x=noise*.4*sum(math.exp(-max(0,t-d)*100) if t>=d else 0 for d in [0,.03,.06,.09])
        elif variant==3:
            x=noise*.5*math.exp(-t*37)+.3*math.sin(t*2*math.pi*800)*math.exp(-t*40)
        elif variant==4:
            x=(math.sin(t*2*math.pi*520)+.7*math.sin(t*2*math.pi*830))*math.exp(-t*13)
        else:
            x=noise*.6*math.exp(-t*120)
        x=math.tanh(x*1.5)
        x*=min(1,(length-t)*250)
        result.append(max(-32767,min(32767,int(x*26000))))
    out=DEST/f"{track}_{variant}.wav"
    with wave.open(str(out),"wb") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR)
        w.writeframes(struct.pack("<"+"h"*len(result),*result))
    print(out)
for track in (0,3):
    for variant in range(6):make(track,variant)
