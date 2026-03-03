param(
  [string]$Owner = "hannanpicho-lgtm",
  [string]$Repo = "trampoline-workbench",
  [string]$WorkflowFile = "deploy-training-accounts.yml",
  [string]$Ref = "main",
  [string]$EnableDeploy = "true",
  [string]$Base44ApiKey = "",
  [string]$Base44ProjectId = "",
  [string]$Base44AppId = ""
)

$token = $env:GITHUB_TOKEN
if ([string]::IsNullOrWhiteSpace($token)) {
  $token = $env:GH_PAT
}

if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Error "Missing token. Set GITHUB_TOKEN or GH_PAT with repo/workflow scope."
  exit 1
}

$uri = "https://api.github.com/repos/$Owner/$Repo/actions/workflows/$WorkflowFile/dispatches"
$headers = @{
  "Accept" = "application/vnd.github+json"
  "Authorization" = "Bearer $token"
  "X-GitHub-Api-Version" = "2022-11-28"
  "User-Agent" = "workflow-dispatch-script"
}

$body = @{
  ref = $Ref
  inputs = @{
    enable_deploy = $EnableDeploy
    base44_api_key = $Base44ApiKey
    base44_project_id = $Base44ProjectId
    base44_app_id = $Base44AppId
  }
} | ConvertTo-Json -Depth 4

try {
  Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -ContentType "application/json" -Body $body | Out-Null
  Write-Output "Workflow dispatch sent: $WorkflowFile on $Ref (enable_deploy=$EnableDeploy)"
} catch {
  Write-Error "Dispatch failed: $($_.Exception.Message)"
  if ($_.ErrorDetails.Message) {
    Write-Output $_.ErrorDetails.Message
  }
  exit 1
}
