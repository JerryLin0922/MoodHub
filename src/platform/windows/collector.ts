import type { HealthMetricType } from '../../core/types';
import type { HealthAdapter, PullOptions, RawMetric } from '../../core/adapters/types';

declare global {
  interface Window {
    /** Electron preload 注入（见 electron/preload.js） */
    moodhub?: {
      platform: string; // win32 / linux / darwin
      arch: string;     // x64 / arm64 / ia32
      desktop?: {
        /** 返回 RawMetric JSON 数组字符串；不可用返回 null */
        collectHealth: (payload: string) => Promise<string | null>;
      };
    };
  }
}

const METRIC_MAP: Record<string, HealthMetricType> = {
  steps: 'steps',
  heart_rate: 'heart_rate',
  resting_heart_rate: 'resting_heart_rate',
  sleep_duration: 'sleep_duration',
  sleep_efficiency: 'sleep_efficiency',
  hrv: 'hrv',
  spo2: 'spo2',
  stress: 'stress',
  exercise_minutes: 'exercise_minutes',
};

/**
 * Windows 桌面采集适配器（Electron）。
 * 渲染进程 → preload（window.moodhub.desktop）→ IPC → 主进程
 *   └─ 原生 WinRT 模块（electron/native/<arch>/moodhub-health.node，按 arch 预编译）
 *   └─ 无原生模块时降级 PowerShell 兜底（health-winrt.ps1，与 arch 无关）
 * 覆盖 x86 / x64 / ARM64，主优化 ARM64（原生 ARM64 运行，避开 x64 模拟层）。
 * source = 'windows'
 */
export class WindowsHealthAdapter implements HealthAdapter {
  readonly source = 'windows' as const;

  isAvailable(): Promise<boolean> {
    const bridge = window.moodhub?.desktop;
    return Promise.resolve(
      !!bridge &&
        window.moodhub?.platform === 'win32' &&
        typeof bridge.collectHealth === 'function'
    );
  }

  async pull(opts: PullOptions): Promise<RawMetric[]> {
    const bridge = window.moodhub?.desktop;
    if (!bridge) throw new Error('Windows bridge unavailable');

    const raw = await bridge.collectHealth(
      JSON.stringify({
        fromDate: opts.fromDate,
        toDate: opts.toDate,
        metrics: opts.metrics,
      })
    );
    if (!raw) return [];

    const list = JSON.parse(raw) as Array<Record<string, unknown>>;
    return list
      .map((item): RawMetric | null => {
        const metric = METRIC_MAP[String(item.metric ?? '')];
        if (!metric) return null;
        const value = Number(item.value);
        if (!Number.isFinite(value)) return null;
        return {
          source: this.source,
          metric,
          value,
          unit: String(item.unit ?? ''),
          startAt: String(item.startAt),
          endAt: item.endAt ? String(item.endAt) : undefined,
          meta: item.meta as Record<string, unknown> | undefined,
        } satisfies RawMetric;
      })
      .filter((x): x is RawMetric => x !== null);
  }
}
