(() => {
  'use strict';

  const { operations, summarize, storage } = globalThis.Jetta;
  const historyKey = 'thinking-playground-last';
  const $ = (selector) => document.querySelector(selector);

  function formatTime(seconds) {
    const rounded = Math.max(0, Math.floor(seconds));
    return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
  }

  function renderQuestion(session) {
    const question = session.question;
    $('#question-number').textContent = String(session.answers.length + 1).padStart(2, '0');
    $('#question').textContent =
      `${question.a} ${operations[question.operation].symbol} ${question.b} = ?`;
    $('#answer').value = '';
    $('#answer').focus({ preventScroll: true });
  }

  function renderProgress(session, now) {
    const elapsed = session.elapsed(now);
    const timed = session.mode === 'time';
    $('#timer').textContent = formatTime(timed ? Math.ceil(session.limit - elapsed) : elapsed);
    $('#answered-count').textContent = session.answers.length;
    $('#progress-text').textContent = timed
      ? `${formatTime(session.limit)} limit`
      : `${session.answers.length} / ${session.limit}`;
    $('#progress-bar').style.width =
      `${(timed ? elapsed / session.limit : session.answers.length / session.limit) * 100}%`;
  }

  function renderResults(session, summary) {
    $('#score').textContent = `${summary.percentage}%`;
    $('#total-count').textContent = summary.total;
    $('#correct-count').textContent = `${summary.correct} / ${summary.total}`;
    $('#elapsed').textContent = `${summary.seconds.toFixed(1)} sec`;
    $('#average').textContent =
      summary.average === null ? '—' : `${summary.average.toFixed(1)} sec`;
    const timed = session.mode === 'time';
    $('#result-title').textContent = timed ? 'Time’s up. Great effort!' : 'Question goal complete!';
    $('#result-description').textContent = timed
      ? `You answered ${summary.total} questions in ${session.limit} seconds.`
      : `You completed ${summary.total} questions in ${summary.seconds.toFixed(1)} seconds.`;
    $('#empty-results').hidden = summary.total !== 0;

    const operationResults = $('#operation-results');
    operationResults.replaceChildren();
    for (const [key, operation] of Object.entries(operations)) {
      const entries = session.answers.filter((item) => item.question.operation === key);
      if (!entries.length) continue;
      const stats = summarize(entries);
      const box = document.createElement('div');
      box.className = 'op-result';
      const label = document.createElement('span');
      const value = document.createElement('strong');
      label.textContent = operation.label;
      value.textContent = `${stats.percentage}% (${stats.correct}/${stats.total})`;
      box.append(label, value);
      operationResults.append(box);
    }

    const questionResults = $('#question-results');
    questionResults.replaceChildren();
    session.answers.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'result-row';
      const expression = document.createElement('span');
      const result = document.createElement('span');
      const { question, userAnswer } = item;
      expression.textContent = `${index + 1}. ${question.a} ${operations[question.operation].symbol} ${question.b} = ${userAnswer}`;
      const correct = userAnswer === question.answer;
      result.className = correct ? 'correct' : 'wrong';
      result.textContent = correct ? 'Correct ✓' : `Correct answer: ${question.answer}`;
      row.append(expression, result);
      questionResults.append(row);
    });
  }

  function renderHistory() {
    const data = storage.read(historyKey);
    const valid =
      data &&
      Number.isFinite(data.percentage) &&
      Number.isFinite(data.correct) &&
      Number.isFinite(data.total) &&
      Number.isFinite(Date.parse(data.date));
    $('#history').hidden = !valid;
    if (!valid) return;
    const card = document.createElement('div');
    card.className = 'history-card';
    const date = document.createElement('span');
    const score = document.createElement('strong');
    date.textContent = new Date(data.date).toLocaleDateString('en-US');
    score.textContent = `Accuracy ${data.percentage}% · ${data.correct}/${data.total} questions`;
    card.append(date, score);
    $('#history-content').replaceChildren(card);
  }

  Object.assign(globalThis.Jetta, {
    historyKey,
    formatTime,
    renderQuestion,
    renderProgress,
    renderResults,
    renderHistory,
  });
})();
