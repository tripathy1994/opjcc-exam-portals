# OPJCC integrated Live Exam staging — 15 November 2026

The final architecture is the EXISTING Teacher/Student portals with only Live Exam on Workers + D1. Two additional standalone websites are NOT the solution. Earlier independent shells remain as legacy fixtures/history.

Full copies: public/staging/teacher and public/staging/student. All 71 existing helper/assets and all source outside recorded Live Exam ranges match the locked baseline. Raw original HTML/config references are under references/locked-baseline. Original E: files remain immutable.

## Run local synthetic tests

Requires Node 24+. In PowerShell:

    $env:PORT='8788'
    $env:OPJCC_LOCAL_DB='integrated-review.sqlite'
    $env:OPJCC_MONITOR_FIXTURE='1'
    npm start

Open http://127.0.0.1:8788/staging/ for the safety notice. DO NOT enter real credentials. The full copies preserve original Authentication code; browser tests use an explicitly mocked SDK and synthetic identities. Production sign-in/master integration is not connected or accepted. Staging connections are fenced to the local API.

    npm test
    node tests/integrated-ui.mjs
    node tests/integrated-workflow.mjs
    node tests/integrated-import.mjs
    node tests/integrated-pdfs.mjs

Browser tests need pinned Playwright/Chrome, available on this PC. Fixture students become Offline naturally without heartbeat clients; values are not hard-coded.

Build: node staging-tools/build-integrated.mjs

Proof: docs/integrated/PROTECTED_CHANGE_REPORT.json, two HTML patches, independent boundary tests. No original file is edited. Source code, models, fonts and approved PDF references are reused.

wrangler.jsonc is backend-only. Additional Teacher/Student Worker deployments are rejected. No account access or deployment occurred. Do not evade the acknowledged Cloudflare browser restriction. New-account/Free-plan/acceptance gates must be resolved normally.

See FINAL_REPORT.md, PROGRESS.md and docs/integrated/TEST_REPORT.md. Original Hosting, Firebase, Attendance, protected AI Worker and Cloudinary remain untouched. Continuous streaming/event snapshots are disabled.
