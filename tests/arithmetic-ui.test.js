import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { loadPage, typeValue, answerCorrectly } from './helpers/dom.js';

async function game(t, options) {
  const page = await loadPage('games/arithmetic.html', options);
  t.after(() => {
    assert.deepEqual(page.errors, []);
    page.dom.window.close();
  });
  return page;
}

function selectMode(page, mode) {
  if (!page.$('#mode-dialog').open) page.$('#change-mode').click();
  page.$(`[data-mode="${mode}"]`).click();
}

test('home links to a standalone arithmetic page with all local assets available', async (t) => {
  const home = await loadPage('index.html');
  t.after(() => home.dom.window.close());
  const href = home.$('#open-game').getAttribute('href');
  assert.equal(href, 'games/arithmetic.html');
  assert.equal(home.$('#practice'), null);
  assert.equal(home.$('script[src*="arithmetic"]'), null);
  const page = await game(t);
  assert.equal(page.$('#mode-dialog').open, true);
  for (const selector of ['#back-home', '#result-home', '.brand']) {
    assert.equal(page.$(selector).getAttribute('href'), '../index.html');
  }
  for (const path of ['index.html', href]) {
    const url = new URL(`../${path}`, import.meta.url);
    const html = await readFile(url, 'utf8');
    for (const [, asset] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      await access(new URL(asset, url));
    }
  }
  assert.deepEqual(home.errors, []);
});

test('count presets and custom values stay synchronized and determine game length', async (t) => {
  const page = await game(t);
  selectMode(page, 'count');
  assert.equal(page.$('#time-settings').hidden, true);
  for (const count of [10, 30, 50]) {
    const button = page.$(`#count-settings [data-preset="${count}"]`);
    button.click();
    assert.equal(page.$('#question-count').value, String(count));
    assert.equal(button.getAttribute('aria-pressed'), 'true');
  }
  typeValue(page, '#question-count', 7);
  assert.equal(page.$('#count-settings [aria-pressed="true"]'), null);
  page.$('#count-settings [data-preset="10"]').click();
  page.$('#start-game').click();
  assert.equal(page.$('#practice').hidden, false);
  assert.equal(page.$('#mode-dialog').open, false);
  for (let index = 0; index < 10; index++) {
    page.window.__now += 1000;
    answerCorrectly(page);
  }
  assert.equal(page.$('#results').hidden, false);
  assert.equal(page.$('#score').textContent, '100%');
  assert.equal(page.$('#total-count').textContent, '10');
  assert.equal(page.$('#elapsed').textContent, '10.0 sec');
  page.$('#retry').click();
  assert.equal(page.$('#setup').hidden, false);
  assert.equal(page.$('#history').hidden, false);
});

test('time presets control the deadline and reject answers submitted at expiry', async (t) => {
  const page = await game(t);
  selectMode(page, 'time');
  assert.equal(page.$('#count-settings').hidden, true);
  for (const seconds of [30, 60, 90]) {
    const button = page.$(`#time-settings [data-preset="${seconds}"]`);
    button.click();
    assert.equal(page.$('#time-limit').value, String(seconds));
    assert.equal(button.getAttribute('aria-pressed'), 'true');
  }
  typeValue(page, '#time-limit', 75);
  assert.equal(page.$('#time-settings [aria-pressed="true"]'), null);
  page.$('#time-settings [data-preset="30"]').click();
  page.$('#start-game').click();
  assert.equal(page.$('#timer').textContent, '0:30');
  page.window.__now = 5000;
  answerCorrectly(page);
  page.window.__now = 31000;
  answerCorrectly(page);
  assert.equal(page.$('#results').hidden, false);
  assert.equal(page.$('#total-count').textContent, '1');
  assert.equal(page.$('#elapsed').textContent, '30.0 sec');
});

test('invalid settings do not start a session and changing mode preserves each limit', async (t) => {
  const page = await game(t);
  page.$('#close-mode').click();
  page.$('#start-game').click();
  assert.equal(page.$('#mode-dialog').open, true);
  selectMode(page, 'count');
  typeValue(page, '#question-count', 0);
  page.$('#start-game').click();
  assert.equal(page.$('#practice').hidden, true);
  page.$('#count-settings [data-preset="50"]').click();
  selectMode(page, 'time');
  page.$('#time-settings [data-preset="90"]').click();
  selectMode(page, 'count');
  assert.equal(page.$('#question-count').value, '50');
  assert.equal(page.$('#time-limit').value, '90');
  page.window.document.querySelectorAll('input[name="operation"]').forEach((input) => {
    input.checked = false;
  });
  page.$('#start-game').click();
  assert.ok(page.$('#setup-error').textContent);
  assert.equal(page.$('#practice').hidden, true);
});

test('keyboard viewport changes are reflected and quitting clears the live game', async (t) => {
  const page = await game(t);
  selectMode(page, 'count');
  page.$('#start-game').click();
  const viewport = page.window.visualViewport;
  Object.assign(viewport, { height: 240, offsetTop: 80 });
  viewport.dispatchEvent(new page.window.Event('resize'));
  assert.equal(
    page.window.document.documentElement.style.getPropertyValue('--visible-height'),
    '240px',
  );
  assert.equal(
    page.window.document.documentElement.style.getPropertyValue('--visible-top'),
    '80px',
  );
  assert.equal(page.window.document.body.classList.contains('short-game'), true);
  page.$('#quit-game').click();
  assert.equal(page.$('#setup').hidden, false);
  assert.equal(page.window.document.body.classList.contains('playing'), false);
});

test('saved themes, legacy practice history and blocked storage work across page initialization', async (t) => {
  const history = { date: '2026-10-27T00:00:00Z', percentage: 80, correct: 8, total: 10 };
  const page = await game(t, {
    stored: {
      'thinking-playground-theme': 'dark',
      'thinking-playground-last': JSON.stringify(history),
    },
  });
  assert.equal(page.window.document.documentElement.dataset.theme, 'dark');
  assert.equal(page.$('#history').hidden, false);
  page.$('#theme-toggle').click();
  assert.equal(page.window.localStorage.getItem('thinking-playground-theme'), 'light');
  assert.equal(page.$('meta[name="theme-color"]').content, '#f0f9ff');
  const blocked = await game(t, { blockedStorage: true });
  selectMode(blocked, 'time');
  blocked.$('#start-game').click();
  blocked.window.__now += 61000;
  blocked.window.document.dispatchEvent(new blocked.window.Event('visibilitychange'));
  assert.equal(blocked.$('#results').hidden, false);
  assert.equal(blocked.$('#total-count').textContent, '0');
  assert.equal(blocked.$('#average').textContent, '—');
});

test('a restored game resumes its timer and expires at the original deadline', async (t) => {
  const page = await game(t);
  selectMode(page, 'time');
  page.$('#time-settings [data-preset="30"]').click();
  page.$('#start-game').click();
  page.window.dispatchEvent(new page.window.Event('pagehide'));
  page.window.__now = 20000;
  page.window.dispatchEvent(new page.window.Event('pageshow'));
  assert.equal(page.$('#timer').textContent, '0:11');
  assert.equal(page.$('#practice').hidden, false);
  page.window.dispatchEvent(new page.window.Event('pagehide'));
  page.window.__now = 50000;
  page.window.dispatchEvent(new page.window.Event('pageshow'));
  assert.equal(page.$('#results').hidden, false);
  assert.equal(page.$('#elapsed').textContent, '30.0 sec');
  assert.equal(page.$('#total-count').textContent, '0');
});
