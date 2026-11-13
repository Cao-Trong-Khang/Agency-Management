# 1. Đăng nhập để lấy token JWT
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method Post -ContentType "application/json" `
  -Body '{"email":"admin@gmail.com","password":"123456"}'

$headers = @{ Authorization = "Bearer $($login.token)" }

# 2. Warm-up
$warmupCount = 5
Write-Output "Đang thực hiện $warmupCount lượt warm-up requests..."

for ($i = 0; $i -lt $warmupCount; $i++) {
    $null = Invoke-RestMethod `
      -Uri "http://localhost:3000/api/reports/debt?mode=month" `
      -Headers $headers
}

# 3. Đo lường chính thức
$sampleCount = 100
Write-Output "Đang thực hiện $sampleCount lượt đo lường chính thức cho mode=month..."

$times = @()

for ($i = 0; $i -lt $sampleCount; $i++) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    $null = Invoke-RestMethod `
      -Uri "http://localhost:3000/api/reports/debt?mode=month" `
      -Headers $headers

    $sw.Stop()
    $times += $sw.Elapsed.TotalMilliseconds

    Write-Progress `
      -Activity "Đang đo API response time" `
      -Status "$($i + 1)/$sampleCount requests" `
      -PercentComplete (($i + 1) / $sampleCount * 100)
}

# 4. Tính toán thống kê
$sorted = @($times | Sort-Object)
$avg = ($sorted | Measure-Object -Average).Average
$min = $sorted[0]
$max = $sorted[-1]

# Linear interpolation percentile
function Get-Percentile {
    param(
        [double[]]$Values,
        [double]$Percentile
    )

    $position = ($Values.Count - 1) * $Percentile
    $lowerIndex = [Math]::Floor($position)
    $upperIndex = [Math]::Ceiling($position)
    $weight = $position - $lowerIndex

    return $Values[$lowerIndex] +
        ($Values[$upperIndex] - $Values[$lowerIndex]) * $weight
}

$p50 = Get-Percentile -Values $sorted -Percentile 0.50
$p90 = Get-Percentile -Values $sorted -Percentile 0.90
$p95 = Get-Percentile -Values $sorted -Percentile 0.95
$p99 = Get-Percentile -Values $sorted -Percentile 0.99

# 5. Hiển thị kết quả
Write-Output "`n========================================================"
Write-Output "KẾT QUẢ ĐO LƯỜNG BASELINE API RESPONSE TIME (mode=month)"
Write-Output "========================================================"
Write-Output "Số mẫu đo (Samples):  $($sorted.Count)"
Write-Output "Nhanh nhất (Min):     $([Math]::Round($min, 2)) ms"
Write-Output "Trung bình (Average): $([Math]::Round($avg, 2)) ms"
Write-Output "Trung vị (p50):       $([Math]::Round($p50, 2)) ms"
Write-Output "Phân vị 90 (p90):     $([Math]::Round($p90, 2)) ms"
Write-Output "Phân vị 95 (p95):     $([Math]::Round($p95, 2)) ms"
Write-Output "Phân vị 99 (p99):     $([Math]::Round($p99, 2)) ms"
Write-Output "Chậm nhất (Max):      $([Math]::Round($max, 2)) ms"
Write-Output "========================================================"
