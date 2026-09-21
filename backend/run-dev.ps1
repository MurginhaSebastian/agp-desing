# Arranca el backend en local cargando backend/.env como variables de entorno.
# Spring Boot NO lee .env por sí solo; este script lo hace por ti.
# Uso:  cd backend ; .\run-dev.ps1          (requiere JDK 21, Maven y Postgres corriendo)
$ErrorActionPreference = 'Stop'
$envFile = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path $envFile)) {
  Write-Error "Falta backend\.env. Copia .env.example a .env y rellena JWT_SECRET y ADMIN_PASSWORD_HASH."
}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  $name, $value = $line -split '=', 2
  [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), 'Process')
}
foreach ($required in 'JWT_SECRET', 'ADMIN_PASSWORD_HASH', 'DB_PASSWORD') {
  if (-not [Environment]::GetEnvironmentVariable($required, 'Process')) {
    Write-Error "La variable $required está vacía en backend\.env"
  }
}
Set-Location $PSScriptRoot
& (Join-Path $PSScriptRoot 'mvnw.cmd') spring-boot:run
