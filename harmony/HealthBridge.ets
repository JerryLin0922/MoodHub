// harmony/HealthBridge.ets
// ArkWeb 壳与 HarmonyOS Health Service Kit 的桥接层。
// 经 Web 组件 javaScriptProxy 注入为 window.moodhubNative；
// Web 端调用 collectHealthData(payload) 触发读取，
// 读取完成经 controller.runJavaScript 派发 CustomEvent('moodhub:huawei:health') 回传。
//
// SDK 校准依据（2026-09 核对华为官方文档，API 21 / HarmonyOS 6.0.1 目标）：
//   1. 数据类型常量已从 healthStore.DataType.STEPS 旧枚举迁移为
//      healthStore.samplePointHelper.<type>.DATA_TYPE；
//   2. 读取入口为 healthStore.readData(SamplePointReadRequest)；
//   3. 权限体系改为「联盟申请 Health Service Kit 服务 + 配置 Client ID」，
//      运行时 healthStore.init(context) 初始化后，用 AuthorizationRequest 引导用户授权；
//   4. 官方文档确认：手机侧 readData 时间参数生效（10 分钟级/小时级），
//      Wearable 侧时间参数暂不生效、仅返回最新一条。
// 未验证点（本机无法编译 .ets，需在 DevEco Studio 6.0.1 用 SDK 声明文件核对，见 README 校验清单）：
//   - SamplePointReadRequest 的 fields 传参形态（下述采用字段枚举数组写法）
//   - AuthorizationRequest 授权方法的准确方法名
//   - SamplePoint.fields 返回结构（下述按 { step: number } / { bpm: number } 取值）

import { webview } from '@kit.ArkWeb';
import { healthStore } from '@kit.HealthServiceKit';
import { BusinessError } from '@kit.BasicServicesKit';

interface RawRow {
  metric: string;
  value: number;
  unit: string;
  startAt: string;
  endAt?: string;
}

/** 采样点读取请求（对齐官方 SamplePointReadRequest 的结构子集） */
interface SamplePointReadRequest {
  samplePointDataType: healthStore.DataType;
  startTime: number;
  endTime: number;
  fields: Array<healthStore.Field>;
}

export class HealthBridge {
  private controller: webview.WebviewController;

  constructor(controller: webview.WebviewController) {
    this.controller = controller;
  }

  /** javaScriptProxy 需要暴露的方法列表 */
  methodList(): Array<string> {
    return ['collectHealthData', 'requestPermission'];
  }

  /**
   * 权限申请：新体系下需先在华为开发者联盟申请 Health Service Kit 服务并配置 Client ID
   * （module.json5 配置 client_id），运行时 init + 授权弹窗引导用户授权对应数据类型。
   */
  requestPermission(): void {
    // TODO(dev): 在 DevEco Studio 中核对授权方法名（候选 healthStore.authorization /
    // requestAuthorization）与 AuthorizationRequest 的 readDataTypes 属性名后启用。
    // 授权类型建议：
    //   healthStore.samplePointHelper.dailyActivities.DATA_TYPE
    //   healthStore.samplePointHelper.heartRate.DATA_TYPE
  }

  collectHealthData(payload: string): void {
    const req = this.parsePayload(payload);
    this.readData(req)
      .then((json: string) => this.pushToWeb(json))
      .catch((err: BusinessError) => {
        console.error(`[MoodHub][harmony-health] readData failed: ${err.code} ${err.message}`);
        this.pushToWeb('[]');
      });
  }

  private parsePayload(payload: string): { fromDate?: string; toDate?: string } {
    try {
      return JSON.parse(payload) as { fromDate?: string; toDate?: string };
    } catch {
      return {};
    }
  }

  /** 核心读取：healthStore.readData(SamplePointReadRequest)，按需扩展数据类型 */
  private async readData(req: { fromDate?: string; toDate?: string }): Promise<string> {
    const now = new Date();
    const end = req.toDate
      ? new Date(`${req.toDate}T23:59:59`).getTime()
      : now.getTime();
    const start = req.fromDate
      ? new Date(`${req.fromDate}T00:00:00`).getTime()
      : end - 7 * 86_400_000;

    // 已确认的数据类型常量（官方文档 samplePointHelper 目录）：
    //   步数 dailyActivities.Fields.step；心率 heartRate.Fields.bpm
    const dataTypes: Array<healthStore.DataType> = [
      healthStore.samplePointHelper.dailyActivities.DATA_TYPE,
      healthStore.samplePointHelper.heartRate.DATA_TYPE,
    ];

    const rows: RawRow[] = [];
    for (const type of dataTypes) {
      const request: SamplePointReadRequest = {
        samplePointDataType: type,
        startTime: start,
        endTime: end,
        fields: this.fieldsFor(type),
      };
      const samples = await healthStore.readData(request);
      for (const sample of samples) {
        const row = this.toRaw(type, sample);
        if (row) rows.push(row);
      }
    }
    return JSON.stringify(rows);
  }

  /** 按数据类型选择要读取的字段（fields 传字段枚举数组，形态待 DevEco 核对） */
  private fieldsFor(type: healthStore.DataType): Array<healthStore.Field> {
    if (type === healthStore.samplePointHelper.dailyActivities.DATA_TYPE) {
      return [healthStore.samplePointHelper.dailyActivities.Fields.step];
    }
    return [healthStore.samplePointHelper.heartRate.Fields.bpm];
  }

  /** 采样点映射：SamplePoint.fields 按 { step: number } / { bpm: number } 取值 */
  private toRaw(type: healthStore.DataType, sample: Object): RawRow | null {
    const s = sample as Record<string, unknown>;
    const isSteps = type === healthStore.samplePointHelper.dailyActivities.DATA_TYPE;
    const metric = isSteps ? 'steps' : 'heart_rate';
    const rawValue = isSteps
      ? (s.fields as Record<string, unknown> | undefined)?.step
      : (s.fields as Record<string, unknown> | undefined)?.bpm;
    const value = Number(rawValue ?? NaN);
    if (!Number.isFinite(value)) return null;
    return {
      metric,
      value,
      unit: metric === 'steps' ? 'count' : 'bpm',
      startAt: String(s.startTime ?? ''),
      endAt: s.endTime ? String(s.endTime) : undefined,
    };
  }

  private pushToWeb(json: string): void {
    const script =
      `window.dispatchEvent(new CustomEvent('moodhub:huawei:health', { detail: ${json} }))`;
    this.controller.runJavaScript(script, (err) => {
      if (err) {
        console.error('[MoodHub][harmony-health] pushToWeb failed', err);
      }
    });
  }
}
