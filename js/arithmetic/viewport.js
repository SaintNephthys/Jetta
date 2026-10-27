(() => {
  'use strict';

  function initViewport() {
    const viewport = window.visualViewport;
    const practice = document.querySelector('#practice');
    function update() {
      const height = viewport?.height ?? window.innerHeight;
      const style = document.documentElement.style;
      style.setProperty('--visible-height', `${height}px`);
      style.setProperty('--visible-width', `${viewport?.width ?? window.innerWidth}px`);
      style.setProperty('--visible-top', `${viewport?.offsetTop ?? 0}px`);
      style.setProperty('--visible-left', `${viewport?.offsetLeft ?? 0}px`);
      // Also respect a shorter foldable display segment when it is exposed.
      const availableHeight = Math.min(height, practice.getBoundingClientRect().height || height);
      document.body.classList.toggle('compact-game', availableHeight <= 500);
      document.body.classList.toggle('short-game', availableHeight <= 300);
    }
    viewport?.addEventListener('resize', update, { passive: true });
    viewport?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
    return update;
  }

  (globalThis.Jetta ??= {}).initViewport = initViewport;
})();
