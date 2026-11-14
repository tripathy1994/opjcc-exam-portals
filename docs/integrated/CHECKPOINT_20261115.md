# Next checkpoint — 15 November 2026

Baseline preserved: 4556aabdb339244c8e18698694b087fbfe7b04be and its verified 301-file backup. No application source, schema or deployment configuration changes were necessary in this checkpoint. Only evidence and this runbook were refreshed.

## UI comparison
Actual full-shell desktop and 1024px tablet browser captures were compared with approved-monitor-reference.png. The blue header, no-streaming notice, five pastel metrics, warning queue, roster, selected details and process footer are present. No overlapping fixed/absolute panels remain. No genuine defect requiring a UI patch was established.

Exact visible differences retained intentionally: existing portal navigation/branding surrounds the panel; typography/spacing are not pixel-identical to the illustrative image; six authorized actions occupy two rows instead of the reference four; selected details contain additional authenticated sync/history fields; optional evidence photos are replaced by warning history and a privacy notice. Current question is explicitly Not reported rather than invented. Counts and queue events are real synthetic backend values, not reference-image constants. Tablet roster has horizontal scrolling and details below; this is not a claim of full pixel equivalence. No continuous video or new snapshots are enabled.

## Fresh verification
- npm test: 39 passed, zero failed. Includes permissions, private key isolation, deterministic order/deadline, initial + two changes, concurrent answer CAS, submission, Review V2 half marks/publication, monitor commands, 30+20 and 50-student synthetic scenarios.
- node scripts/verify.mjs: 81 syntax checks, 66 copied legacy assets, 78/78 locked manifest, four PDF references; zero reported failures/heuristic secret findings.
- node tests/integrated-ui.mjs: actual full-shell local browser fixture; 30 JF/20 NTPC rows, five server-confirmed commands, no photos/video, desktop/tablet panels, Student eligibility/precheck and disabled Start without camera; zero browser errors.
- node tests/integrated-workflow.mjs: Teacher builder publication -> synthetic API admission -> original IndexedDB AnswerStore save/confirmed submission -> original Teacher Review V2 0.5/1 -> publication -> own Individual Answer Sheet download, 363486 bytes; zero Teacher/Student browser errors.
- Protected-range/hash tests confirm original non-exam sections and existing helper/assets unchanged. Exact Student camera/face/fullscreen algorithms remain preserved. Camera runtime helper remains byte-identical to locked source. Existing desktop synthetic inference/close and offline recovery evidence is retained in docs/LOCAL_RUNTIME.json; it was NOT rerun or upgraded to physical Android evidence here.
- Physical Android camera/warning lifecycle in this new integrated backend, real Firebase authenticated acceptance, cloud D1 runtime/CPU/quota measurements: PENDING. Original production recovery results do not establish acceptance of the new project.

## Deployment readiness and blocker
LOCAL CANDIDATE TESTED; CLOUD DEPLOYMENT BLOCKED, NOT RELEASE READY FOR STUDENTS.
No Cloudflare account connection was attempted. Prior Computer Use URL-verification safety restriction remains unresolved and was not retested. No alternate browser, token extraction or CLI account access was attempted. Cloudflare documentation does not resolve a Codex browser safety block; restore supported access through the normal managed connection/support process first. Do not mark the local approval record resolved merely to bypass this gate.

Worker opjcc-exam-api and D1 opjcc-exam-db are proposed names only. Schema migrations/0001_initial.sql is locally exercised; root wrangler.jsonc has no static-assets binding, deliberately unresolved database UUID, integrations disabled, empty exact-origin allowlist. Existing deployment guard requires dedicated-account verification and integration acceptance. Wrangler is not installed/pinned in this project: actual Wrangler/workerd bundle dry-run and real D1 migration acceptance remain PENDING, not equivalent to SQLite-adapter tests.

## Supported Cloudflare sequence — ONLY after safety restriction is properly resolved
These are future steps, not commands executed in this checkpoint.
1. Review and pin a supported Wrangler devDependency, record lockfile/version. Use the officially supported interactive OAuth login when required; no credentials in chat/source. Verify the active identity/account using supported Wrangler account inspection and dashboard; independently match account ID, himansu-iot.workers.dev and Free plan before each remote action. Never infer account ID from subdomain or reuse an unrelated existing database.
2. Review the ignored config/account-approval.local.json record, exact origins and integration acceptance with evidence. Keep production master sync, result projection and AI/media dependencies disabled until their separate gates are satisfied. The record is a guard, not independent proof of selected account.
3. Once safe access exists, use Wrangler d1 create opjcc-exam-db only in the verified NEW account. Record the returned UUID. Configure binding DB/account_id in the ignored generated config via the existing guarded script. Do not overwrite a similarly named resource in another account.
4. Before any cloud migration, run Wrangler d1 migrations apply opjcc-exam-db --local using the verified configuration and review resulting schema. Run Wrangler deploy --dry-run with that configuration and inspect bundle/bindings. These checks have NOT been executed yet.
5. Review unapplied migrations with Wrangler d1 migrations list; apply the additive migration with explicit --remote only after the account/resource recheck. Existing scripts/deploy.ps1 actions ProvisionDatabase, MigrateDatabase, DeployApi implement these guarded remote phases. Do not run legacy DeployTeacher/DeployStudent actions; they intentionally reject.
6. Deploy ONLY the new backend, capture Worker version and D1 identity, verify health, unauthenticated denial and exact-origin CORS. Use authorized isolated identities and synthetic data for end-to-end/load acceptance. Cloud quota/CPU/latency must be measured before admitting students. No original Hosting cutover or production result sync is approved.
7. Rollback: preserve accepted answers and database backup first; restore only a schema-compatible new Worker version. Never restore an older DB over newer submissions, delete attempts or auto-unblock. Original production remains unchanged and needs no rollback from this checkpoint.

Official references (read-only public documentation):
- https://developers.cloudflare.com/workers/get-started/guide/
- https://developers.cloudflare.com/workers/wrangler/commands/
- https://developers.cloudflare.com/d1/wrangler-commands/
- https://developers.cloudflare.com/d1/reference/migrations/

Outstanding approval/dependency gates: supported account access; actual new account ID/Free-plan verification; pinned deployment tooling; real Firebase principal/student-minimization approval; private photo storage; protected AI origin compatibility; historical result read policy and disabled projection activation; real-device acceptance. No production source, Firebase/Auth/Rules/Attendance, AI Worker, Cloudinary or production data was changed or deployed.
