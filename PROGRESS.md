# Continuation checkpoint

## Implemented

- Locked Teacher Review V2 and Android Student V3 exam-only extraction. Helper modules, vision assets, fonts/logo and four approved PDF references copied with SHA evidence.
- Local-only synthetic login; Worker-compatible authenticated API; indexed D1 schema; SQLite local adapter and loopback server.
- Trusted Teacher/class ownership, eligibility, published paper/key separation, deterministic attempt IDs, immutable question order/deadline, two-change limit, operation receipts and atomic version guards.
- Teacher half-mark review/private save/publication/unpublication; publication revisions and disabled projection outbox.
- Original browser AnswerStore/IndexedDB offline behavior; on-device vision worker retained; no continuous streaming.
- Audited recovery/reopen contract adapters. Destructive operations intentionally fail closed.
- Disabled Firebase Auth/master integration and fixture-only result-sync adapter; guarded future deployment configs for new account only.
- Core, browser, PDF import/render, offline and local vision tests; see docs/TEST_REPORT.md.

## Exact next steps

1. Complete physical Android acceptance and expanded multi-language/multi-page UI regression; do not infer success from baseline or desktop tests.
2. Resolve Cloudflare safety restriction through the normal supported process only. No account access while blocked. Verify himansu-iot account ID/Free plan before provisioning/deploying.
3. Review private photo delivery, AI origin contract and minimal approved Firebase master access. No production credentials currently exist in this project.
4. Test recovery-file chooser UI, deliberate deadline/hold/reconnect races in the browser, and dedicated destructive-action migration before enabling those controls.
5. Wrangler/D1 cloud dry-run and actual free-tier load/CPU/row-budget measurement before real student use.
6. Separate approval before any production result projection, original link changes, IAM/Rules or protected Worker changes.

No production deployment has occurred. New cloud names are proposals only; there are no verified deployed URLs.
