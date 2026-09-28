import {
  HealthConnect,
  type HealthConnectPlugin,
  type RecordType,
  type TimeRangeFilter,
  type Record as HealthRecord,
} from 'capacitor-health-connect';
import type { HealthMetricType } from '../../core/types';
import type { HealthAdapter, PullOptions, RawMetric } from '../../core/adapters/types';

/**
 * Android Health Connect 采集适配器（Capacitor 6 工程）。
 * 依赖：npm i capacitor-health-connect（ubie-oss@0.7.0；peer 要求 @capacitor/core ^5，
 *       Capacitor 6 工程请用 --legacy-peer-deps 安装），随后 npx cap sync android。
 * source = 'healthconnect'
 *
 * 校准说明（2026-09，对照真实包 definitions.d.ts）：
 * - 早期草案包名 @mokkapps/capacitor-health-connect 在 npm 不存在，已替换为真实包 capacitor-health-connect；
 * - API 由 querySamples(dataTypes) 校准为 checkAvailability / requestHealthPermissions / readRecords(type, timeRangeFilter)；
 * - RecordType 联合类型无 SleepSession/SleepStage/HRV/Stress，这些指标本轮在 Android 侧不采集；
 * - 每条记录按联合类型收窄取值（count / beatsPerMinute / percentage / energy），HeartRateSeries 展开为多条心率样本。
 */
const TYPE_TO_METRIC: Partial<Record<RecordType, HealthMetricType>> = {
  Steps: 'steps',
  RestingHeartRate: 'resting_heart_rate',
  HeartRateSeries: 'heart_rate',
  OxygenSaturation: 'spo2',
  ActiveCaloriesBurned: 'exercise_minutes',
};

const SUPPORTED = Object.keys(TYPE_TO_METRIC) as RecordType[];

function unitFor(metric: HealthMetricType): string {
  switch (metric) {
    case 'steps':
      return 'count';
    case 'heart_rate':
    case 'resting_heart_rate':
      return 'bpm';
    case 'spo2':
      return '%';
    case 'exercise_minutes':
      return 'kcal';
    default:
      return '';
  }
}

function pickValue(record: HealthRecord): number | undefined {
  switch (record.type) {
    case 'Steps':
      return record.count;
    case 'RestingHeartRate':
      return record.beatsPerMinute;
    case 'OxygenSaturation':
      return record.percentage.value;
    case 'ActiveCaloriesBurned':
      return record.energy.value;
    default:
      return undefined;
  }
}

function startAtOf(record: HealthRecord): string {
  switch (record.type) {
    case 'Steps':
    case 'HeartRateSeries':
    case 'ActiveCaloriesBurned':
      return record.startTime.toISOString();
    default:
      return record.time.toISOString();
  }
}

function endAtOf(record: HealthRecord): string | undefined {
  switch (record.type) {
    case 'Steps':
    case 'HeartRateSeries':
    case 'ActiveCaloriesBurned':
      return record.endTime.toISOString();
    default:
      return undefined;
  }
}

export class HealthConnectAdapter implements HealthAdapter {
  readonly source = 'healthconnect' as const;
  private plugin: HealthConnectPlugin;

  constructor(plugin: HealthConnectPlugin = HealthConnect) {
    this.plugin = plugin;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { availability } = await this.plugin.checkAvailability();
      return availability === 'Available';
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<void> {
    await this.plugin.requestHealthPermissions({
      read: SUPPORTED,
      write: [],
    });
  }

  async pull(opts: PullOptions): Promise<RawMetric[]> {
    const end = opts.toDate
      ? new Date(`${opts.toDate}T23:59:59`)
      : new Date();
    const start = opts.fromDate
      ? new Date(`${opts.fromDate}T00:00:00`)
      : new Date(end.getTime() - 7 * 86_400_000);
    const timeRangeFilter: TimeRangeFilter = {
      type: 'between',
      startTime: start,
      endTime: end,
    };

    const raws: RawMetric[] = [];
    for (const type of SUPPORTED) {
      const metric = TYPE_TO_METRIC[type];
      if (!metric) continue;
      let records: Array<HealthRecord & { metadata: { id: string } }>;
      try {
        const res = await this.plugin.readRecords({
          type,
          timeRangeFilter,
        });
        records = res.records;
      } catch (e) {
        console.warn(`[MoodHub][healthconnect] read ${type} failed`, e);
        continue;
      }
      for (const record of records) {
        if (record.type === 'HeartRateSeries') {
          for (const sample of record.samples) {
            raws.push({
              source: this.source,
              metric,
              value: sample.beatsPerMinute,
              unit: unitFor(metric),
              startAt: sample.time.toISOString(),
              meta: { nativeType: type, id: record.metadata.id },
            });
          }
          continue;
        }
        const value = pickValue(record);
        if (value === undefined || Number.isNaN(value)) continue;
        raws.push({
          source: this.source,
          metric,
          value,
          unit: unitFor(metric),
          startAt: startAtOf(record),
          endAt: endAtOf(record),
          meta: { nativeType: type, id: record.metadata.id },
        });
      }
    }
    return raws;
  }
}
