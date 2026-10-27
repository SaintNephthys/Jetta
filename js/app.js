import { makeQuestion, operations, summarize } from './math.js';
const $ = selector => document.querySelector(selector);
const show = (element, visible) => element.classList.toggle('hidden', !visible);
const home = $('#home'), game = $('#game'), setup = $('#setup'), practice = $('#practice'), results = $('#results');
let session = null;
function screen(target) { show(setup, target === 'setup'); show(practice, target === 'practice'); show(results, target === 'results'); show($('#history'), target === 'setup' && renderHistory()); window.scrollTo(0, 0); }
function openGame() { show(home, false); show(game, true); screen('setup'); }
function openHome() { session = null; show(game, false); show(home, true); window.scrollTo(0, 0); }
$('#open-game').addEventListener('click', openGame);
$('#back-home').addEventListener('click', openHome);
$('#result-home').addEventListener('click', openHome);
$('#retry').addEventListener('click', () => screen('setup'));
$('#quit-game').addEventListener('click', () => { if (confirm('If you quit, this practice session will not be saved. Quit now?')) { session = null; screen('setup'); } });
$('#start-game').addEventListener('click', () => {
  const selected = [...document.querySelectorAll('input[name="operation"]:checked')].map(input => input.value);
  if (!selected.length) { $('#setup-error').textContent = 'Please select at least one operation.'; return; }
  $('#setup-error').textContent = '';
  const level = $('input[name="level"]:checked').value;
  const count = Number($('input[name="count"]:checked').value);
  // Shuffle a balanced sequence so every selected operation is represented when possible.
  const sequence = Array.from({ length: count }, (_, i) => selected[i % selected.length]);
  for (let i = sequence.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [sequence[i], sequence[j]] = [sequence[j], sequence[i]]; }
  session = { questions: sequence.map(op => makeQuestion(op, level)), answers: [], started: Date.now() };
  screen('practice'); renderQuestion();
});
function renderQuestion() {
  const index = session.answers.length, q = session.questions[index];
  $('#progress-text').textContent = `${index + 1} / ${session.questions.length}`;
  $('#progress-bar').style.width = `${index / session.questions.length * 100}%`;
  $('#question-number').textContent = String(index + 1).padStart(2, '0');
  $('#question').textContent = `${q.a} ${operations[q.operation].symbol} ${q.b} = ?`;
  $('#answer').value = ''; $('#answer').focus();
}
$('#answer-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!session || $('#answer').value.trim() === '' || !$('#answer').validity.valid) return;
  const question = session.questions[session.answers.length];
  session.answers.push({ question, userAnswer: Number($('#answer').value) });
  if (session.answers.length === session.questions.length) finish(); else renderQuestion();
});
function finish() {
  const summary = summarize(session.answers), seconds = Math.max(1, Math.round((Date.now() - session.started) / 1000));
  $('#score').textContent = `${summary.percentage}%`;
  $('#correct-count').textContent = `${summary.correct} / ${summary.total}`;
  $('#elapsed').textContent = seconds >= 60 ? `${Math.floor(seconds / 60)} min ${seconds % 60} sec` : `${seconds} sec`;
  $('#average').textContent = `${(seconds / summary.total).toFixed(1)} sec`;
  const opContainer = $('#operation-results'); opContainer.replaceChildren();
  for (const [key, op] of Object.entries(operations)) {
    const entries = session.answers.filter(item => item.question.operation === key);
    if (!entries.length) continue;
    const stats = summarize(entries), box = document.createElement('div'); box.className = 'op-result';
    const label = document.createElement('span'), value = document.createElement('strong'); label.textContent = op.label; value.textContent = `${stats.percentage}% (${stats.correct}/${stats.total})`; box.append(label, value); opContainer.append(box);
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
}
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
