import test from 'node:test';
import assert from 'node:assert/strict';
import { makeQuestion, summarize } from './helpers/runtime.js';

test('all operations generate valid integer answers at each difficulty', () => {
  for (const level of ['easy', 'medium', 'hard'])
    for (const operation of ['add', 'subtract', 'multiply', 'divide']) {
      for (let i = 0; i < 100; i++) {
        const q = makeQuestion(operation, level);
        assert.ok(Number.isInteger(q.answer));
        if (operation === 'add') assert.equal(q.a + q.b, q.answer);
        if (operation === 'subtract') {
          assert.equal(q.a - q.b, q.answer);
          assert.ok(q.answer >= 0);
        }
        if (operation === 'multiply') assert.equal(q.a * q.b, q.answer);
        if (operation === 'divide') assert.equal(q.a / q.b, q.answer);
      }
    }
});
test('summary counts correct answers and handles empty sessions', () => {
  assert.deepEqual(summarize([]), { correct: 0, total: 0, percentage: 0 });
  assert.deepEqual(
    summarize([
      { question: { answer: 2 }, userAnswer: 2 },
      { question: { answer: 3 }, userAnswer: 1 },
    ]),
    { correct: 1, total: 2, percentage: 50 },
  );
});

test('Easy and Medium retain the old Medium and Hard ranges while Hard increases them', () => {
  for (const [level, min, max, factorMin, factorMax] of [
    ['easy', 10, 50, 2, 12],
    ['medium', 20, 99, 2, 20],
    ['hard', 100, 999, 10, 99],
  ]) {
    for (const [random, expected, factor] of [
      [() => 0, min, factorMin],
      [() => 1 - Number.EPSILON, max, factorMax],
    ]) {
      assert.deepEqual(makeQuestion('add', level, random), {
        operation: 'add',
        a: expected,
        b: expected,
        answer: expected * 2,
      });
      const multiplication = makeQuestion('multiply', level, random);
      assert.equal(multiplication.a, expected);
      assert.equal(multiplication.b, factor);
      const division = makeQuestion('divide', level, random);
      assert.equal(division.a, expected * factor);
      assert.equal(division.b, factor);
      assert.equal(division.answer, expected);
    }
  }
});

test('Custom operands keep exactly the requested digits and arithmetic remains integral', () => {
  for (let first = 1; first <= 4; first++)
    for (let second = 1; second <= 4; second++) {
      for (const operation of ['add', 'subtract', 'multiply', 'divide']) {
        const digits = { first, second };
        if (first < second && ['subtract', 'divide'].includes(operation)) {
          assert.throws(
            () => makeQuestion(operation, 'custom', Math.random, digits),
            /Invalid question/,
          );
          continue;
        }
        for (const random of [() => 0, () => 1 - Number.EPSILON, () => 0.5, Math.random]) {
          for (let sample = 0; sample < 20; sample++) {
            const question = makeQuestion(operation, 'custom', random, digits);
            assert.equal(String(question.a).length, first);
            assert.equal(String(question.b).length, second);
            assert.ok(Number.isSafeInteger(question.answer));
            assert.ok(question.answer >= 0 && question.answer < 100000000);
            const expected =
              operation === 'add'
                ? question.a + question.b
                : operation === 'subtract'
                  ? question.a - question.b
                  : operation === 'multiply'
                    ? question.a * question.b
                    : question.a / question.b;
            assert.equal(question.answer, expected);
          }
        }
      }
    }
});

test('invalid custom digit values are rejected before generating questions', () => {
  for (const digits of [
    null,
    {},
    { first: 0, second: 1 },
    { first: 5, second: 1 },
    { first: 2, second: 1.5 },
    { first: '2', second: 1 },
  ]) {
    assert.throws(() => makeQuestion('add', 'custom', Math.random, digits), /Invalid question/);
  }
});
