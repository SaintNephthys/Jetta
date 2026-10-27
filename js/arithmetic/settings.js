(() => {
  'use strict';

  function initSettings() {
    const dialog = document.querySelector('#mode-dialog');
    const changeButton = document.querySelector('#change-mode');
    const countInput = document.querySelector('#question-count');
    const timeInput = document.querySelector('#time-limit');
    let mode = null;

    function syncPresets(input) {
      document.querySelectorAll(`[data-target="${input.id}"]`).forEach((button) => {
        button.setAttribute(
          'aria-pressed',
          String(input.value !== '' && Number(input.value) === Number(button.dataset.preset)),
        );
      });
    }

    for (const input of [countInput, timeInput]) {
      input.addEventListener('input', () => syncPresets(input));
      syncPresets(input);
    }
    document.querySelectorAll('[data-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.target);
        input.value = button.dataset.preset;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    function choose() {
      if (!dialog.open) dialog.showModal();
    }
    changeButton.addEventListener('click', choose);
    document.querySelector('#close-mode').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => changeButton.focus());
    dialog.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        mode = button.dataset.mode;
        document.querySelector('#selected-mode').textContent =
          mode === 'count' ? 'Question goal' : 'Time challenge';
        document.querySelector('#selected-mode-icon').textContent = mode === 'count' ? '#' : '◷';
        document.querySelector('#count-settings').hidden = mode !== 'count';
        document.querySelector('#time-settings').hidden = mode !== 'time';
        dialog.close();
      });
    });

    function read() {
      if (!mode) {
        choose();
        return null;
      }
      const selected = [...document.querySelectorAll('input[name="operation"]:checked')].map(
        (input) => input.value,
      );
      const error = document.querySelector('#setup-error');
      error.textContent = selected.length ? '' : 'Please select at least one operation.';
      if (!selected.length) return null;
      const input = mode === 'count' ? countInput : timeInput;
      if (!input.reportValidity()) return null;
      return {
        mode,
        limit: Number(input.value),
        selected,
        level: document.querySelector('input[name="level"]:checked').value,
      };
    }

    return { choose, read };
  }

  (globalThis.Jetta ??= {}).initSettings = initSettings;
})();
