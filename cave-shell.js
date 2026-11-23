(() => {
  if (window.self !== window.top || document.querySelector('[data-cave-shell]')) return;
  const script = document.currentScript;
  const adsScript = document.createElement('script');
  adsScript.src = new URL('site-ads.js', script.src).href;
  adsScript.defer = true;
  document.head.appendChild(adsScript);
  const root = script.dataset.caveRoot || './';
  const inProgress = new URL('in-progress/', new URL(root, document.baseURI)).href;
  const overlay = script.dataset.cavePlacement === 'overlay';

  const style = document.createElement('style');
  style.textContent = `
    .cave-shell{box-sizing:border-box;position:relative;z-index:6;display:flex;align-items:center;flex-wrap:wrap;gap:6px;width:min(1120px,calc(100% - 20px));margin:8px auto;font:700 13px/1.2 system-ui,sans-serif}
    .cave-shell.is-overlay{position:fixed;z-index:30;top:max(8px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));margin:0;width:auto;max-width:calc(100% - 16px)}
    .cave-shell a,.cave-shell button{box-sizing:border-box;display:inline-flex;align-items:center;min-height:44px;margin:0;padding:7px 11px;border:1px solid #536579;border-radius:8px;background:#111721;color:#eff7ff;text-decoration:none;font:inherit;letter-spacing:normal;text-transform:none;box-shadow:none;cursor:pointer}
    .cave-shell a:hover,.cave-shell button:hover{background:#253345}
    .cave-shell a:focus-visible,.cave-shell button:focus-visible,.cave-skip:focus-visible{outline:3px solid #8ff5ff;outline-offset:2px}
    .cave-shell .cave-help{box-sizing:border-box;position:absolute;top:calc(100% + 5px);left:0;width:min(330px,calc(100vw - 20px));border:1px solid #8098b1;border-radius:8px;background:#111721;color:#eff7ff;padding:12px;font-weight:400;line-height:1.5;box-shadow:0 8px 20px #0008}
    .cave-help[hidden]{display:none!important}
    .cave-skip{position:absolute;z-index:32;top:8px;left:8px;padding:10px 14px;transform:translateY(-150%);background:#eff7ff;color:#111721;font:700 14px/1.4 system-ui,sans-serif}
    .cave-skip:focus{transform:none}
    @media(max-width:360px){.cave-shell a,.cave-shell button{padding-inline:8px}}
  `;
  document.head.appendChild(style);

  const shell = document.createElement('nav');
  shell.className = overlay ? 'cave-shell is-overlay' : 'cave-shell';
  shell.dataset.caveShell = '';
  shell.setAttribute('aria-label', 'Bear Cave navigation');
  shell.innerHTML = `
    <a class="cave-home"><span aria-hidden="true">←&nbsp;</span> Bear Cave</a>
    <a href="${new URL('bearbeats.html', new URL(root, document.baseURI)).href}">BearBeats</a>
    <a class="cave-progress">In Progress</a>
    <a href="${new URL('promotions.html', new URL(root, document.baseURI)).href}">Promotions</a>
    <button type="button" aria-expanded="false" aria-controls="caveQuickHelp">Quick start</button>
    <div class="cave-help" id="caveQuickHelp" hidden>Start at low volume. Tap a control to enable browser audio. Allow microphone, camera, or MIDI access when the tool you’re using asks for it.</div>
  `;
  shell.querySelector('.cave-home').href = root;
  shell.querySelector('.cave-progress').href = inProgress;
  document.body.prepend(shell);

  const footer = document.querySelector('footer') || document.createElement('footer');
  const footerNav = document.createElement('nav');
  footerNav.className = 'cave-shell';
  footerNav.setAttribute('aria-label', 'Bear Cave footer links');
  for (const link of shell.querySelectorAll('a')) {
    if ([...footer.querySelectorAll('a')].some(existing => existing.href === link.href)) continue;
    const footerLink = link.cloneNode(true);
    footerLink.textContent = link.classList.contains('cave-home') ? 'Bear Cave' : link.textContent;
    footerNav.append(footerLink);
  }
  if (footerNav.childElementCount) {
    footer.append(footerNav);
    if (!footer.isConnected) document.body.append(footer);
  }

  const content = document.querySelector('main, [role="main"]');
  if (content && !document.querySelector('a.skip-link, a.cave-skip')) {
    if (!content.id) content.id = 'cave-main';
    if (!content.hasAttribute('tabindex')) content.tabIndex = -1;
    const skip = document.createElement('a');
    skip.className = 'cave-skip';
    skip.href = '#' + content.id;
    skip.textContent = 'Skip to content';
    shell.before(skip);
  }

  const button = shell.querySelector('button');
  const help = shell.querySelector('.cave-help');
  function setHelp(open) {
    help.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  }

  button.addEventListener('click', () => setHelp(help.hidden));
  shell.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !help.hidden) {
      setHelp(false);
      button.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!shell.contains(event.target)) setHelp(false);
  });
})();
