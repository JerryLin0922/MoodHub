import type { HealthSample, HealthSource } from '../types';
import { dedupeByDay, normalizeMany } from './normalize';
import type { HealthAdapter, PullOptions, PullResult } from './types';

const adapters = new Map<HealthSource, HealthAdapter>();

export function registerAdapter(adapter: HealthAdapter): void {
  adapters.set(adapter.source, adapter);
}

export function getAdapter(source: HealthSource): HealthAdapter | undefined {
  return adapters.get(source);
}

export function listAdapters(): HealthAdapter[] {
  return [...adapters.values()];
}

/** 采集 → 归一化 → （可选回调渐进写入 store）→ 返回结果 */
export async function pullAndNormalize(
  source: HealthSource,
  opts: PullOptions = {}
): Promise<PullResult> {
  const adapter = getAdapter(source);
  if (!adapter) {
    throw new Error(`No adapter registered for source: ${source}`);
  }

  const raws = await adapter.pull(opts);
  if (opts.limit && raws.length > opts.limit) {
    raws.length = opts.limit;
  }

  const { samples, skipped } = normalizeMany(raws);
  let final = samples;
  if (opts.dedupeAccumulated !== false) {
    final = dedupeByDay(final);
  }

  if (final.length && opts.onSamples) {
    opts.onSamples(final as HealthSample[]);
  }

  return {
    source,
    samples: final,
    skipped,
    rawCount: raws.length,
  };
}
