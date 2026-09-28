// electron/preload.js（替换原 preload）
// contextBridge 暴露 window.moodhub，渲染进程据此调用桌面健康采集。
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('moodhub', {
  platform: process.platform, // win32 / linux / darwin
  arch: process.arch, // x64 / arm64 / ia32
  desktop: {
    collectHealth: (payload) => ipcRenderer.invoke('moodhub:health:collect', payload),
  },
});
