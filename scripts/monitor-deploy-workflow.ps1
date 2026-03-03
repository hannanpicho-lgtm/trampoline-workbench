param(
  [string]$Owner = "hannanpicho-lgtm",
  [string]$Repo = "trampoline-workbench",
  [string]$WorkflowFile = "deploy-training-accounts.yml",
  [string]$Branch = "main",
  [int]$PollSeconds = 20,
  [int]$TimeoutMinutes = 20
)

$token = $env:GITHUB_TOKEN
if ([string]::IsNullOrWhiteSpace($token)) {
  $token = $env:GH_PAT
}

if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Error "Missing token. Set GITHUB_TOKEN or GH_PAT with repo/workflow scope."
  exit 1
}

$headers = @{
  "Accept" = "application/vnd.github+json"
  "Authorization" = "Bearer $token"
  "X-GitHub-Api-Version" = "2022-11-28"
  "User-Agent" = "workflow-monitor-script"
}

function Get-LatestRun {
  param([string]$Owner, [string]$Repo, [string]$WorkflowFile, [string]$Branch, [hashtable]$Headers)

  $uri = "https://api.github.com/repos/$Owner/$Repo/actions/workflows/$WorkflowFile/runs?branch=$Branch&per_page=1"
  $result = Invoke-RestMethod -Uri $uri -Headers $Headers -Method Get
  if (-not $result.workflow_runs -or $result.workflow_runs.Count -eq 0) {
    return $null
  }
  return $result.workflow_runs[0]
}

function Get-Run {
  param([string]$Owner, [string]$Repo, [string]$RunId, [hashtable]$Headers)

  $uri = "https://api.github.com/repos/$Owner/$Repo/actions/runs/$RunId"
  return Invoke-RestMethod -Uri $uri -Headers $Headers -Method Get
}

function Get-RunJobs {
  param([string]$Owner, [string]$Repo, [string]$RunId, [hashtable]$Headers)

  $uri = "https://api.github.com/repos/$Owner/$Repo/actions/runs/$RunId/jobs?per_page=100"
  $result = Invoke-RestMethod -Uri $uri -Headers $Headers -Method Get
  if (-not $result.jobs) {
    return @()
  }
  return $result.jobs
}

try {
  $run = Get-LatestRun -Owner $Owner -Repo $Repo -WorkflowFile $WorkflowFile -Branch $Branch -Headers $headers
  if (-not $run) {
    Write-Error "No workflow runs found for $WorkflowFile on branch $Branch"
    exit 1
  }

  Write-Output "Watching run #$($run.run_number) (id=$($run.id))"
  Write-Output $run.html_url

  $deadline = (Get-Date).AddMinutes($TimeoutMinutes)
  $current = $run

  while ($current.status -ne "completed") {
    if ((Get-Date) -gt $deadline) {
      Write-Error "Timeout after $TimeoutMinutes minutes while waiting for run completion."
      exit 1
    }

    Start-Sleep -Seconds $PollSeconds
    $current = Get-Run -Owner $Owner -Repo $Repo -RunId $run.id -Headers $headers
    Write-Output "status=$($current.status) conclusion=$($current.conclusion)"
  }

  Write-Output "final_status=$($current.status) final_conclusion=$($current.conclusion)"

  $jobs = Get-RunJobs -Owner $Owner -Repo $Repo -RunId $run.id -Headers $headers
  if ($jobs.Count -gt 0) {
    $jobs | Select-Object name, status, conclusion | Format-Table -AutoSize | Out-String | Write-Output
  }

  if ($current.conclusion -ne "success") {
    $failedJobs = $jobs | Where-Object { $_.conclusion -and $_.conclusion -ne "success" -and $_.conclusion -ne "skipped" }

    foreach ($job in $failedJobs) {
      Write-Output "---- Failed Job: $($job.name) (conclusion=$($job.conclusion))"
      $failedSteps = @($job.steps | Where-Object { $_.conclusion -and $_.conclusion -ne "success" -and $_.conclusion -ne "skipped" })
      if ($failedSteps.Count -eq 0) {
        Write-Output "No explicit failed steps were reported for this job."
      } else {
        $failedSteps | Select-Object number, name, status, conclusion | Format-Table -AutoSize | Out-String | Write-Output
      }
    }

    exit 1
  }

  Write-Output "Workflow run succeeded."
  exit 0
} catch {
  Write-Error "Monitor failed: $($_.Exception.Message)"
  if ($_.ErrorDetails.Message) {
    Write-Output $_.ErrorDetails.Message
  }
  exit 1
}
