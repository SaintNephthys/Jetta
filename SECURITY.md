# Security and publication

JETTA is a static browser application. HTML, CSS, and JavaScript delivered to the browser are public. Never put API secrets, access tokens, passwords, or private keys in these files. Environment variables copied into browser scripts are also public; adding an `.env` file does not make a client-side secret safe.

`.gitignore` excludes local environment files, credential configuration, private key files, logs, installed dependencies, and generated artifacts. `.env.example` and `.env.*.example` may be committed only with placeholder values. Ignore rules do not remove files already committed or erase Git history. If a credential is ever committed, revoke or rotate it at the provider before cleaning the history.

Game answers and stored history are rendered as text rather than HTML. Browser storage contains only a theme preference and the latest completion summary; do not store credentials or sensitive information there. There is no server-side authentication or trusted leaderboard, so locally edited game scores are not security assertions.

Before publishing, run:

```sh
npm ci
npm run check
npm test
npm audit
```

Review `git status --short`, staged files, and any new external URLs. The Pages artifact must contain only `index.html`, `games/`, `css/`, `js/`, and its generated `.nojekyll` marker. Do not publish the repository root, `node_modules/`, tests, local configuration, or Git metadata as the site artifact. New asset directories must be added explicitly to the packaging script after review.

Dependency audits and pattern-based secret scans can miss vulnerabilities and unusual credential formats. A clean result describes the checked revision and dependency data at that time; it is not a guarantee for future changes.
