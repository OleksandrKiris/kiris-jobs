param()
# Compatibility wrapper: all PrimServ assets come from the canonical official logo.
$ErrorActionPreference = "Stop"
& node (Join-Path $PSScriptRoot "generate-share-cards.mjs")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
