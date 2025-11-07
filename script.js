(function(){
  const scene = document.getElementById('scene');
  const fileInputs = [document.getElementById('file-input'), document.getElementById('corner-file-input')];
  const clearSomeBtn = document.getElementById('clear-some');
  const exportBtn = document.getElementById('export-list');
  const stats = document.getElementById('stats');

  let items = []; // {id, name, size, x, y, el}

  function prettyBytes(n){
    if(!n) return '0 B';
    const u = ['B','KB','MB','GB','TB'];
    const e = Math.floor(Math.log(n)/Math.log(1024));
    return (n/Math.pow(1024,e)).toFixed(1)+' '+u[e];
  }

  function rand(min,max){ return Math.random()*(max-min)+min; }
  function randPos(){
    return { x: rand(5, 95), y: rand(20, 95) };
  }

  function addItem(name, size){
    const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2);
    const {x,y} = randPos();
    const el = document.createElement('div');
    el.className = 'msg';
    el.style.left = x+'%';
    el.style.top = y+'%';
    el.textContent = '• '+name+' ('+prettyBytes(size||0)+')';
    scene.appendChild(el);
    const it = {id,name,size,x,y,el};
    items.push(it);
    updateStats();
  }

  function handleFiles(fileList){
    const files = Array.from(fileList||[]);
    if(!files.length) return;
    files.forEach(f => addItem(f.name, f.size));
  }

  fileInputs.forEach(inp => {
    inp.addEventListener('change', e => handleFiles(e.target.files));
  });

  // drag & drop anywhere
  document.addEventListener('dragover', e => { e.preventDefault(); });
  document.addEventListener('drop', e => {
    e.preventDefault();
    handleFiles(e.dataTransfer && e.dataTransfer.files);
  });

  // clear a little: remove a small random subset (max 3 or ~15%)
  clearSomeBtn.addEventListener('click', () => {
    if(items.length === 0) return;
    const n = Math.min(3, Math.ceil(items.length*0.15) || 1);
    for(let i=0;i<n;i++){
      if(items.length===0) break;
      const idx = Math.floor(Math.random()*items.length);
      const it = items.splice(idx,1)[0];
      it.el.remove();
    }
    // leave a ghost note
    const note = document.createElement('div');
    const {x,y} = randPos();
    note.className = 'msg';
    note.style.left = x+'%';
    note.style.top = y+'%';
    note.textContent = 'swept a little @ ' + new Date().toLocaleTimeString();
    scene.appendChild(note);
    items.push({id: (crypto.randomUUID? crypto.randomUUID(): String(Math.random()).slice(2)), name:'note', size:0, x,y, el: note});
    updateStats();
  });

  exportBtn.addEventListener('click', () => {
    const text = items.filter(i=>i.name!=='note').map(i => '• ' + i.name + ' (' + prettyBytes(i.size||0) + ')').join('\n');
    const blob = new Blob([text || '(the basement is empty)'], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'basement-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  function updateStats(){
    const total = items.filter(i=>i.name!=='note').reduce((a,b)=>a+(b.size||0),0);
    const count = items.filter(i=>i.name!=='note').length;
    stats.textContent = count ? (count + ' scattered items • total ' + prettyBytes(total)) : 'no items in the basement yet';
  }

  updateStats();
})();