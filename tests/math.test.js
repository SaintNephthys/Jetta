import test from 'node:test';
import assert from 'node:assert/strict';
import { makeQuestion, summarize, normalizeAnswer, answersMatch } from './helpers/runtime.js';

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

test('Custom mixes operand lengths within each selected maximum with exact arithmetic', () => {
  let seed = 12345;
  const seededRandom = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  for (let maxDigits = 1; maxDigits <= 12; maxDigits++) {
    const lengths = new Set();
    for (const operation of ['add', 'subtract', 'multiply', 'divide']) {
      for (const random of [() => 0, () => 1 - Number.EPSILON, seededRandom]) {
        for (let i = 0; i < 100; i++) {
          const q = makeQuestion(operation, 'custom', random, maxDigits);
          assert.ok(String(q.a).length <= maxDigits && String(q.b).length <= maxDigits);
          assert.ok(q.a > 0 && q.b > 0);
          assert.ok(Number.isSafeInteger(q.a) && Number.isSafeInteger(q.b));
          const a = BigInt(q.a),
            b = BigInt(q.b);
          const expected =
            operation === 'add'
              ? a + b
              : operation === 'subtract'
                ? a - b
                : operation === 'multiply'
                  ? a * b
                  : a / b;
          assert.equal(BigInt(q.answer), expected);
          assert.ok(expected >= 0n);
          if (operation === 'divide') assert.equal(a % b, 0n);
          if (operation === 'add' && random === seededRandom) {
            lengths.add(String(q.a).length);
            lengths.add(String(q.b).length);
          }
        }
      }
    }
    assert.equal(lengths.size, maxDigits);
  }
});

test('12-digit multiplication and neighboring answers remain distinct', () => {
  const q = makeQuestion('multiply', 'custom', () => 1 - Number.EPSILON, 12);
  assert.equal(q.answer, 999999999998000000000001n);
  assert.equal(answersMatch('999999999998000000000001', q.answer), true);
  assert.equal(answersMatch('999999999998000000000002', q.answer), false);
  assert.deepEqual(
    summarize([
      { question: q, userAnswer: q.answer },
      { question: q, userAnswer: q.answer + 1n },
    ]),
    { correct: 1, total: 2, percentage: 50 },
  );
});

test('answer normalization preserves exact integers and rejects malformed or unsafe numeric inputs', () => {
  assert.equal(normalizeAnswer('00042'), 42);
  assert.equal(normalizeAnswer('9007199254740993'), 9007199254740993n);
  assert.equal(normalizeAnswer(999999999998000000000001n), 999999999998000000000001n);
  for (const value of [
    '',
    '-1',
    '1.5',
    '1e12',
    '9'.repeat(25),
    Number.MAX_SAFE_INTEGER + 1,
    NaN,
    Infinity,
    {},
    null,
    -1n,
  ])
    assert.equal(normalizeAnswer(value), null);
});

test('invalid Custom maximum values are rejected before question generation', () => {
  for (const value of [null, 0, 13, 1.5, '12', {}, { first: 2, second: 1 }])
    assert.throws(() => makeQuestion('add', 'custom', Math.random, value), /Invalid question/);
});
