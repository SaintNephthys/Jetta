(() => {
  'use strict';

  const storageKey = 'thinking-playground-theme';
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  let savedTheme;
  try {
    savedTheme = localStorage.getItem(storageKey);
  } catch {
    // Private browsing and file URLs may restrict storage.
  }
  let followsSystem = !['light', 'dark'].includes(savedTheme);

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content =
      theme === 'dark' ? '#0b1728' : '#f0f9ff';
    const toggle = document.querySelector('#theme-toggle');
    if (!toggle) return;
    const dark = theme === 'dark';
    toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.querySelector('span').textContent = dark ? '☀' : '☾';
  }

  apply(followsSystem ? (systemTheme.matches ? 'dark' : 'light') : savedTheme);
  systemTheme.addEventListener('change', (event) => {
    if (followsSystem) apply(event.matches ? 'dark' : 'light');
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey) return;
    followsSystem = !['light', 'dark'].includes(event.newValue);
    apply(followsSystem ? (systemTheme.matches ? 'dark' : 'light') : event.newValue);
  });
  document.addEventListener('DOMContentLoaded', () => {
    apply(document.documentElement.dataset.theme);
    document.querySelector('#theme-toggle').addEventListener('click', () => {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      followsSystem = false;
      apply(theme);
      try {
        localStorage.setItem(storageKey, theme);
      } catch {
        // The chosen theme remains active for this page.
      }
    });
  });
})();
