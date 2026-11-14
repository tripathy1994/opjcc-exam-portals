# Local implementation verification — 14 November 2026

This is a working LOCAL development candidate, not a deployed or production-ready examination release. All test identities, papers and answers were synthetic. No Cloudflare account access, production Firebase reads/writes, AI calls or Cloudinary uploads were used.

## Verified results

| Check | Result | Evidence |
|---|---|---|
| Node syntax, copied-module hashes, four reference PDFs, locked source manifest | PASS | INTEGRITY_AND_SYNTAX.json |
| Core API/DB/security/contract suite | 24/24 PASS | CORE_TESTS.txt; tests/core.test.mjs |
| Teacher and Student synthetic sign-in/render | PASS, zero captured browser errors | BROWSER_SMOKE.json |
| Actual Teacher manual MCQ builder → approve/publish via UI | PASS | UI_WORKFLOW.json |
| Original browser IndexedDB AnswerStore → confirmed answer → submission receipt | PASS | UI_WORKFLOW.json |
| Actual Teacher Review V2 UI → 0.5 mark → private save → separate publication | PASS | UI_WORKFLOW.json; screenshots |
| Student own published result and guarded Individual Answer Sheet download | PASS, local synthetic data | UI_WORKFLOW.json |
| Mixed actual PDF fixture | PASS: 47 = 30 MCQ + 10 Fill + 7 Short, 40 missing-key warnings retained | PDF_IMPORT_RESULTS.json |
| Four PDF renderers | PASS: JF approval, NTPC approval, Individual portrait, Consolidated landscape | PDF_RENDER_RESULTS.json; pdf-samples/ |
| PDF visual review | PASS for generated synthetic samples: logo/aspect, diagram, tables and signature areas visible without observed clipping | pdf-samples/*.png |
| Exact historical-reference pixel comparison | PENDING: sample content/page counts differ; no pixel-identical claim | Four exact original references preserved |
| Desktop Chrome local vision worker/model/WASM | PASS: initialization, synthetic blank-frame inference (zero faces), close | LOCAL_RUNTIME.json |
| IndexedDB offline confirmation → reconnect → submission | PASS using original AnswerStore with isolated fixture adapter | LOCAL_RUNTIME.json |
| Batch 30 + 20 | PASS: 50 starts, 200 saves, 50 submissions | LOCAL_LOAD_RESULTS.json |
| 50 concurrent stress | PASS: 50 starts, 50 saves, 50 submissions | LOCAL_LOAD_RESULTS.json |
| Firebase-shaped RSA JWT verification | PASS against locally generated fixture key/JWK; wrong audience/expired/forged token denied; trusted DB role used | Core suite |
| Audited Teacher recovery and bounded one-time reopen | PASS contract/DB tests; deadline/order/answer limits preserved | Core suite |
| Fifth camera-warning block, Teacher hold/resume/reset and audit history | PASS server tests | Core suite |
| Result projection/withdrawal, checksum/retry receipts | PASS against fixture destination only; outbox remains disabled | Core suite |

The admission used in browser AnswerStore integration was an explicitly synthetic API fixture. It was NOT a genuine camera-verified Android exam start. The vision test used a blank canvas stream, NOT a physical camera. Missing-key warnings are expected, not a parser failure. No OCR implementation is claimed.

## Not verified / release blockers

- BLOCKED: Cloudflare browser safety restriction; no account/DB/resource IDs or deployment URLs verified. No CLI/account fallback was attempted.
- BLOCKED: real Firebase master access/privileged sync not approved; production Auth UI adapter disabled by default. RSA fixture acceptance is not live Firebase sign-in acceptance.
- BLOCKED: original AI Worker new-origin compatibility; Generate/Re-Generate/AI translation are explicitly fail-closed. Existing authoring code is preserved, no AI request sent.
- BLOCKED: private media delivery and upload integration. Local synthetic selfies use data URLs; production Cloudinary settings/preset were not used or changed. Non-image attachments are not enabled in the local fixture upload adapter.
- PENDING: physical Android camera/microphone, sustained face tracking, real-device keyboard/fullscreen/app-switch and low-end performance.
- PENDING: exhaustive mixed-language UI review, multi-page golden-content visual comparisons, recovery-file chooser UI and destructive-action adaptation. Deletion remains disabled server-side.
- PENDING: Wrangler bundle/dry-run, actual D1 execution, account-wide free-tier reads/writes/CPU/storage and cloud load. Node SQLite results are not Cloudflare benchmarks.
- BLOCKED: actual result writes back to original Firebase, original Teacher projection controls/conflict policy, original portal link cutover. Separate approval required.

## Resource design

Student subscriptions share one batched watch request per 10-second poll. Heartbeat is carried with that watch where active. Unchanged presence is persisted at most once per minute; camera/mic/online changes and warnings are not suppressed. Confirmed answers and submissions remain immediate version-guarded operations. This avoids treating every inference frame or heartbeat as an audit write.

Transactions guard every read dependency atomically and are bounded for free-tier statement/parameter budgets. D1 index write amplification, cold JWT CPU and actual billing counters still require cloud measurement. No paid services or auto-upgrade enabled.

Expired attempts cannot save new answers, but can irreversibly submit their previously server-confirmed answer snapshot; this does not extend their deadline or admit late answers. Teacher recovery is explicit, reasoned and audited, invalidates old private review and preserves the two-change limit. No existing/real attempt was unblocked or changed.

## Production protection

All writes were limited to C:\OPJCC_EXAM_PORTALS. Locked recovery files are read-only references and rechecked against their manifest. No original Teacher/Student file, Attendance code, Firebase data/Rules/Auth/IAM, Cloudinary settings or Worker was changed. No cloud resources were provisioned.
