import test from 'node:test';
import assert from 'node:assert/strict';
import { makeQuestion, summarize } from '../js/math.js';

test('all operations generate valid integer answers at each difficulty', () => {
  for (const level of ['easy', 'medium', 'hard']) for (const operation of ['add', 'subtract', 'multiply', 'divide']) {
    for (let i = 0; i < 100; i++) {
      const q = makeQuestion(operation, level);
      assert.ok(Number.isInteger(q.answer));
      if (operation === 'add') assert.equal(q.a + q.b, q.answer);
      if (operation === 'subtract') { assert.equal(q.a - q.b, q.answer); assert.ok(q.answer >= 0); }
      if (operation === 'multiply') assert.equal(q.a * q.b, q.answer);
      if (operation === 'divide') assert.equal(q.a / q.b, q.answer);
    }
  }
});
test('summary counts correct answers and handles empty sessions', () => {
  assert.deepEqual(summarize([]), { correct: 0, total: 0, percentage: 0 });
  assert.deepEqual(summarize([{ question: { answer: 2 }, userAnswer: 2 }, { question: { answer: 3 }, userAnswer: 1 }]), { correct: 1, total: 2, percentage: 50 });
});
