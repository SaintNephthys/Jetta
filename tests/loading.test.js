import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// file:// pages cannot import ES modules. Exercise the shipped dependencies as
// classic scripts in an isolated browser-like global, without Node's loader.
test('arithmetic runtime can load without an ES module loader', async () => {
  const context = vm.createContext({});
  for (const filename of ['math.js', 'session.js']) {
    const source = await readFile(new URL(`../js/${filename}`, import.meta.url), 'utf8');
    new vm.Script(source, { filename }).runInContext(context);
  }
  const result = vm.runInContext(`(() => {
    const session = new Jetta.PracticeSession({ mode:'count', limit:1, selected:['add'], level:'easy', now:0 });
    session.submit(session.question.answer, 1000);
    return session.summary(1000);
  })()`, context);
  assert.equal(result.correct, 1);
  assert.equal(result.total, 1);
  assert.equal(result.seconds, 1);

  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*\bsrc="([^"]+)"[^>]*)>/g)];
  assert.equal(scripts.length, 3);
  for (const [, attributes, src] of scripts) {
    assert.doesNotMatch(attributes, /type="module"/);
    assert.match(attributes, /\bdefer\b/);
    const source = await readFile(new URL(`../${src}`, import.meta.url), 'utf8');
    assert.doesNotThrow(() => new vm.Script(source, { filename: src }));
  }
});
