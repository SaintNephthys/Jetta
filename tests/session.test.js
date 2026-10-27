import test from 'node:test';
import assert from 'node:assert/strict';
import { PracticeSession } from './helpers/runtime.js';

const settings = {
  mode: 'count',
  limit: 3,
  selected: ['add', 'subtract', 'multiply', 'divide'],
  level: 'easy',
  now: 1000,
};

test('question goal finishes at the chosen count and freezes elapsed time', () => {
  const session = new PracticeSession(settings);
  assert.equal(session.submit(session.question.answer, 2000), true);
  assert.equal(session.submit(session.question.answer + 1, 3000), true);
  assert.equal(session.update(90000), false);
  assert.equal(session.submit(session.question.answer, 91000), true);
  assert.equal(session.submit(0, 92000), false);
  assert.deepEqual(session.summary(120000), {
    correct: 2,
    total: 3,
    percentage: 67,
    seconds: 90,
    average: 30,
    mode: 'count',
  });
});

test('time challenge accepts answers before its deadline and rejects late answers', () => {
  const session = new PracticeSession({ ...settings, mode: 'time', limit: 10 });
  session.submit(session.question.answer, 10999);
  assert.equal(session.submit(session.question.answer, 11000), false);
  assert.equal(session.answers.length, 1);
  assert.equal(session.summary(999999).seconds, 10);
});

test('time challenge expires after a background gap, including zero answers', () => {
  const session = new PracticeSession({ ...settings, mode: 'time', limit: 60 });
  assert.equal(session.update(2000), false);
  assert.equal(session.update(500000), true);
  assert.deepEqual(session.summary(500000), {
    correct: 0,
    total: 0,
    percentage: 0,
    seconds: 60,
    average: null,
    mode: 'time',
  });
});

test('timed practice keeps generating balanced batches of selected operations', () => {
  const session = new PracticeSession({ ...settings, mode: 'time', limit: 60 });
  for (let batch = 0; batch < 5; batch++) {
    const seen = new Set();
    for (let i = 0; i < 4; i++) {
      seen.add(session.question.operation);
      assert.equal(session.submit(session.question.answer, 2000 + batch * 1000 + i), true);
    }
    assert.equal(seen.size, 4);
  }
  assert.equal(session.summary(6000).total, 20);
});

test('invalid answers do not advance the question', () => {
  const session = new PracticeSession(settings);
  const question = session.question;
  for (const value of [NaN, Infinity, -1, 1.2, Number.MAX_SAFE_INTEGER + 1])
    assert.equal(session.submit(value, 2000), false);
  assert.equal(session.question, question);
  assert.equal(session.answers.length, 0);
});

test('invalid game settings are rejected', () => {
  for (const change of [
    { mode: 'other' },
    { limit: 0 },
    { limit: 1.5 },
    { selected: [] },
    { selected: ['other'] },
    { level: 'other' },
  ]) {
    assert.throws(
      () => new PracticeSession({ ...settings, ...change }),
      /Invalid practice settings/,
    );
  }
});
