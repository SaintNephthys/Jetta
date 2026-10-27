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

  function validCustomDigits(digits, selected) {
    return Boolean(
      digits &&
        [digits.first, digits.second].every(
          (value) => Number.isInteger(value) && value >= 1 && value <= 4,
        ) &&
        (!selected.some((operation) => operation === 'subtract' || operation === 'divide') ||
          digits.first >= digits.second),
    );
  }

  function digitRange(digits) {
    return [10 ** (digits - 1), 10 ** digits - 1];
  }

  function makeQuestion(operation, level, random = Math.random, customDigits = null) {
    if (
      !Object.hasOwn(operations, operation) ||
      (level === 'custom'
        ? !validCustomDigits(customDigits, [operation])
        : !Object.hasOwn(presets, level))
    ) {
      throw new Error('Invalid question settings');
    }
    let a, b, answer;
    if (level === 'custom') {
      const [firstMin, firstMax] = digitRange(customDigits.first);
      const [secondMin, secondMax] = digitRange(customDigits.second);
      a = randomInt(firstMin, firstMax, random);
      b = randomInt(secondMin, secondMax, random);
      if (operation === 'divide') {
        // Choose a whole-number quotient whose product stays in the requested
        // dividend range, instead of changing the requested operand lengths.
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
    if (operation === 'multiply') answer = a * b;
    return { operation, a, b, answer };
  }

  function summarize(answers) {
    const correct = answers.filter((item) => item.userAnswer === item.question.answer).length;
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
    validCustomDigits,
  });
})();
