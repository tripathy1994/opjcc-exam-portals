# Integrated staging deployment and rollback

No cloud deployment or account access occurred. Safety restriction remains. Do not try another browser/CLI authentication path while blocked.

Final architecture: new backend Worker `opjcc-exam-api` + D1 `opjcc-exam-db`, original Teacher/Student Hosting ultimately retained. Names are proposed, not verified resources. Separate app deployment actions now throw before any account command. Legacy app configs remain for history only.

When normal supported access is restored: independently verify NEW `himansu-iot.workers.dev` account ID/Free plan and selected CLI account before each deployment. Do not infer the ID from its name. Do not reuse an existing resource from another account. Current local approval/config placeholders intentionally prevent execution.

Provision only the new D1, record UUID, apply additive schema, deploy ONLY the new backend after acceptance. Do not activate billing. Worker has no static-asset binding in the current configuration. Exact HTTPS origins must be explicitly configured; wildcard is rejected. No origin config authorizes a user: Firebase token signature and trusted D1 principal/class checks still apply.

`exam-transport-config.js` defaults to same-origin local API. A verified dedicated-account HTTPS API URL can be set later; no endpoint is active now. Real master access, principal provisioning and private media delivery remain approval gates. No privileged production credential is present. Result projection outbox remains disabled.

Original Hosting cutover is NOT approved. Before a future cutover: complete real identity/media/Android acceptance, cloud quota/load/CPU measurements, historical read-only federation and result-authority policy; capture current original Hosting releases/affected files; review exact Live Exam diffs. Never deploy original Rules/Auth/indexes/Workers or overwrite historical records. AI on isolated origin remains blocked; keep original Worker unchanged.

## Rollback

Original production needs no rollback: it was not changed. Prior local commit `59d6633542584d49e80609e7b71fe17a69780cd2`, its ZIP and PRE_INTEGRATED Git bundle are preserved. Restore into a NEW folder for comparison; do not reset/delete working changes. Current source and full Git history are included in the new verified ZIP.

Future backend rollback: preserve all accepted attempts/answers and new-D1 backup first. Roll back only a new Worker version compatible with the schema. Stop new admissions on critical failure; do not auto-unblock, discard responses, replay attempts into Firebase or restore an old DB over newer answers. Current schema migration is additive; no destructive down migration provided.

Reverse HTML patches are audit evidence only, not automatic production deployment/rollback commands. Raw immutable original HTML/config and exact helper/asset hashes are included for recovery. Synthetic local databases are deliberately excluded from source backups; regenerate test fixtures instead of importing real student records.
