# electron/health-winrt.ps1
# MoodHub Windows 健康采集 PowerShell 兜底方案（health-ipc.js 降级路径）。
#
# 说明（诚实边界）：
#   Windows 桌面版没有系统级的步数/心率标准 API（Windows 健康数据散落在
#   各设备厂商私有协议中），因此本脚本默认返回空数组 []，不编造数据。
#   接入第三方数据源时，在此处读取厂商 SDK/文件/服务并输出 RawMetric 数组：
#     [{"metric":"steps","value":1234,"unit":"count","startAt":"2026-09-28T08:00:00"}]
#
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File health-winrt.ps1 -Payload '{"fromDate":"2026-09-21","toDate":"2026-09-28"}'
# 输出：仅向 stdout 输出一行 JSON 数组（health-ipc.js 直接 JSON.parse）。

param(
  [string]$Payload = '{}'
)

$ErrorActionPreference = 'Stop'

function Write-Log([string]$Message) {
  # 诊断日志不写入 stdout（避免污染 JSON 输出），写入 %TEMP%\moodhub-health.log
  try {
    $logPath = Join-Path $env:TEMP 'moodhub-health.log'
    Add-Content -Path $logPath -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message) -Encoding UTF8
  } catch {
    # 日志失败不影响主流程
  }
}

try {
  $req = $Payload | ConvertFrom-Json -ErrorAction SilentlyContinue
  $fromDate = $null
  $toDate = $null
  if ($req) {
    $fromDate = $req.fromDate
    $toDate = $req.toDate
  }
  Write-Log ("collect requested from={0} to={1}" -f $fromDate, $toDate)

  # TODO(dev): 在此接入 Windows 健康数据源（如厂商 SDK 本地服务 / 文件导出）。
  # Windows 无系统级步数/心率 API，返回空数组，UI 层据此提示无数据源。
  $rows = @()

  Write-Output ($rows | ConvertTo-Json -Compress -Depth 4)
} catch {
  Write-Log ("collect failed: {0}" -f $_.Exception.Message)
  Write-Output '[]'
}
