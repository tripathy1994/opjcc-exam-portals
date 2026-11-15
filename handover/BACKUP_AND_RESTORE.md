# Backup and restore — Windows PowerShell

## Package locations
Primary C:\OPJCC_EXAM_FINAL_HANDOVER_20261115\OPJCC_EXAM_FINAL_COMPLETE_BACKUP.zip. Read FINAL_DELIVERY_RECORD.json for exact final SHA/commit/test results and second-copy path. PRE_CLOUD_INITIAL_BACKUP.zip preserves the first verified snapshot if present. LOCKED_RECOVERY_HASH_VERIFIED is the separately verified immutable original78-file copy. Older C:\OPJCC_EXAM_PORTALS\backups checkpoints remain untouched.

The ZIP contains complete source, handover/, GIT_HISTORY.bundle and internal SHA256_MANIFEST.txt. No .git objects, OAuth/private credentials, node_modules, .local databases or student data exports. Complete Git refs/history are recoverable from bundle. External FILES_AND_HASHES_SHA256.txt covers the delivery files excluding itself; ZIP cannot include its own hash. Handover project manifest similarly excludes itself and generated state. Do not confuse the source manifest with the final ZIP hash.

## Verify and extract into a NEW empty folder
```powershell
$package='C:\OPJCC_EXAM_FINAL_HANDOVER_20261115'
$zip=Join-Path $package 'OPJCC_EXAM_FINAL_COMPLETE_BACKUP.zip'
Get-FileHash -LiteralPath $zip -Algorithm SHA256
# Compare exactly with FINAL_DELIVERY_RECORD.json / APK-independent ZIP_SHA256.txt.
$restore='C:\OPJCC_EXAM_RESTORE_REVIEW'
if(Test-Path -LiteralPath $restore){throw 'Choose a new restore folder; never overwrite'}
Expand-Archive -LiteralPath $zip -DestinationPath $restore
Set-Location $restore
foreach($line in Get-Content -LiteralPath SHA256_MANIFEST.txt){
 if($line -match '^([A-Fa-f0-9]{64})  (.+)$'){
  $expected=$matches[1]; $relative=$matches[2]
  if($relative -match '(^|[\\/])\.\.([\\/]|$)'){throw 'Unsafe manifest path'}
  if((Get-FileHash -LiteralPath (Join-Path $restore $relative) -Algorithm SHA256).Hash -ne $expected){throw "Mismatch: $relative"}
 }
}
git bundle verify GIT_HISTORY.bundle
# Reconstruct complete Git metadata without changing restored source files:
git clone --no-checkout GIT_HISTORY.bundle C:\OPJCC_EXAM_HISTORY_REVIEW
git -C C:\OPJCC_EXAM_HISTORY_REVIEW log --all --oneline --decorate -20
# To inspect a preserved checkpoint, use a separate clone/folder, never reset existing work:
git -C C:\OPJCC_EXAM_HISTORY_REVIEW checkout f97474bbe22c2d0654e7a71b13f15cbf3733318f
```
Copy/verify locked recovery separately using its FILE_SHA256_MANIFEST.txt; preserve original paths where available. Do not overwrite E original. Existing project .git need not be copied because bundle is verified. A fresh no-checkout clone provides metadata, while ZIP includes working docs/evidence. If restoring under a different path, review absolute baseline/backup script guards before use; scripts/backup.ps1 intentionally only accepts C:\OPJCC_EXAM_PORTALS.

## Tools, local run and tests
Install free Node24+, Git, Chrome. No portal/Firebase credentials are needed for synthetic tests. No package-lock.json existed; use npm install (not npm ci), review generated lockfile. package.json pins Playwright1.62.1; bundled parser dependencies included. Optionally npx playwright install chromium, but existing tests request Chrome channel, so install Chrome or explicitly review test browser configuration. Never disable browser security.
```powershell
node --version
npm install
npm test
$env:PORT='8788'
$env:OPJCC_LOCAL_DB='new-review.sqlite'
$env:OPJCC_MONITOR_FIXTURE='1'
npm start
# Another PowerShell in the project, while server runs:
node tests/integrated-ui.mjs
node tests/integrated-workflow.mjs
node tests/integrated-import.mjs
node tests/integrated-pdfs.mjs
# http://127.0.0.1:8788/staging/ — synthetic fixture only
```
Core tests restored with portable original-HTML fallback and bundled parser modules pass without npm dependencies on this PC. Browser tests need Playwright/Chrome and local server, may download public CDN libraries. No real login/start/submission should be used. scripts/verify.mjs expects original E baseline path; use verified copy with explicitly reviewed path mapping on a different PC. Do not call a missing baseline PASS.

## Future cloud checks/deployment — NOT executed here
```powershell
wrangler whoami
# Must list account90e713649e8ec426a9d05511cc636235, NEVER protected old account.
$env:CLOUDFLARE_ACCOUNT_ID='90e713649e8ec426a9d05511cc636235'
# Only after Free plan, supported access and gate acceptance are genuinely verified:
wrangler d1 list
# Review/pin local Wrangler and check new resource names before creation.
# Existing guarded entry point, currently intentionally blocked:
powershell -NoProfile -File scripts/deploy.ps1 -Action ProvisionDatabase
# Record NEW database UUID in verified config; never reuse an old account resource.
# Reviewed config must contain exact account_id and DB UUID.
wrangler d1 migrations apply opjcc-exam-db --local --config wrangler.verified.local.json
wrangler deploy --dry-run --config wrangler.verified.local.json
powershell -NoProfile -File scripts/deploy.ps1 -Action MigrateDatabase
powershell -NoProfile -File scripts/deploy.ps1 -Action DeployApi
```
Do not run deployment examples until CLOUDFLARE_DEPLOYMENT_STATUS.md gates are resolved. Do not put credentials in commands/source or read token files. CLI OAuth must be user-authorized through normal supported login. The old browser safety block is NOT resolved by manually editing a JSON boolean. No Teacher/Student app deployment action is allowed by this backend-only architecture.

## Recovery limits
Source and Git can be recovered from this package. Runtime credentials remain in normal authorized account storage, NOT ZIP. No production database export, cloud state export or billing backup exists. Future Worker rollback must be schema-compatible and preserve all new answers; take approved D1 backup first. Do not overwrite current response data with old DB snapshots. No original production deployment occurred here.
