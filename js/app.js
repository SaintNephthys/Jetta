import { operations, summarize } from './math.js';
import { PracticeSession } from './session.js';

const $ = selector => document.querySelector(selector);
const show = (element, visible) => element.classList.toggle('hidden', !visible);
const home = $('#home'), game = $('#game'), setup = $('#setup'), practice = $('#practice'), results = $('#results');
const modeDialog = $('#mode-dialog');
let session = null;
let mode = null;
let timer = null;
let choosingOnEntry = false;

function stopTimer() { clearInterval(timer); timer = null; }
function screen(target) {
  show(setup, target === 'setup');
  show(practice, target === 'practice');
  show(results, target === 'results');
  show($('#history'), target === 'setup' && renderHistory());
  document.body.classList.toggle('playing', target === 'practice');
  if (target !== 'practice') {
    stopTimer();
    $('#answer').blur();
    window.scrollTo(0, 0);
  }
}
function chooseMode(onEntry = false) {
  choosingOnEntry = onEntry;
  modeDialog.showModal();
}
function openGame() {
  show(home, false); show(game, true); screen('setup'); chooseMode(true);
}
function openHome() {
  stopTimer(); session = null;
  document.body.classList.remove('playing');
  show(game, false); show(home, true); window.scrollTo(0, 0);
  $('#open-game').focus();
}
$('#open-game').addEventListener('click', openGame);
$('#back-home').addEventListener('click', openHome);
$('#result-home').addEventListener('click', openHome);
$('#retry').addEventListener('click', () => { session = null; screen('setup'); $('#start-game').focus(); });
$('#change-mode').addEventListener('click', () => chooseMode());
$('#close-mode').addEventListener('click', () => modeDialog.close());
modeDialog.addEventListener('close', () => { if (choosingOnEntry) openHome(); });
modeDialog.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  $('#selected-mode').textContent = mode === 'count' ? 'Question goal · measure your time' : 'Time challenge · count your answers';
  show($('#count-settings'), mode === 'count');
  show($('#time-settings'), mode === 'time');
  choosingOnEntry = false;
  modeDialog.close();
  $('#change-mode').focus();
}));
$('#quit-game').addEventListener('click', () => {
  if (confirm('If you quit, this practice session will not be saved. Quit now?')) {
    session = null; screen('setup'); $('#start-game').focus();
  } else tick();
});
$('#start-game').addEventListener('click', () => {
  const selected = [...document.querySelectorAll('input[name="operation"]:checked')].map(input => input.value);
  if (!mode) { chooseMode(); return; }
  if (!selected.length) { $('#setup-error').textContent = 'Please select at least one operation.'; return; }
  const limitInput = mode === 'count' ? $('#question-count') : $('#time-limit');
  if (!limitInput.reportValidity()) return;
  $('#setup-error').textContent = '';
  session = new PracticeSession({ mode, limit: Number(limitInput.value), selected, level: $('input[name="level"]:checked').value });
  $('#practice-title').textContent = mode === 'count' ? 'Question goal' : 'Time challenge';
  $('#timer-label').textContent = mode === 'count' ? 'Time elapsed' : 'Time remaining';
  $('#progress-label').textContent = mode === 'count' ? 'Question progress' : 'Time progress';
  screen('practice');
  renderQuestion();
  tick();
  timer = setInterval(tick, 200);
});
function formatTime(seconds) {
  const rounded = Math.max(0, Math.floor(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}
function tick() {
  if (!session) return;
  const now = Date.now();
  if (session.update(now)) { finish(); return; }
  const elapsed = session.elapsed(now);
  $('#timer').textContent = formatTime(mode === 'time' ? Math.ceil(session.limit - elapsed) : elapsed);
  $('#answered-count').textContent = session.answers.length;
  $('#progress-text').textContent = mode === 'count' ? `${session.answers.length} / ${session.limit}` : `${formatTime(session.limit)} limit`;
  $('#progress-bar').style.width = `${(mode === 'count' ? session.answers.length / session.limit : elapsed / session.limit) * 100}%`;
}
document.addEventListener('visibilitychange', () => { if (timer !== null) tick(); });
window.addEventListener('pageshow', () => { if (timer !== null) tick(); });
function renderQuestion() {
  const q = session.question;
  $('#question-number').textContent = String(session.answers.length + 1).padStart(2, '0');
  $('#question').textContent = `${q.a} ${operations[q.operation].symbol} ${q.b} = ?`;
  $('#answer').value = '';
  $('#answer').focus({ preventScroll: true });
}
$('#answer-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!session) return;
  const now = Date.now();
  if (session.update(now)) { finish(); return; }
  const input = $('#answer');
  if (!input.validity.valid || !/^[0-9]+$/.test(input.value)) return;
  if (!session.submit(Number(input.value), now)) return;
  if (session.finishedAt !== null) finish();
  else { renderQuestion(); tick(); }
});
function finish() {
  stopTimer();
  const summary = session.summary(Date.now());
  $('#score').textContent = `${summary.percentage}%`;
  $('#total-count').textContent = summary.total;
  $('#correct-count').textContent = `${summary.correct} / ${summary.total}`;
  $('#elapsed').textContent = `${summary.seconds.toFixed(1)} sec`;
  $('#average').textContent = summary.average === null ? '—' : `${summary.average.toFixed(1)} sec`;
  $('#result-title').textContent = mode === 'time' ? 'Time’s up. Great effort!' : 'Question goal complete!';
  $('#result-description').textContent = mode === 'time'
    ? `You answered ${summary.total} questions in ${session.limit} seconds.`
    : `You completed ${summary.total} questions in ${summary.seconds.toFixed(1)} seconds.`;
  show($('#empty-results'), summary.total === 0);
  const opContainer = $('#operation-results'); opContainer.replaceChildren();
  for (const [key, op] of Object.entries(operations)) {
    const entries = session.answers.filter(item => item.question.operation === key);
    if (!entries.length) continue;
    const stats = summarize(entries), box = document.createElement('div'); box.className = 'op-result';
    const label = document.createElement('span'), value = document.createElement('strong');
    label.textContent = op.label; value.textContent = `${stats.percentage}% (${stats.correct}/${stats.total})`;
    box.append(label, value); opContainer.append(box);
  }
  const list = $('#question-results'); list.replaceChildren();
  session.answers.forEach((item, i) => {
    const row = document.createElement('div'); row.className = 'result-row';
    const expression = document.createElement('span'), result = document.createElement('span');
    expression.textContent = `${i + 1}. ${item.question.a} ${operations[item.question.operation].symbol} ${item.question.b} = ${item.userAnswer}`;
    const correct = item.userAnswer === item.question.answer;
    result.className = correct ? 'correct' : 'wrong'; result.textContent = correct ? 'Correct ✓' : `Correct answer: ${item.question.answer}`;
    row.append(expression, result); list.append(row);
  });
  try { localStorage.setItem('thinking-playground-last', JSON.stringify({ date: new Date().toISOString(), ...summary })); } catch { /* Practice still works when storage is unavailable. */ }
  screen('results');
  $('#result-title').focus({ preventScroll: true });
}

// Follow the visible viewport as the software keyboard opens, pans, or closes.
function updateViewport() {
  const viewport = window.visualViewport;
  const root = document.documentElement.style;
  const height = viewport?.height ?? window.innerHeight;
  document.body.classList.toggle('compact-game', height <= 500);
  document.body.classList.toggle('short-game', height <= 300);
  root.setProperty('--visible-height', `${viewport?.height ?? window.innerHeight}px`);
  root.setProperty('--visible-width', `${viewport?.width ?? window.innerWidth}px`);
  root.setProperty('--visible-top', `${viewport?.offsetTop ?? 0}px`);
  root.setProperty('--visible-left', `${viewport?.offsetLeft ?? 0}px`);
}
window.visualViewport?.addEventListener('resize', updateViewport);
window.visualViewport?.addEventListener('scroll', updateViewport);
window.addEventListener('resize', updateViewport);
updateViewport();

function renderHistory() {
  try {
    const data = JSON.parse(localStorage.getItem('thinking-playground-last'));
    if (!data || !Number.isFinite(data.percentage) || !Number.isFinite(data.correct) || !Number.isFinite(data.total) || !Number.isFinite(Date.parse(data.date))) return false;
    const card = document.createElement('div'); card.className = 'history-card';
    const date = document.createElement('span'), score = document.createElement('strong');
    date.textContent = new Date(data.date).toLocaleDateString('en-US'); score.textContent = `Accuracy ${data.percentage}% · ${data.correct}/${data.total} questions`;
    card.append(date, score); $('#history-content').replaceChildren(card); return true;
  } catch { return false; }
}

const themeToggle = $('#theme-toggle');
function updateThemeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggle.querySelector('span').textContent = dark ? '☀' : '☾';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#141c17' : '#f8f9f5';
}
updateThemeButton();
themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('thinking-playground-theme', theme); } catch { /* Theme remains active for this page. */ }
  updateThemeButton();
});
