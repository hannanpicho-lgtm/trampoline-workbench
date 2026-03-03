param(
  [string]$Owner = "hannanpicho-lgtm",
  [string]$Repo = "trampoline-workbench",
  [string]$WorkflowFile = "deploy-training-accounts.yml",
  [string]$Ref = "main",
  [string]$EnableDeploy = "true",
  [string]$Base44ApiKey = "",
  [string]$Base44ProjectId = "",
  [string]$Base44AppId = "",
  [int]$PollSeconds = 20,
  [int]$TimeoutMinutes = 20
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$triggerScript = Join-Path $scriptDir "trigger-deploy-workflow.ps1"
$monitorScript = Join-Path $scriptDir "monitor-deploy-workflow.ps1"

if (-not (Test-Path $triggerScript)) {
  Write-Error "Missing script: $triggerScript"
  exit 1
}

if (-not (Test-Path $monitorScript)) {
  Write-Error "Missing script: $monitorScript"
  exit 1
}

Write-Output "Dispatching workflow..."
& $triggerScript `
  -Owner $Owner `
  -Repo $Repo `
  -WorkflowFile $WorkflowFile `
  -Ref $Ref `
  -EnableDeploy $EnableDeploy `
  -Base44ApiKey $Base44ApiKey `
  -Base44ProjectId $Base44ProjectId `
  -Base44AppId $Base44AppId

${dispatchExitCode} = $LASTEXITCODE
if (${dispatchExitCode} -ne 0) {
  Write-Error "Dispatch failed."
  exit ${dispatchExitCode}
}

Write-Output "Monitoring latest run..."
& $monitorScript `
  -Owner $Owner `
  -Repo $Repo `
  -WorkflowFile $WorkflowFile `
  -Branch $Ref `
  -PollSeconds $PollSeconds `
  -TimeoutMinutes $TimeoutMinutes

${monitorExitCode} = $LASTEXITCODE
if (${monitorExitCode} -ne 0) {
  Write-Error "Workflow dispatched successfully, but the monitored run did not succeed."
}

exit ${monitorExitCode}
