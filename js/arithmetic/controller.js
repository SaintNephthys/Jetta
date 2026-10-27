(() => {
  'use strict';

  const {
    PracticeSession,
    initSettings,
    initViewport,
    renderQuestion,
    renderProgress,
    renderResults,
    renderHistory,
    storage,
    historyKey,
  } = globalThis.Jetta;
  const $ = (selector) => document.querySelector(selector);
  const settings = initSettings();
  const updateViewport = initViewport();
  let session = null;
  let timer = null;
  let active = false;

  function stopTimer() {
    clearInterval(timer);
    timer = null;
  }

  function showScreen(target) {
    for (const name of ['setup', 'practice', 'results']) {
      $(`#${name}`).hidden = name !== target;
    }
    active = target === 'practice';
    document.body.classList.toggle('playing', active);
    $('#history').hidden = true;
    if (active) {
      updateViewport();
    } else {
      stopTimer();
      $('#answer').blur();
      window.scrollTo(0, 0);
      if (target === 'setup') renderHistory();
    }
  }

  function finish() {
    if (!active) return;
    const summary = session.summary(Date.now());
    renderResults(session, summary);
    storage.write(historyKey, { date: new Date().toISOString(), ...summary });
    showScreen('results');
    $('#result-title').focus({ preventScroll: true });
  }

  function tick() {
    if (!active || !session) return;
    const now = Date.now();
    if (session.update(now)) finish();
    else renderProgress(session, now);
  }

  function startTimer() {
    stopTimer();
    tick();
    if (active) timer = setInterval(tick, 200);
  }

  $('#start-game').addEventListener('click', () => {
    const options = settings.read();
    if (!options) return;
    session = new PracticeSession(options);
    const timed = session.mode === 'time';
    $('#practice-title').textContent = timed ? 'Time challenge' : 'Question goal';
    $('#timer-label').textContent = timed ? 'Time remaining' : 'Time elapsed';
    $('#progress-label').textContent = timed ? 'Time progress' : 'Question progress';
    showScreen('practice');
    renderQuestion(session);
    startTimer();
  });

  $('#answer-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!active || !session) return;
    const now = Date.now();
    if (session.update(now)) {
      finish();
      return;
    }
    const input = $('#answer');
    if (!input.validity.valid || !/^[0-9]+$/.test(input.value)) return;
    if (!session.submit(Number(input.value), now)) return;
    if (session.finishedAt !== null) finish();
    else {
      renderQuestion(session);
      tick();
    }
  });

  $('#retry').addEventListener('click', () => {
    session = null;
    showScreen('setup');
    $('#start-game').focus();
  });
  $('#quit-game').addEventListener('click', () => {
    if (confirm('If you quit, this practice session will not be saved. Quit now?')) {
      session = null;
      showScreen('setup');
      $('#start-game').focus();
    } else tick();
  });
  document.addEventListener('visibilitychange', tick);
  window.addEventListener('pagehide', stopTimer);
  window.addEventListener('pageshow', () => {
    if (active) startTimer();
  });

  showScreen('setup');
  settings.choose();
})();
