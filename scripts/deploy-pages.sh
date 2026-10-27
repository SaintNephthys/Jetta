#!/usr/bin/env bash
# Prepare and validate a Pages artifact. Publication is handled by deploy-pages.
set -euo pipefail

JETTA_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$JETTA_ROOT"

# Stop immediately if installation, validation, or packaging fails.
npm ci
npm run check
npm test
npm run build:pages

test -s artifacts/pages/index.html

# Expose only the reviewed public directory to the next GitHub Actions step.
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  printf 'artifact_path=artifacts/pages\n' >> "$GITHUB_OUTPUT"
fi

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  cat >> "$GITHUB_STEP_SUMMARY" <<'SUMMARY'
### Pages artifact ready

- Dependency installation, formatting checks, and automated tests passed.
- Public site files were packaged into `artifacts/pages/`.
- The workflow publishes this artifact only from the default branch.
SUMMARY
fi

printf 'Validated Pages artifact: artifacts/pages/\n'
