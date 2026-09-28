// electron/health-ipc.js
// MoodHub Windows 健康采集 IPC。在 main.js 顶部 require('./health-ipc') 并调用 registerHealthIpc()。
//
// 采集链路：
//   渲染进程 window.moodhub.desktop.collectHealth(payload)
//     → ipcMain.handle('moodhub:health:collect')
//       → 优先加载 electron/native/<arch>/moodhub-health.node（N-API，按 arch 预编译）
//       → 无原生模块时降级 electron/health-winrt.ps1（PowerShell 兜底，三架构通用）
//
// arch 取值：x64 / arm64（Windows on ARM 主优化）/ ia32（x86）

const { ipcMain } = require('electron');
const { execFile } = require('node:child_process');
const path = require('node:path');

const CHANNEL = 'moodhub:health:collect';

/** 尝试加载当前 arch 的原生 WinRT 桥（缺失返回 null，自动降级） */
function loadNative(arch) {
  const p = path.join(__dirname, 'native', arch, 'moodhub-health.node');
  try {
    return require(p);
  } catch {
    return null;
  }
}

/** PowerShell 兜底：读取系统健康数据并输出 JSON 数组（RawMetric） */
function collectViaPowerShell(payload) {
  const script = path.join(__dirname, 'health-winrt.ps1');
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        script,
        '-Payload',
        payload,
      ],
      { windowsHide: true, timeout: 20_000, maxBuffer: 16 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(err);
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch {
          reject(new Error('invalid PowerShell output'));
        }
      }
    );
  });
}

function registerHealthIpc() {
  ipcMain.handle(CHANNEL, async (_event, payload) => {
    const arch = process.arch;
    const native = loadNative(arch);
    try {
      if (native) {
        const rows = native.collect(JSON.parse(payload || '{}'));
        return JSON.stringify(rows ?? []);
      }
      return JSON.stringify(await collectViaPowerShell(payload));
    } catch (e) {
      // 采集失败不阻断主流程：返回空数组并记录日志，UI 层提示无数据源
      console.warn('[MoodHub][windows-health] collect failed:', e);
      return '[]';
    }
  });
}

module.exports = { registerHealthIpc, CHANNEL };
