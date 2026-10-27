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
    function setMode(nextMode) {
      mode = nextMode;
      const timed = mode === 'time';
      document.querySelector('#selected-mode').textContent = timed
        ? 'Time challenge'
        : 'Question goal';
      document.querySelector('#selected-mode-icon').textContent = timed ? '◷' : '#';
      document.querySelector('#count-settings').hidden = timed;
      document.querySelector('#time-settings').hidden = !timed;
      const action = timed ? 'Switch to question goal' : 'Switch to time challenge';
      changeButton.setAttribute('aria-label', action);
      changeButton.title = action;
    }
    changeButton.addEventListener('click', () => setMode(mode === 'count' ? 'time' : 'count'));
    document.querySelector('#close-mode').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => changeButton.focus());
    dialog.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        setMode(button.dataset.mode);
        dialog.close();
      });
    });

    const customPanel = document.querySelector('#custom-settings-panel');
    const customFields = document.querySelector('#custom-settings');
    function updateDifficulty() {
      const custom = document.querySelector('input[name="level"]:checked').value === 'custom';
      customPanel.dataset.open = String(custom);
      customPanel.setAttribute('aria-hidden', String(!custom));
      customPanel.inert = !custom;
      customFields.disabled = !custom;
      document.querySelector('#setup-error').textContent = '';
    }
    document.querySelectorAll('input[name="level"]').forEach((input) => {
      input.addEventListener('change', updateDifficulty);
    });
    updateDifficulty();

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
      const level = document.querySelector('input[name="level"]:checked').value;
      const customDigits =
        level === 'custom'
          ? {
              first: Number(document.querySelector('#first-digits').value),
              second: Number(document.querySelector('#second-digits').value),
            }
          : null;
      if (level === 'custom' && !globalThis.Jetta.validCustomDigits(customDigits, selected)) {
        error.textContent =
          'For subtraction and division, the first number must have at least as many digits as the second.';
        document.querySelector('#first-digits').focus();
        return null;
      }
      return { mode, limit: Number(input.value), selected, level, customDigits };
    }

    return { choose, read };
  }

  (globalThis.Jetta ??= {}).initSettings = initSettings;
})();
