export const operations = { add: { label: '덧셈', symbol: '+' }, subtract: { label: '뺄셈', symbol: '−' }, multiply: { label: '곱셈', symbol: '×' }, divide: { label: '나눗셈', symbol: '÷' } };
const randomInt = (min, max, random) => Math.floor(random() * (max - min + 1)) + min;

export function makeQuestion(operation, level, random = Math.random) {
  const limits = { easy: [1, 9], medium: [10, 50], hard: [20, 99] };
  if (!operations[operation] || !limits[level]) throw new Error('Invalid question settings');
  const [min, max] = limits[level];
  let a = randomInt(min, max, random);
  let b = randomInt(min, max, random);
  let answer;
  if (operation === 'add') answer = a + b;
  if (operation === 'subtract') { if (b > a) [a, b] = [b, a]; answer = a - b; }
  if (operation === 'multiply') { b = randomInt(2, level === 'easy' ? 9 : level === 'medium' ? 12 : 20, random); answer = a * b; }
  if (operation === 'divide') { b = randomInt(2, level === 'easy' ? 9 : level === 'medium' ? 12 : 20, random); answer = a; a *= b; }
  return { operation, a, b, answer };
}

export function summarize(answers) {
  const correct = answers.filter(item => item.userAnswer === item.question.answer).length;
  return { correct, total: answers.length, percentage: answers.length ? Math.round(correct / answers.length * 100) : 0 };
}
