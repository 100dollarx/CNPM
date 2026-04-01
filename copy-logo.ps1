$src = Join-Path $PSScriptRoot "logo.png"
$dst = Join-Path $PSScriptRoot "ETMS.Desktop\public\logo.png"
[System.IO.File]::Copy($src, $dst, $true)
Write-Host "Logo copied: $?"
