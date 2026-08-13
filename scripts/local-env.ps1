function New-RandomHex([int]$Bytes = 32) {
  $buffer = New-Object byte[] $Bytes
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($buffer) } finally { $rng.Dispose() }
  return -join ($buffer | ForEach-Object { $_.ToString('x2') })
}

function Get-DotEnvValue([string]$RepoRoot, [string]$Key) {
  $envPath = Join-Path $RepoRoot '.env'
  if (-not (Test-Path -LiteralPath $envPath)) { return '' }
  $pattern = '^(\s*' + [regex]::Escape($Key) + '\s*=)(.*)$'
  foreach ($line in Get-Content -Path $envPath) {
    if ($line -match $pattern) { return $matches[2].Trim().Trim('"').Trim("'") }
  }
  return ''
}

function Set-DotEnvValue([string]$RepoRoot, [string]$Key, [string]$Value) {
  $envPath = Join-Path $RepoRoot '.env'
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  $text = if (Test-Path -LiteralPath $envPath) { [System.IO.File]::ReadAllText($envPath) } else { '' }
  $line = "$Key=$Value"
  if ($text -match ('(?m)^\s*' + [regex]::Escape($Key) + '\s*=')) {
    $text = [regex]::Replace($text, ('(?m)^\s*' + [regex]::Escape($Key) + '\s*=.*$'), $line)
  } else {
    if ($text.Length -gt 0 -and -not $text.EndsWith("`n")) { $text += "`n" }
    $text += "$line`n"
  }
  [System.IO.File]::WriteAllText($envPath, $text, $utf8NoBom)
}

function Ensure-RootEnv([string]$RepoRoot) {
  $envPath = Join-Path $RepoRoot '.env'
  $examplePath = Join-Path $RepoRoot '.env.example'
  if (-not (Test-Path -LiteralPath $envPath)) {
    Copy-Item -LiteralPath $examplePath -Destination $envPath
    Write-Host 'Created .env from .env.example'
  }

  $secret = Get-DotEnvValue $RepoRoot 'ADMIN_SECRET_KEY'
  if ([string]::IsNullOrWhiteSpace($secret)) {
    Set-DotEnvValue $RepoRoot 'ADMIN_SECRET_KEY' (New-RandomHex 32)
    Write-Host 'Created ADMIN_SECRET_KEY in .env'
  }
}