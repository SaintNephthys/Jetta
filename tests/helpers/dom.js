import { JSDOM, ResourceLoader, VirtualConsole } from 'jsdom';

class LocalResources extends ResourceLoader {
  fetch(url, options) {
    return url.startsWith('file:') ? super.fetch(url, options) : null;
  }
}

export async function loadPage(
  path = 'games/arithmetic.html',
  { blockedStorage = false, stored = {} } = {},
) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => errors.push(error.message));
  const dom = await JSDOM.fromFile(new URL(`../../${path}`, import.meta.url).pathname, {
    runScripts: 'dangerously',
    resources: new LocalResources(),
    virtualConsole,
    beforeParse(window) {
      window.__now = 1000;
      window.Date.now = () => window.__now;
      window.matchMedia = () => Object.assign(new window.EventTarget(), { matches: false });
      window.scrollTo = () => {};
      window.confirm = () => true;
      const viewport = Object.assign(new window.EventTarget(), {
        width: 390,
        height: 844,
        offsetTop: 0,
        offsetLeft: 0,
      });
      Object.defineProperty(window, 'visualViewport', { value: viewport });
      const data = new Map(Object.entries(stored));
      Object.defineProperty(window, 'localStorage', {
        get() {
          if (blockedStorage) throw new window.DOMException('Storage blocked', 'SecurityError');
          return {
            getItem: (key) => data.get(key) ?? null,
            setItem: (key, value) => data.set(key, String(value)),
          };
        },
      });
      window.HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
      };
      window.HTMLDialogElement.prototype.close = function () {
        this.open = false;
        window.setTimeout(() => this.dispatchEvent(new window.Event('close')), 0);
      };
    },
  });
  await new Promise((resolve) => dom.window.addEventListener('load', resolve, { once: true }));
  return {
    dom,
    window: dom.window,
    $: (selector) => dom.window.document.querySelector(selector),
    errors,
  };
}

export function typeValue(page, selector, value) {
  const input = page.$(selector);
  input.value = String(value);
  input.dispatchEvent(new page.window.Event('input', { bubbles: true }));
}

export function answerCorrectly(page) {
  const [a, operator, b] = page.$('#question').textContent.split(' ');
  const left = Number(a),
    right = Number(b);
  const value =
    operator === '+'
      ? left + right
      : operator === '−'
        ? left - right
        : operator === '×'
          ? left * right
          : left / right;
  typeValue(page, '#answer', value);
  page.$('#answer-form').requestSubmit();
}
