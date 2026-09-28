import type {
  HealthMetricType,
  HealthSample,
  HealthSource,
} from '../types';

/**
 * 归一化适配层的统一原始记录契约。
 * 各平台采集器把厂商原始数据结构映射为 RawMetric，
 * 再由 normalize.ts 转为 MoodHub 的 HealthSample。
 */
export interface RawMetric {
  /** 数据来源：windows / healthconnect / huawei / healthkit ... */
  source: HealthSource;
  /** 已映射到 MoodHub 内部指标名 */
  metric: HealthMetricType;
  value: number;
  unit: string;
  /** 采集开始时间（ISO，本地时区） */
  startAt: string;
  /** 采集结束时间（瞬时值可省略） */
  endAt?: string;
  meta?: Record<string, unknown>;
}

export interface PullOptions {
  /** 起始日期 YYYY-MM-DD，默认近 7 天 */
  fromDate?: string;
  /** 结束日期 YYYY-MM-DD，默认今天 */
  toDate?: string;
  /** 需要拉取的指标子集，缺省拉适配器支持的全部指标 */
  metrics?: HealthMetricType[];
  /** 单次采集条数上限，防止一次性写入过多 */
  limit?: number;
  /** steps 等累计型指标按 date+type 去重（默认 true，幂等合并） */
  dedupeAccumulated?: boolean;
  /** 归一化完成的回调，用于渐进写入 store */
  onSamples?: (samples: HealthSample[]) => void;
}

export interface PullResult {
  source: HealthSource;
  /** 归一化后的样本 */
  samples: HealthSample[];
  /** 归一化时被校验过滤掉的记录数 */
  skipped: number;
  /** 采集层返回的原始记录数 */
  rawCount: number;
}

/** 平台采集适配器契约 */
export interface HealthAdapter {
  readonly source: HealthSource;
  /** 当前环境是否具备该采集能力 */
  isAvailable(): Promise<boolean>;
  /** 申请权限（无权限模型的平台可空实现） */
  requestPermissions?(): Promise<void>;
  /** 拉取原始指标 */
  pull(opts: PullOptions): Promise<RawMetric[]>;
}
