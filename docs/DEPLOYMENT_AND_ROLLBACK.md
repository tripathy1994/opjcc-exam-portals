# Deployment preparation — NOT executed

Account subdomain must be `himansu-iot.workers.dev`. No account ID or database ID is verified; no resources exist from this task. Browser safety block remains unresolved. Do not try alternate account access to evade it.

Proposed resources: `opjcc-exam-api`, `opjcc-exam-db`, `opjcc-exam-teacher`, `opjcc-exam-student`.

After a normal supported connection is available, verify the account ID/subdomain and Free plan independently. Preserve a dated verification record without secrets. Review all remaining acceptance blockers. Copy `config/account-approval.example.json` to the ignored `.local.json` name only then; never invent account/database IDs. Use a pinned, reviewed Wrangler installation in this new project; install/version verification is pending.

Guarded script actions: ProvisionDatabase → record verified new UUID → MigrateDatabase → DeployApi → DeployTeacher → DeployStudent. Each invocation checks the saved dedicated-account approval. Also verify the selected account in the supported session immediately before each invocation; the local record is not independent proof of current cloud state. Capture version IDs, asset read-back hashes and actual account usage. No Firebase deployment commands are present.

The shells cannot become a real exam release until trusted master synchronization, approved private-media delivery and Firebase sign-in integration are accepted. AI can remain explicitly blocked if its protected original endpoint rejects the new origin. Result projection stays disabled absent separate production-write approval.

## Rollback

Local: stop `npm start`; restore source from the verified ZIP/Git bundle. `.local` is disposable synthetic data only; never restore it over real data.

New cloud resources, when later deployed: record the preceding Worker version before every change. Revert only the new Worker versions; never alter original services. D1 migration 0001 is additive; no down/drop migration is provided. Export a verified new-D1 backup before schema changes. Code rollback must remain compatible with existing data. Stop new admissions if critical failure occurs; preserve accepted answers and allow safe completion/recovery. Never discard attempts, automatically unblock users or replay them into original Firebase.

Original Teacher/Student cutover links and result projection writes require separate approval and are not part of these scripts.
