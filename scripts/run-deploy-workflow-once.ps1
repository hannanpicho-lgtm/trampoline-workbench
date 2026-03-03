param(
  [string]$EnableDeploy = "true"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $scriptDir "run-deploy-workflow.ps1"

if (-not (Test-Path $runner)) {
  Write-Error "Missing script: $runner"
  exit 1
}

$secureToken = Read-Host "Paste GitHub token" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
  $plainToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if ([string]::IsNullOrWhiteSpace($plainToken)) {
  Write-Error "Token was empty."
  exit 1
}

$env:GITHUB_TOKEN = $plainToken
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

& $runner -EnableDeploy $EnableDeploy
exit $LASTEXITCODE
