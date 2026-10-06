param (
    [string]$FilePath
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

if (-not (Test-Path $FilePath)) {
    Write-Error "File not found: $FilePath"
    exit 1
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($FilePath)
$textBuilder = New-Object System.Text.StringBuilder

foreach ($entry in $zip.Entries) {
    if ($entry.FullName -match '^(word/document\.xml|ppt/slides/slide\d+\.xml)') {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        
        # Strip XML tags to get clean plain text
        $plain = $content -replace '<[^>]+>', ' '
        $plain = $plain -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>' -replace '&quot;', '"' -replace '&apos;', "'"
        $plain = $plain -replace '\s+', ' '
        [void]$textBuilder.AppendLine($plain.Trim())
    }
}

$zip.Dispose()
$textBuilder.ToString()
