$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectRoot=[IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
if($projectRoot -ne 'C:\OPJCC_EXAM_PORTALS'){throw 'Unexpected backup source; review before running elsewhere'}
$stamp=Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir=Join-Path $projectRoot "backups\LOCAL_CANDIDATE_$stamp"
New-Item -ItemType Directory -Path $backupDir -ErrorAction Stop | Out-Null
$zipPath=Join-Path $backupDir 'OPJCC_EXAM_PORTALS_LOCAL.zip'
$bundle=Join-Path $backupDir 'GIT_HISTORY.bundle'
& git -C $projectRoot bundle create $bundle --all
if($LASTEXITCODE -ne 0){throw 'Git history bundle failed'}
& git -C $projectRoot bundle verify $bundle
if($LASTEXITCODE -ne 0){throw 'Git bundle verification failed'}
$entries=@(Get-ChildItem -LiteralPath $projectRoot -Recurse -File -Force | Where-Object {
  $relative=$_.FullName.Substring($projectRoot.Length+1)
  $relative -notmatch '^(?:\.git|\.local|\.wrangler|node_modules|backups)(?:\\|$)' -and $relative -notmatch '(?:^|\\)(?:\.env|\.dev\.vars|account-approval\.local\.json|wrangler\.verified\.local\.json)$' -and $_.Extension -notin @('.pem','.key','.p12','.pfx')
} | ForEach-Object {[pscustomobject]@{Source=$_.FullName;Name=$_.FullName.Substring($projectRoot.Length+1).Replace('\','/')}})
$entries += [pscustomobject]@{Source=$bundle;Name='GIT_HISTORY.bundle'}
$manifest=@{}
$archive=[IO.Compression.ZipFile]::Open($zipPath,[IO.Compression.ZipArchiveMode]::Create)
try{
 foreach($item in $entries){$manifest[$item.Name]=(Get-FileHash -Algorithm SHA256 -LiteralPath $item.Source).Hash;[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$item.Source,$item.Name,[IO.Compression.CompressionLevel]::Optimal) | Out-Null}
 $entry=$archive.CreateEntry('SHA256_MANIFEST.txt');$writer=[IO.StreamWriter]::new($entry.Open());try{foreach($name in ($manifest.Keys|Sort-Object)){$writer.WriteLine("$($manifest[$name])  $name")}}finally{$writer.Dispose()}
}finally{$archive.Dispose()}
$archive=[IO.Compression.ZipFile]::OpenRead($zipPath);$verified=0
try{
 $reader=[IO.StreamReader]::new($archive.GetEntry('SHA256_MANIFEST.txt').Open());try{$storedManifest=$reader.ReadToEnd()}finally{$reader.Dispose()}
 $stored=@{};foreach($line in ($storedManifest -split "`r?`n")){if($line -match '^([A-F0-9]{64})  (.+)$'){$stored[$matches[2]]=$matches[1]}}
 if($stored.Count -ne $manifest.Count){throw 'Stored manifest count mismatch'}
 foreach($entry in $archive.Entries){if($entry.FullName -eq 'SHA256_MANIFEST.txt'){continue};$stream=$entry.Open();$sha=[Security.Cryptography.SHA256]::Create();try{$actual=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','');if($actual -ne $stored[$entry.FullName] -or $actual -ne $manifest[$entry.FullName]){throw "ZIP hash mismatch: $($entry.FullName)"};$verified++}finally{$stream.Dispose();$sha.Dispose()}}
}finally{$archive.Dispose()}
if($verified -ne $entries.Count){throw 'ZIP entry count mismatch'}
$hash=(Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
$restore=Join-Path $backupDir 'RESTORE_SMOKE'
[IO.Compression.ZipFile]::ExtractToDirectory($zipPath,$restore)
$testOutput=& node --test (Join-Path $restore 'tests\core.test.mjs') 2>&1
$testExit=$LASTEXITCODE
$testOutput | Set-Content -LiteralPath (Join-Path $backupDir 'RESTORE_TESTS.txt') -Encoding utf8
$result=[ordered]@{Zip=$zipPath;SHA256=$hash;FilesVerified=$verified;ManifestIncluded=$true;GitCommit=(& git -C $projectRoot rev-parse HEAD);ZipReadback='PASS';GitBundle='PASS';RestoreCoreTests= $(if($testExit -eq 0){'PASS'}else{'FAIL'});Excluded='.git objects, .local database, node_modules, credentials, account approval/session files'}
$result | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $backupDir 'BACKUP_VERIFICATION.json') -Encoding utf8
"$hash  OPJCC_EXAM_PORTALS_LOCAL.zip" | Set-Content -LiteralPath (Join-Path $backupDir 'ZIP_SHA256.txt') -Encoding ascii
$result | ConvertTo-Json -Compress
if($testExit -ne 0){throw 'Restore smoke tests failed; inspect RESTORE_TESTS.txt'}
