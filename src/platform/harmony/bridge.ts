import type { HealthAdapter, PullOptions, RawMetric } from '../../core/adapters/types';

declare global {
  interface Window {
    /** ArkTS 侧通过 javaScriptProxy 注入（见 harmony/HealthBridge.ets） */
    moodhubNative?: {
      collectHealthData?: (payload: string) => void;
      requestPermission?: () => void;
    };
  }
}

const EVENT = 'moodhub:huawei:health';

/**
 * 鸿蒙 Web 侧桥接适配器。
 * ArkTS 侧 healthStore.readData 读取完成后，经 controller.runJavaScript
 * 派发 CustomEvent('moodhub:huawei:health', { detail: RawMetric[] }) 回传；
 * Web 侧只依赖该事件契约，与平台实现解耦。
 * source = 'huawei'
 */
export class HarmonyHealthAdapter implements HealthAdapter {
  readonly source = 'huawei' as const;

  isAvailable(): Promise<boolean> {
    const ok =
      typeof window !== 'undefined' &&
      typeof window.moodhubNative?.collectHealthData === 'function';
    return Promise.resolve(ok);
  }

  requestPermissions(): Promise<void> {
    window.moodhubNative?.requestPermission?.();
    return Promise.resolve();
  }

  pull(opts: PullOptions): Promise<RawMetric[]> {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error('Harmony Health Service Kit 采集超时（30s）'));
      }, 30_000);

      const onData = (e: Event) => {
        const detail = (e as CustomEvent).detail as RawMetric[] | undefined;
        if (!Array.isArray(detail)) return;
        cleanup();
        resolve(detail.filter(d => matches(d, opts)));
      };

      const cleanup = () => {
        window.clearTimeout(timer);
        window.removeEventListener(EVENT, onData);
      };

      window.addEventListener(EVENT, onData);
      window.moodhubNative?.collectHealthData?.(
        JSON.stringify({
          fromDate: opts.fromDate,
          toDate: opts.toDate,
          metrics: opts.metrics,
        })
      );
    });
  }
}

function matches(raw: RawMetric, opts: PullOptions): boolean {
  if (opts.metrics?.length && !opts.metrics.includes(raw.metric)) return false;
  if (opts.fromDate && raw.startAt.slice(0, 10) < opts.fromDate) return false;
  if (opts.toDate && raw.startAt.slice(0, 10) > opts.toDate) return false;
  return true;
}
