(function () {
  if (document.querySelector('[data-cave-shell]')) return;
  const root = document.currentScript?.dataset.caveRoot || 'index.html';

  const style = document.createElement('style');
  style.textContent = `
    .cave-shell{position:fixed;z-index:99999;top:max(8px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));display:flex;align-items:center;gap:7px;font:800 12px/1.1 "Segoe UI",Tahoma,sans-serif;letter-spacing:.04em}
    .cave-shell a,.cave-shell button{min-height:38px;border:2px solid #8ef7ff;border-radius:5px;background:#080b0eee;color:#f8fbff;padding:9px 11px;text-decoration:none;box-shadow:3px 3px 0 #000,0 0 14px #00d8ff44;cursor:pointer}
    .cave-shell a:hover,.cave-shell button:hover,.cave-shell a:focus-visible,.cave-shell button:focus-visible{background:#16232a;outline:2px solid #ff4ca8;outline-offset:2px}
    .cave-shell .cave-help{display:none;position:absolute;top:46px;left:0;width:min(330px,calc(100vw - 16px));border:2px solid #ff4ca8;background:#080b0ef5;color:#f8fbff;padding:12px;box-shadow:5px 5px 0 #000}
    .cave-shell.open .cave-help{display:block}.cave-shell .cave-help strong{display:block;color:#8ef7ff;margin-bottom:6px}.cave-shell .cave-help p{margin:0;color:#d8dce2;font-weight:600;line-height:1.4;letter-spacing:0}
    @media(max-width:560px){.cave-shell{top:max(5px,env(safe-area-inset-top));left:max(5px,env(safe-area-inset-left))}.cave-shell a,.cave-shell button{min-height:36px;padding:8px 9px}.cave-shell .cave-label{display:none}}
    @media(prefers-reduced-motion:reduce){.cave-shell *{scroll-behavior:auto!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const shell = document.createElement('nav');
  shell.className = 'cave-shell';
  shell.dataset.caveShell = '';
  shell.setAttribute('aria-label', 'Bear Cave navigation');
  shell.innerHTML = '<a href="' + root + '" aria-label="Back to the Bear Cave">← <span class="cave-label">BEAR CAVE</span></a><button type="button" aria-expanded="false" aria-controls="caveQuickHelp">?</button><div class="cave-help" id="caveQuickHelp"><strong>QUICK START</strong><p>Start at low volume. Tap a main control to unlock browser audio. Allow microphone, camera, or MIDI only when the tool asks for it.</p></div>';
  document.body.appendChild(shell);

  const button = shell.querySelector('button');
  button.addEventListener('click', function () {
    const open = shell.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      shell.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }
  });
})();
