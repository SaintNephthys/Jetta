import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

function luminance(hex) {
  const channels = hex.match(/[a-f0-9]{2}/gi).map((value) => {
    const component = parseInt(value, 16) / 255;
    return component <= 0.04045 ? component / 12.92 : ((component + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('dark theme colors retain text and control contrast on the darker surfaces', async () => {
  const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');
  const dark = css.match(/\[data-theme='dark'\]\s*\{([^}]+)\}/)[1];
  const colors = Object.fromEntries(
    [...dark.matchAll(/--([a-z-]+):\s*(#[a-f0-9]{6});/g)].map(([, key, value]) => [key, value]),
  );
  for (const background of ['background', 'surface', 'surface-soft']) {
    assert.ok(contrast(colors.text, colors[background]) >= 7, `text on ${background}`);
    assert.ok(contrast(colors.muted, colors[background]) >= 4.5, `secondary text on ${background}`);
    assert.ok(contrast(colors.border, colors[background]) >= 3, `controls on ${background}`);
  }
  assert.ok(contrast(colors.accent, colors.selected) >= 4.5);
  assert.ok(contrast(colors['accent-text'], colors.accent) >= 4.5);
  assert.ok(contrast(colors.focus, colors.surface) >= 3);
});
