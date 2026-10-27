(() => {
  'use strict';

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Games remain usable when storage is blocked or full.
    }
  }

  (globalThis.Jetta ??= {}).storage = { read, write };
})();
