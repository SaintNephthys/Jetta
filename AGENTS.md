# Repository Guidelines

## Project Structure & Module Organization

JETTA is a static browser game collection. `index.html` contains the screens, `css/` contains responsive styles, `js/` contains UI, arithmetic, and session modules, and `tests/` contains automated tests. Keep documentation at the root and generated files and local dependencies out of version control.

## Build, Test, and Development Commands

No dependency installation or build is needed. From the root, run `python3 -m http.server 8000` for local development and `npm test` for tests (Node.js 18+). See README.md for setup and hosting.

## Coding Style & Naming Conventions

Follow the conventions of the language and framework introduced to the project. Use consistent indentation, descriptive names, and small, focused modules. Configure a formatter or linter when the first source files are added, and document how to run it. Avoid committing credentials or machine-specific configuration.

## Testing Guidelines

Use the built-in Node.js test runner with `tests/*.test.js`. Test arithmetic generation and session behavior independently from the DOM, including deadline boundaries and regression cases. Run `npm test` before committing. For layout changes, also inspect desktop, tablet, narrow phone, and reduced-height keyboard viewports in a browser.

## Commit & Pull Request Guidelines

There is no Git history from which to infer a commit convention. Write concise, imperative commit subjects that describe the change, such as `Add local development setup`. Keep commits focused. Pull requests should explain the purpose and implementation, describe how the change was tested, and link relevant issues. Include screenshots when a change affects the user interface.

After completing and verifying a requested change, review the working tree and create a focused commit without waiting for a separate request. Include only files related to the task; do not include unrelated changes. If a commit cannot be created, report the reason.
