# Repository Guidelines

## Project Structure & Module Organization

JETTA is a static browser game collection. `index.html` is the game library; `games/arithmetic.html` is a standalone game page. `css/style.css` defines shared light sky-blue and dark neon theme tokens and controls; page styles live in `css/home.css` and `css/arithmetic.css`. Shared scripts live in `js/`, while `js/arithmetic/` separates arithmetic, session state, settings, rendering, viewport handling, and controller logic. Automated tests live in `tests/`. Keep documentation at the root. Exclude `node_modules/` and generated artifacts from version control; commit `package-lock.json` for reproducible development installs.

## Build, Test, and Development Commands

The site needs no build step or runtime dependencies. Open `index.html` directly, or run `python3 -m http.server 8000` from the root. For development, use Node.js 18+ and `npm ci`. Run `npm test` for tests, `npm run check` for formatting validation, and `npm run format` to apply Prettier. Browser scripts share `globalThis.Jetta`; load theme initialization synchronously in the head, then page scripts in dependency order with `defer` to support file and HTTP URLs. See README.md for details.

## Coding Style & Naming Conventions

Use Prettier with the committed configuration: two-space indentation, single-quoted JavaScript strings, and a 100-column print width. Keep DOM-free game rules separate from browser UI. Custom operands stay within 12 digits, but their products require BigInt; pass answer input as strings and use the shared answer normalization/comparison helpers. Persist session summaries rather than raw BigInt answer data. Use shared CSS custom properties for colors, native links for page navigation, and the `hidden` attribute for game screen visibility. Avoid duplicated overrides, credentials, and machine-specific configuration.

## Testing Guidelines

Use the built-in Node.js test runner with `tests/*.test.js`. Test arithmetic and session behavior independently, and use jsdom integration tests for presets, validation, screen transitions, theme initialization, file loading, and navigation paths. DOM tests do not validate pixel layout or native keyboards. Run `npm test` and `npm run check` before committing. For layout changes, inspect desktop, tablet, narrow phone, and reduced-height keyboard viewports in a browser when access is available; report any verification limitation.

## Commit & Pull Request Guidelines

There is no Git history from which to infer a commit convention. Write concise, imperative commit subjects that describe the change, such as `Add local development setup`. Keep commits focused. Pull requests should explain the purpose and implementation, describe how the change was tested, and link relevant issues. Include screenshots when a change affects the user interface.

After completing and verifying a requested change, review the working tree and create a focused commit without waiting for a separate request. Include only files related to the task; do not include unrelated changes. If a commit cannot be created, report the reason.
