$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$narrationRoot = Join-Path (Split-Path $PSScriptRoot -Parent) 'public\narration'
$narrationLines = Get-Content -LiteralPath (Join-Path $narrationRoot 'script.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$narrationVoices = @{
  david = 'Microsoft David Desktop'
  zira = 'Microsoft Zira Desktop'
}
foreach ($voiceId in $narrationVoices.Keys) {
  $voiceFolder = Join-Path $narrationRoot $voiceId
  New-Item -ItemType Directory -Path $voiceFolder -Force | Out-Null
  $narrator = New-Object System.Speech.Synthesis.SpeechSynthesizer
  try {
    $narrator.SelectVoice($narrationVoices[$voiceId])
    $narrator.Rate = -1
    $narrator.Volume = 100
    foreach ($line in $narrationLines) {
      $narrator.SetOutputToWaveFile((Join-Path $voiceFolder $line.file))
      $narrator.Speak($line.text)
      $narrator.SetOutputToNull()
    }
  } finally { $narrator.Dispose() }
  Write-Output "Generated $($narrationLines.Count) clips for $voiceId"
}
