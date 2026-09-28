import { registerAdapter } from '../core/adapters';
import { HealthConnectAdapter } from './android/healthConnect';
import { HarmonyHealthAdapter } from './harmony/bridge';
import { WindowsHealthAdapter } from './windows/collector';

/**
 * 按运行环境注册可用采集适配器。
 * 在应用初始化（AppProvider 挂载前）调用一次即可。
 *
 * - Electron/Windows 桌面：windows
 * - Android（Capacitor）：healthconnect
 * - 鸿蒙 ArkWeb 壳：huawei
 */
export function registerPlatformAdapters(): void {
  const ua =
    typeof navigator !== 'undefined' ? navigator.userAgent : '';

  // Electron 桌面端优先注册 Windows 采集器（isAvailable 会二次探测 bridge）
  if (typeof window !== 'undefined' && window.moodhub?.platform === 'win32') {
    registerAdapter(new WindowsHealthAdapter());
  }

  // Android：Capacitor Health Connect 插件存在且可用时注册
  if (/Android/i.test(ua)) {
    registerAdapter(new HealthConnectAdapter());
  }

  // 鸿蒙 ArkWeb：window.moodhubNative 注入时注册
  if (
    typeof window !== 'undefined' &&
    typeof window.moodhubNative?.collectHealthData === 'function'
  ) {
    registerAdapter(new HarmonyHealthAdapter());
  }
}
