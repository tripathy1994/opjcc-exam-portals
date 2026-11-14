# Integrated staging evidence — 15 November 2026

## Environment

Actual locked full Teacher/Student HTML, not the prior standalone shells. Only Live Exam ranges changed. Original Auth/Firestore SDK interactions were mocked for synthetic browser tests; protected non-exam writes throw in the mock. Local server fences staging connections to the local API. No real Firebase login, production data read/write, AI generation, camera capture or Cloudflare access occurred.

| Verification | Status | Evidence |
|---|---|---|
| Combined backend/core, monitoring/security and protected-boundary suites | 39/39 PASS | AUTOMATED_TESTS.txt |
| Original 30+20 and 50-concurrent synthetic contracts | PASS locally, not cloud benchmarks | core.test.mjs; root LOCAL_LOAD_RESULTS.json |
| Teacher View/Warn/Hold/Block/Clear/Resume actual actions and confirmations | PASS, synthetic state | UI_RESULTS.json |
| 30-row JF / 20-row NTPC switching and desktop/tablet layout | PASS | UI_RESULTS.json; screenshots |
| Student eligible list and original camera pre-check; Start disabled before checks | PASS; camera/start not pressed | UI_RESULTS.json |
| Full-shell Teacher builder → synthetic admission → original browser AnswerStore → submission receipt → 0.5 review/private save → publish → own-PDF download | PASS | WORKFLOW_RESULTS.json; downloaded PDF |
| Actual searchable PDF fixture | PASS: 30 MCQ, 10 Fill, 7 Short; 40 missing-key warnings | PDF_IMPORT_RESULTS.json |
| Four PDF renderers | PASS: A4 portrait/landscape, zero renderer warnings | PDF_RENDER_RESULTS.json |
| Four reference hashes, logo/fonts/model/helper assets | PASS | root INTEGRITY_AND_SYNTAX.json; boundary suite |
| AI bank/count/type/four-language settings | PASS helper tests | core.test.mjs |
| Actual AI Generate/Re-Generate/translation | BLOCKED, no request sent | staging txAIRequest |
| Real Firebase identity/master and historical/D1 federation | BLOCKED/PENDING | No production access/projection |
| Physical Android camera/mic, sustained face tracking, keyboard/fullscreen/app-switch | PENDING | No device used |
| Golden-content PDF pixel identity, exhaustive multilingual UI | PENDING | Synthetic content differs; source unchanged |
| Cloudflare/D1 deployment, quotas, CPU, cloud latency/load | BLOCKED/PENDING | Safety restriction; no alternate access attempted |

## Interpretation and issues resolved

Counts/times come from the authorized local backend. All fixture students are synthetic, not real observed students. They naturally become Offline without heartbeat clients; counts are not hard-coded.

Device pending-sync and AI reports are labelled. Missing server answers are not assumed to be offline answers. Confirmed answer count and last server save are separate. Current question is Not reported. AI warning count/five-warning policy is distinct from all event counts. No new automatic eye-gaze penalty or camera-covered claim was added. Event snapshots remain disabled.

The initial PDF fixture failure was caused by its Auth mock having currentUser=null while a synthetic portal identity was set. The mock was corrected; the original own-account guard was NOT weakened. Final browser download and PDF-header/size checks passed.

Original sidebar CSS collided with newly introduced aside elements. Only the new dashboard markup/styles were contained using neutral component containers; original global styles/navigation were not edited.

## Design comparison

Reference: approved-monitor-reference.png. Internal composition/colors implemented: blue selector header, five pastel cards, warning queue, roster/actions, selected details/history and process row. No callout bubbles or monitor framing. Original portal theme/header/sidebar are preserved. Close composition match; not full-screen pixel identity to an infographic.

## Protection and gates

No original source, Attendance/punch/notifications, Firebase data/Rules/Auth/IAM/indexes, Cloudinary or protected Worker changes. No real student data copied to D1. Live Rules were not fetched; no task operation changed them.

Backend-only Cloudflare config is prepared but gated. Minimal master access, private media delivery, real result projection and original Hosting cutover need separate permission/privacy review. No original production deployment is approved. Recovery contract tests pass; full recovery chooser and destructive adapter tests remain pending. Destructive actions remain disabled.


Additional verified compatibility: the Live Exam transport normalizes legacy endAt-only extensions to matching IST milliseconds without modifying attempt deadlines. Server publication/admission also enforce reviewed canonical multilingual variants and True/False tokens. These are isolated backend/transport changes, not production metadata writes.
