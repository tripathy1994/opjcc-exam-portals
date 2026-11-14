param([ValidateSet('ProvisionDatabase','MigrateDatabase','DeployApi','DeployTeacher','DeployStudent')][string]$Action)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$approvalPath=Join-Path $projectRoot 'config\account-approval.local.json'
if(!(Test-Path -LiteralPath $approvalPath)){throw 'BLOCKED: dedicated-account verification record missing. Do not access Cloudflare while browser safety block remains.'}
$approval=Get-Content -LiteralPath $approvalPath -Raw | ConvertFrom-Json
if(!$approval.browserSafetyBlockResolved -or $approval.verifiedSubdomain -ne 'himansu-iot' -or !$approval.freePlanVerified -or $approval.verifiedAccountId -notmatch '^[a-f0-9]{32}$'){throw 'BLOCKED: supported access/new-account/free-plan verification required.'}
if(!$approval.integrationAcceptanceComplete){throw 'BLOCKED: integration acceptance is not complete. Shell deployment needs an explicit reviewed gate decision.'}
# No login, token acquisition, browser automation or secret reads in this script.
# Wrangler uses a normal separately authorized session when this gate is resolved.
$env:CLOUDFLARE_ACCOUNT_ID=$approval.verifiedAccountId
Push-Location $projectRoot
try{
  $cli=Join-Path $projectRoot 'node_modules\.bin\wrangler.cmd'
  if(!(Test-Path -LiteralPath $cli)){throw 'Install the pinned Wrangler version after normal tool/network approval; no automatic install or account access.'}
  if($Action -eq 'ProvisionDatabase'){& $cli d1 create opjcc-exam-db; if($LASTEXITCODE -ne 0){throw 'Database provisioning failed'}; return}
  if($approval.approvedDatabaseId -notmatch '^[a-f0-9-]{36}$'){throw 'Verified new database ID required'}
  $cfg=Get-Content -LiteralPath (Join-Path $projectRoot 'wrangler.jsonc') -Raw | ConvertFrom-Json
  $cfg | Add-Member -NotePropertyName account_id -NotePropertyValue $approval.verifiedAccountId
  $cfg.d1_databases[0].database_id=$approval.approvedDatabaseId
  # Config stays at project root so source/asset paths resolve correctly.
  $generated=Join-Path $projectRoot 'wrangler.verified.local.json'
  $cfg | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $generated -Encoding utf8
  switch($Action){
    'MigrateDatabase' { & $cli d1 migrations apply opjcc-exam-db --remote --config $generated }
    'DeployApi' { & $cli deploy --config $generated }
    'DeployTeacher' { & $cli deploy --config config\teacher.jsonc }
    'DeployStudent' { & $cli deploy --config config\student.jsonc }
  }
  if($LASTEXITCODE -ne 0){throw 'Cloudflare command failed; stop without further actions'}
}finally{Pop-Location}
