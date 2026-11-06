import tkinter as tk
from tkinter import ttk, messagebox
import queue
import threading
import numpy as np
import sounddevice as sd

RATE = 48000
BLOCK = 480
class Bridge:
    def __init__(self, root):
        self.root=root
        root.title("MATTBEAR Audio Bridge | Pre-release")
        root.geometry("620x465")
        root.configure(bg="#171329")
        self.devices=sd.query_devices()
        self.inputs=[(i,d) for i,d in enumerate(self.devices) if d["max_input_channels"]>0]
        self.outputs=[(i,d) for i,d in enumerate(self.devices) if d["max_output_channels"]>0]
        self.running=False
        self.muted=False
        self.q=queue.Queue(maxsize=48)
        self.level=0
        self.gain=tk.DoubleVar(value=.75)
        self.monitor=tk.BooleanVar(value=True)
        self.status=tk.StringVar(value="Stopped")
        self.source=tk.StringVar()
        self.broadcast=tk.StringVar()
        self.headphones=tk.StringVar()
        self.label("🐾 MATTBEAR AUDIO BRIDGE",22)
        self.label("INPUT • AUDIENT iD4")
        self.src=self.combo(self.inputs,self.source,"audient")
        self.label("BROADCAST • VB-CABLE PLAYBACK ENDPOINT")
        self.dst=self.combo(self.outputs,self.broadcast,"cable input")
        self.label("MONITOR • HEADPHONES")
        self.mon=self.combo(self.outputs,self.headphones,"audient")
        ttk.Checkbutton(root,text="Headphone monitoring",variable=self.monitor).pack()
        self.label("Software gain: 75% initially")
        ttk.Scale(root,from_=0,to=1.5,variable=self.gain,orient="horizontal").pack(fill="x",padx=35)
        self.meter=ttk.Progressbar(root,maximum=100)
        self.meter.pack(fill="x",padx=35,pady=10)
        frame=ttk.Frame(root)
        frame.pack(pady=12)
        ttk.Button(frame,text="START BRIDGE",command=self.start).pack(side="left",padx=6)
        ttk.Button(frame,text="STOP",command=self.stop).pack(side="left",padx=6)
        ttk.Button(frame,text="MUTE / UNMUTE",command=self.toggle_mute).pack(side="left",padx=6)
        ttk.Label(root,textvariable=self.status).pack()
        self.root.after(100,self.tick)
        root.protocol("WM_DELETE_WINDOW",self.close)
    def label(self,text,size=11):
        tk.Label(self.root,text=text,bg="#171329",fg="#d6aaff",font=("Segoe UI",size,"bold")).pack(pady=(11,3))
    def combo(self,devices,var,preferred):
        choices=[f"{i}: {d['name']}" for i,d in devices]
        c=ttk.Combobox(self.root,textvariable=var,values=choices,state="readonly",width=75)
        c.pack(padx=20)
        if choices:
            c.current(next((n for n,s in enumerate(choices) if preferred in s.lower()),0))
        return c
    def index(self,var):
        return int(var.get().split(":",1)[0])
    def toggle_mute(self):
        self.muted=not self.muted
        self.status.set("Muted" if self.muted else ("Running" if self.running else "Stopped"))
    def start(self):
        if self.running:return
        try:
            src=self.index(self.source); dst=self.index(self.broadcast)
            mon=self.index(self.headphones)
            if self.monitor.get() and mon==dst:
                raise ValueError("Monitor and broadcast outputs must be different")
            self.running=True
            self.worker=threading.Thread(target=self.run,args=(src,dst,mon,self.monitor.get()),daemon=True)
            self.worker.start()
            self.status.set("Starting…")
        except Exception as e:
            self.running=False
            messagebox.showerror("Audio setup",str(e))
    def run(self,src,dst,mon,monitor):
        try:
            with sd.InputStream(device=src,channels=1,samplerate=RATE,blocksize=BLOCK,dtype="float32",callback=self.capture):
                with sd.OutputStream(device=dst,channels=2,samplerate=RATE,blocksize=BLOCK,dtype="float32",callback=self.play):
                    if monitor:
                        with sd.OutputStream(device=mon,channels=2,samplerate=RATE,blocksize=BLOCK,dtype="float32",callback=self.listen):
                            self.status.set("Running")
                            while self.running:threading.Event().wait(.1)
                    else:
                        self.status.set("Running")
                        while self.running:threading.Event().wait(.1)
        except Exception as e:
            self.status.set("Audio error: "+str(e))
        finally:
            self.running=False
    def capture(self,indata,frames,time,status):
        audio=np.repeat(indata,2,axis=1)*float(self.gain.get())
        if self.muted:audio*=0
        audio=np.clip(audio,-1,1)
        self.level=float(np.max(np.abs(audio)))*100
        try:self.q.put_nowait(audio.copy())
        except queue.Full:
            try:self.q.get_nowait()
            except queue.Empty:pass
    def play(self,outdata,frames,time,status):
        try:audio=self.q.get_nowait()
        except queue.Empty:audio=np.zeros((frames,2),dtype="float32")
        outdata[:]=0
        n=min(frames,len(audio))
        outdata[:n]=audio[:n]
        self.last=outdata.copy()
    def listen(self,outdata,frames,time,status):
        audio=getattr(self,"last",None)
        outdata[:]=0
        if audio is not None:
            n=min(frames,len(audio))
            outdata[:n]=audio[:n]
    def tick(self):
        self.meter["value"]=min(self.level,100)
        self.root.after(100,self.tick)
    def stop(self):
        self.running=False
        self.status.set("Stopping…")
    def close(self):
        self.running=False
        self.root.destroy()
if __name__=="__main__":
    root=tk.Tk()
    Bridge(root)
    root.mainloop()
