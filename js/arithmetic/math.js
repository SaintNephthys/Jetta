(() => {
  'use strict';
  const operations = {
    add: { label: 'Addition', symbol: '+' },
    subtract: { label: 'Subtraction', symbol: '−' },
    multiply: { label: 'Multiplication', symbol: '×' },
    divide: { label: 'Division', symbol: '÷' },
  };
  const randomInt = (min, max, random) => Math.floor(random() * (max - min + 1)) + min;

  const presets = {
    easy: { min: 10, max: 50, factorMin: 2, factorMax: 12 },
    medium: { min: 20, max: 99, factorMin: 2, factorMax: 20 },
    hard: { min: 100, max: 999, factorMin: 10, factorMax: 99 },
  };

  function validMaxDigits(value) {
    return Number.isInteger(value) && value >= 1 && value <= 12;
  }

  // Operands fit within Number's exact integer range. Products of 12-digit
  // operands do not, so normalize answers through BigInt before comparing.
  function normalizeAnswer(value) {
    if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? value : null;
    if (typeof value === 'string' && /^[0-9]{1,24}$/.test(value)) value = BigInt(value);
    if (typeof value !== 'bigint' || value < 0n || value >= 10n ** 24n) return null;
    return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value;
  }

  function answersMatch(value, expected) {
    const actual = normalizeAnswer(value);
    return actual !== null && actual === normalizeAnswer(expected);
  }

  function digitRange(digits) {
    return [10 ** (digits - 1), 10 ** digits - 1];
  }

  function makeQuestion(operation, level, random = Math.random, maxDigits = null) {
    if (
      !Object.hasOwn(operations, operation) ||
      (level === 'custom' ? !validMaxDigits(maxDigits) : !Object.hasOwn(presets, level))
    ) {
      throw new Error('Invalid question settings');
    }
    let a, b, answer;
    if (level === 'custom') {
      const firstDigits = randomInt(1, maxDigits, random);
      const secondDigits = randomInt(1, operation === 'divide' ? firstDigits : maxDigits, random);
      const [firstMin, firstMax] = digitRange(firstDigits);
      const [secondMin, secondMax] = digitRange(secondDigits);
      a = randomInt(firstMin, firstMax, random);
      b = randomInt(secondMin, secondMax, random);
      if (operation === 'divide') {
        answer = randomInt(Math.ceil(firstMin / b), Math.floor(firstMax / b), random);
        a = answer * b;
      }
    } else {
      const { min, max, factorMin, factorMax } = presets[level];
      a = randomInt(min, max, random);
      b = randomInt(min, max, random);
      if (operation === 'multiply' || operation === 'divide') {
        b = randomInt(factorMin, factorMax, random);
      }
      if (operation === 'divide') {
        answer = a;
        a *= b;
      }
    }
    if (operation === 'add') answer = a + b;
    if (operation === 'subtract') {
      if (b > a) [a, b] = [b, a];
      answer = a - b;
    }
    if (operation === 'multiply') answer = normalizeAnswer(BigInt(a) * BigInt(b));
    return { operation, a, b, answer };
  }

  function summarize(answers) {
    const correct = answers.filter((item) =>
      answersMatch(item.userAnswer, item.question.answer),
    ).length;
    return {
      correct,
      total: answers.length,
      percentage: answers.length ? Math.round((correct / answers.length) * 100) : 0,
    };
  }

  Object.assign((globalThis.Jetta ??= {}), {
    operations,
    makeQuestion,
    summarize,
    validMaxDigits,
    normalizeAnswer,
    answersMatch,
  });
})();
