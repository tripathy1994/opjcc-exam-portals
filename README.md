# OPJCC independent Exam Portals — local development candidate

Source extracted from the immutable locked 14 November Teacher Review V2 / Student Android V3 recovery. This is NOT a deployed release. Original portals are untouched.

## Run locally

Requires Node 24 or newer (uses built-in SQLite). No npm install required for the local server/core tests.

    npm start

Open http://127.0.0.1:8787/teacher/ or http://127.0.0.1:8787/student/ . Use **Local synthetic sign-in**. Students 1–30 are the Jindal synthetic batch; 31–50 are the NTPC synthetic batch. Sessions are per tab; sign out when changing roles. No real credentials needed. Server binds ONLY to loopback. Restarting invalidates local session tokens; sign in again.

    npm test
    npm run verify

Browser integration scripts in `tests/` use the existing host Playwright/Chrome installation. See docs/TEST_REPORT.md for exact observed results and limitations. Local data in `.local/` is disposable synthetic test data and is excluded from Git/backups.

## Boundaries

- Production Firebase data/master sync, result writes, Cloudinary uploads and protected AI requests are disabled.
- Local synthetic selfies are data URLs; this is NOT the production private-media solution.
- Continuous live streaming is disabled; original on-device face runtime is copied.
- Audited recovery and explicit Teacher reopen are implemented and contract-tested locally. Full recovery-file UI interaction remains pending. Destructive workflows fail closed pending dedicated migration tests; copied controls/helpers are retained.
- Real Android acceptance, exact golden-content PDF/pixel comparisons, new-origin AI compatibility and actual Cloudflare free-tier measurements remain pending.
- No browser/account access attempted after the safety block. Deployment script refuses unresolved account/acceptance gates.

## Structure

`public/teacher` and `public/student`: extracted original exam UI and exact helper assets.
`public/shared`: new transport/local session adapter; Firebase Auth adapter disabled by default.
`backend`: Worker API, server authorization, master/projection adapters.
`migrations`: D1-compatible SQLite schema.
`tools`: loopback server, D1 test adapter, synthetic fixtures.
`references`: source manifest and four exact approved PDF references.
`docs`: actual test evidence, screenshots, PDF samples, limitations and rollback.

Do not point any deploy command at the original account, Firebase Hosting, Attendance, original AI Worker or existing databases. Do not enable integrations by merely changing a Boolean; complete the documented permission/privacy gates first.
